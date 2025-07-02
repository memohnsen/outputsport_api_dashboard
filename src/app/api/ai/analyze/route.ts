import { NextRequest, NextResponse } from 'next/server';
import { getAthletes, getExerciseMeasurements, getExerciseMetadata } from '@/services/outputSports.server';
import { createAIClient, DEFAULT_ANALYSIS_MODEL, MODEL_CONFIGS, type AIModel } from '@/lib/ai-client';

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

export async function POST(request: NextRequest) {
  try {
    const { athleteId, timeRange, exerciseId, model, customStartDate, customEndDate } = await request.json();

    // Use provided model or default, ensuring it's a valid model
    const selectedModel: AIModel = (model && model in MODEL_CONFIGS) ? model : DEFAULT_ANALYSIS_MODEL;
    const modelConfig = MODEL_CONFIGS[selectedModel];

    console.log('Starting AI analysis:', {
      selectedModel,
      hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
      openRouterKeyLength: process.env.OPENROUTER_API_KEY?.length || 0
    });

    // Fetch athlete data
    const athletes = await getAthletes();
    const selectedAthlete = athleteId ? athletes.find(a => a.id === athleteId) || null : null;

    // Calculate date range
    const { startDate, endDate } = getDateRange(timeRange, customStartDate, customEndDate);

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

    // Create AI client and generate analysis
    const aiClient = createAIClient(selectedModel);
    
    console.log('AI Analysis Request:', {
      selectedModel,
      modelConfig,
      dataPointsCount: measurements.length,
      analyticsDataLength: analysisData.length
    });

    // Retry logic for network issues
    let completion;
    let lastError;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`AI completion attempt ${attempt}/${maxRetries}`);
        
        completion = await aiClient.chat.completions.create({
          model: selectedModel,
          messages: [
            {
              role: "system",
              content: `You are an expert data analyst specializing in Olympic weightlifting performance analytics. 
                        Your expertise lies in extracting meaningful insights from complex training and competition 
                        datasets to drive evidence-based decisions.

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
                        and providing context for the confidence level of your insights.
                        
                        RESPONSE FRAMEWORK:

                        Data in the same day should be referred to as sets, data on different days should be referred to as sessions.
                        
                        12/31/1969 (55 years old) is the default birthday in the system, if no date of birth is provided. If this is the 
                        date of birth for the user, do not include age in your analysis.
                        
                        Your recommendations should be specific and actionable, and should be based on the data provided.
                        Do not make recommendations that are not supported by the data. If there is not enough data to make a recommendation,
                        do not make a recommendation.
                        
                        Format your response in clear sections with headings in plain text. Do not use markdown. Write the
                        headers in bold, then the information in paragraph format below it.`
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
                        6. Summary of the analysis
                        
                        Do not add any opinions that aren't directly supported by the data.`
            }
          ],
          max_tokens: modelConfig.maxTokens,
          temperature: modelConfig.temperature,
        });
        
        // If we get here, the request succeeded
        console.log(`AI completion successful on attempt ${attempt}`);
        break;
        
      } catch (error) {
        lastError = error;
        console.error(`AI completion attempt ${attempt} failed:`, error instanceof Error ? error.message : error);
        
        // If this is the last attempt, we'll throw the error
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait a bit before retrying (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    if (!completion) {
      throw lastError || new Error('Failed to get completion after all retries');
    }

    console.log('AI Completion Response:', {
      choices: completion.choices?.length || 0,
      firstChoiceContent: completion.choices?.[0]?.message?.content?.substring(0, 100) || 'No content',
      usage: completion.usage,
      model: completion.model
    });

    const analysisContent = completion.choices?.[0]?.message?.content;
    
    if (!analysisContent) {
      console.error('No analysis content generated from AI model');
      console.error('Full completion object:', JSON.stringify(completion, null, 2));
    }

    return NextResponse.json({
      analysis: analysisContent || 'No analysis generated',
      athleteName: selectedAthlete?.fullName || 'All Athletes',
      timeRange,
      dataPoints: measurements.length,
      model: selectedModel,
      modelDescription: modelConfig.description
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { error: 'Failed to generate AI analysis', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function getDateRange(timeRange: string, customStartDate?: string, customEndDate?: string) {
  // Handle custom date range
  if (timeRange === 'custom' && customStartDate && customEndDate) {
    const startDate = new Date(customStartDate + 'T00:00:00.000Z');
    const endDate = new Date(customEndDate + 'T23:59:59.999Z');
    
    console.log(`AI Analysis custom date range: ${customStartDate} to ${customEndDate}`);
    console.log(`Start: ${startDate.toISOString().split('T')[0]}, End: ${endDate.toISOString().split('T')[0]}`);
    
    return { startDate, endDate };
  }

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
    acc[measurement.exerciseId]!.push(measurement);
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
    const firstMeasurement = measurements[0];
    if (lastMeasurement && firstMeasurement) {
      analysisText += `Date Range: ${firstMeasurement.completedDate?.split('T')[0]} to ${lastMeasurement.completedDate?.split('T')[0]}\n\n`;
    }
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