import { env } from "@/env";

interface OAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

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

// Store token in memory
let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

/**
 * Authenticate with Output Sports API
 */
export async function getAuthToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const response = await fetch("https://api.outputsports.com/api/v1/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grantType: "password",
      email: env.OUTPUT_EMAIL,
      password: env.OUTPUT_PASSWORD,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to authenticate: ${response.statusText}`);
  }

  const data = await response.json() as OAuthResponse;
  
  // Cache the token and set expiry
  cachedToken = data.accessToken;
  tokenExpiry = Date.now() + (parseInt(data.expiresIn) * 1000);
  
  return data.accessToken;
}

/**
 * Get all athletes from Output Sports API
 */
export async function getAthletes(): Promise<Athlete[]> {
  const token = await getAuthToken();
  
  const response = await fetch("https://api.outputsports.com/api/v1/athletes", {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch athletes: ${response.statusText}`);
  }

  return response.json() as Promise<Athlete[]>;
}

/**
 * Get all exercise metadata from Output Sports API
 */
export async function getExerciseMetadata(): Promise<ExerciseMetadata[]> {
  const token = await getAuthToken();
  
  const response = await fetch("https://api.outputsports.com/api/v1/exercises/metadata", {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch exercise metadata: ${response.statusText}`);
  }

  return response.json() as Promise<ExerciseMetadata[]>;
}

/**
 * Get exercise measurements from Output Sports API
 */
export async function getExerciseMeasurements(
  startDate: Date,
  endDate: Date,
  exerciseMetadataIds: string[] = [],
  athleteIds: string[] = []
): Promise<ExerciseMeasurement[]> {
  const token = await getAuthToken();
  
  const response = await fetch("https://api.outputsports.com/api/v1/exercises/measurements", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      exerciseMetadataIds,
      athleteIds,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch exercise measurements: ${response.statusText}`);
  }

  return response.json() as Promise<ExerciseMeasurement[]>;
}

// Helper function to calculate date range for last 30 days
export function getLast30DaysRange(): { startDate: Date, endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  return { startDate, endDate };
} 