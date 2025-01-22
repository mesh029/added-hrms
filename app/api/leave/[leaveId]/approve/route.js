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

        // Calculate leave duration excluding weekends
        const calculateLeaveDuration = (startDate, endDate) => {
            const start = new Date(startDate);
            const end = new Date(endDate);
            let duration = 0;

            for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
                if (current.getDay() !== 0 && current.getDay() !== 6) { // Exclude weekends (Sunday and Saturday)
                    duration++;
                }
            }
            return duration;
        };

        const leaveDuration = calculateLeaveDuration(leave.startDate, leave.endDate);

        // Validate leave balance at the first approval stage
        if (approver.role === "INCHARGE" && leave.user.leaveDays < leaveDuration) {
            return NextResponse.json(
                { error: "Insufficient leave days available." },
                { status: 403 }
            );
        }

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
        const approversDetails = approvals.map((approval) => ({
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

        // Deduct leave days from user's balance if fully approved
        if (allApproved) {
            const remainingLeaveDays = leave.user.leaveDays - leaveDuration;
            await prisma.user.update({
                where: { id: leave.user.id },
                data: { leaveDays: remainingLeaveDays },
            });

            const recipients = [
                ...approvals.map((a) => a.approverId),
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

        // Notify the next approver if available
        const relatedLocations = {
            Kisumu: ["Kisumu", "Kakamega", "Vihiga"],
            Nyamira: ["Nyamira", "Kisii", "Migori"],
            Kakamega: ["Kisumu", "Kakamega", "Vihiga"],
        };

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

        if (nextApprover) {
            await prisma.notification.create({
                data: {
                    recipientId: nextApprover.id,
                    message: `Leave request from ${requestingUserName} (ID: ${leaveId}) is awaiting your approval as ${nextRole}.`,
                    leaveRequestId: parseInt(leaveId),
                },
            });
        }

        return NextResponse.json({ message: "Leave approved successfully." }, { status: 200 });
    } catch (error) {
        console.error("Error approving leave request:", error);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}
