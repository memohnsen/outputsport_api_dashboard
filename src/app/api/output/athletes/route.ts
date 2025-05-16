import { getAthletes } from "@/services/outputSports.server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const athletes = await getAthletes();
    return NextResponse.json(athletes);
  } catch (error) {
    console.error("Error fetching athletes:", error);
    return NextResponse.json(
      { error: "Failed to fetch athletes" },
      { status: 500 }
    );
  }
} 