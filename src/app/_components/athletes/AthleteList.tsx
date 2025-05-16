"use client";

import { useEffect, useState } from 'react';
import { getAthletes, getExerciseMeasurements, getLast30DaysRange } from '@/services/outputSports.client';
import type { Athlete, ExerciseMeasurement } from '@/services/outputSports.client';

interface AthleteListProps {
  selectedAthlete: Athlete | null;
  onAthleteSelect: (athlete: Athlete | null) => void;
}

export default function AthleteList({ selectedAthlete, onAthleteSelect }: AthleteListProps) {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [athleteMeasurements, setAthleteMeasurements] = useState<ExerciseMeasurement[]>([]);
  const [loadingMeasurements, setLoadingMeasurements] = useState(false);
  // Add debug state to help troubleshoot
  const [debugInfo, setDebugInfo] = useState<string>('');

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

    fetchAthletes();
  }, []);

  // Fetch athlete's measurements when an athlete is selected
  useEffect(() => {
    if (!selectedAthlete) {
      setAthleteMeasurements([]);
      setDebugInfo('No athlete selected');
      return;
    }

    async function fetchAthleteMeasurements() {
      try {
        setLoadingMeasurements(true);
        const { startDate, endDate } = getLast30DaysRange();
        // Use optional chaining to prevent null reference errors
        const athleteName = selectedAthlete?.fullName || 'Unknown';
        const athleteId = selectedAthlete?.id || '';
        
        setDebugInfo(`Fetching measurements for athlete: ${athleteName} (${athleteId})`);
        
        if (athleteId) {
          // Ensure we're only fetching data for the selected athlete
          const measurements = await getExerciseMeasurements(startDate, endDate, [], [athleteId]);
          console.log(`Measurements for ${athleteName}:`, measurements);
          
          // Filter to ensure we only have measurements for this specific athlete
          const filteredMeasurements = measurements.filter(m => m.athleteId === athleteId);
          console.log(`Filtered measurements for ${athleteName}:`, filteredMeasurements);
          
          setAthleteMeasurements(filteredMeasurements);
          setDebugInfo(`Found ${filteredMeasurements.length} measurements for ${athleteName}`);
        }
      } catch (err) {
        console.error('Failed to fetch athlete measurements:', err);
        setDebugInfo(`Error fetching measurements: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoadingMeasurements(false);
      }
    }

    fetchAthleteMeasurements();
  }, [selectedAthlete]);

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

  const handleAthleteChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const athleteId = event.target.value;
    if (athleteId) {
      const athlete = athletes.find(a => a.id === athleteId) || null;
      console.log('Selected athlete:', athlete);
      
      // Clear measurements first to prevent showing previous data
      setAthleteMeasurements([]);
      
      // Update the selected athlete at the parent level
      onAthleteSelect(athlete);
      
      setDebugInfo(`Selected athlete: ${athlete?.fullName} (ID: ${athlete?.id})`);
    } else {
      // Clear measurements and athlete selection
      setAthleteMeasurements([]);
      onAthleteSelect(null);
      setDebugInfo('No athlete selected');
    }
  };

  // Log when the selectedAthlete prop changes
  useEffect(() => {
    if (selectedAthlete) {
      console.log(`AthleteList received selectedAthlete: ${selectedAthlete.fullName}`);
    } else {
      console.log('AthleteList received null selectedAthlete');
    }
  }, [selectedAthlete]);

  // Get the most common exercise category for the athlete
  const getTopExercise = () => {
    if (!athleteMeasurements.length) return 'N/A';
    
    const categoryCounts: Record<string, number> = {};
    athleteMeasurements.forEach(m => {
      const category = m.exerciseCategory;
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    let topCategory = '';
    let maxCount = 0;
    
    Object.entries(categoryCounts).forEach(([category, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topCategory = category;
      }
    });

    return topCategory || 'N/A';
  };

  // Get the most recent measurement date and exercise
  const getLatestMeasurement = () => {
    if (!athleteMeasurements.length) return { date: 'N/A', exercise: 'N/A' };
    
    // Make sure we sort by date
    const sortedMeasurements = [...athleteMeasurements].sort(
      (a, b) => new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime()
    );
    
    const latest = sortedMeasurements[0];
    if (!latest) return { date: 'N/A', exercise: 'N/A' };
    
    const daysAgo = Math.floor((Date.now() - new Date(latest.completedDate).getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      date: daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`,
      exercise: latest.exerciseId
    };
  };

  if (loading) {
    return (
      <div className="w-full rounded-xl bg-[#0D0D0D]/50 p-6 backdrop-blur-sm border border-[#8C8C8C]/10">
        <h3 className="mb-4 text-xl font-semibold text-white">Athlete Profile</h3>
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-[#887D2B]"></div>
          <span className="ml-2 text-white">Loading athletes...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full rounded-xl bg-[#0D0D0D]/50 p-6 backdrop-blur-sm border border-[#8C8C8C]/10">
        <h3 className="mb-4 text-xl font-semibold text-white">Athlete Profile</h3>
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

  const latestMeasurement = getLatestMeasurement();

  return (
    <div className="w-full rounded-xl bg-[#0D0D0D]/50 p-6 backdrop-blur-sm border border-[#8C8C8C]/10">
      <h3 className="mb-4 text-xl font-semibold text-white">Athlete Profile</h3>
      
      <div className="mb-6">
        <label htmlFor="athlete-select" className="mb-2 block text-sm font-medium text-[#8C8C8C]">
          Select Athlete:
        </label>
        <select
          id="athlete-select"
          className="w-full rounded-md border-[#8C8C8C]/20 bg-[#0D0D0D]/70 px-3 py-2 text-white focus:border-[#887D2B] focus:ring focus:ring-[#887D2B]/30"
          value={selectedAthlete?.id || ''}
          onChange={handleAthleteChange}
        >
          <option value="">-- Select an athlete --</option>
          {athletes.map(athlete => (
            <option key={athlete.id} value={athlete.id}>
              {athlete.fullName}
            </option>
          ))}
        </select>
      </div>
      
      {selectedAthlete ? (
        <div className="rounded-lg bg-[#0D0D0D]/70 p-5 border border-[#8C8C8C]/10">
          <div className="mb-4 flex items-center">
            <div className="mr-4 h-16 w-16 rounded-full bg-[#887D2B]/30 text-center">
              <span className="text-2xl font-bold leading-[4rem] text-white">
                {selectedAthlete.firstName[0]}{selectedAthlete.lastName[0]}
              </span>
            </div>
            <div>
              <h4 className="text-xl font-bold text-white">{selectedAthlete.fullName}</h4>
              <p className="text-[#8C8C8C]">ID: {selectedAthlete.id}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-md bg-[#0D0D0D]/80 p-3">
              <p className="text-sm text-[#8C8C8C]">External ID</p>
              <p className="text-white">{selectedAthlete.externalId || 'N/A'}</p>
            </div>
            <div className="rounded-md bg-[#0D0D0D]/80 p-3">
              <p className="text-sm text-[#8C8C8C]">Date of Birth</p>
              <p className="text-white">{formatDate(selectedAthlete.dateOfBirth)}</p>
            </div>
            <div className="rounded-md bg-[#0D0D0D]/80 p-3">
              <p className="text-sm text-[#8C8C8C]">Age</p>
              <p className="text-white">{calculateAge(selectedAthlete.dateOfBirth)} years</p>
            </div>
          </div>
          
          <div className="mt-6">
            <h5 className="mb-3 text-lg font-medium text-white">Performance Summary</h5>
            {loadingMeasurements ? (
              <div className="flex items-center justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-t-2 border-[#887D2B]"></div>
                <span className="ml-2 text-sm text-white">Loading data...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-md bg-[#0D0D0D]/80 p-3">
                  <p className="text-sm text-[#8C8C8C]">Total Measurements</p>
                  <p className="text-xl font-semibold text-white">{athleteMeasurements.length}</p>
                </div>
                <div className="rounded-md bg-[#0D0D0D]/80 p-3">
                  <p className="text-sm text-[#8C8C8C]">Latest Measurement</p>
                  <p className="text-white">{latestMeasurement.exercise} ({latestMeasurement.date})</p>
                </div>
                <div className="rounded-md bg-[#0D0D0D]/80 p-3">
                  <p className="text-sm text-[#8C8C8C]">Top Exercise Category</p>
                  <p className="text-white">{getTopExercise()}</p>
                </div>
                <div className="rounded-md bg-[#0D0D0D]/80 p-3">
                  <p className="text-sm text-[#8C8C8C]">Data Status</p>
                  {athleteMeasurements.length > 0 ? (
                    <p className="text-sm text-green-400">✓ Active measurements available</p>
                  ) : (
                    <p className="text-sm text-amber-400">! No recent measurements found</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Debug information - remove in production */}
          {/* <div className="mt-4 border-t border-gray-700 pt-3 text-xs text-gray-500">
            <p>Debug: {debugInfo}</p>
          </div> */}
        </div>
      ) : (
        <div className="rounded-md bg-[#0D0D0D]/70 p-6 text-center text-white border border-[#8C8C8C]/10">
          <svg className="mx-auto mb-4 h-12 w-12 text-[#8C8C8C]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <p className="mb-2 text-lg font-medium">No athlete selected</p>
          <p>Select an athlete from the dropdown to view their profile</p>
        </div>
      )}
    </div>
  );
} 