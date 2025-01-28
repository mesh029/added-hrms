import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET(req, context) {

    try {

    const {params} = await context;
    const {timesheetId} = params


    if (!timesheetId) {
        return NextResponse.json({ error: "Timesheet not found." }, { status: 400 });
    }
    
        // Validate that `timesheetId` is provided and is a number
        const parsedTimesheetId = parseInt(timesheetId);
        if (isNaN(parsedTimesheetId)) {
          return NextResponse.json({ error: "Invalid Timesheet ID." }, { status: 400 });
        }
    
        // Fetch the timesheet entries based on the timesheet ID
        const timesheetEntries = await prisma.timesheetEntry.findMany({
          where: { timesheetId: parsedTimesheetId },
        });
    
        // If no entries are found
        if (timesheetEntries.length === 0) {
          return NextResponse.json(
            { error: "No timesheet entries found for the given Timesheet ID." },
            { status: 404 }
          );
        }
    
        return NextResponse.json(
          {
            message: "Timesheet entries fetched successfully.",
            timesheetEntries,
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("Error fetching timesheet entries:", error);
        return NextResponse.json({ error: "Failed to fetch timesheet entries." }, { status: 500 });
      }
}
