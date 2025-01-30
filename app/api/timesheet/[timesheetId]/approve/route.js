import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Handle the POST method for approving the timesheet
export async function POST(req, context) {
const {params} = await context;
  
const { timesheetId } = params; // Get timesheetId from the URL path
const { searchParams } = new URL(req.url);
const approverId = searchParams.get('approverId'); // Get approverId from query string

  if (!timesheetId || !approverId) {
    return NextResponse.json({ error: "Missing timesheetId or approverId parameter." }, { status: 400 });
  }

  try {
    // Fetch approver details
    const approver = await prisma.user.findUnique({ where: { id: parseInt(approverId) } });
    if (!approver) {
      return NextResponse.json({ error: "Approver not found." }, { status: 404 });
    }

    const approvalOrder = ["INCHARGE", "PO", "HR", "PADM"];
    const approverIndex = approvalOrder.indexOf(approver.role);

    if (approverIndex === -1) {
      return NextResponse.json({ error: "Invalid approver role." }, { status: 403 });
    }

    // Fetch timesheet details
    const timesheet = await prisma.timesheet.findUnique({
      where: { id: parseInt(timesheetId) },
      include: { approvals: true, user: true },
    });

    if (!timesheet) {
      return NextResponse.json({ error: "Timesheet not found." }, { status: 404 });
    }

    const requestingUserName = timesheet.user.name;

    // Check previous approval
    if (approverIndex > 0) {
      const previousRole = approvalOrder[approverIndex - 1];
      const previousApproval = timesheet.approvals.find(
        (approval) => approval.approverRole === previousRole && approval.status === "Approved"
      );

      if (!previousApproval) {
        return NextResponse.json({
          error: `Cannot approve. Waiting for approval from ${previousRole}.`,
        }, { status: 403 });
      }
    }

    // Register approval
    await prisma.approval.create({
      data: {
        timesheetId: parseInt(timesheetId),
        approverId: parseInt(approverId),
        approverRole: approver.role,
        approverName: approver.name,
        signature: approver.title,
        status: "Approved",
      },
    });

    const approvals = await prisma.approval.findMany({ where: { timesheetId: parseInt(timesheetId) } });
    const approversDetails = approvals.map(approval => ({
      name: approval.approverName,
      role: approval.approverRole,
      title: approval.signature,
    }));

    await prisma.timesheet.update({
      where: { id: parseInt(timesheetId) },
      data: { approvers: approversDetails },
    });

    const allApproved = approvalOrder.every((role) =>
      approvals.some((approval) => approval.approverRole === role && approval.status === "Approved")
    );

    const status = allApproved ? "Fully Approved" : `Approved by: ${approver.role}`;
    await prisma.timesheet.update({
      where: { id: parseInt(timesheetId) },
      data: { status },
    });

    // Notify the timesheet submitter
    await prisma.notification.create({
      data: {
        recipientId: timesheet.user.id,
        message: `Your timesheet (ID: ${timesheetId}) has been approved by ${approver.role}.`,
        timesheetId: parseInt(timesheetId),
      },
    });

    // Define the related locations map
    const relatedLocations = {
      "Kisumu": ["Kisumu", "Kakamega", "Vihiga"],
      "Nyamira": ["Nyamira", "Kisii", "Migori"],
      "Kakamega": ["Kisumu", "Kakamega", "Vihiga"],
      // Add other locations and their related locations here
    };

    // Determine the next approver
    let nextRole, nextApprover;
    if (approver.role === "INCHARGE") {
      nextRole = "PO";
      nextApprover = await prisma.user.findFirst({
        where: { role: nextRole, name: approver.reportsTo },
      });
    } else if (approver.role === "PO") {
      nextRole = "HR";
      const approverLocation = timesheet.user.location;
      const validLocations = relatedLocations[approverLocation] || [];

      nextApprover = await prisma.user.findMany({
        where: {
          role: nextRole,
          location: { in: validLocations }, // Check if HR's location is in the valid locations list
        },
      });
    
    } else if (approver.role === "HR") {
      nextRole = "PADM";
      nextApprover = await prisma.user.findMany({ where: { role: nextRole } });
    }

    if (nextApprover && nextApprover.length > 0) {
      // Extract approver IDs into an array
      const approverIds = nextApprover.map((approver) => approver.id);
    
      // Create a single notification
      await prisma.notification.create({
        data: {
          recipients: { connect: approverIds.map((id) => ({ id })) }, // Link all approvers
          message: `Timesheet from ${requestingUserName} (ID: ${timesheetId}) is awaiting your approval as ${nextRole}.`,
          timesheetId: parseInt(timesheetId), // Use `timesheetId` directly
        },
      });
    }
    
    
    
    if (allApproved) {
      const recipients = [...approvals.map(a => a.approverId), timesheet.user.id];
      for (const recipientId of recipients) {
        await prisma.notification.create({
          data: {
            recipientId,
            message: `Timesheet from ${requestingUserName} (ID: ${timesheetId}) has been fully approved.`,
            timesheetId: parseInt(timesheetId),
          },
        });
      }
    }

    return NextResponse.json({ message: "Timesheet approved successfully." }, { status: 200 });
  } catch (error) {
    console.error("Error approving timesheet:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
