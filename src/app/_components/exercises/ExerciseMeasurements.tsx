"use client";

import { useEffect, useState } from 'react';
import { getExerciseMeasurements, getExerciseMetadata } from '@/services/outputSports.client';
import type { ExerciseMetadata, ExerciseMeasurement, Athlete } from '@/services/outputSports.client';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type TimeRange = 'today' | '7days' | '30days' | '90days' | 'year' | 'all';
type AggregationMode = 'aggregate' | 'showAll';

interface ExerciseMeasurementsProps {
  selectedAthlete: Athlete | null;
  timeRange: TimeRange;
  aggregationMode: AggregationMode;
  selectedExercise?: string | null;
  onExerciseChange?: (exerciseId: string | null) => void;
}

export default function ExerciseMeasurements({ selectedAthlete, timeRange, aggregationMode, selectedExercise: propSelectedExercise, onExerciseChange }: ExerciseMeasurementsProps) {
  const [measurements, setMeasurements] = useState<ExerciseMeasurement[]>([]);
  const [allMeasurements, setAllMeasurements] = useState<ExerciseMeasurement[]>([]);
  const [exercises, setExercises] = useState<ExerciseMetadata[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<ExerciseMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [visibleMetrics, setVisibleMetrics] = useState<Record<string, boolean>>({});
  const [secondaryAxisMetrics, setSecondaryAxisMetrics] = useState<string[]>([]);
  const [primaryAxisMetrics, setPrimaryAxisMetrics] = useState<string[]>([]);

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
    
    // Calculate date ranges based on selected option, always including today
    switch(timeRange) {
      case 'today':
        // Today's date - explicitly set both start and end date to today
        startDateStr = endDateStr;
        console.log(`Today's exact date: ${now.toLocaleString()}`);
        console.log(`Today's range string: ${startDateStr} (for both start and end)`);
        break;
      case '7days':
        // 6 days before today for a total of 7 days
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 6);
        startDateStr = formatDateString(sevenDaysAgo);
        console.log(`7 days range: ${startDateStr} to ${endDateStr} (includes today and 6 previous days)`);
        break;
      case '30days':
        // 29 days before today for a total of 30 days
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 29);
        startDateStr = formatDateString(thirtyDaysAgo);
        break;
      case '90days':
        // 89 days before today for a total of 90 days
        const ninetyDaysAgo = new Date(now);
        ninetyDaysAgo.setDate(now.getDate() - 89);
        startDateStr = formatDateString(ninetyDaysAgo);
        break;
      case 'year':
      case 'all':
        // Also use 89 days for consistency with API limits
        const limitedDate = new Date(now);
        limitedDate.setDate(now.getDate() - 89);
        startDateStr = formatDateString(limitedDate);
        break;
      default:
        // Default to 30 days (including today)
        const defaultDate = new Date(now);
        defaultDate.setDate(now.getDate() - 29);
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

  // Sync internal selectedExercise state with prop
  useEffect(() => {
    if (propSelectedExercise !== undefined && propSelectedExercise !== selectedExercise) {
      setSelectedExercise(propSelectedExercise);
    }
  }, [propSelectedExercise]);
  
  // Function to filter measurements by time range
  const filterMeasurementsByTimeRange = (measurements: ExerciseMeasurement[], currentTimeRange: TimeRange) => {
    setLoading(true);
    
    // Get today's date for consistent date handling
    const today = new Date();
    const todayYMD = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Calculate start and end dates based on time range, explicitly ensuring today is included
    let startDate = new Date(today); // Clone today
    const endDate = new Date(today); // End date is always today
    
    // Set end time to end of day to include all of today's data
    endDate.setHours(23, 59, 59, 999);
    
    // Calculate the start date based on the time range (moving backward from today)
    switch (currentTimeRange) {
      case 'today':
        // Start date is beginning of today
        startDate.setHours(0, 0, 0, 0);
        break;
      case '7days':
        // 6 days before today (for a total of 7 days including today)
        startDate.setDate(today.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '30days':
        // 29 days before today (for a total of 30 days including today)
        startDate.setDate(today.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '90days':
        // 89 days before today (for a total of 90 days including today)
        startDate.setDate(today.getDate() - 89);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
      case 'all':
        // Use 90 days for both year and all-time (based on API limits)
        startDate.setDate(today.getDate() - 89);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        // Default to 30 days
        startDate.setDate(today.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
    }
    
    // Format dates for logging
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = todayYMD;
    
    console.log(`Filtering measurements for time range: ${currentTimeRange}`);
    console.log(`Date range: ${startDateStr} to ${endDateStr} (today)`);
    console.log(`Using start timestamp: ${startDate.toISOString()}, end timestamp: ${endDate.toISOString()}`);
    
    try {
      // For the "today" case, use a simpler string-based date comparison
      if (currentTimeRange === 'today') {
        console.log(`TODAY CASE - Using direct date string comparison with ${todayYMD}`);
        
        // Filter directly using the date string for today's date
        const filteredByDate = measurements.filter(measurement => {
          // Extract just the date part from the measurement's completedDate
          const datePartOnly = measurement.completedDate.split('T')[0];
          const isToday = datePartOnly === todayYMD;
          
          if (isToday) {
            console.log(`Found today's measurement: ${measurement.completedDate}`);
          }
          
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
            const newExerciseId = availableExercises[0].id;
            setSelectedExercise(newExerciseId);
            if (onExerciseChange) {
              onExerciseChange(newExerciseId);
            }
          } else {
            setSelectedExercise(null);
            if (onExerciseChange) {
              onExerciseChange(null);
            }
          }
        } else if (!selectedExercise && availableExercises.length > 0 && availableExercises[0]?.id) {
          const newExerciseId = availableExercises[0].id;
          setSelectedExercise(newExerciseId);
          if (onExerciseChange) {
            onExerciseChange(newExerciseId);
          }
        }
        
        setError(null);
        setLoading(false);
        return;
      }
      
      // For other time ranges, use timestamp comparison
      console.log(`Using time range: ${currentTimeRange}, filtering between ${startDate.toISOString()} and ${endDate.toISOString()}`);
      
      // Filter measurements by date range
      const filteredByDate = measurements.filter(measurement => {
        const measurementDate = new Date(measurement.completedDate);
        const isInRange = measurementDate >= startDate && measurementDate <= endDate;
        
        // Debug logging for today's data to confirm inclusion
        const measurementYMD = measurement.completedDate.split('T')[0];
        if (measurementYMD === todayYMD) {
          console.log(`Today's measurement: ${measurement.completedDate}, included: ${isInRange}`);
        }
        
        return isInRange;
      });
      
      console.log(`Filtered to ${filteredByDate.length} measurements for ${currentTimeRange}`);
      
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
          const newExerciseId = availableExercises[0].id;
          setSelectedExercise(newExerciseId);
          if (onExerciseChange) {
            onExerciseChange(newExerciseId);
          }
        } else {
          setSelectedExercise(null);
          if (onExerciseChange) {
            onExerciseChange(null);
          }
        }
      } else if (!selectedExercise && availableExercises.length > 0 && availableExercises[0]?.id) {
        const newExerciseId = availableExercises[0].id;
        setSelectedExercise(newExerciseId);
        if (onExerciseChange) {
          onExerciseChange(newExerciseId);
        }
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
    if (measurements.length === 0) {
      // Clear chart data if there are no measurements
      setChartData([]);
      return;
    }
    
    // Filter measurements for the selected exercise (or all if none selected)
    const exerciseMeasurements = selectedExercise 
      ? measurements.filter(m => m.exerciseId === selectedExercise)
      : measurements; // Show all measurements if no specific exercise selected
    console.log(`Filtered to ${exerciseMeasurements.length} measurements for ${selectedExercise ? `exercise ${selectedExercise}` : 'all exercises'}`);
    
    if (exerciseMeasurements.length === 0) {
      // No measurements for this exercise in the selected time range
      setChartData([]);
      return;
    }
    
    // Debug: Log all unique units for the selected exercise (or all exercises)
    if (selectedExercise) {
      const exercise = exercises.find(e => e.id === selectedExercise);
      if (exercise) {
        console.log('DEBUG - All metrics and units for current exercise:');
        exercise.metrics.forEach(metric => {
          console.log(`${metric.field}: "${metric.unitOfMeasure}"`);
        });
      }
    } else {
      console.log('DEBUG - Showing data for all movements combined');
    }
    
    // Process data for the chart, with time-based aggregation based on time range
    let processedData;
    
    // Log the type of data we're working with
    console.log(`Processing ${exerciseMeasurements.length} measurements for ${timeRange} view (${aggregationMode} mode)`);
    console.log(`First measurement sample:`, exerciseMeasurements[0]);

    if (aggregationMode === 'showAll') {
      // For "Show All" mode, display individual measurements regardless of time range
      processedData = exerciseMeasurements.map(measurement => {
        // Ensure we have proper date handling
        let formattedDate = '';
        let formattedFullDate = new Date();
        
        try {
          const date = new Date(measurement.completedDate);
          if (!isNaN(date.getTime())) {
            // Format date and time for individual measurements
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const hours = date.getHours();
            const minutes = date.getMinutes();
            formattedDate = `${month}/${day} ${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
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
        
        // Add all metrics to the data point with proper field names and round to 2 decimal places
        measurement.metrics.forEach(metric => {
          dataPoint[metric.field] = Number(metric.value.toFixed(2));
        });
        
        return dataPoint;
      });
      
      // Sort by time for show all view
      processedData.sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());
    } else if (timeRange === 'today') {
      // For today view, display individual sets/measurements
      processedData = exerciseMeasurements.map(measurement => {
        // Ensure we have proper date handling
        let formattedDate = '';
        let formattedFullDate = new Date();
        
        try {
          const date = new Date(measurement.completedDate);
          if (!isNaN(date.getTime())) {
            // For today view, include the time for each set
            const hours = date.getHours();
            const minutes = date.getMinutes();
            formattedDate = `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
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
        
        // Add all metrics to the data point with proper field names and round to 2 decimal places
        measurement.metrics.forEach(metric => {
          dataPoint[metric.field] = Number(metric.value.toFixed(2));
        });
        
        return dataPoint;
      });
      
      // Sort by time for today view
      processedData.sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());
    } else {
      // For other time ranges, aggregate data based on the selected range
      const aggregatedData: Record<string, any> = {};
      
      // Get the metric fields from the first measurement to ensure we capture all fields
      const allMetricFields = new Set<string>();
      exerciseMeasurements.forEach(measurement => {
        measurement.metrics.forEach(metric => {
          allMetricFields.add(metric.field);
        });
      });
      console.log(`Found ${allMetricFields.size} unique metric fields:`, [...allMetricFields]);
      
      // Define the grouping key based on time range
      exerciseMeasurements.forEach(measurement => {
        try {
          const date = new Date(measurement.completedDate);
          if (isNaN(date.getTime())) {
            console.error('Invalid date in measurement:', measurement.completedDate);
            return;
          }
          
          let groupKey = '';
          let displayDate = '';
          
          // Different grouping logic based on time range
          if (timeRange === '7days') {
            // Group by day for week view
            groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            displayDate = `${date.getMonth() + 1}/${date.getDate()}`;
          } else if (timeRange === '30days') {
            // Group by week for month view
            // Get the start of the year
            const startOfYear = new Date(date.getFullYear(), 0, 1);
            // Calculate days since start of year
            const daysSinceStart = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
            // Get week number (0-indexed)
            const weekNumber = Math.floor(daysSinceStart / 7);
            
            groupKey = `${date.getFullYear()}-W${weekNumber}`;
            
            // Calculate the start and end date of this week for better display
            const weekStart = new Date(startOfYear);
            weekStart.setDate(weekStart.getDate() + (weekNumber * 7));
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            
            // Format as "MM/DD-MM/DD" for week range
            displayDate = `${weekStart.getMonth() + 1}/${weekStart.getDate()}-${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;
          } else {
            // Group by month for 90 days and all time
            groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            // Month names for better display
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            displayDate = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
          }
          
          // Initialize group if it doesn't exist
          if (!aggregatedData[groupKey]) {
            // Initialize with all possible metric fields set to zero
            const metricSums: Record<string, number> = {};
            const metricCounts: Record<string, number> = {};
            
            allMetricFields.forEach(field => {
              metricSums[field] = 0;
              metricCounts[field] = 0;
            });
            
            aggregatedData[groupKey] = {
              id: groupKey, // Ensure we have an ID for the chart
              groupKey,
              date: displayDate,
              fullDate: date,
              rawDate: measurement.completedDate,
              measurementCount: 0,
              exerciseId: measurement.exerciseId,
              exerciseCategory: measurement.exerciseCategory,
              exerciseType: measurement.exerciseType,
              athleteId: measurement.athleteId,
              athleteName: `${measurement.athleteFirstName} ${measurement.athleteLastName}`,
              variant: measurement.variant || 'Standard',
              metricSums,
              metricCounts
            };
          }
          
          // Increment the count of measurements in this group
          aggregatedData[groupKey].measurementCount++;
          
          // Accumulate metric values for averaging
          measurement.metrics.forEach(metric => {
            if (!aggregatedData[groupKey].metricSums[metric.field]) {
              aggregatedData[groupKey].metricSums[metric.field] = 0;
              aggregatedData[groupKey].metricCounts[metric.field] = 0;
            }
            
            aggregatedData[groupKey].metricSums[metric.field] += metric.value;
            aggregatedData[groupKey].metricCounts[metric.field]++;
          });
        } catch (error) {
          console.error('Error aggregating data:', error);
        }
      });
      
      // Calculate averages and prepare the final data
      processedData = Object.values(aggregatedData).map(group => {
        // Create the basic data point structure that the chart expects
        const dataPoint: any = {
          id: group.groupKey,
          groupKey: group.groupKey,
          date: group.date,
          fullDate: group.fullDate,
          rawDate: group.rawDate,
          measurementCount: group.measurementCount,
          athleteId: group.athleteId,
          athleteName: group.athleteName,
          exerciseId: group.exerciseId,
          exerciseCategory: group.exerciseCategory,
          exerciseType: group.exerciseType,
          variant: group.variant
        };
        
        // Add all metric fields directly to the data point - this is crucial for the chart
        allMetricFields.forEach(field => {
          if (group.metricCounts[field] > 0) {
            const avg = group.metricSums[field] / group.metricCounts[field];
            dataPoint[field] = Number(avg.toFixed(2));
          } else {
            // Ensure the field exists even if no data (use null instead of undefined)
            dataPoint[field] = null;
          }
        });
        
        // Debug log to verify data structure
        console.log(`Aggregated data point for ${group.date}:`, 
          Object.entries(dataPoint)
            .filter(([key]) => allMetricFields.has(key))
            .map(([key, value]) => `${key}: ${value}`)
        );
        
        return dataPoint;
      });
      
      // Sort by date for aggregated views
      if (timeRange === '7days') {
        // Sort by day for week view - need to parse the actual dates
        processedData.sort((a, b) => {
          return a.fullDate.getTime() - b.fullDate.getTime();
        });
      } else if (timeRange === '30days') {
        // Sort by week for month view
        processedData.sort((a, b) => {
          // Extract week numbers from the groupKey
          const getWeekNumber = (key: string | undefined): number => {
            if (!key) return 0;
            const match = key.match(/W(\d+)/);
            return match ? parseInt(match[1]) : 0;
          };
          
          const weekA = getWeekNumber(a.groupKey);
          const weekB = getWeekNumber(b.groupKey);
          
          // First sort by year, then by week
          const yearA = parseInt((a.groupKey || '').split('-')[0] || '0');
          const yearB = parseInt((b.groupKey || '').split('-')[0] || '0');
          
          if (yearA !== yearB) {
            return yearA - yearB;
          }
          
          return weekA - weekB;
        });
      } else {
        // Sort by month for 90 days and all time
        processedData.sort((a, b) => {
          // Extract year and month from groupKey (YYYY-MM)
          const splitA = (a.groupKey || '0-0').split('-');
          const splitB = (b.groupKey || '0-0').split('-');
          const yearA = parseInt(splitA[0] || '0');
          const monthA = parseInt(splitA[1] || '0');
          const yearB = parseInt(splitB[0] || '0');
          const monthB = parseInt(splitB[1] || '0');
          
          // First compare years
          if (yearA !== yearB) {
            return yearA - yearB;
          }
          
          // Then compare months
          return monthA - monthB;
        });
      }
      
      // Add dates to debug logs
      if (processedData.length > 0) {
        console.log(`First processed data point after sorting:`, processedData[0]);
        console.log(`Sorted dates:`, processedData.map(d => d.date).join(', '));
        
        // Check if the data point has the expected metrics
        const metrics = Object.keys(processedData[0]).filter(key => 
          !['id', 'groupKey', 'date', 'fullDate', 'rawDate', 'measurementCount', 
            'athleteId', 'athleteName', 'exerciseId', 'exerciseCategory', 
            'exerciseType', 'variant', 'metricSums', 'metricCounts'].includes(key)
        );
        console.log(`Available metrics in processed data: ${metrics.join(', ')}`);
      }
    }
    
    // Log the processed data for debugging
    console.log(`Processed chart data: ${processedData.length} data points for ${timeRange}`);
    
    setChartData(processedData);
    
    // Initialize visible metrics - set all metrics to visible by default
    const metricFields = getUniqueMetricFields(processedData);
    const initialVisibility: Record<string, boolean> = {};
    metricFields.forEach(field => {
      // Ensure all metrics are visible (checked) by default
      initialVisibility[field] = true;
    });
    setVisibleMetrics(initialVisibility);
    
    // Debug log to check what metrics are available in the chart data
    if (processedData && processedData.length > 0) {
      console.log('Chart data metrics check:');
      const sampleDataPoint = processedData[0];
      const metricFields = getUniqueMetricFields(processedData);
      console.log(`Available metric fields: ${metricFields.join(', ')}`);
      metricFields.forEach(field => {
        console.log(`Sample value for ${field}: ${sampleDataPoint[field]}`);
      });
    }

    // After processing the data, identify which metrics need a secondary axis
    if (processedData.length > 0) {
      // Get all the metrics from the data
      const allMetrics = getUniqueMetricFields(processedData);
      
      // Calculate the max value for each metric
      const metricMaxValues: Record<string, number> = {};
      allMetrics.forEach(metric => {
        const values = processedData.map(item => item[metric]).filter(v => typeof v === 'number') as number[];
        if (values.length > 0) {
          metricMaxValues[metric] = Math.max(...values);
        }
      });
      
      // Group metrics by order of magnitude
      const metricsByMagnitude: Record<string, number[]> = {};
      Object.entries(metricMaxValues).forEach(([metric, maxValue]) => {
        if (maxValue === 0) return; // Skip metrics with max value of 0
        
        // Get order of magnitude (10^x where maxValue is between 10^x and 10^(x+1))
        const magnitude = Math.floor(Math.log10(maxValue));
        if (!metricsByMagnitude[magnitude]) {
          metricsByMagnitude[magnitude] = [];
        }
        metricsByMagnitude[magnitude].push(parseInt(metric));
      });
      
      console.log('Metrics grouped by magnitude:', metricsByMagnitude);
      
      // Find the most common magnitude group
      let primaryMagnitude = '';
      let maxMetrics = 0;
      
      Object.entries(metricsByMagnitude).forEach(([magnitude, metrics]) => {
        if (metrics.length > maxMetrics) {
          maxMetrics = metrics.length;
          primaryMagnitude = magnitude;
        }
      });
      
      // All metrics not in the primary magnitude group will use the secondary axis
      const primary: string[] = [];
      const secondary: string[] = [];
      
      allMetrics.forEach(metric => {
        // Get the max value for this metric
        const maxVal = metricMaxValues[metric] || 0;
        if (maxVal === 0) {
          primary.push(metric); // Default to primary if no data
          return;
        }
        
        // Calculate the magnitude of this metric's max value
        const magnitude = Math.floor(Math.log10(maxVal));
        
        // If the magnitude differs by more than 1 from the primary magnitude,
        // put it on the secondary axis
        if (Math.abs(magnitude - parseInt(primaryMagnitude)) > 1) {
          secondary.push(metric);
          console.log(`Metric ${metric} (max ${maxVal}) assigned to secondary axis (magnitude: ${magnitude})`);
        } else {
          primary.push(metric);
          console.log(`Metric ${metric} (max ${maxVal}) assigned to primary axis (magnitude: ${magnitude})`);
        }
      });
      
      setPrimaryAxisMetrics(primary);
      setSecondaryAxisMetrics(secondary);
      
      console.log('Primary axis metrics:', primary);
      console.log('Secondary axis metrics:', secondary);
    }
  }, [selectedExercise, measurements, timeRange, aggregationMode]);

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

  const getUniqueMetricFields = (data = chartData) => {
    if (!data || data.length === 0) return [];
    
    // Get all metric fields excluding non-metric properties
    const excludedFields = ['id', 'groupKey', 'date', 'fullDate', 'rawDate', 'athleteId', 'athleteName', 
                           'exerciseId', 'exerciseCategory', 'exerciseType', 'variant', 
                           'measurementCount', 'metricSums', 'metricCounts'];
    
    const fields = Object.keys(data[0]).filter(
      key => !excludedFields.includes(key) && data[0][key] !== undefined && data[0][key] !== null
    );
    
    return fields;
  };
  
  // Toggle visibility of a metric in the chart
  const toggleMetricVisibility = (metricField: string) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [metricField]: !prev[metricField]
    }));
  };
  
  // Select all metrics
  const selectAllMetrics = () => {
    const allMetrics = getUniqueMetricFields();
    const allVisible: Record<string, boolean> = {};
    allMetrics.forEach(field => {
      allVisible[field] = true;
    });
    setVisibleMetrics(allVisible);
  };
  
  // Deselect all metrics
  const deselectAllMetrics = () => {
    const allMetrics = getUniqueMetricFields();
    const allHidden: Record<string, boolean> = {};
    allMetrics.forEach(field => {
      allHidden[field] = false;
    });
    setVisibleMetrics(allHidden);
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
    if (!selectedExercise) return 'All Movements';
    const exercise = exercises.find(e => e.id === selectedExercise);
    return exercise ? `${exercise.name} (${exercise.category})` : 'Unknown exercise';
  };

  // Handle exercise selection change
  const handleExerciseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const exerciseId = e.target.value;
    console.log(`Changing selected exercise to: ${exerciseId}`);
    const exerciseValue = exerciseId || null;
    setSelectedExercise(exerciseValue);
    
    // Notify parent component of the exercise change
    if (onExerciseChange) {
      onExerciseChange(exerciseValue);
    }
  };

  // Get the unit of measure for a specific metric field
  const getMetricUnit = (metricField: string): string => {
    if (!selectedExercise) return '';
    
    const exercise = exercises.find(e => e.id === selectedExercise);
    if (!exercise) return '';
    
    const metricInfo = exercise.metrics.find(m => m.field === metricField);
    
    // Log the actual unit for debugging
    if (metricInfo?.unitOfMeasure && metricField === 'meanForce') {
      console.log(`Unit for ${metricField}: "${metricInfo.unitOfMeasure}"`);
    }
    
    return metricInfo?.unitOfMeasure || '';
  };
  
  // Convert unit to shorthand format
  const getShorthandUnit = (unit: string): string => {
    // Handle null or empty units
    if (!unit) return '';
    
    // Clean the input unit (trim whitespace, lowercase for case-insensitive matching)
    const cleanUnit = unit.trim().toLowerCase();
    
    // Handle empty units
    if (!cleanUnit) return '';
    
    // Use proper scientific units based on measurement type
    const metricFieldToUnit: Record<string, string> = {
      // Force metrics - Newtons (N)
      'meanForce': 'N',
      'peakForce': 'N',
      'relativeForce': 'N/kg',
      'relativeMeanForce': 'N/kg',
      'relativePeakForce': 'N/kg',
      'bestMeanForce': 'N',
      
      // Velocity metrics - meters per second (m/s)
      'meanVelocity': 'm/s',
      'peakVelocity': 'm/s',
      'meanPropulsiveVelocity': 'm/s',
      'eccentricMeanVelocity': 'm/s',
      'eccentricPeakVelocity': 'm/s',
      'bestMeanVelocity': 'm/s',
      
      // Power metrics - Watts (W)
      'meanPower': 'W',
      'peakPower': 'W',
      'relativeMeanPower': 'W/kg',
      'relativePeakPower': 'W/kg',
      'bestMeanPower': 'W',
      
      // Acceleration metrics - meters per second squared (m/s²)
      'meanAcceleration': 'm/s²',
      'peakAcceleration': 'm/s²',
      
      // Impulse metrics - Newton seconds (N·s)
      'meanConcentricImpulse': 'N·s',
      
      // Other common metrics
      'estimatedOneRepMax': 'kg',
      'weight': 'kg',
      'timeUnderTension': 's',
      'totalWork': 'J',
      'repCount': 'reps'
    };
    
    // Find standard scientific units for physics quantities
    if (/newton/i.test(cleanUnit)) return 'N';
    if (/watt/i.test(cleanUnit)) return 'W';
    if (/joule/i.test(cleanUnit)) return 'J';
    if (/kilogram/i.test(cleanUnit)) return 'kg';
    if (/second/i.test(cleanUnit) && !cleanUnit.includes('per')) return 's';
    if (/percent/i.test(cleanUnit)) return '%';
    if (/repetition/i.test(cleanUnit)) return 'reps';
    
    // Compound units
    if (/(meter.*second.*squared|m.*s.*2|m\/s2)/i.test(cleanUnit)) return 'm/s²';
    if (/(meter.*second|m.*s|m\/s)/i.test(cleanUnit)) return 'm/s';
    if (/(newton.*second|n.*s|n-s)/i.test(cleanUnit)) return 'N·s';
    
    // Return common scientific units as is
    if (unit === 'N') return 'N';
    if (unit === 'W') return 'W';
    if (unit === 'J') return 'J';
    if (unit === 'kg') return 'kg';
    if (unit === 's') return 's';
    if (unit === 'm/s') return 'm/s';
    if (unit === 'm/s²') return 'm/s²';
    if (unit === 'N·s' || unit === 'N-s') return 'N·s';
    
    // Return the original unit if no match is found
    return unit;
  };

  // Format the metric name for display by capitalizing and adding spaces (without units)
  const formatMetricNameOnly = (metricField: string) => {
    // Convert camelCase to Title Case With Spaces
    return metricField
      // Insert a space before capital letters
      .replace(/([A-Z])/g, ' $1')
      // Capitalize the first letter
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Format the metric name for display by capitalizing and adding spaces
  const formatMetricName = (metricField: string) => {
    // Get the base name without units
    const name = formatMetricNameOnly(metricField);
    
    // Use proper scientific units based on measurement type
    const metricFieldToUnit: Record<string, string> = {
      // Force metrics - Newtons (N)
      'meanForce': 'N',
      'peakForce': 'N',
      'relativeForce': 'N',
      'relativeMeanForce': 'N',
      'relativePeakForce': 'N',
      'bestMeanForce': 'N',
      
      // Velocity metrics - meters per second (m/s)
      'meanVelocity': 'm/s',
      'peakVelocity': 'm/s',
      'meanPropulsiveVelocity': 'm/s',
      'eccentricMeanVelocity': 'm/s',
      'eccentricPeakVelocity': 'm/s',
      'bestMeanVelocity': 'm/s',
      
      // Power metrics - Watts (W)
      'meanPower': 'W',
      'peakPower': 'W',
      'relativeMeanPower': 'W',
      'relativePeakPower': 'W',
      'bestMeanPower': 'W',
      
      // Acceleration metrics - meters per second squared (m/s²)
      'meanAcceleration': 'm/s²',
      'peakAcceleration': 'm/s²',
      
      // Impulse metrics - Newton seconds (N·s)
      'meanConcentricImpulse': 'N·s',
      
      // Other common metrics
      'estimatedOneRepMax': 'kg',
      'weight': 'kg',
      'timeUnderTension': 's',
      'totalWork': 'J',
      'repCount': 'reps'
    };
    
    // Get the unit for this specific metric field if available
    const knownUnit = metricFieldToUnit[metricField];
    
    // If we have a known unit for this field, use it
    if (knownUnit) {
      return `${name} (${knownUnit})`;
    }
    
    // Otherwise, get the unit from the exercise metadata
    const unit = getMetricUnit(metricField);
    const standardizedUnit = unit ? getShorthandUnit(unit) : '';
    
    return standardizedUnit ? `${name} (${standardizedUnit})` : name;
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
            <option value="">All Movements</option>
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
          <div className="flex flex-col md:flex-row gap-4">
            <div className="h-96 w-full md:w-3/4 bg-[#1a1a1a]/80 rounded-lg p-2">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 40, // Increased to make room for secondary Y-axis
                    left: 20,
                    bottom: 30,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#8C8C8C"
                    tickFormatter={(value) => {
                      // If we're in an aggregated view, show appropriate labels
                      if (timeRange !== 'today') {
                        return value;
                      } else {
                        // For today view, show times more cleanly
                        return value; // Already formatted as HH:MM in the data processing
                      }
                    }}
                  />
                  
                  {/* Primary Y-axis */}
                  <YAxis 
                    yAxisId="left"
                    stroke="#8C8C8C"
                    domain={['auto', 'auto']}
                  />
                  
                  {/* Secondary Y-axis */}
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#A19543"
                    domain={['auto', 'auto']}
                  />
                  
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(40, 40, 40, 0.95)',
                      borderColor: '#8C8C8C',
                      color: 'white'
                    }}
                    formatter={(value, name, props) => {
                      if (typeof value !== 'number') return [value, name];
                      
                      // Extract the metric field name from the dataKey
                      const metricField = String(props.dataKey);
                      
                      // Use proper scientific units based on measurement type
                      const metricFieldToUnit: Record<string, string> = {
                        // Force metrics - Newtons (N)
                        'meanForce': 'N',
                        'peakForce': 'N',
                        'relativeForce': 'N/kg',
                        'relativeMeanForce': 'N/kg',
                        'relativePeakForce': 'N/kg',
                        'bestMeanForce': 'N',
                        
                        // Velocity metrics - meters per second (m/s)
                        'meanVelocity': 'm/s',
                        'peakVelocity': 'm/s',
                        'meanPropulsiveVelocity': 'm/s',
                        'eccentricMeanVelocity': 'm/s',
                        'eccentricPeakVelocity': 'm/s',
                        'bestMeanVelocity': 'm/s',
                        
                        // Power metrics - Watts (W)
                        'meanPower': 'W',
                        'peakPower': 'W',
                        'relativeMeanPower': 'W/kg',
                        'relativePeakPower': 'W/kg',
                        'bestMeanPower': 'W',
                        
                        // Acceleration metrics - meters per second squared (m/s²)
                        'meanAcceleration': 'm/s²',
                        'peakAcceleration': 'm/s²',
                        
                        // Impulse metrics - Newton seconds (N·s)
                        'meanConcentricImpulse': 'N·s',
                        
                        // Other common metrics
                        'estimatedOneRepMax': 'kg',
                        'weight': 'kg',
                        'timeUnderTension': 's',
                        'totalWork': 'J',
                        'repCount': 'reps'
                      };
                      
                      // Get the known unit for this field
                      const unit = metricFieldToUnit[metricField] || getShorthandUnit(getMetricUnit(metricField));
                      
                      // Format the value with 2 decimal places and add the unit
                      const formattedValue = unit 
                        ? `${value.toFixed(2)} ${unit}` 
                        : value.toFixed(2);
                      
                      return [formattedValue, String(name)];
                    }}
                    labelFormatter={(label, payload) => {
                      // Add measurement count info for aggregated views
                      if (timeRange !== 'today' && payload && payload.length > 0 && payload[0]?.payload) {
                        const measurement = payload[0].payload;
                        if (measurement && typeof measurement.measurementCount === 'number') {
                          const count = measurement.measurementCount;
                          let timeUnit = '';
                          
                          switch(timeRange) {
                            case '7days':
                              timeUnit = 'Day';
                              break;
                            case '30days':
                              timeUnit = 'Week';
                              break;
                            default:
                              timeUnit = 'Month';
                              break;
                          }
                          
                          return `${timeUnit}: ${label} (${count} measurement${count !== 1 ? 's' : ''})`;
                        }
                      }
                      
                      if (timeRange === 'today') {
                        return `Time: ${label}`;
                      }
                      
                      return `Date: ${label}`;
                    }}
                  />
                  
                  {/* Render lines based on which axis they belong to */}
                  {getUniqueMetricFields()
                    .filter(field => visibleMetrics[field] !== false)
                    .slice(0, 5) // Limit to first 5 selected metrics only
                    .map((field, index) => {
                      // Use highly distinct colors for better visibility
                      const colors = ['#FF0000', '#00FF00', '#0080FF', '#FF8000', '#FF00FF', '#00FFFF', '#FFFF00', '#FF4080', '#80FF00', '#8000FF'];
                      
                      // Determine which Y axis to use
                      const isSecondary = secondaryAxisMetrics.includes(field);
                      const yAxisId = isSecondary ? "right" : "left";
                      
                      return (
                        <Line 
                          key={field}
                          type="monotone" 
                          dataKey={field} 
                          stroke={colors[index % colors.length]} 
                          activeDot={{ r: 8 }} 
                          name={formatMetricName(field)}
                          connectNulls={true}
                          yAxisId={yAxisId}
                          strokeWidth={3} // Thicker lines for better visibility
                        />
                      );
                    })
                  }
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="md:w-1/4 bg-[#1a1a1a]/80 rounded-lg p-4 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="text-white font-medium">Metrics</div>
                <div className="flex space-x-2">
                  <button 
                    onClick={selectAllMetrics}
                    className="px-2 py-1 text-xs bg-[#887D2B]/80 hover:bg-[#887D2B] text-white rounded"
                  >
                    Select All
                  </button>
                  <button 
                    onClick={deselectAllMetrics}
                    className="px-2 py-1 text-xs bg-[#333]/80 hover:bg-[#444] text-white rounded"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              <div className="flex flex-col space-y-2 max-h-80 overflow-y-auto">
                {getUniqueMetricFields().map((field, index) => {
                  // Use the same highly distinct colors as the chart
                  const colors = ['#FF0000', '#00FF00', '#0080FF', '#FF8000', '#FF00FF', '#00FFFF', '#FFFF00', '#FF4080', '#80FF00', '#8000FF'];
                  
                  // Get the correct color based on the field's position in the visible metrics list
                  // This ensures legend colors match chart line colors exactly
                  const getFieldColor = (fieldName: string) => {
                    const visibleFields = getUniqueMetricFields()
                      .filter(f => visibleMetrics[f] !== false)
                      .slice(0, 5); // Match the chart's limit of 5 visible metrics
                    
                    const visibleIndex = visibleFields.indexOf(fieldName);
                    
                    if (visibleIndex === -1) {
                      // Field is not visible in chart, use a dimmed gray color
                      return '#666666';
                    }
                    
                    return colors[visibleIndex % colors.length];
                  };
                  
                  const fieldColor = getFieldColor(field);
                  const isVisible = visibleMetrics[field] !== false;
                  
                  return (
                    <div key={field} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`metric-${field}`}
                        checked={isVisible}
                        onChange={() => toggleMetricVisibility(field)}
                        className="mr-2 h-4 w-4 rounded border-[#8C8C8C]/30 bg-[#1a1a1a] focus:ring-[#887D2B]"
                      />
                      <label
                        htmlFor={`metric-${field}`}
                        className="flex items-center text-sm cursor-pointer"
                      >
                        <span 
                          className="inline-block w-3 h-3 mr-2 border border-white/20" 
                          style={{ backgroundColor: fieldColor }}
                        ></span>
                        <span 
                          className="text-[#8C8C8C]"
                          title={`${formatMetricName(field)}`}
                        >
                          {formatMetricName(field)}
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
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
                      {getUniqueMetricFields().map(field => (
                        // Only show table columns for visible metrics
                        visibleMetrics[field] !== false && (
                          <th key={field} className="px-4 py-2 text-left font-medium text-[#8C8C8C]">
                            {formatMetricNameOnly(field)}
                          </th>
                        )
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((dataPoint, index) => (
                      <tr 
                        key={dataPoint.id || dataPoint.groupKey || index} 
                        className="border-b border-[#8C8C8C]/10 hover:bg-[#0D0D0D]/70"
                      >
                        <td className="px-4 py-3 text-white">
                          {dataPoint.date || formatDateDisplay(dataPoint.rawDate)}
                          {/* Show measurement count for aggregated views */}
                          {timeRange !== 'today' && dataPoint.measurementCount && (
                            <span className="text-xs text-[#8C8C8C] ml-1">
                              ({dataPoint.measurementCount} set{dataPoint.measurementCount !== 1 ? 's' : ''})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#8C8C8C]">{dataPoint.athleteName}</td>
                        {getUniqueMetricFields().map(field => 
                          // Only render cells for visible metrics
                          visibleMetrics[field] !== false ? (
                            <td key={field} className="px-4 py-3 text-[#8C8C8C]">
                              {typeof dataPoint[field] === 'number' 
                                ? (() => {
                                    // Use proper scientific units based on measurement type
                                    const metricFieldToUnit: Record<string, string> = {
                                      // Force metrics - Newtons (N)
                                      'meanForce': 'N',
                                      'peakForce': 'N',
                                      'relativeForce': 'N/kg',
                                      'relativeMeanForce': 'N/kg',
                                      'relativePeakForce': 'N/kg',
                                      'bestMeanForce': 'N',
                                      
                                      // Velocity metrics - meters per second (m/s)
                                      'meanVelocity': 'm/s',
                                      'peakVelocity': 'm/s',
                                      'meanPropulsiveVelocity': 'm/s',
                                      'eccentricMeanVelocity': 'm/s',
                                      'eccentricPeakVelocity': 'm/s',
                                      'bestMeanVelocity': 'm/s',
                                      
                                      // Power metrics - Watts (W)
                                      'meanPower': 'W',
                                      'peakPower': 'W',
                                      'relativeMeanPower': 'W/kg',
                                      'relativePeakPower': 'W/kg',
                                      'bestMeanPower': 'W',
                                      
                                      // Acceleration metrics - meters per second squared (m/s²)
                                      'meanAcceleration': 'm/s²',
                                      'peakAcceleration': 'm/s²',
                                      
                                      // Impulse metrics - Newton seconds (N·s)
                                      'meanConcentricImpulse': 'N·s',
                                      
                                      // Other common metrics
                                      'estimatedOneRepMax': 'kg',
                                      'weight': 'kg',
                                      'timeUnderTension': 's',
                                      'totalWork': 'J',
                                      'repCount': 'reps'
                                    };
                                    
                                    // Get the known unit for this field
                                    const unit = metricFieldToUnit[field] || getShorthandUnit(getMetricUnit(field));
                                    return `${dataPoint[field].toFixed(2)}${unit ? ' ' + unit : ''}`;
                                  })()
                                : dataPoint[field] || 'N/A'}
                            </td>
                          ) : null
                        )}
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
      
      {/* Add note about metric limit when needed */}
      {getUniqueMetricFields().filter(field => visibleMetrics[field] !== false).length > 5 && (
        <div className="text-xs text-[#8C8C8C] italic mt-2 text-center">
          * Chart displays only the first 5 selected metrics. All selected metrics are shown in the table below.
        </div>
      )}

      {/* Show explanation text if there are metrics on both axes */}
      {secondaryAxisMetrics.length > 0 && (
        <div className="text-xs text-[#8C8C8C] mt-1 flex items-center">
          <span className="inline-block w-3 h-3 mr-1 bg-[#8C8C8C]"></span>
          <span>Primary Y-axis (left)</span>
          <span className="mx-2">•</span>
          <span className="inline-block w-3 h-3 mr-1 bg-[#A19543]"></span>
          <span>Secondary Y-axis (right)</span>
        </div>
      )}
    </div>
  );
}