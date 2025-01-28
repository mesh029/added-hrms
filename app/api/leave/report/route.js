import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET(req) {
    try {
        // Fetch all users and leaves with approval and user details
        const allUsers = await prisma.user.findMany();
        let leaves = await prisma.leave.findMany({
            include: {
                approvals: true,
                user: true,
            },
        });

        // Map leaves to their associated users
        leaves = leaves.map(leave => {
            const associatedUser = allUsers.find(u => u.id === leave.userId);
            return { ...leave, user: associatedUser };
        });

        // Pending Leaves
        let pendingLeaves = leaves.filter((leave) => {
            return leave.status !== "Fully Approved" && !leave.status.startsWith("Rejected by:");
        }).map(leave => ({ ...leave, label: "Pending" }));

        // Fully Approved Leaves
        let fullyApprovedLeaves = leaves.filter(
            (leave) => leave.status === "Fully Approved"
        ).map(leave => ({ ...leave, label: "Fully Approved" }));

        // Rejected Leaves
        let rejectedLeaves = leaves.filter(
            (leave) => leave.status.startsWith("Rejected by:")
        ).map(leave => ({ ...leave, label: "Rejected" }));

        // Leaves Awaiting Next Approver
        let awaitingNextApproverLeaves = leaves.filter(
            (leave) => leave.status.startsWith("Approved by:")
        ).map(leave => ({ ...leave, label: "Awaiting Next Approver" }));

        // Return categorized leaves
        return NextResponse.json({
            leaves,                  // All leaves (for reports)
            pendingLeaves,           
            fullyApprovedLeaves,     
            rejectedLeaves,          
            awaitingNextApproverLeaves // New filter result
        });

    } catch (error) {
        console.error("Error fetching leaves:", error);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}
