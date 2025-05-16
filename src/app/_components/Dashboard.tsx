"use client";

import BarChart from './charts/BarChart';
import LineChart from './charts/LineChart';
import PieChart from './charts/PieChart';
import DataTable from './DataTable';

export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      <div className="md:col-span-2 xl:col-span-3">
        <div className="mb-6 flex flex-wrap items-center justify-between">
          <h2 className="text-3xl font-bold text-white">Analytics Dashboard</h2>
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
      
      <div className="xl:col-span-2">
        <LineChart title="Revenue Growth Trend" />
      </div>
      
      <div>
        <PieChart title="Sales Distribution" />
      </div>
      
      <div>
        <BarChart title="Monthly Sales" />
      </div>
      
      <div className="md:col-span-2">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex items-center rounded-xl bg-white/5 p-6 backdrop-blur-sm">
            <div className="mr-4 rounded-full bg-blue-500/10 p-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Revenue</p>
              <h4 className="text-2xl font-bold text-white">$24,345</h4>
              <p className="text-sm text-green-400">↑ 8.2% from last month</p>
            </div>
          </div>
          
          <div className="flex items-center rounded-xl bg-white/5 p-6 backdrop-blur-sm">
            <div className="mr-4 rounded-full bg-purple-500/10 p-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Active Users</p>
              <h4 className="text-2xl font-bold text-white">12,543</h4>
              <p className="text-sm text-green-400">↑ 12.3% from last month</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="md:col-span-2 xl:col-span-3">
        <DataTable title="Top Performing Products" />
      </div>
    </div>
  );
} 