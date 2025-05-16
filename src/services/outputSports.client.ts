export interface Athlete {
  id: string;
  externalId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
}

export interface ExerciseMetadata {
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

export interface ExerciseMeasurement {
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

/**
 * Get all athletes from Output Sports API
 */
export async function getAthletes(): Promise<Athlete[]> {
  const response = await fetch('/api/output/athletes');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch athletes: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Get all exercise metadata from Output Sports API
 */
export async function getExerciseMetadata(): Promise<ExerciseMetadata[]> {
  const response = await fetch('/api/output/exercises/metadata');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch exercise metadata: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Get exercise measurements from Output Sports API
 */
export async function getExerciseMeasurements(
  startDate: string | Date,
  endDate: string | Date,
  exerciseMetadataIds: string[] = [],
  athleteIds: string[] = []
): Promise<ExerciseMeasurement[]> {
  try {
    // Convert dates to strings if they're Date objects, using LOCAL date components
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const startDateStr = typeof startDate === 'string' 
      ? startDate 
      : formatLocalDate(startDate);
    
    const endDateStr = typeof endDate === 'string' 
      ? endDate 
      : formatLocalDate(endDate);
    
    // Check if this is a "today" request
    const now = new Date();
    const todayStr = formatLocalDate(now);
    const isTodayRequest = startDateStr === endDateStr && startDateStr === todayStr;
    
    if (isTodayRequest) {
      console.log(`THIS IS A TODAY REQUEST - Today's date: ${todayStr}`);
    }
    
    console.log(`Client: Sending request with string date range ${startDateStr} to ${endDateStr}`);
    
    const response = await fetch('/api/output/exercises/measurements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: startDateStr,
        endDate: endDateStr,
        exerciseMetadataIds,
        athleteIds,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.error || response.statusText;
      console.error(`API error: ${response.status} ${errorMessage}`);
      throw new Error(`Failed to fetch exercise measurements: ${errorMessage}`);
    }
    
    const data = await response.json();
    console.log(`Client: Received ${data.length} measurements`);
    
    // If this is a "today" request, check if we have any data for today
    if (isTodayRequest) {
      const todayData = data.filter((m: ExerciseMeasurement) => m.completedDate.split('T')[0] === todayStr);
      console.log(`TODAY REQUEST - Found ${todayData.length} measurements for today out of ${data.length} total`);
      
      if (todayData.length > 0) {
        console.log(`First today measurement: ${JSON.stringify(todayData[0])}`);
      } else {
        console.log('No measurements found for today!');
      }
    }
    
    return data;
  } catch (error) {
    console.error('Client error fetching measurements:', error);
    throw error;
  }
}

// Helper function to calculate date range for last 30 days
export function getLast30DaysRange(): { startDate: Date, endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  return { startDate, endDate };
} 