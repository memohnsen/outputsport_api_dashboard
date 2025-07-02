"use client";

import { useState } from 'react';
import { api } from "@/trpc/react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type TimeRange = 'today' | '7days' | '30days' | '90days' | 'year' | 'all' | 'custom';

interface SavedReport {
  id: string;
  name: string;
  athleteId: string | null;
  athleteName: string;
  exercise: string | null;
  timeRange: string;
  customStartDate?: string;
  customEndDate?: string;
  createdAt: Date;
}

export default function ReportsPage() {
  const router = useRouter();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: reports, isLoading, refetch } = api.reports.getAll.useQuery();
  const deleteMutation = api.reports.delete.useMutation({
    onSuccess: () => {
      void refetch();
      setDeleteConfirm(null);
    },
  });

  const getTimeRangeLabel = (timeRange: string, customStartDate?: string, customEndDate?: string) => {
    switch(timeRange) {
      case 'today': return 'Today';
      case '7days': return 'Last 7 Days';
      case '30days': return 'Last 30 Days';
      case '90days': return 'Last 90 Days';
      case 'year': return 'Last Year';
      case 'all': return 'All Time';
      case 'custom': 
        if (customStartDate && customEndDate) {
          return `Custom (${customStartDate} to ${customEndDate})`;
        }
        return 'Custom';
      default: return timeRange;
    }
  };

  const handleLoadReport = (report: SavedReport) => {
    const params = new URLSearchParams();
    if (report.athleteId) {
      params.set('athlete', report.athleteId);
    }
    params.set('timeRange', report.timeRange);
    if (report.exercise) {
      params.set('exercise', report.exercise);
    }
    if (report.timeRange === 'custom' && report.customStartDate && report.customEndDate) {
      params.set('customStartDate', report.customStartDate);
      params.set('customEndDate', report.customEndDate);
    }
    
    router.push(`/?${params.toString()}`);
  };

  const handleDeleteReport = (reportId: string) => {
    deleteMutation.mutate({ id: reportId });
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#0D0D0D] to-[#1a1a1a] px-4 py-6 sm:py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-center py-12 sm:py-16">
            <div className="h-8 w-8 sm:h-10 sm:w-10 animate-spin rounded-full border-b-2 border-t-2 border-[#887D2B]"></div>
            <span className="ml-3 text-lg sm:text-xl text-white">Loading reports...</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0D0D0D] to-[#1a1a1a] px-4 py-6 sm:py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              <span className="text-[#887D2B]">Saved</span> 
              <span className="block sm:inline"> Reports</span>
            </h1>
            
            <nav className="flex space-x-6 lg:space-x-8 items-center">
              <Link href="/" className="text-[#8C8C8C] hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link href="/athletes" className="text-[#8C8C8C] hover:text-white transition-colors">
                Athletes
              </Link>
              <Link href="/reports" className="text-white hover:text-[#887D2B] transition-colors">
                Reports
              </Link>
            </nav>
          </div>
        </header>

        <div className="space-y-4">
          {!reports || reports.length === 0 ? (
            <div className="rounded-xl bg-[#1a1a1a] p-8 backdrop-blur-sm border border-[#8C8C8C]/10 text-center">
              <h3 className="text-xl font-semibold text-white mb-2">No Saved Reports</h3>
              <p className="text-[#8C8C8C] mb-4">
                You haven't saved any reports yet. Go to the dashboard and save your first report!
              </p>
              <Link 
                href="/"
                className="inline-block bg-[#887D2B] hover:bg-[#9a8e30] text-white px-6 py-2 rounded-lg transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="rounded-xl bg-[#1a1a1a] p-6 backdrop-blur-sm border border-[#8C8C8C]/10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">{report.name}</h3>
                    <div className="space-y-1 text-sm text-[#8C8C8C]">
                      <p>
                        <span className="font-medium">Athlete:</span> {report.athleteName}
                      </p>
                      {report.exercise && (
                        <p>
                          <span className="font-medium">Exercise:</span> {report.exercise}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Time Range:</span> {getTimeRangeLabel(report.timeRange, report.customStartDate, report.customEndDate)}
                      </p>
                      <p>
                        <span className="font-medium">Created:</span> {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => handleLoadReport(report)}
                      className="bg-[#887D2B] hover:bg-[#9a8e30] text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Load Report
                    </button>
                    
                    {deleteConfirm === report.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          disabled={deleteMutation.isPending}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {deleteMutation.isPending ? 'Deleting...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="bg-[#8C8C8C] hover:bg-[#a0a0a0] text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(report.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}