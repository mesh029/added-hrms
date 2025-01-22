import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET(req) {
    try {
        // Fetch all users and timesheets with approval and user details
        const allUsers = await prisma.user.findMany();
        let timesheets = await prisma.timesheet.findMany({
            include: {
                approvals: true,
                user: true,
            },
        });

        // Map timesheets to their associated users
        timesheets = timesheets.map(timesheet => {
            const associatedUser = allUsers.find(u => u.id === timesheet.userId);
            return { ...timesheet, user: associatedUser };
        });

        // Pending Timesheets
        let pendingTimesheets = timesheets.filter((timesheet) => {
            return timesheet.status !== "Fully Approved" && !timesheet.status.startsWith("Rejected by:");
        }).map(timesheet => ({ ...timesheet, label: "Pending" }));

        // Fully Approved Timesheets
        let fullyApprovedTimesheets = timesheets.filter(
            (timesheet) => timesheet.status === "Fully Approved"
        ).map(timesheet => ({ ...timesheet, label: "Fully Approved" }));

        // Rejected Timesheets
        let rejectedTimesheets = timesheets.filter(
            (timesheet) => timesheet.status.startsWith("Rejected by:")
        ).map(timesheet => ({ ...timesheet, label: "Rejected" }));

        // Timesheets Awaiting Next Approver
        let awaitingNextApproverTimesheets = timesheets.filter(
            (timesheet) => timesheet.status.startsWith("Approved by:")
        ).map(timesheet => ({ ...timesheet, label: "Awaiting Next Approver" }));

        // Return categorized timesheets
        return NextResponse.json({
            timesheets, // All timesheets (for reports)
            pendingTimesheets,       
            fullyApprovedTimesheets, 
            rejectedTimesheets,      
            awaitingNextApproverTimesheets // New filter result
        });

    } catch (error) {
        console.error("Error fetching timesheets:", error);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}
