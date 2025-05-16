import { getExerciseMetadata } from "@/services/outputSports.server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const exerciseMetadata = await getExerciseMetadata();
    return NextResponse.json(exerciseMetadata);
  } catch (error) {
    console.error("Error fetching exercise metadata:", error);
    return NextResponse.json(
      { error: "Failed to fetch exercise metadata" },
      { status: 500 }
    );
  }
} 