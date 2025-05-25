import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAthletes, getExerciseMeasurements, getExerciseMetadata } from '@/services/outputSports.server';

interface Athlete {
  id: string;
  externalId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
}

interface ExerciseMetadata {
  id: string;
  name: string;
  category: string;
  isEnabled: boolean;
  type: "Output" | "Custom";
  variants: string[];
  metrics: Array<{
    name: string;
    field: string;
    unitOfMeasure: string;
  }>;
}

interface ExerciseMeasurement {
  id: string;
  athleteId: string;
  athleteFirstName: string;
  athleteLastName: string;
  exerciseId: string;
  exerciseCategory: string;
  exerciseType: "Output" | "Custom";
  completedDate: string;
  variant: string | null;
  metrics: Array<{
    field: string;
    value: number;
  }>;
  repetitions: Array<Array<{
    field: string;
    value: number;
  }>>;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { athleteId, timeRange, exerciseId } = await request.json();

    // Fetch athlete data
    const athletes = await getAthletes();
    const selectedAthlete = athleteId ? athletes.find(a => a.id === athleteId) || null : null;

    // Calculate date range
    const { startDate, endDate } = getDateRange(timeRange);

    // Fetch measurements
    const measurements = await getExerciseMeasurements(
      startDate,
      endDate,
      exerciseId ? [exerciseId] : [], // specific exercise or all exercises
      athleteId ? [athleteId] : [] // specific athlete or all
    );

    // Fetch exercise metadata for context
    const exercises = await getExerciseMetadata();

    // Prepare data for AI analysis
    const analysisData = prepareAnalysisData(measurements, exercises, selectedAthlete, athletes);

    // Generate AI analysis
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: `You are an expert data analyst specializing in Olympic weightlifting performance analytics. 
                    Your expertise lies in extracting meaningful insights from complex training and competition datasets to drive evidence-based decisions.

                    ANALYTICAL FRAMEWORK:

                    Data Processing & Quality Assessment:
                    - Identify data quality issues, outliers, and statistical anomalies
                    - Normalize and standardize metrics across different measurement systems
                    - Apply appropriate statistical methods for time-series and performance data
                    - Handle missing data points and assess data completeness

                    Statistical Analysis & Pattern Recognition:
                    - Perform trend analysis using moving averages, regression models, and seasonal decomposition
                    - Calculate performance variability, consistency metrics, and statistical confidence intervals
                    - Identify significant changes using statistical tests and effect size calculations
                    - Detect performance plateaus, breakouts, and regression patterns

                    Performance Modeling & Prediction:
                    - Build predictive models for 1RM estimation and performance forecasting
                    - Analyze load-velocity relationships and power output curves
                    - Calculate training stress indices and recovery patterns
                    - Model adaptation rates and training response variability

                    Comparative & Cohort Analysis:
                    - Benchmark individual performance against peer groups and historical data
                    - Perform percentile rankings and z-score calculations for context
                    - Analyze performance relative to bodyweight, age, and experience level
                    - Compare training methodologies and their effectiveness

                    Risk Assessment & Load Management:
                    - Calculate training load ratios and identify overreaching indicators
                    - Analyze injury risk factors through movement quality metrics
                    - Monitor fatigue markers and readiness indicators
                    - Assess training monotony and strain metrics

                    REPORTING STANDARDS:
                    - Present findings with statistical significance and confidence levels
                    - Include effect sizes and practical significance alongside statistical measures
                    - Provide uncertainty estimates and confidence intervals for predictions
                    - Use data visualization best practices for clear communication
                    - Support all recommendations with quantitative evidence and statistical backing

                    Always approach analysis with scientific rigor, acknowledging limitations in the data 
                    and providing context for the confidence level of your insights. Provide your responses in plain text.`
        },
        {
          role: "user",
          content: `Please analyze the following athlete performance data and provide insights:

${analysisData}

Please provide:
1. Key performance insights
2. Trends observed in the data
3. Areas for improvement
4. Strengths identified
5. Specific recommendations

Format your response in clear sections with headings.`
        }
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    return NextResponse.json({
      analysis: completion.choices[0]?.message?.content || 'No analysis generated',
      athleteName: selectedAthlete?.fullName || 'All Athletes',
      timeRange,
      dataPoints: measurements.length
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI analysis' },
      { status: 500 }
    );
  }
}

function getDateRange(timeRange: string) {
  const endDate = new Date();
  const startDate = new Date(endDate); // Create a proper copy

  switch (timeRange) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case '7days':
      startDate.setDate(endDate.getDate() - 6); // 6 days ago + today = 7 days
      startDate.setHours(0, 0, 0, 0);
      break;
    case '30days':
      startDate.setDate(endDate.getDate() - 29); // 29 days ago + today = 30 days  
      startDate.setHours(0, 0, 0, 0);
      break;
    case '90days':
      startDate.setDate(endDate.getDate() - 89); // 89 days ago + today = 90 days
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'year':
      startDate.setFullYear(endDate.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'all':
      startDate.setFullYear(2020, 0, 1); // January 1, 2020
      startDate.setHours(0, 0, 0, 0);
      break;
    default:
      startDate.setDate(endDate.getDate() - 6); // Default to 7 days
      startDate.setHours(0, 0, 0, 0);
  }

  // Add debug logging
  console.log(`AI Analysis date range calculation for ${timeRange}:`);
  console.log(`Start: ${startDate.toISOString().split('T')[0]}, End: ${endDate.toISOString().split('T')[0]}`);

  return { startDate, endDate };
}

function prepareAnalysisData(measurements: ExerciseMeasurement[], exercises: ExerciseMetadata[], selectedAthlete: Athlete | null, athletes: Athlete[]) {
  if (measurements.length === 0) {
    return selectedAthlete 
      ? `No performance data available for ${selectedAthlete.fullName} in the selected time period.`
      : `No performance data available for any athletes in the selected time period.`;
  }

  // Group measurements by exercise
  const exerciseGroups: Record<string, ExerciseMeasurement[]> = measurements.reduce((acc, measurement) => {
    if (!acc[measurement.exerciseId]) {
      acc[measurement.exerciseId] = [];
    }
    acc[measurement.exerciseId].push(measurement);
    return acc;
  }, {} as Record<string, ExerciseMeasurement[]>);

  let analysisText = '';
  
  if (selectedAthlete) {
    analysisText += `Performance Analysis for: ${selectedAthlete.fullName}\n`;
    analysisText += `Age: ${calculateAge(selectedAthlete.dateOfBirth)} years\n\n`;
  } else {
    analysisText += `Performance Analysis for: All Athletes (${athletes.length} total)\n\n`;
  }

  analysisText += `Total Measurements: ${measurements.length}\n`;
  analysisText += `Exercises Performed: ${Object.keys(exerciseGroups).length}\n`;
  if (measurements.length > 0) {
    const lastMeasurement = measurements[measurements.length - 1];
    analysisText += `Date Range: ${measurements[0]?.completedDate?.split('T')[0]} to ${lastMeasurement?.completedDate?.split('T')[0]}\n\n`;
  }

  // Analyze each exercise
  Object.entries(exerciseGroups).forEach(([exerciseId, exerciseMeasurements]) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    const exerciseName = exercise?.name || exerciseId;
    const category = exercise?.category || 'Unknown';
    
    analysisText += `Exercise: ${exerciseName} (${category})\n`;
    analysisText += `- Sessions: ${exerciseMeasurements.length}\n`;
    
    // Analyze metrics for this exercise
    const metrics = exercise?.metrics || [];
    metrics.forEach((metric: { name: string; field: string; unitOfMeasure: string }) => {
      const values = exerciseMeasurements
        .flatMap(m => m.metrics)
        .filter(m => m.field === metric.field)
        .map(m => m.value);
      
      if (values.length > 0) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        
        analysisText += `- ${metric.name}: Avg ${avg.toFixed(2)}${metric.unitOfMeasure}, Max ${max}${metric.unitOfMeasure}, Min ${min}${metric.unitOfMeasure}\n`;
      }
    });
    
    analysisText += '\n';
  });

  // Add recent performance trend
  const recentMeasurements = measurements.slice(-10); // Last 10 measurements
  if (recentMeasurements.length > 0) {
    analysisText += `Recent Performance (Last 10 sessions):\n`;
    recentMeasurements.forEach(m => {
      const exercise = exercises.find(e => e.id === m.exerciseId);
      analysisText += `- ${m.completedDate.split('T')[0]}: ${exercise?.name || m.exerciseId}\n`;
    });
  }

  return analysisText;
}

function calculateAge(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
} 