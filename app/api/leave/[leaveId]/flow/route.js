import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req, context) {
    try {
        const { leaveId } = await context.params;

        // Validate the leaveId
        if (!leaveId) {
            return NextResponse.json({ error: "Leave ID is required." }, { status: 400 });
        }

        // Fetch the approval flow for the leave request
        const approvals = await prisma.approval.findMany({
            where: {
                leaveRequestId: parseInt(leaveId, 10), // Ensure leaveId is a valid number
            },
            orderBy: {
                timestamp: "asc", // Order by timestamp to show the approval flow
            },
            include: {
                approver: true,  // Include approver details
                leaveRequest: true, // Include leave request details (corrected from timesheet to leaveRequest)
            },
        });

        // Check if approvals exist for the given leaveId
        if (approvals.length === 0) {
            return NextResponse.json({ error: "No approval flow found for the provided leave." }, { status: 404 });
        }

        // Respond with the approval flow data
        return NextResponse.json(approvals, { status: 200 });
    } catch (error) {
        console.error("Error fetching approval flow:", error);
        return NextResponse.json({ error: "An error occurred while fetching the approval flow." }, { status: 500 });
    }
}
