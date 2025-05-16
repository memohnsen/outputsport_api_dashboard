"use client";

import { useEffect, useState } from 'react';
import { getAthletes, getExerciseMeasurements, getExerciseMetadata } from '@/services/outputSports.client';

export default function MetricsOverview() {
  const [athleteCount, setAthleteCount] = useState<number>(0);
  const [measurementCount, setMeasurementCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        
        // Fetch athletes count
        const athletes = await getAthletes();
        setAthleteCount(athletes.length);
        
        // Fetch measurements (last 30 days)
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        // Convert to YYYY-MM-DD format
        const endDateStr = today.toISOString().split('T')[0];
        const startDateStr = thirtyDaysAgo.toISOString().split('T')[0];
        
        console.log(`MetricsOverview: Using date range ${startDateStr} to ${endDateStr}`);
        
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
  }, []);

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

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <div className="flex h-32 flex-1 items-center rounded-xl bg-[#1a1a1a] p-6 backdrop-blur-sm border border-[#8C8C8C]/10">
        <div className="mr-4 rounded-full bg-[#887D2B]/20 p-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#887D2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm text-[#8C8C8C]">Total Athletes</p>
          <h4 className="text-2xl font-bold text-white">{athleteCount}</h4>
          <p className="text-sm text-[#8C8C8C]">From Output Sports API</p>
        </div>
      </div>
      
      <div className="flex h-32 flex-1 items-center rounded-xl bg-[#1a1a1a] p-6 backdrop-blur-sm border border-[#8C8C8C]/10">
        <div className="mr-4 rounded-full bg-[#887D2B]/20 p-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#887D2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <div>
          <p className="text-sm text-[#8C8C8C]">Measurements (30 days)</p>
          <h4 className="text-2xl font-bold text-white">{measurementCount}</h4>
          <p className="text-sm text-[#8C8C8C]">Last 30 days of data</p>
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