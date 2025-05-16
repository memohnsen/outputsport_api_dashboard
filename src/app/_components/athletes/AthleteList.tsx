"use client";

import { useEffect, useState } from 'react';
import { getAthletes } from '@/services/outputSports.client';
import type { Athlete } from '@/services/outputSports.client';

export default function AthleteList() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);

  useEffect(() => {
    async function fetchAthletes() {
      try {
        setLoading(true);
        const data = await getAthletes();
        setAthletes(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch athletes:', err);
        setError('Failed to load athletes. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchAthletes();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  if (loading) {
    return (
      <div className="w-full rounded-xl bg-white/5 p-6 backdrop-blur-sm">
        <h3 className="mb-4 text-xl font-semibold text-white">Athletes</h3>
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-purple-500"></div>
          <span className="ml-2 text-white">Loading athletes...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full rounded-xl bg-white/5 p-6 backdrop-blur-sm">
        <h3 className="mb-4 text-xl font-semibold text-white">Athletes</h3>
        <div className="rounded-md bg-red-500/20 p-4 text-center text-white">
          <p>{error}</p>
          <button 
            className="mt-3 rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl bg-white/5 p-6 backdrop-blur-sm">
      <h3 className="mb-4 text-xl font-semibold text-white">Athletes ({athletes.length})</h3>
      
      {selectedAthlete ? (
        <div>
          <button 
            onClick={() => setSelectedAthlete(null)}
            className="mb-4 flex items-center text-sm text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to all athletes
          </button>
          
          <div className="rounded-lg bg-white/10 p-5">
            <div className="mb-4 flex items-center">
              <div className="mr-4 h-16 w-16 rounded-full bg-purple-500/30 text-center">
                <span className="text-2xl font-bold leading-[4rem] text-white">
                  {selectedAthlete.firstName[0]}{selectedAthlete.lastName[0]}
                </span>
              </div>
              <div>
                <h4 className="text-xl font-bold text-white">{selectedAthlete.fullName}</h4>
                <p className="text-gray-400">ID: {selectedAthlete.id}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-md bg-white/5 p-3">
                <p className="text-sm text-gray-400">External ID</p>
                <p className="text-white">{selectedAthlete.externalId || 'N/A'}</p>
              </div>
              <div className="rounded-md bg-white/5 p-3">
                <p className="text-sm text-gray-400">Date of Birth</p>
                <p className="text-white">{formatDate(selectedAthlete.dateOfBirth)}</p>
              </div>
              <div className="rounded-md bg-white/5 p-3">
                <p className="text-sm text-gray-400">Age</p>
                <p className="text-white">{calculateAge(selectedAthlete.dateOfBirth)} years</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-full table-auto">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-4 py-2 text-left font-medium text-gray-300">Name</th>
                <th className="px-4 py-2 text-left font-medium text-gray-300">ID</th>
                <th className="px-4 py-2 text-left font-medium text-gray-300">Date of Birth</th>
                <th className="px-4 py-2 text-left font-medium text-gray-300">Age</th>
                <th className="px-4 py-2 text-left font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {athletes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No athletes found
                  </td>
                </tr>
              ) : (
                athletes.map(athlete => (
                  <tr 
                    key={athlete.id} 
                    className="border-b border-gray-800 hover:bg-white/5"
                  >
                    <td className="px-4 py-3 text-white">{athlete.fullName}</td>
                    <td className="px-4 py-3 text-gray-300">{athlete.id}</td>
                    <td className="px-4 py-3 text-gray-300">{formatDate(athlete.dateOfBirth)}</td>
                    <td className="px-4 py-3 text-gray-300">{calculateAge(athlete.dateOfBirth)}</td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => setSelectedAthlete(athlete)}
                        className="rounded bg-purple-600/80 px-3 py-1 text-sm text-white hover:bg-purple-600"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 