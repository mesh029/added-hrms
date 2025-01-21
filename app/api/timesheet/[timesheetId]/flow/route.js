import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req, context) {
    try {
        const { timesheetId } = await context.params;

        // Validate the timesheetId
        if (!timesheetId) {
            return NextResponse.json({ error: "Timesheet ID is required." }, { status: 400 });
        }

        // Fetch the approval flow for the timesheet
        const approvals = await prisma.approval.findMany({
            where: {
                timesheetId: parseInt(timesheetId, 10), // Ensure timesheetId is a valid number
            },
            orderBy: {
                timestamp: "asc", // Order by timestamp to show the approval flow
            },
            include: {
                approver: true,  // Include approver details
                timesheet: true, // Include timesheet details
            },
        });

        // Check if approvals exist for the given timesheetId
        if (approvals.length === 0) {
            return NextResponse.json({ error: "No approval flow found for the provided timesheet." }, { status: 404 });
        }

        // Respond with the approval flow data
        return NextResponse.json(approvals, { status: 200 });
    } catch (error) {
        console.error("Error fetching approval flow:", error);
        return NextResponse.json({ error: "An error occurred while fetching the approval flow." }, { status: 500 });
    }
}
