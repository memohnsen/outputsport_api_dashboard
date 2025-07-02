"use client";

import { useEffect, useState } from 'react';
import { getAthletes, getExerciseMeasurements, getExerciseMetadata } from '@/services/outputSports.client';

type TimeRange = 'today' | '7days' | '30days' | '90days' | 'year' | 'all' | 'custom';

interface MetricsOverviewProps {
  timeRange?: TimeRange;
  customStartDate?: string;
  customEndDate?: string;
}

export default function MetricsOverview({ timeRange = '30days', customStartDate, customEndDate }: MetricsOverviewProps) {
  const [athleteCount, setAthleteCount] = useState<number>(0);
  const [measurementCount, setMeasurementCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to get date range based on timeRange
  const getDateRange = () => {
    const today = new Date();
    
    const formatDateString = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const endDateStr = formatDateString(today);
    let startDateStr;
    
    switch(timeRange) {
      case 'today':
        startDateStr = endDateStr;
        break;
      case '7days':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);
        startDateStr = formatDateString(sevenDaysAgo);
        break;
      case '30days':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 29);
        startDateStr = formatDateString(thirtyDaysAgo);
        break;
      case '90days':
        const ninetyDaysAgo = new Date(today);
        ninetyDaysAgo.setDate(today.getDate() - 89);
        startDateStr = formatDateString(ninetyDaysAgo);
        break;
      case 'year':
      case 'all':
        const yearAgo = new Date(today);
        yearAgo.setDate(today.getDate() - 89); // Using 90 days for consistency
        startDateStr = formatDateString(yearAgo);
        break;
      case 'custom':
        startDateStr = customStartDate || formatDateString(today);
        return { 
          startDateStr, 
          endDateStr: customEndDate || endDateStr 
        };
      default:
        const defaultDate = new Date(today);
        defaultDate.setDate(today.getDate() - 29);
        startDateStr = formatDateString(defaultDate);
    }
    
    return { startDateStr, endDateStr };
  };

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        
        // Fetch athletes count
        const athletes = await getAthletes();
        setAthleteCount(athletes.length);
        
        // Get date range based on selected time range
        const { startDateStr, endDateStr } = getDateRange();
        
        console.log(`MetricsOverview: Using date range ${startDateStr} to ${endDateStr} for ${timeRange}`);
        
        // Make sure we have proper string values
        if (startDateStr && endDateStr) {
          const measurements = await getExerciseMeasurements(startDateStr, endDateStr);
          setMeasurementCount(measurements.length);
        } else {
          console.error('Invalid date strings generated');
          setMeasurementCount(0);
        }
        
        setError(null);
      } catch (err) {
        console.error('Failed to fetch metrics:', err);
        setError('Failed to load metrics data');
      } finally {
        setLoading(false);
      }
    }

    void fetchMetrics();
  }, [timeRange, customStartDate, customEndDate]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 md:flex-row">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full rounded-xl bg-red-500/20 p-6 text-center text-white">
        <p>{error}</p>
        <button 
          className="mt-3 rounded bg-[#887D2B] px-4 py-2 text-sm font-medium text-white hover:bg-[#776c25]"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  const getTimeRangeLabel = () => {
    switch(timeRange) {
      case 'today': return 'Today';
      case '7days': return 'Last 7 Days';
      case '30days': return 'Last 30 Days';
      case '90days': return 'Last 90 Days';
      case 'year': return 'Last Year';
      case 'all': return 'All Time';
      case 'custom': return `Custom Range`;
      default: return 'Last 30 Days';
    }
  };

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <div className="flex flex-1 items-center rounded-xl bg-[#1a1a1a] p-6 backdrop-blur-sm border border-[#8C8C8C]/10">
        <div className="mr-4 rounded-full bg-blue-500/10 p-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm text-gray-400">Active Athletes</p>
          <h4 className="text-2xl font-bold text-white">{athleteCount}</h4>
          <p className="text-sm text-gray-400">Total registered</p>
        </div>
      </div>
      
      <div className="flex flex-1 items-center rounded-xl bg-[#1a1a1a] p-6 backdrop-blur-sm border border-[#8C8C8C]/10">
        <div className="mr-4 rounded-full bg-purple-500/10 p-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <p className="text-sm text-gray-400">Measurements</p>
          <h4 className="text-2xl font-bold text-white">{measurementCount.toLocaleString()}</h4>
          <p className="text-sm text-gray-400">{getTimeRangeLabel()}</p>
        </div>
      </div>
    </div>
  );
}

function MetricCardSkeleton() {
  return (
    <div className="flex h-32 flex-1 animate-pulse items-center rounded-xl bg-[#1a1a1a] p-6 backdrop-blur-sm border border-[#8C8C8C]/10">
      <div className="mr-4 h-14 w-14 rounded-full bg-[#8C8C8C]/20"></div>
      <div className="w-full">
        <div className="mb-2 h-4 w-24 rounded bg-[#8C8C8C]/20"></div>
        <div className="mb-2 h-6 w-16 rounded bg-[#8C8C8C]/20"></div>
        <div className="h-4 w-32 rounded bg-[#8C8C8C]/20"></div>
      </div>
    </div>
  );
} 