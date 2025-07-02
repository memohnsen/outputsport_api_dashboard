"use client";

import { useState, useEffect } from 'react';
import ExerciseMeasurements from './exercises/ExerciseMeasurements';
import MetricsOverview from './MetricsOverview';
import PhysicsFormulasHelper from './PhysicsFormulasHelper';
import AIAnalysis from './AIAnalysis';
import type { Athlete } from '@/services/outputSports.client';
import { getAthletes } from '@/services/outputSports.client';
import { useSearchParams } from 'next/navigation';

type TimeRange = 'today' | '7days' | '30days' | '90days' | 'year' | 'all' | 'custom';
type AggregationMode = 'aggregate' | 'showAll';

export default function OutputDashboard() {
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [isLoadingAthlete, setIsLoadingAthlete] = useState(false);
  const [isLoadingAthletes, setIsLoadingAthletes] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('7days');
  const [aggregationMode, setAggregationMode] = useState<AggregationMode>('aggregate');
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  
  // Custom date range state
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  
  const searchParams = useSearchParams();
  
  // Initialize custom date range with default values (today - 30 days to today)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setCustomEndDate(today.toISOString().split('T')[0]);
    setCustomStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);
  
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

  const handleAggregationModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setAggregationMode(event.target.value as AggregationMode);
  };

  const handleCustomStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCustomStartDate(event.target.value);
  };

  const handleCustomEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCustomEndDate(event.target.value);
  };

  const getTimeRangeLabel = () => {
    switch(timeRange) {
      case 'today': return 'Today';
      case '7days': return 'Last 7 Days';
      case '30days': return 'Last 30 Days';
      case '90days': return 'Last 90 Days';
      case 'year': return 'Last Year';
      case 'all': return 'All Time';
      case 'custom': return 'Custom Range';
      default: return 'Last 7 Days';
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <div>
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
            <div className="w-full sm:w-64 lg:max-w-xs">
              <label className="mb-1 block text-sm font-medium text-[#8C8C8C] sm:hidden">
                Select Athlete
              </label>
              <select
                className="w-full rounded-md border-[#8C8C8C]/20 bg-[#1a1a1a] px-3 py-3 sm:py-2 text-white focus:border-[#887D2B] focus:ring focus:ring-[#887D2B]/30 text-base sm:text-sm"
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
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
            <div className="w-full sm:w-auto">
              <label className="mb-1 block text-sm font-medium text-[#8C8C8C] sm:hidden">
                Time Range
              </label>
              <select
                className="w-full rounded-md border-[#8C8C8C]/20 bg-[#1a1a1a] px-3 py-3 sm:py-2 text-white focus:border-[#887D2B] focus:ring focus:ring-[#887D2B]/30 text-base sm:text-sm"
                value={timeRange}
                onChange={handleTimeRangeChange}
              >
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="year">Last Year</option>
                <option value="all">All Time</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="w-full sm:w-auto">
              <label className="mb-1 block text-sm font-medium text-[#8C8C8C] sm:hidden">
                View Mode
              </label>
              <select
                className="w-full rounded-md border-[#8C8C8C]/20 bg-[#1a1a1a] px-3 py-3 sm:py-2 text-white focus:border-[#887D2B] focus:ring focus:ring-[#887D2B]/30 text-base sm:text-sm"
                value={aggregationMode}
                onChange={handleAggregationModeChange}
              >
                <option value="aggregate">Aggregate</option>
                <option value="showAll">Show All</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Custom Date Range Picker */}
        {timeRange === 'custom' && (
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#8C8C8C]">
                Start Date
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={handleCustomStartDateChange}
                className="rounded-md border-[#8C8C8C]/20 bg-[#1a1a1a] px-3 py-2 text-white focus:border-[#887D2B] focus:ring focus:ring-[#887D2B]/30 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#8C8C8C]">
                End Date
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={handleCustomEndDateChange}
                className="rounded-md border-[#8C8C8C]/20 bg-[#1a1a1a] px-3 py-2 text-white focus:border-[#887D2B] focus:ring focus:ring-[#887D2B]/30 text-sm"
              />
            </div>
          </div>
        )}
      </div>
      
      <MetricsOverview />
      
      <PhysicsFormulasHelper />
      
      <AIAnalysis selectedAthlete={selectedAthlete} timeRange={timeRange} selectedExercise={selectedExercise} />
      
      <div className="grid grid-cols-1">
        {isLoadingAthlete ? (
          <div className="flex h-64 items-center justify-center rounded-xl bg-[#1a1a1a] p-6 backdrop-blur-sm border border-[#8C8C8C]/10">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-[#887D2B]"></div>
            <span className="ml-2 text-white">Loading athlete data...</span>
          </div>
        ) : (
          <ExerciseMeasurements 
            selectedAthlete={selectedAthlete} 
            timeRange={timeRange}
            aggregationMode={aggregationMode}
            selectedExercise={selectedExercise}
            onExerciseChange={setSelectedExercise}
          />
        )}
      </div>
    </div>
  );
} 