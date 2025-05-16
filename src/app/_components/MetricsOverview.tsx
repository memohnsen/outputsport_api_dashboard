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