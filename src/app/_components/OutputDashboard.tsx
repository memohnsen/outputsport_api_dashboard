"use client";

import { useState, useEffect } from 'react';
import ExerciseMeasurements from './exercises/ExerciseMeasurements';
import MetricsOverview from './MetricsOverview';
import type { Athlete } from '@/services/outputSports.client';
import { getAthletes } from '@/services/outputSports.client';
import { useSearchParams } from 'next/navigation';

type TimeRange = 'today' | '7days' | '30days' | '90days' | 'year' | 'all';

export default function OutputDashboard() {
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [isLoadingAthlete, setIsLoadingAthlete] = useState(false);
  const [isLoadingAthletes, setIsLoadingAthletes] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('7days');
  const searchParams = useSearchParams();
  
  // Fetch all athletes on component mount
  useEffect(() => {
    async function fetchAthletes() {
      try {
        setIsLoadingAthletes(true);
        const data = await getAthletes();
        // Sort athletes by first name
        const sortedAthletes = [...data].sort((a, b) => 
          a.firstName.localeCompare(b.firstName)
        );
        setAthletes(sortedAthletes);
      } catch (error) {
        console.error('Error fetching athletes:', error);
      } finally {
        setIsLoadingAthletes(false);
      }
    }
    
    void fetchAthletes();
  }, []);

  // Handle athlete selection from URL query parameter
  useEffect(() => {
    const athleteId = searchParams.get('athlete');
    
    if (athleteId && athletes.length > 0) {
      const athlete = athletes.find(a => a.id === athleteId);
      
      if (athlete) {
        console.log('Found athlete from URL:', athlete.fullName);
        setSelectedAthlete(athlete);
      }
    }
  }, [searchParams, athletes]);

  const handleAthleteChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const athleteId = event.target.value;
    if (athleteId) {
      const athlete = athletes.find(a => a.id === athleteId) ?? null;
      console.log('Selected athlete:', athlete);
      setSelectedAthlete(athlete);
    } else {
      setSelectedAthlete(null);
    }
  };

  const handleTimeRangeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeRange(event.target.value as TimeRange);
  };

  const getTimeRangeLabel = () => {
    switch(timeRange) {
      case 'today': return 'Today';
      case '7days': return 'Last 7 Days';
      case '30days': return 'Last 30 Days';
      case '90days': return 'Last 90 Days';
      case 'year': return 'Last Year';
      case 'all': return 'All Time';
      default: return 'Last 7 Days';
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between">
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
            <div className="w-full max-w-xs sm:w-64">
              <select
                className="w-full rounded-md border-[#8C8C8C]/20 bg-[#1a1a1a] px-3 py-2 text-white focus:border-[#887D2B] focus:ring focus:ring-[#887D2B]/30"
                value={selectedAthlete?.id ?? ''}
                onChange={handleAthleteChange}
                disabled={isLoadingAthletes}
              >
                <option value="">All Athletes</option>
                {isLoadingAthletes ? (
                  <option value="" disabled>Loading athletes...</option>
                ) : (
                  athletes.map(athlete => (
                    <option key={athlete.id} value={athlete.id}>
                      {athlete.fullName}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
          <div className="mt-4 sm:mt-0">
            <select
              className="w-full rounded-md border-[#8C8C8C]/20 bg-[#1a1a1a] px-3 py-2 text-white focus:border-[#887D2B] focus:ring focus:ring-[#887D2B]/30"
              value={timeRange}
              onChange={handleTimeRangeChange}
            >
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="year">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>
      
      <MetricsOverview />
      
      <div className="grid grid-cols-1">
        {isLoadingAthlete ? (
          <div className="flex h-64 items-center justify-center rounded-xl bg-[#1a1a1a] p-6 backdrop-blur-sm border border-[#8C8C8C]/10">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-[#887D2B]"></div>
            <span className="ml-2 text-white">Loading athlete data...</span>
          </div>
        ) : (
          <ExerciseMeasurements selectedAthlete={selectedAthlete} timeRange={timeRange} />
        )}
      </div>
    </div>
  );
} 