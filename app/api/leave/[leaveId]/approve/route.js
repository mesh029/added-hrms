import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(req, context) {
    const { leaveId } = await context.params;
    const { searchParams } = new URL(req.url);
    const approverId = searchParams.get('approverId'); // Get approverId from the query string

    if (!leaveId || !approverId) {
        return NextResponse.json({ error: "Missing leaveId or approverId." }, { status: 400 });
    }

    try {
        const approver = await prisma.user.findUnique({ where: { id: parseInt(approverId) } });
        if (!approver) {
            return NextResponse.json({ error: "Approver not found." }, { status: 404 });
        }

        const approvalOrder = ["INCHARGE", "PO", "HR"];
        const approverIndex = approvalOrder.indexOf(approver.role);

        if (approverIndex === -1) {
            return NextResponse.json({ error: "Invalid approver role." }, { status: 403 });
        }

        const leave = await prisma.leave.findUnique({
            where: { id: parseInt(leaveId) },
            include: { approvals: true, user: true },
        });

        if (!leave) {
            return NextResponse.json({ error: "Leave request not found." }, { status: 404 });
        }

        const requestingUserName = leave.user.name;

        // Check approval order
        if (approverIndex > 0) {
            const previousRole = approvalOrder[approverIndex - 1];
            const previousApproval = leave.approvals.find(
                (approval) => approval.approverRole === previousRole && approval.status === "Approved"
            );

            if (!previousApproval) {
                return NextResponse.json(
                    { error: `Cannot approve. Waiting for approval from ${previousRole}.` },
                    { status: 403 }
                );
            }
        }

        // Register the approval
        await prisma.approval.create({
            data: {
                leaveRequestId: parseInt(leaveId),
                approverId: parseInt(approverId),
                approverRole: approver.role,
                approverName: approver.name,
                signature: approver.title,
                status: "Approved",
            },
        });

        // Fetch updated approvals for the leave request
        const approvals = await prisma.approval.findMany({ where: { leaveRequestId: parseInt(leaveId) } });
        const approversDetails = approvals.map(approval => ({
            name: approval.approverName,
            role: approval.approverRole,
            title: approval.signature,
        }));

        await prisma.leave.update({
            where: { id: parseInt(leaveId) },
            data: { approvers: approversDetails },
        });

        // Check if all approvals are completed
        const allApproved = approvalOrder.every((role) =>
            approvals.some((approval) => approval.approverRole === role && approval.status === "Approved")
        );

        const status = allApproved ? "Fully Approved" : `Approved by: ${approver.role}`;
        await prisma.leave.update({
            where: { id: parseInt(leaveId) },
            data: { status },
        });

        // Notify the staff who submitted the leave request about the current approval
        await prisma.notification.create({
            data: {
                recipientId: leave.user.id,
                message: `Your leave request (ID: ${leaveId}) has been approved by ${approver.role}.`,
                leaveRequestId: parseInt(leaveId),
            },
        });

        const relatedLocations = {
            "Kisumu": ["Kisumu", "Kakamega", "Vihiga"],
            "Nyamira": ["Nyamira", "Kisii", "Migori"],
            "Kakamega": ["Kisumu", "Kakamega", "Vihiga"],
            // Add other locations and their related locations here
        };
  

        // Determine the next approver and send notifications
        let nextRole, nextApprover;
        if (approver.role === "INCHARGE") {
            nextRole = "PO";
            nextApprover = await prisma.user.findFirst({
                where: { role: nextRole, name: approver.reportsTo },
            });
        } else if (approver.role === "PO") {
            nextRole = "HR";
            const approverLocation = leave.user.location;
            const validLocations = relatedLocations[approverLocation] || [];

            nextApprover = await prisma.user.findFirst({
                where: {
                    role: nextRole,
                    location: { in: validLocations },
                },
            });
        }

        // Notify the next approver if available
        if (nextApprover) {
            await prisma.notification.create({
                data: {
                    recipientId: nextApprover.id,
                    message: `Leave request from ${requestingUserName} (ID: ${leaveId}) is awaiting your approval as ${nextRole}.`,
                    leaveRequestId: parseInt(leaveId),
                },
            });
        }

        // Notify all involved when fully approved
        if (allApproved) {
            const recipients = [
                ...approvals.map(a => a.approverId),
                leave.user.id,
            ];

            for (const recipientId of recipients) {
                await prisma.notification.create({
                    data: {
                        recipientId,
                        message: `Leave request from ${requestingUserName} (ID: ${leaveId}) has been fully approved.`,
                        leaveRequestId: parseInt(leaveId),
                    },
                });
            }
        }

        return NextResponse.json({ message: "Leave approved successfully." }, { status: 200 });
    } catch (error) {
        console.error("Error approving leave request:", error);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}
