"use client";

import { useEffect, useState } from 'react';
import { getExerciseMeasurements, getExerciseMetadata, getLast30DaysRange } from '@/services/outputSports.client';
import type { ExerciseMetadata, ExerciseMeasurement } from '@/services/outputSports.client';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ExerciseMeasurements() {
  const [measurements, setMeasurements] = useState<ExerciseMeasurement[]>([]);
  const [exercises, setExercises] = useState<ExerciseMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // First, fetch metadata to get exercise IDs
        const exercisesData = await getExerciseMetadata();
        setExercises(exercisesData);
        
        // Use the last 30 days as the date range
        const { startDate, endDate } = getLast30DaysRange();
        
        // Fetch measurements for all exercises for the last 30 days
        const measurementsData = await getExerciseMeasurements(startDate, endDate);
        setMeasurements(measurementsData);
        
        // If there are exercises, set the first one as selected
        if (exercisesData.length > 0 && exercisesData[0]) {
          setSelectedExercise(exercisesData[0].id);
        }
        
        setError(null);
      } catch (err) {
        console.error('Failed to fetch exercise data:', err);
        setError('Failed to load exercise data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Update chart data when selected exercise changes or measurements are loaded
  useEffect(() => {
    if (!selectedExercise || measurements.length === 0) return;
    
    // Filter measurements for the selected exercise
    const exerciseMeasurements = measurements.filter(m => m.exerciseId === selectedExercise);
    
    // Process data for the chart
    const processedData = exerciseMeasurements.map(measurement => {
      const date = new Date(measurement.completedDate);
      const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
      
      // Create a base object with the date
      const dataPoint: any = {
        date: formattedDate,
        fullDate: date,
        athleteName: `${measurement.athleteFirstName} ${measurement.athleteLastName}`
      };
      
      // Add all metrics to the data point
      measurement.metrics.forEach(metric => {
        dataPoint[metric.field] = metric.value;
      });
      
      return dataPoint;
    });
    
    // Sort by date
    processedData.sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());
    
    setChartData(processedData);
  }, [selectedExercise, measurements]);

  const getUniqueMetricFields = () => {
    if (chartData.length === 0) return [];
    
    // Get all metric fields except date, fullDate, and athleteName
    const fields = Object.keys(chartData[0]).filter(
      key => key !== 'date' && key !== 'fullDate' && key !== 'athleteName'
    );
    
    return fields;
  };

  if (loading) {
    return (
      <div className="w-full rounded-xl bg-white/5 p-6 backdrop-blur-sm">
        <h3 className="mb-4 text-xl font-semibold text-white">Exercise Measurements</h3>
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-purple-500"></div>
          <span className="ml-2 text-white">Loading exercise data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full rounded-xl bg-white/5 p-6 backdrop-blur-sm">
        <h3 className="mb-4 text-xl font-semibold text-white">Exercise Measurements</h3>
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

  if (exercises.length === 0) {
    return (
      <div className="w-full rounded-xl bg-white/5 p-6 backdrop-blur-sm">
        <h3 className="mb-4 text-xl font-semibold text-white">Exercise Measurements</h3>
        <div className="text-center text-gray-400">
          <p>No exercise data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl bg-white/5 p-6 backdrop-blur-sm">
      <h3 className="mb-4 text-xl font-semibold text-white">Exercise Measurements</h3>
      
      <div className="mb-6">
        <label htmlFor="exercise-select" className="mb-2 block text-sm font-medium text-gray-400">
          Select Exercise:
        </label>
        <select
          id="exercise-select"
          className="w-full rounded-md border-gray-700 bg-white/10 px-3 py-2 text-white focus:border-purple-500 focus:ring focus:ring-purple-500/30"
          value={selectedExercise || ''}
          onChange={(e) => setSelectedExercise(e.target.value)}
        >
          {exercises.map(exercise => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.name} ({exercise.category})
            </option>
          ))}
        </select>
      </div>
      
      {chartData.length > 0 ? (
        <div>
          <div className="mb-4">
            <h4 className="text-lg font-medium text-white">
              {exercises.find(e => e.id === selectedExercise)?.name} Performance Trends
            </h4>
            <p className="text-sm text-gray-400">Last 30 days data visualization</p>
          </div>
          
          <div className="h-96 w-full">
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
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#ccc" />
                <YAxis stroke="#ccc" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(50, 50, 50, 0.95)',
                    borderColor: '#666',
                    color: 'white'
                  }}
                  formatter={(value, name) => [value, name]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend wrapperStyle={{ color: '#ccc' }} />
                
                {getUniqueMetricFields().map((field, index) => {
                  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'];
                  return (
                    <Line 
                      key={field}
                      type="monotone" 
                      dataKey={field} 
                      stroke={colors[index % colors.length]} 
                      activeDot={{ r: 8 }} 
                      name={field}
                    />
                  );
                })}
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-8">
            <h4 className="mb-3 text-lg font-medium text-white">Measurement Details</h4>
            <div className="overflow-x-auto">
              <table className="w-full min-w-full table-auto">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="px-4 py-2 text-left font-medium text-gray-300">Date</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-300">Athlete</th>
                    {getUniqueMetricFields().map(field => (
                      <th key={field} className="px-4 py-2 text-left font-medium text-gray-300">
                        {field}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((dataPoint, index) => (
                    <tr 
                      key={index} 
                      className="border-b border-gray-800 hover:bg-white/5"
                    >
                      <td className="px-4 py-3 text-white">{dataPoint.date}</td>
                      <td className="px-4 py-3 text-gray-300">{dataPoint.athleteName}</td>
                      {getUniqueMetricFields().map(field => (
                        <td key={field} className="px-4 py-3 text-gray-300">
                          {dataPoint[field]?.toFixed(2) || 'N/A'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-md bg-blue-500/20 p-4 text-center text-white">
          <p>No measurement data available for the selected exercise in the last 30 days.</p>
        </div>
      )}
    </div>
  );
} 