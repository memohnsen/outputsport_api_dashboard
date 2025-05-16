"use client";

import { useEffect, useState } from 'react';
import { getExerciseMeasurements, getExerciseMetadata } from '@/services/outputSports.client';
import type { ExerciseMetadata, ExerciseMeasurement, Athlete } from '@/services/outputSports.client';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type TimeRange = 'today' | '7days' | '30days' | '90days' | 'year' | 'all';

interface ExerciseMeasurementsProps {
  selectedAthlete: Athlete | null;
  timeRange: TimeRange;
}

export default function ExerciseMeasurements({ selectedAthlete, timeRange }: ExerciseMeasurementsProps) {
  const [measurements, setMeasurements] = useState<ExerciseMeasurement[]>([]);
  const [allMeasurements, setAllMeasurements] = useState<ExerciseMeasurement[]>([]);
  const [exercises, setExercises] = useState<ExerciseMetadata[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<ExerciseMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  // Get date range based on selected time range
  const getDateRange = () => {
    // Get current date in local timezone
    const now = new Date();
    
    // Format date as YYYY-MM-DD using local date components
    const formatDateString = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    // Current date as end date
    const endDateStr = formatDateString(now);
    let startDateStr;
    
    // Calculate date ranges based on selected option
    switch(timeRange) {
      case 'today':
        // Today's date - explicitly set both start and end date to today
        startDateStr = endDateStr;
        console.log(`Today's exact date: ${now.toLocaleString()}`);
        console.log(`Today's range string: ${startDateStr} (for both start and end)`);
        break;
      case '7days':
        // 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        startDateStr = formatDateString(sevenDaysAgo);
        break;
      case '30days':
        // 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        startDateStr = formatDateString(thirtyDaysAgo);
        break;
      case '90days':
        // 90 days - maximum recommended range based on API behavior
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(now.getDate() - 90);
        startDateStr = formatDateString(ninetyDaysAgo);
        break;
      case 'year':
        // Limit to 90 days for "year" option since API seems to reject larger ranges
        const yearLimited = new Date();
        yearLimited.setDate(now.getDate() - 90);
        startDateStr = formatDateString(yearLimited);
        break;
      case 'all':
        // Also limit "all time" to 90 days based on API behavior in logs
        const allTimeLimited = new Date();
        allTimeLimited.setDate(now.getDate() - 90);
        startDateStr = formatDateString(allTimeLimited);
        break;
      default:
        // Default to 30 days
        const defaultDate = new Date();
        defaultDate.setDate(now.getDate() - 30);
        startDateStr = formatDateString(defaultDate);
    }
    
    console.log(`Using date range: ${startDateStr} to ${endDateStr} for ${timeRange}`);
    
    // Return the date strings directly
    return { 
      startDateStr,
      endDateStr
    };
  };

  // Initial data fetch for all measurements
  useEffect(() => {
    async function fetchInitialData() {
      try {
        setInitialLoading(true);
        console.log("Initial data fetch for all measurements and metadata");
        
        // Fetch all exercise metadata
        const exercisesData = await getExerciseMetadata();
        setExercises(exercisesData);
        
        // Get a reasonably large date range (1 year)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(endDate.getFullYear() - 1);
        
        // Format dates using local components
        const formatLocalDate = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        
        const startDateStr = formatLocalDate(startDate);
        const endDateStr = formatLocalDate(endDate);
        
        console.log(`Fetching all measurements from ${startDateStr} to ${endDateStr}`);
        
        // Fetch all measurements for the selected athlete (or all athletes)
        const athleteIds = selectedAthlete ? [selectedAthlete.id] : [];
        
        try {
          // Make a single API call to get measurements for a full year
          if (startDateStr && endDateStr) {
            const allMeasurementsData = await getExerciseMeasurements(startDateStr, endDateStr, [], athleteIds);
            console.log(`Successfully fetched ${allMeasurementsData.length} total measurements`);
            
            // Filter the measurements for the selected athlete if needed
            const filteredAllData = selectedAthlete 
              ? allMeasurementsData.filter(m => m.athleteId === selectedAthlete.id)
              : allMeasurementsData;
            
            console.log(`Total measurements after filtering: ${filteredAllData.length}`);
            
            // Store all measurements for later filtering by date range
            setAllMeasurements(filteredAllData);
            
            // Initial filtering by current time range
            filterMeasurementsByTimeRange(filteredAllData, timeRange);
          }
        } catch (error) {
          console.error('Error fetching all measurements:', error);
          
          // Try a smaller range as fallback (3 months)
          try {
            console.log("Trying fallback with 90 days instead of 1 year");
            const fallbackStartDate = new Date();
            fallbackStartDate.setDate(fallbackStartDate.getDate() - 90);
            
            const fallbackStartStr = formatLocalDate(fallbackStartDate);
            const fallbackAllMeasurements = await getExerciseMeasurements(
              fallbackStartStr || '', 
              endDateStr || '', 
              [], 
              athleteIds
            );
            
            console.log(`Fallback successful: got ${fallbackAllMeasurements.length} measurements for 90 days`);
            
            // Filter for selected athlete if needed
            const filteredFallbackData = selectedAthlete 
              ? fallbackAllMeasurements.filter(m => m.athleteId === selectedAthlete.id)
              : fallbackAllMeasurements;
            
            setAllMeasurements(filteredFallbackData);
            filterMeasurementsByTimeRange(filteredFallbackData, timeRange);
            setError('Limited to last 90 days of data');
            setTimeout(() => setError(null), 5000);
          } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            setError('Failed to load measurement data. Try selecting a specific time range.');
            setAllMeasurements([]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
        if (err instanceof Error) {
          setError(`Failed to load data: ${err.message}`);
        } else {
          setError('Failed to load data. Please try again later.');
        }
      } finally {
        setInitialLoading(false);
      }
    }
    
    fetchInitialData();
  }, [selectedAthlete]); // Only re-fetch all data when athlete changes
  
  // Function to filter measurements by time range
  const filterMeasurementsByTimeRange = (measurements: ExerciseMeasurement[], currentTimeRange: TimeRange) => {
    setLoading(true);
    
    const { startDateStr, endDateStr } = getDateRange();
    console.log(`Filtering measurements for time range: ${currentTimeRange} (${startDateStr} to ${endDateStr})`);
    
    try {
      // For the "today" case, use a simpler string-based date comparison to avoid timezone issues
      if (currentTimeRange === 'today') {
        console.log(`TODAY CASE - Using direct date string comparison with ${startDateStr}`);
        
        // Filter directly using the date string for today's date
        const filteredByDate = measurements.filter(measurement => {
          // Extract just the date part from the measurement's completedDate
          const datePartOnly = measurement.completedDate.split('T')[0];
          const isToday = datePartOnly === startDateStr; // Since startDateStr === endDateStr for "today"
          
          console.log(`Measurement date: ${measurement.completedDate}, extracted date: ${datePartOnly}, isToday: ${isToday}`);
          return isToday;
        });
        
        console.log(`Filtered to ${filteredByDate.length} measurements for TODAY`);
        
        // Continue with the rest of the filtering logic...
        setMeasurements(filteredByDate);
        
        // Get unique exercise IDs from the filtered measurements
        const exerciseIdsWithData = new Set(filteredByDate.map(m => m.exerciseId));
        
        // Filter the exercises metadata to only include exercises with data
        const availableExercises = exercises.filter(exercise => 
          exerciseIdsWithData.has(exercise.id)
        );
        
        console.log(`Found ${availableExercises.length} exercises with data for today`);
        setFilteredExercises(availableExercises);
        
        // Update selected exercise if needed
        if (selectedExercise && !exerciseIdsWithData.has(selectedExercise)) {
          if (availableExercises.length > 0 && availableExercises[0]?.id) {
            console.log(`Selected exercise ${selectedExercise} has no data in this range, switching to ${availableExercises[0].id}`);
            setSelectedExercise(availableExercises[0].id);
          } else {
            setSelectedExercise(null);
          }
        } else if (!selectedExercise && availableExercises.length > 0 && availableExercises[0]?.id) {
          setSelectedExercise(availableExercises[0].id);
        }
        
        setError(null);
        setLoading(false);
        return;
      }
      
      // For other time ranges, use the existing date-based comparison logic
      // Create fresh Date objects from our formatted date strings (in local time)
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      
      // Set time to beginning of day (00:00:00) in local time
      startDate.setHours(0, 0, 0, 0);
      
      // Set time to end of day (23:59:59.999) in local time
      endDate.setHours(23, 59, 59, 999);
      
      // Log the actual date objects with times for debugging
      console.log(`Date range for filtering - Start: ${startDate.toISOString()}, End: ${endDate.toISOString()}`);
      
      // Filter measurements by date range
      const filteredByDate = measurements.filter(measurement => {
        const measurementDate = new Date(measurement.completedDate);
        return measurementDate >= startDate && measurementDate <= endDate;
      });
      
      console.log(`Filtered to ${filteredByDate.length} measurements for the selected time range`);
      
      // Update measurements state with filtered data
      setMeasurements(filteredByDate);
      
      // Get unique exercise IDs from the filtered measurements
      const exerciseIdsWithData = new Set(filteredByDate.map(m => m.exerciseId));
      
      // Filter the exercises metadata to only include exercises with data
      const availableExercises = exercises.filter(exercise => 
        exerciseIdsWithData.has(exercise.id)
      );
      
      console.log(`Found ${availableExercises.length} exercises with data for this time range`);
      setFilteredExercises(availableExercises);
      
      // Update selected exercise if needed
      if (selectedExercise && !exerciseIdsWithData.has(selectedExercise)) {
        if (availableExercises.length > 0 && availableExercises[0]?.id) {
          console.log(`Selected exercise ${selectedExercise} has no data in this range, switching to ${availableExercises[0].id}`);
          setSelectedExercise(availableExercises[0].id);
        } else {
          setSelectedExercise(null);
        }
      } else if (!selectedExercise && availableExercises.length > 0 && availableExercises[0]?.id) {
        setSelectedExercise(availableExercises[0].id);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error filtering measurements:', err);
      setError('Error filtering data by date range');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter measurements when time range changes
  useEffect(() => {
    if (allMeasurements.length > 0) {
      console.log(`Time range changed to: ${timeRange}, filtering ${allMeasurements.length} measurements...`);
      
      // Special debug for "today" - log any measurements that exist for today
      if (timeRange === 'today') {
        // Get today's date in YYYY-MM-DD format
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        console.log(`DEBUG - Today's date: ${todayStr}`);
        
        // Check for any measurements with today's date
        const todayData = allMeasurements.filter(m => {
          const measurementDateStr = m.completedDate.split('T')[0];
          const isToday = measurementDateStr === todayStr;
          if (isToday) {
            console.log(`Found measurement for today: ${m.completedDate}, athlete: ${m.athleteFirstName} ${m.athleteLastName}`);
          }
          return isToday;
        });
        
        console.log(`Total today's measurements in data: ${todayData.length}`);
      }
      
      filterMeasurementsByTimeRange(allMeasurements, timeRange);
    }
  }, [timeRange, allMeasurements, exercises]);

  // Update chart data when selected exercise changes or measurements are loaded
  useEffect(() => {
    if (!selectedExercise || measurements.length === 0) {
      // Clear chart data if there are no measurements but preserve selected exercise
      setChartData([]);
      return;
    }
    
    // Filter measurements for the selected exercise
    const exerciseMeasurements = measurements.filter(m => m.exerciseId === selectedExercise);
    console.log(`Filtered to ${exerciseMeasurements.length} measurements for exercise ${selectedExercise}`);
    
    if (exerciseMeasurements.length === 0) {
      // No measurements for this exercise in the selected time range
      setChartData([]);
      return;
    }
    
    // Process data for the chart
    const processedData = exerciseMeasurements.map(measurement => {
      // Ensure we have proper date handling
      let formattedDate = '';
      let formattedFullDate = new Date();
      
      try {
        const date = new Date(measurement.completedDate);
        if (!isNaN(date.getTime())) {
          formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
          formattedFullDate = date;
        } else {
          console.error('Invalid date in measurement:', measurement.completedDate);
        }
      } catch (error) {
        console.error('Error processing date:', error);
      }
      
      // Create a base object with the date and athlete info
      const dataPoint: any = {
        id: measurement.id,
        date: formattedDate,
        fullDate: formattedFullDate,
        rawDate: measurement.completedDate,
        athleteId: measurement.athleteId,
        athleteName: `${measurement.athleteFirstName} ${measurement.athleteLastName}`,
        exerciseId: measurement.exerciseId,
        exerciseCategory: measurement.exerciseCategory,
        exerciseType: measurement.exerciseType,
        variant: measurement.variant || 'Standard'
      };
      
      // Add all metrics to the data point with proper field names
      measurement.metrics.forEach(metric => {
        dataPoint[metric.field] = metric.value;
      });
      
      return dataPoint;
    });
    
    // Log the processed data for debugging
    console.log(`Processed chart data: ${processedData.length} data points for ${timeRange}`);
    
    // Sort by date
    processedData.sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());
    
    setChartData(processedData);
  }, [selectedExercise, measurements, timeRange]);

  // Update the time range text in the subtitle
  const getTimeRangeText = () => {
    switch(timeRange) {
      case 'today': return 'Today';
      case '7days': return 'Last 7 days';
      case '30days': return 'Last 30 days';
      case '90days': return 'Last 90 days';
      case 'year': return 'Last year';
      case 'all': return 'All time';
      default: return 'Last 30 days';
    }
  };

  const getUniqueMetricFields = () => {
    if (chartData.length === 0) return [];
    
    // Get all metric fields excluding non-metric properties
    const excludedFields = ['id', 'date', 'fullDate', 'rawDate', 'athleteId', 'athleteName', 
                           'exerciseId', 'exerciseCategory', 'exerciseType', 'variant'];
    
    const fields = Object.keys(chartData[0]).filter(
      key => !excludedFields.includes(key)
    );
    
    return fields;
  };

  // Format the date to be more readable
  const formatDateDisplay = (dateString: string) => {
    try {
      // Make sure we're dealing with a valid date string
      if (!dateString) return 'Invalid date';
      
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date string:', dateString);
        return 'Invalid date';
      }
      
      // Format as MM/DD
      return `${date.getMonth() + 1}/${date.getDate()}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Get current exercise name and details
  const getCurrentExerciseName = () => {
    if (!selectedExercise) return 'No exercise selected';
    const exercise = exercises.find(e => e.id === selectedExercise);
    return exercise ? `${exercise.name} (${exercise.category})` : 'Unknown exercise';
  };

  // Handle exercise selection change
  const handleExerciseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const exerciseId = e.target.value;
    console.log(`Changing selected exercise to: ${exerciseId}`);
    setSelectedExercise(exerciseId);
  };

  // Format the metric name for display by capitalizing and adding spaces
  const formatMetricName = (metricField: string) => {
    // Convert camelCase to Title Case With Spaces
    return metricField
      // Insert a space before capital letters
      .replace(/([A-Z])/g, ' $1')
      // Capitalize the first letter
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  if (initialLoading) {
    return (
      <div className="w-full rounded-xl bg-[#1a1a1a] p-6 backdrop-blur-sm border border-[#8C8C8C]/10">
        <h3 className="mb-4 text-xl font-semibold text-white">Exercise Measurements</h3>
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-[#887D2B]"></div>
          <span className="ml-2 text-white">Loading exercise data...</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full rounded-xl bg-[#1a1a1a] p-6 backdrop-blur-sm border border-[#8C8C8C]/10">
        <h3 className="mb-4 text-xl font-semibold text-white">Exercise Measurements</h3>
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-[#887D2B]"></div>
          <span className="ml-2 text-white">Loading exercise data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full rounded-xl bg-[#1a1a1a] p-6 backdrop-blur-sm border border-[#8C8C8C]/10">
        <h3 className="mb-4 text-xl font-semibold text-white">Exercise Measurements</h3>
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

  if (exercises.length === 0) {
    return (
      <div className="w-full rounded-xl bg-[#1a1a1a] p-6 backdrop-blur-sm border border-[#8C8C8C]/10">
        <h3 className="mb-4 text-xl font-semibold text-white">Exercise Measurements</h3>
        <div className="text-center text-[#8C8C8C]">
          <p>No exercise data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl bg-[#1a1a1a] p-6 backdrop-blur-sm border border-[#8C8C8C]/10">
      <h3 className="mb-4 text-xl font-semibold text-white">
        {selectedAthlete ? `${selectedAthlete.fullName}'s ` : ''}Exercise Measurements
      </h3>
      
      {!selectedAthlete && (
        <div className="mb-4 rounded-md bg-[#887D2B]/10 p-4 text-center">
          <p className="text-[#8C8C8C]">
            Select an athlete from the dropdown above to view their specific measurements.
            Currently showing data for all athletes.
          </p>
        </div>
      )}
      
      <div className="mb-6">
        <label htmlFor="exercise-select" className="mb-2 block text-sm font-medium text-[#8C8C8C]">
          Select Exercise:
        </label>
        {filteredExercises.length > 0 ? (
          <select
            id="exercise-select"
            className="w-full rounded-md border-[#8C8C8C]/20 bg-[#1a1a1a] px-3 py-2 text-white focus:border-[#887D2B] focus:ring focus:ring-[#887D2B]/30"
            value={selectedExercise || ''}
            onChange={handleExerciseChange}
          >
            {filteredExercises.map(exercise => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name} ({exercise.category})
              </option>
            ))}
          </select>
        ) : (
          <div className="rounded-md bg-[#0D0D0D]/90 p-4 text-center text-[#8C8C8C] border border-[#8C8C8C]/10">
            <p>
              {selectedAthlete
                ? `No exercises with data for ${selectedAthlete.fullName} in the selected time range.`
                : 'No exercises with data in the selected time range.'}
            </p>
          </div>
        )}
      </div>
      
      {filteredExercises.length === 0 ? (
        <div className="mt-4 rounded-md bg-[#0D0D0D]/90 p-6 text-center text-white border border-[#8C8C8C]/10">
          <div className="mx-auto mb-4 h-16 w-16 text-[#887D2B]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="mb-2 text-lg font-medium text-white">No Measurement Data Available</h4>
          <p className="text-[#8C8C8C]">
            {selectedAthlete 
              ? `There are no exercises with data for ${selectedAthlete.fullName} in the selected time range.`
              : 'There are no exercises with data in the selected time range.'}
          </p>
          <p className="mt-2 text-[#8C8C8C]">Try selecting a different time range or athlete.</p>
        </div>
      ) : chartData.length > 0 ? (
        <div>
          <div className="mb-4">
            <h4 className="text-lg font-medium text-white">
              {exercises.find(e => e.id === selectedExercise)?.name} Performance Trends
              {selectedAthlete ? ` for ${selectedAthlete.fullName}` : ''}
            </h4>
            <p className="text-sm text-[#8C8C8C]">{getTimeRangeText()} data visualization</p>
          </div>
          
          <div className="h-96 w-full bg-[#1a1a1a]/80 rounded-lg p-2">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#8C8C8C" />
                <YAxis stroke="#8C8C8C" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(40, 40, 40, 0.95)',
                    borderColor: '#8C8C8C',
                    color: 'white'
                  }}
                  formatter={(value, name) => [value, name]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend wrapperStyle={{ color: '#8C8C8C' }} />
                
                {getUniqueMetricFields().map((field, index) => {
                  const colors = ['#887D2B', '#A19543', '#7A705F', '#BFAF30', '#D6C12B'];
                  return (
                    <Line 
                      key={field}
                      type="monotone" 
                      dataKey={field} 
                      stroke={colors[index % colors.length]} 
                      activeDot={{ r: 8 }} 
                      name={formatMetricName(field)}
                    />
                  );
                })}
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-8">
            <h4 className="mb-3 text-lg font-medium text-white">
              Measurement Details
              {selectedAthlete && ` for ${selectedAthlete.fullName}`}
            </h4>
            
            {chartData.length === 0 ? (
              <div className="rounded-md bg-amber-500/20 p-4 text-center text-white">
                <p>No measurement data available for {getCurrentExerciseName()}</p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-[#1a1a1a]/80 rounded-lg">
                <table className="w-full min-w-full table-auto">
                  <thead>
                    <tr className="border-b border-[#8C8C8C]/30">
                      <th className="px-4 py-2 text-left font-medium text-[#8C8C8C]">Date</th>
                      <th className="px-4 py-2 text-left font-medium text-[#8C8C8C]">Athlete</th>
                      <th className="px-4 py-2 text-left font-medium text-[#8C8C8C]">Variant</th>
                      {getUniqueMetricFields().map(field => (
                        <th key={field} className="px-4 py-2 text-left font-medium text-[#8C8C8C]">
                          {formatMetricName(field)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((dataPoint, index) => (
                      <tr 
                        key={dataPoint.id || index} 
                        className="border-b border-[#8C8C8C]/10 hover:bg-[#0D0D0D]/70"
                      >
                        <td className="px-4 py-3 text-white">{dataPoint.date || formatDateDisplay(dataPoint.rawDate)}</td>
                        <td className="px-4 py-3 text-[#8C8C8C]">{dataPoint.athleteName}</td>
                        <td className="px-4 py-3 text-[#8C8C8C]">{dataPoint.variant}</td>
                        {getUniqueMetricFields().map(field => (
                          <td key={field} className="px-4 py-3 text-[#8C8C8C]">
                            {typeof dataPoint[field] === 'number' 
                              ? dataPoint[field].toFixed(2) 
                              : dataPoint[field] || 'N/A'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-md bg-[#0D0D0D]/90 p-4 text-center text-white border border-[#8C8C8C]/10">
          <p>
            {selectedAthlete 
              ? `No measurement data available for ${selectedAthlete.fullName} on the selected exercise for the ${getTimeRangeText().toLowerCase()}.` 
              : `No measurement data available for the selected exercise for the ${getTimeRangeText().toLowerCase()}.`}
          </p>
          <p className="mt-2 text-sm text-[#8C8C8C]">
            The exercise exists in this time range but has no data points to display.
          </p>
        </div>
      )}
    </div>
  );
}