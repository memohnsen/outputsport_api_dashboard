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
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');

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

  // Sort and filter athletes whenever the athletes array, sort option, search term, or sort order changes
  useEffect(() => {
    if (!athletes.length) return;

    // First filter by search term
    let filtered = athletes;
    if (searchTerm) {
      filtered = athletes.filter(athlete => 
        athlete.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        athlete.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        athlete.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (athlete.externalId && athlete.externalId.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Then sort
    const sorted = [...filtered];
    
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

    // Apply sort order
    if (sortOrder === 'desc') {
      sorted.reverse();
    }
    
    setSortedAthletes(sorted);
  }, [athletes, sortBy, sortOrder, searchTerm]);

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
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 max-w-md">
            <label htmlFor="search" className="sr-only">Search athletes</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-[#8C8C8C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                placeholder="Search athletes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-3 sm:py-2 text-base sm:text-sm rounded-md border border-[#8C8C8C]/20 bg-[#1a1a1a] text-white placeholder-[#8C8C8C] focus:border-[#887D2B] focus:ring focus:ring-[#887D2B]/30"
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-2 sm:items-center">
            <div className="w-full sm:w-auto">
              <label className="mb-1 block text-sm font-medium text-[#8C8C8C] sm:hidden">
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full sm:w-auto px-3 py-3 sm:py-2 text-base sm:text-sm rounded-md border border-[#8C8C8C]/20 bg-[#1a1a1a] text-white focus:border-[#887D2B] focus:ring focus:ring-[#887D2B]/30"
              >
                <option value="firstName">Sort by First Name</option>
                <option value="lastName">Sort by Last Name</option>
                <option value="age">Sort by Age</option>
              </select>
            </div>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="w-full sm:w-auto px-3 py-3 sm:py-2 text-base sm:text-sm rounded-md border border-[#8C8C8C]/20 bg-[#1a1a1a] text-white hover:bg-[#212121] focus:border-[#887D2B] focus:ring focus:ring-[#887D2B]/30 transition-colors"
              title={`Currently sorting ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
            >
              {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
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

      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedAthletes.map(athlete => (
          <div 
            key={athlete.id} 
            className="rounded-xl bg-[#1a1a1a] p-4 sm:p-6 backdrop-blur-sm transition-all hover:bg-[#212121] border border-[#8C8C8C]/10"
          >
            <div className="mb-4 flex items-center">
              <div className="mr-3 sm:mr-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-[#887D2B]/30 text-center">
                <span className="text-lg sm:text-2xl font-bold text-white">
                  {athlete.firstName[0]}{athlete.lastName[0]}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-white truncate">{athlete.fullName}</h3>
                <p className="text-sm text-[#8C8C8C]">{calculateAge(athlete.dateOfBirth)} years old</p>
              </div>
            </div>
            
            <div className="mb-4 grid grid-cols-1 gap-2">
              <div className="rounded bg-[#0D0D0D]/90 p-3">
                <p className="text-xs text-[#8C8C8C]">External ID</p>
                <p className="truncate text-sm text-white">{athlete.externalId ?? 'N/A'}</p>
              </div>
              <div className="rounded bg-[#0D0D0D]/90 p-3">
                <p className="text-xs text-[#8C8C8C]">Date of Birth</p>
                <p className="text-sm text-white">{formatDate(athlete.dateOfBirth)}</p>
              </div>
            </div>
            
            <Link 
              href={`/?athlete=${athlete.id}`}
              className="mt-2 block w-full rounded-md bg-[#887D2B] px-4 py-3 sm:py-2 text-center text-base sm:text-sm font-medium text-white hover:bg-[#776c25] transition-colors"
            >
              View Performance
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
} 