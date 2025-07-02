"use client";

import { useState, useEffect } from 'react';
import ExerciseMeasurements from './exercises/ExerciseMeasurements';
import MetricsOverview from './MetricsOverview';
import PhysicsFormulasHelper from './PhysicsFormulasHelper';
import AIAnalysis from './AIAnalysis';
import type { Athlete } from '@/services/outputSports.client';
import { getAthletes } from '@/services/outputSports.client';
import { useSearchParams } from 'next/navigation';
import { api } from "@/trpc/react";

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
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [reportName, setReportName] = useState('');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const searchParams = useSearchParams();

  const saveReportMutation = api.reports.save.useMutation({
    onSuccess: () => {
      setShowSaveModal(false);
      setReportName('');
      alert('Report saved successfully!');
    },
    onError: (error: any) => {
      alert('Failed to save report: ' + error.message);
    },
  });

  const handleSaveReport = () => {
    if (!reportName.trim()) {
      alert('Please enter a report name');
      return;
    }

    saveReportMutation.mutate({
      name: reportName.trim(),
      athleteId: selectedAthlete?.id ?? null,
      athleteName: selectedAthlete?.fullName ?? 'All Athletes',
      exercise: selectedExercise,
      timeRange: timeRange,
      customStartDate: timeRange === 'custom' ? customStartDate : undefined,
      customEndDate: timeRange === 'custom' ? customEndDate : undefined,
    });
  };
  
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

  // Handle URL query parameters (from loaded reports)
  useEffect(() => {
    const athleteId = searchParams.get('athlete');
    const urlTimeRange = searchParams.get('timeRange');
    const urlExercise = searchParams.get('exercise');
    const urlCustomStartDate = searchParams.get('customStartDate');
    const urlCustomEndDate = searchParams.get('customEndDate');
    
    if (athleteId && athletes.length > 0) {
      const athlete = athletes.find(a => a.id === athleteId);
      
      if (athlete) {
        console.log('Found athlete from URL:', athlete.fullName);
        setSelectedAthlete(athlete);
      }
    }

    if (urlTimeRange && ['today', '7days', '30days', '90days', 'year', 'all', 'custom'].includes(urlTimeRange)) {
      setTimeRange(urlTimeRange as TimeRange);
    }

    if (urlExercise) {
      setSelectedExercise(urlExercise);
    }

    if (urlCustomStartDate && urlCustomEndDate) {
      setCustomStartDate(urlCustomStartDate);
      setCustomEndDate(urlCustomEndDate);
    }
  }, [searchParams, athletes]);

  // Initialize custom date range to default (today - 30 days through today)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    setCustomStartDate(formatDate(thirtyDaysAgo));
    setCustomEndDate(formatDate(today));
  }, []);

  const handleAthleteChange = (event: any) => {
    const athleteId = event.target.value;
    if (athleteId) {
      const athlete = athletes.find(a => a.id === athleteId) ?? null;
      console.log('Selected athlete:', athlete);
      setSelectedAthlete(athlete);
    } else {
      setSelectedAthlete(null);
    }
  };

  const handleTimeRangeChange = (event: any) => {
    setTimeRange(event.target.value as TimeRange);
  };

  const handleCustomStartDateChange = (event: any) => {
    setCustomStartDate(event.target.value);
  };

  const handleCustomEndDateChange = (event: any) => {
    setCustomEndDate(event.target.value);
  };

  const handleAggregationModeChange = (event: any) => {
    setAggregationMode(event.target.value as AggregationMode);
  };

  const getTimeRangeLabel = () => {
    switch(timeRange) {
      case 'today': return 'Today';
      case '7days': return 'Last 7 Days';
      case '30days': return 'Last 30 Days';
      case '90days': return 'Last 90 Days';
      case 'year': return 'Last Year';
      case 'all': return 'All Time';
      case 'custom': return `Custom (${customStartDate} to ${customEndDate})`;
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
            
            {/* Custom Date Range Inputs */}
            {timeRange === 'custom' && (
              <>
                <div className="w-full sm:w-auto">
                  <label className="mb-1 block text-sm font-medium text-[#8C8C8C] sm:hidden">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={handleCustomStartDateChange}
                    className="w-full rounded-md border-[#8C8C8C]/20 bg-[#1a1a1a] px-3 py-3 sm:py-2 text-white focus:border-[#887D2B] focus:ring focus:ring-[#887D2B]/30 text-base sm:text-sm"
                  />
                </div>
                <div className="w-full sm:w-auto">
                  <label className="mb-1 block text-sm font-medium text-[#8C8C8C] sm:hidden">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={handleCustomEndDateChange}
                    className="w-full rounded-md border-[#8C8C8C]/20 bg-[#1a1a1a] px-3 py-3 sm:py-2 text-white focus:border-[#887D2B] focus:ring focus:ring-[#887D2B]/30 text-base sm:text-sm"
                  />
                </div>
              </>
            )}
            
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
            <div className="w-full sm:w-auto">
              <button
                onClick={() => setShowSaveModal(true)}
                className="w-full bg-[#887D2B] hover:bg-[#9a8e30] text-white px-4 py-3 sm:py-2 rounded-md transition-colors text-base sm:text-sm font-medium"
              >
                Save Report
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <MetricsOverview />
      
      <PhysicsFormulasHelper />
      
      <AIAnalysis 
        selectedAthlete={selectedAthlete} 
        timeRange={timeRange} 
        selectedExercise={selectedExercise}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
      />
      
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
            customStartDate={customStartDate}
            customEndDate={customEndDate}
          />
        )}
      </div>

      {/* Save Report Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-md border border-[#8C8C8C]/20">
            <h3 className="text-xl font-semibold text-white mb-4">Save Report</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#8C8C8C] mb-2">
                Report Name
              </label>
              <input
                type="text"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Enter report name..."
                className="w-full rounded-md border-[#8C8C8C]/20 bg-[#0D0D0D] px-3 py-2 text-white focus:border-[#887D2B] focus:ring focus:ring-[#887D2B]/30"
              />
            </div>

            <div className="mb-6 text-sm text-[#8C8C8C]">
              <p><strong>Athlete:</strong> {selectedAthlete?.fullName ?? 'All Athletes'}</p>
              {selectedExercise && <p><strong>Exercise:</strong> {selectedExercise}</p>}
              <p><strong>Time Range:</strong> {getTimeRangeLabel()}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveReport}
                disabled={saveReportMutation.isPending || !reportName.trim()}
                className="flex-1 bg-[#887D2B] hover:bg-[#9a8e30] disabled:bg-[#5a5a5a] disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
              >
                {saveReportMutation.isPending ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setReportName('');
                }}
                className="flex-1 bg-[#8C8C8C] hover:bg-[#a0a0a0] text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 