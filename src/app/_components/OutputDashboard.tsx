"use client";

import AthleteList from './athletes/AthleteList';
import ExerciseMeasurements from './exercises/ExerciseMeasurements';

export default function OutputDashboard() {
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
      
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex h-32 flex-1 items-center rounded-xl bg-white/5 p-6 backdrop-blur-sm">
          <div className="mr-4 rounded-full bg-blue-500/10 p-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-400">Total Athletes</p>
            <h4 className="text-2xl font-bold text-white">38</h4>
            <p className="text-sm text-green-400">↑ 4 since last month</p>
          </div>
        </div>
        
        <div className="flex h-32 flex-1 items-center rounded-xl bg-white/5 p-6 backdrop-blur-sm">
          <div className="mr-4 rounded-full bg-purple-500/10 p-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-400">Measurements Recorded</p>
            <h4 className="text-2xl font-bold text-white">845</h4>
            <p className="text-sm text-green-400">↑ 23% from last week</p>
          </div>
        </div>
        
        <div className="flex h-32 flex-1 items-center rounded-xl bg-white/5 p-6 backdrop-blur-sm">
          <div className="mr-4 rounded-full bg-green-500/10 p-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-400">Active Exercises</p>
            <h4 className="text-2xl font-bold text-white">24</h4>
            <p className="text-sm text-green-400">↑ 3 new exercises</p>
          </div>
        </div>
      </div>
      
      <ExerciseMeasurements />
      
      <AthleteList />
    </div>
  );
} 