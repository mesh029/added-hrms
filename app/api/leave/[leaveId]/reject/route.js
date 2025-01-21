import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Handle the POST method for denying the leave
export async function PATCH(req, context) {
    const { leaveId } = await context.params;
    const { reason } = await req.json(); // Get reason for denial
  const { searchParams } = new URL(req.url);

  const approverId = searchParams.get('approverId'); // Get approverId from the query string

  // Validate that leaveId and approverId are provided
  if (!leaveId || !approverId) {
    return NextResponse.json({ error: "Leave ID and approverId are required." }, { status: 400 });
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

    // Fetch leave request and its approvals
    const leaveRequest = await prisma.leave.findUnique({
      where: { id: parseInt(leaveId) },
      include: { approvals: true, user: true },
    });

    if (!leaveRequest) {
      return NextResponse.json({ error: "Leave request not found." }, { status: 404 });
    }

    // Check if the previous approver has approved
    if (approverIndex > 0) {
      const previousRole = approvalOrder[approverIndex - 1];
      const previousApproval = leaveRequest.approvals.find(
        (approval) => approval.approverRole === previousRole && approval.status === "Approved"
      );

      if (!previousApproval) {
        return NextResponse.json({
          error: `Cannot deny. Waiting for approval from ${previousRole}.`,
        }, { status: 403 });
      }
    }

    // Log the denial in the approvals table
    await prisma.approval.create({
      data: {
        leaveRequestId: parseInt(leaveId),
        approverId: parseInt(approverId),
        approverRole: approver.role,
        approverName: approver.name,
        signature: approver.title,
        status: "Denied",
      },
    });

    // Fetch updated approvals for the leave request
    const approvals = await prisma.approval.findMany({ where: { leaveRequestId: parseInt(leaveId) } });
    const approversDetails = approvals.map(approval => ({
      name: approval.approverName,
      role: approval.approverRole,
      title: approval.signature,
      action: approval.status,
    }));

    // Update leave request with the new status and approvers
    await prisma.leave.update({
      where: { id: parseInt(leaveId) },
      data: {
        approvers: approversDetails,
        status: `Denied by: ${approver.name} for: [${reason}]`,
      },
    });

    // Notify all involved parties about the denial
    const involvedApprovers = approvals.filter(approval => approval.status !== "Denied");
    
    for (const approval of involvedApprovers) {
      await prisma.notification.create({
        data: {
          recipientId: approval.approverId,
          message: `Leave request from ${leaveRequest.user.name} (ID: ${leaveId}) has been denied by ${approver.role}.`,
          leaveRequestId: parseInt(leaveId),
        },
      });
    }

    // Optional: Notify the user who requested the leave about the denial
    await prisma.notification.create({
      data: {
        recipientId: leaveRequest.user.id,
        message: `Your leave request (ID: ${leaveId}) has been denied by ${approver.role}. Reason: ${reason}`,
        leaveRequestId: parseInt(leaveId),
      },
    });

    return NextResponse.json({
      message: "Leave denied successfully.",
      approvers: approversDetails,
    }, { status: 200 });
  } catch (error) {
    console.error("Error denying leave request:", error);
    return NextResponse.json({ error: "Failed to deny leave request." }, { status: 500 });
  }
}
