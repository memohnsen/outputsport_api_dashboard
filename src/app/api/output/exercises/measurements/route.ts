import { getExerciseMeasurements } from "@/services/outputSports.server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { startDate, endDate, exerciseMetadataIds = [], athleteIds = [] } = body;
    
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      );
    }
    
    const measurements = await getExerciseMeasurements(
      new Date(startDate),
      new Date(endDate),
      exerciseMetadataIds,
      athleteIds
    );
    
    return NextResponse.json(measurements);
  } catch (error) {
    console.error("Error fetching exercise measurements:", error);
    return NextResponse.json(
      { error: "Failed to fetch exercise measurements" },
      { status: 500 }
    );
  }
} 