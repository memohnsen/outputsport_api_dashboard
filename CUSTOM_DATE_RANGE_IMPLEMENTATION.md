# Custom Date Range Implementation

## Overview
Added a new "Custom" option to the time dropdown that allows users to select a custom date range using date pickers. The default custom range is set to today - 30 days through today.

## Changes Made

### 1. OutputDashboard Component (`src/app/_components/OutputDashboard.tsx`)
- **Updated TimeRange type**: Added 'custom' to the union type
- **Added state variables**: 
  - `customStartDate` and `customEndDate` for storing custom date values
- **Added useEffect**: Initialize custom dates to default range (today - 30 days through today)
- **Added event handlers**: 
  - `handleCustomStartDateChange` and `handleCustomEndDateChange`
- **Updated dropdown**: Added "Custom" option to the time range select
- **Added date inputs**: Added start and end date input fields that appear when "Custom" is selected
- **Updated getTimeRangeLabel**: Added custom date range display format
- **Updated report saving**: Pass custom dates when saving reports with custom time range
- **Updated URL parameter handling**: Handle custom date parameters when loading saved reports
- **Updated component props**: Pass custom dates to ExerciseMeasurements and AIAnalysis components

### 2. ExerciseMeasurements Component (`src/app/_components/exercises/ExerciseMeasurements.tsx`)
- **Updated TimeRange type**: Added 'custom' to the union type
- **Updated interface**: Added optional `customStartDate` and `customEndDate` props
- **Updated getDateRange function**: Added handling for custom date range
- **Updated filterMeasurementsByTimeRange function**: Added custom date filtering logic with proper timezone handling
- **Updated useEffect dependencies**: Added custom dates to dependency array

### 3. Reports Router (`src/server/api/routers/reports.ts`)
- **Updated SavedReport interface**: Added optional `customStartDate` and `customEndDate` fields
- **Updated save input schema**: Added optional custom date fields to validation
- **Updated save mutation**: Store custom dates when saving reports

### 4. Reports Page (`src/app/reports/page.tsx`)
- **Updated TimeRange type**: Added 'custom' to the union type
- **Updated SavedReport interface**: Added optional custom date fields
- **Updated getTimeRangeLabel function**: Added custom date range display
- **Updated handleLoadReport function**: Pass custom dates as URL parameters when loading reports

### 5. AIAnalysis Component (`src/app/_components/AIAnalysis.tsx`)
- **Updated interface**: Added optional `customStartDate` and `customEndDate` props
- **Updated generateAnalysis function**: Pass custom dates to API when timeRange is 'custom'

### 6. AI Analysis API Route (`src/app/api/ai/analyze/route.ts`)
- **Updated POST function**: Extract custom date parameters from request body
- **Updated getDateRange function**: Added handling for custom date ranges with proper timezone handling

## Features

### Date Picker UI
- Custom date inputs appear when "Custom" is selected from the time dropdown
- Date inputs use HTML5 date input type for native date picker support
- Inputs are styled consistently with the existing design system

### Default Behavior
- Default custom date range is set to today - 30 days through today
- Date range is automatically initialized when the component mounts

### Data Filtering
- Custom date ranges properly filter exercise measurements
- Timezone handling ensures accurate date comparisons
- Start date includes beginning of day (00:00:00.000Z)
- End date includes end of day (23:59:59.999Z)

### Report Integration
- Custom date ranges are saved with reports
- Loading a saved report with custom dates restores the date selection
- Report list displays custom date range information

### AI Analysis Support
- AI analysis respects custom date ranges
- Custom dates are passed to the analysis API
- Analysis results reflect the custom time period

## Technical Details

### Date Handling
- Dates are stored as YYYY-MM-DD strings
- Timezone conversion handled consistently across components
- UTC timestamps used for precise filtering

### State Management
- Custom dates stored in OutputDashboard component state
- Passed down to child components as needed
- URL parameters preserve state when loading saved reports

### Validation
- Date inputs use HTML5 validation
- Start and end dates are validated server-side
- Error handling for invalid date ranges

## Testing
The implementation has been tested to ensure:
- Date pickers appear/disappear correctly when selecting Custom
- Data filtering works with custom date ranges
- Reports save and load custom dates properly
- AI analysis works with custom time periods
- Visual updates reflect the selected custom range