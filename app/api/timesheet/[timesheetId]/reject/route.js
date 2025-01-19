import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Handle the PATCH method for rejecting the timesheet
export async function PATCH(req, context) {
 const[params] = await context;
  const { timesheetId } = params; // Get timesheetId from the URL path
  const { reason } = await req.json(); // Get reason for rejection
  const { searchParams } = new URL(req.url);
  const approverId = searchParams.get('approverId'); // Get approverId from the query string

  // Validate that timesheetId, reason, and approverId are provided
  if (!timesheetId || !reason || !approverId) {
    return NextResponse.json({ error: "Missing timesheetId, reason, or approverId." }, { status: 400 });
  }

  try {
    // Fetch approver details
    const approver = await prisma.user.findUnique({ where: { id: parseInt(approverId) } });
    if (!approver) {
      return NextResponse.json({ error: "Approver not found." }, { status: 404 });
    }

    // Fetch timesheet details
    const timesheet = await prisma.timesheet.findUnique({
      where: { id: parseInt(timesheetId) },
    });

    if (!timesheet) {
      return NextResponse.json({ error: "Timesheet not found." }, { status: 404 });
    }

    // Update the status of the timesheet to reflect rejection
    await prisma.timesheet.update({
      where: { id: parseInt(timesheetId) },
      data: {
        status: `Rejected by: ${approver.name} for: [${reason}]`, // Embed approver's name and reason
      },
    });

    // Respond with success
    return NextResponse.json({ message: "Timesheet rejected successfully." }, { status: 200 });
  } catch (error) {
    console.error("Error rejecting timesheet:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
