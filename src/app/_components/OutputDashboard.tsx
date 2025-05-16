"use client";

import { useState } from 'react';
import AthleteList from './athletes/AthleteList';
import ExerciseMeasurements from './exercises/ExerciseMeasurements';
import MetricsOverview from './MetricsOverview';
import type { Athlete } from '@/services/outputSports.client';

export default function OutputDashboard() {
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);

  return (
    <div className="grid grid-cols-1 gap-6">
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between">
          <h2 className="text-3xl font-bold text-white">Output Sports Dashboard</h2>
          <div className="ml-auto flex space-x-2">
            <button className="rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
              Last 7 Days
            </button>
            <button className="rounded bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20">
              Last Month
            </button>
            <button className="rounded bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20">
              Last Year
            </button>
          </div>
        </div>
      </div>
      
      <MetricsOverview />
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ExerciseMeasurements selectedAthlete={selectedAthlete} />
        </div>
        <div className="lg:col-span-1">
          <AthleteList 
            selectedAthlete={selectedAthlete} 
            onAthleteSelect={setSelectedAthlete} 
          />
        </div>
      </div>
    </div>
  );
} 