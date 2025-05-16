import { getExerciseMeasurements } from "@/services/outputSports.server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { startDate, endDate, exerciseMetadataIds = [], athleteIds = [] } = body;
    
    console.log("API received request with dates:", { startDate, endDate });
    
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      );
    }
    
    // Simple validation for date strings (YYYY-MM-DD format)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      console.error("Invalid date format - expected YYYY-MM-DD");
      return NextResponse.json(
        { error: "Invalid date format - expected YYYY-MM-DD" },
        { status: 400 }
      );
    }
    
    // Convert to Date objects for the server API
    try {
      // For "today" case, use the exact same date string but ensure full day coverage
      const isSameDay = startDate === endDate;
      
      // Create dates with explicit time components for proper coverage
      // For the start of the day, use 00:00:00 local time
      const parsedStartDate = new Date(startDate + "T00:00:00");
      
      // For the end of the day, use 23:59:59 local time
      let parsedEndDate = new Date(endDate + "T23:59:59.999");
      
      console.log(`Raw date strings received: startDate=${startDate}, endDate=${endDate}`);
      console.log(`Parsed dates: start=${parsedStartDate.toISOString()}, end=${parsedEndDate.toISOString()}`);
      
      if (isSameDay) {
        console.log("TODAY CASE DETECTED - Ensuring full day coverage");
        console.log(`Today's date range: ${parsedStartDate.toISOString()} to ${parsedEndDate.toISOString()}`);
      }
      
      // Validate dates
      if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
        console.error("Invalid date values after parsing");
        return NextResponse.json(
          { error: "Invalid date values" },
          { status: 400 }
        );
      }
      
      // Check if start date is after end date
      if (parsedStartDate > parsedEndDate) {
        console.error("Start date is after end date");
        return NextResponse.json(
          { error: "Start date must be before end date" },
          { status: 400 }
        );
      }
      
      // Check if date range is too large
      const daysDiff = Math.floor((parsedEndDate.getTime() - parsedStartDate.getTime()) / (1000 * 60 * 60 * 24));
      const MAX_RANGE_DAYS = 90; // Restrict to 90 days based on API behavior in logs
      
      let adjustedStartDate = parsedStartDate;
      
      if (daysDiff > MAX_RANGE_DAYS) {
        console.warn(`Date range too large (${daysDiff} days), adjusting to ${MAX_RANGE_DAYS} days`);
        // Create a new date object to avoid reference issues
        adjustedStartDate = new Date(parsedEndDate);
        // Set the start date to be MAX_RANGE_DAYS before the end date
        adjustedStartDate.setDate(adjustedStartDate.getDate() - MAX_RANGE_DAYS);
        adjustedStartDate.setHours(0, 0, 0, 0); // Set to beginning of day
        console.log(`Adjusted start date from ${parsedStartDate.toISOString()} to ${adjustedStartDate.toISOString()}`);
      }
      
      console.log(`API: Making request with date range: ${adjustedStartDate.toISOString()} to ${parsedEndDate.toISOString()}`);
      
      try {
        const measurements = await getExerciseMeasurements(
          adjustedStartDate,
          parsedEndDate,
          exerciseMetadataIds,
          athleteIds
        );
        
        console.log(`API: Successfully fetched ${measurements.length} measurements`);
        return NextResponse.json(measurements);
      } catch (apiError) {
        console.error(`API error from Output Sports API:`, apiError);
        
        // Handle specific API errors
        if (apiError instanceof Error) {
          // For long date ranges, try with an even shorter range as a fallback
          if (daysDiff >= 60 && apiError.message.includes("Bad Request")) {
            console.log("Trying fallback with shorter date range (30 days)");
            const fallbackStartDate = new Date(parsedEndDate);
            fallbackStartDate.setDate(fallbackStartDate.getDate() - 30);
            fallbackStartDate.setHours(0, 0, 0, 0); // Start at beginning of day
            
            try {
              const fallbackMeasurements = await getExerciseMeasurements(
                fallbackStartDate,
                parsedEndDate,
                exerciseMetadataIds,
                athleteIds
              );
              
              console.log(`API: Fallback succeeded, fetched ${fallbackMeasurements.length} measurements with 30-day range`);
              return NextResponse.json(fallbackMeasurements);
            } catch (fallbackError) {
              console.error("Fallback also failed:", fallbackError);
              return NextResponse.json(
                { error: `Failed to fetch exercise measurements: ${apiError.message}` },
                { status: 500 }
              );
            }
          }
          
          return NextResponse.json(
            { error: `Failed to fetch exercise measurements: ${apiError.message}` },
            { status: 500 }
          );
        }
        
        return NextResponse.json(
          { error: "Failed to fetch exercise measurements from external API" },
          { status: 500 }
        );
      }
      
    } catch (error) {
      console.error("Error processing dates:", error);
      return NextResponse.json(
        { error: "Failed to process date values" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error fetching exercise measurements:", error);
    let errorMessage = "Failed to fetch exercise measurements";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 