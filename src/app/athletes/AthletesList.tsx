"use client";

import { useEffect, useState } from 'react';
import { getAthletes } from '@/services/outputSports.client';
import type { Athlete } from '@/services/outputSports.client';
import Link from 'next/link';

type SortOption = 'firstName' | 'lastName' | 'age';

export default function AthletesList() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [sortedAthletes, setSortedAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('firstName');

  useEffect(() => {
    async function fetchAthletes() {
      try {
        setLoading(true);
        const data = await getAthletes();
        console.log('Fetched athletes:', data);
        setAthletes(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch athletes:', err);
        setError('Failed to load athletes. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    void fetchAthletes();
  }, []);

  // Sort athletes whenever the athletes array or sort option changes
  useEffect(() => {
    if (!athletes.length) return;

    const sorted = [...athletes];
    
    switch (sortBy) {
      case 'firstName':
        sorted.sort((a, b) => a.firstName.localeCompare(b.firstName));
        break;
      case 'lastName':
        sorted.sort((a, b) => a.lastName.localeCompare(b.lastName));
        break;
      case 'age':
        sorted.sort((a, b) => {
          const ageA = calculateAge(a.dateOfBirth);
          const ageB = calculateAge(b.dateOfBirth);
          return ageA - ageB;
        });
        break;
    }
    
    setSortedAthletes(sorted);
  }, [athletes, sortBy]);

  const handleSortChange = (option: SortOption) => {
    setSortBy(option);
  };

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
      <div className="flex items-center justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-[#887D2B]"></div>
        <span className="ml-3 text-xl text-white">Loading athletes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full rounded-xl bg-white/5 p-6 backdrop-blur-sm">
        <div className="rounded-md bg-red-500/20 p-4 text-center text-white">
          <p>{error}</p>
          <button 
            className="mt-3 rounded bg-[#887D2B] px-4 py-2 text-sm font-medium text-white hover:bg-[#776c25]"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-center justify-end">        
        <div className="flex items-center">
          <p className="mr-4 text-[#8C8C8C]">Sort by:</p>
          <div className="flex space-x-2">
            <button 
              className={`rounded px-3 py-1 text-sm font-medium ${sortBy === 'firstName' ? 'bg-[#887D2B] text-white' : 'bg-white/10 text-[#8C8C8C] hover:bg-white/20'}`}
              onClick={() => handleSortChange('firstName')}
            >
              First Name
            </button>
            <button 
              className={`rounded px-3 py-1 text-sm font-medium ${sortBy === 'lastName' ? 'bg-[#887D2B] text-white' : 'bg-white/10 text-[#8C8C8C] hover:bg-white/20'}`}
              onClick={() => handleSortChange('lastName')}
            >
              Last Name
            </button>
            <button 
              className={`rounded px-3 py-1 text-sm font-medium ${sortBy === 'age' ? 'bg-[#887D2B] text-white' : 'bg-white/10 text-[#8C8C8C] hover:bg-white/20'}`}
              onClick={() => handleSortChange('age')}
            >
              Age
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <p className="text-[#8C8C8C]">Total athletes: {sortedAthletes.length}</p>
        <p className="text-sm text-[#8C8C8C]">
          {sortBy === 'firstName' && 'Sorted by first name (A-Z)'}
          {sortBy === 'lastName' && 'Sorted by last name (A-Z)'}
          {sortBy === 'age' && 'Sorted by age (youngest first)'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedAthletes.map(athlete => (
          <div 
            key={athlete.id} 
            className="rounded-xl bg-[#1a1a1a] p-6 backdrop-blur-sm transition-all hover:bg-[#212121] border border-[#8C8C8C]/10"
          >
            <div className="mb-4 flex items-center">
              <div className="mr-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#887D2B]/30 text-center">
                <span className="text-2xl font-bold text-white">
                  {athlete.firstName[0]}{athlete.lastName[0]}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{athlete.fullName}</h3>
                <p className="text-sm text-[#8C8C8C]">{calculateAge(athlete.dateOfBirth)} years old</p>
              </div>
            </div>
            
            <div className="mb-4 grid grid-cols-2 gap-2">
              <div className="rounded bg-[#0D0D0D]/90 p-2">
                <p className="text-xs text-[#8C8C8C]">External ID</p>
                <p className="truncate text-sm text-white">{athlete.externalId ?? 'N/A'}</p>
              </div>
              <div className="rounded bg-[#0D0D0D]/90 p-2">
                <p className="text-xs text-[#8C8C8C]">Date of Birth</p>
                <p className="text-sm text-white">{formatDate(athlete.dateOfBirth)}</p>
              </div>
            </div>
            
            <Link 
              href={`/?athlete=${athlete.id}`}
              className="mt-2 block w-full rounded-md bg-[#887D2B] px-4 py-2 text-center text-sm font-medium text-white hover:bg-[#776c25]"
            >
              View Performance
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
} 