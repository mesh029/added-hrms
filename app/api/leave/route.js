import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: "Missing userId parameter." }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
            select: { 
                id: true, 
                name: true, 
                role: true,  
                location: true, 
                reportsTo: true 
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found." }, { status: 404 });
        }

        const { role, location, reportsTo, name } = user;

        // Fetch all users and leave requests with approval and user details
        const allUsers = await prisma.user.findMany();
        let leaveRequests = await prisma.leave.findMany({
            include: {
                approvals: true,
                user: true,
            },
        });

        // Map the leave requests to their associated users
        leaveRequests = leaveRequests.map(leave => {
            const associatedUser = allUsers.find(u => u.id === leave.userId);
            return { ...leave, user: associatedUser };
        });

        // ✅ Helper function for role-based filtering
        const filterLeaveRequestsByRole = async (leaveRequests) => {
            if (role === "HR") {
                const relatedLocations = {
                    "Kisumu": ["Kisumu", "Kakamega", "Vihiga"],
                    "Nyamira": ["Nyamira", "Kisii", "Migori"],
                    "Kakamega": ["Kisumu", "Kakamega", "Vihiga"],
                };
                const possibleLocations = relatedLocations[location] || [location];
                return leaveRequests.filter(leave =>
                    possibleLocations.includes(leave.user.location)
                );
            } 
            else if (role === "INCHARGE") {
                return leaveRequests.filter(leave => leave.user.reportsTo === name);
            } 
            else if (role === "PO") {
                leaveRequests = await Promise.all(
                    leaveRequests.map(async (leave) => {
                        const relevantInchargeApproval = await Promise.all(
                            leave.approvals.map(async (approval) => {
                                if (approval.approverRole === "INCHARGE") {
                                    const facilityIncharge = await prisma.user.findUnique({
                                        where: { name: approval.approverName },
                                        select: { reportsTo: true },
                                    });
                                    if (facilityIncharge?.reportsTo === name) {
                                        return leave;
                                    }
                                }
                                return null;
                            })
                        );
                        return relevantInchargeApproval.find(Boolean);
                    })
                );
                return leaveRequests.filter(Boolean);
            } 
            else if (role === "PADM") {
                return leaveRequests.filter(leave =>
                    leave.approvals.some(approval =>
                        approval.approverRole === "HR" && approval.status === "Approved"
                    )
                );
            } 
            else if (role === "STAFF") {
                return leaveRequests.filter(leave => leave.user.id === user.id);
            }

            // Return empty array for unrecognized roles
            return [];
        };

        // ✅ Apply role-based filtering
        let roleBasedLeaveRequests = await filterLeaveRequestsByRole(leaveRequests);

        // If no leave requests are returned for an unrecognized role
        if (roleBasedLeaveRequests.length === 0) {
            return NextResponse.json({ message: "No leave requests available for this user or unrecognized role." }, { status: 200 });
        }

        // ✅ Pending Leave Requests
        let pendingLeaveRequests = roleBasedLeaveRequests.filter((leave) => {
            if (role === "INCHARGE") {
                return leave.status === "Pending";
            } else if (role === "PO") {
                return leave.status === "Approved by: INCHARGE";
            } else if (role === "HR") {
                return leave.status === "Approved by: PO";
            } else if (role === "PADM") {
                return leave.status === "Approved by: HR";
            } else if (role === "STAFF") {
                return leave.status !== "Fully Approved" && !leave.status.startsWith("Rejected by:");
            }
            return false;
        }).map(leave => ({ ...leave, label: "Pending" }));

        // ✅ Leaves Awaiting Next Approver (New filter added)
        let awaitingNextApprover = roleBasedLeaveRequests.filter(leave =>
            leave.status === `Approved by: ${role}`
        ).map(leave => ({ ...leave, label: "Awaiting Next Approver" }));

        // ✅ Fully Approved Leave Requests
        let fullyApprovedLeaveRequests = roleBasedLeaveRequests.filter(
            (leave) => leave.status === "Fully Approved"
        ).map(leave => ({ ...leave, label: "Fully Approved" }));

        // ✅ Rejected Leave Requests
        let rejectedLeaveRequests = roleBasedLeaveRequests.filter(
            (leave) => leave.status.startsWith("Denied") || leave.status.startsWith("Rejected")
        ).map(leave => ({ ...leave, label: "Rejected" }));

        // ✅ Return categorized leave requests
        return NextResponse.json({
            roleBasedLeaveRequests,    
            pendingLeaveRequests,      
            awaitingNextApprover,     // ✅ New category for next approver
            fullyApprovedLeaveRequests, 
            rejectedLeaveRequests      
        });

    } catch (error) {
        console.error("Error fetching leave requests:", error);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}


// app/api/leave/route.js

export async function POST(req) {
  try {
    const { userId, startDate, endDate, reason, leaveType } = await req.json(); // Use `await req.json()` for body parsing

    // Validate request body
    if (!userId || !startDate || !endDate || !reason) {
      return new Response(JSON.stringify({ error: "Missing required fields in the request body." }), { status: 400 });
    }

    // Validate dates
    if (new Date(startDate) > new Date(endDate)) {
      return new Response(JSON.stringify({ error: "Start date must be earlier than or equal to end date." }), { status: 400 });
    }

    // Fetch user details to get their supervisor's name from `reportsTo`
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found." }), { status: 404 });
    }

    // Create leave request
    const leave = await prisma.leave.create({
      data: {
        userId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: "Pending", // Default status for new requests
        leaveType,
        reason,
      },
    });

    // Find the direct supervisor using `reportsTo` (name + role check for accuracy)
    const directSupervisor = await prisma.user.findFirst({
      where: {
        name: user.reportsTo,  // Match the supervisor's name from `reportsTo`
        role: "INCHARGE",      // Ensure the supervisor is specifically an INCHARGE
      },
    });

    // Send notification only if the correct supervisor is found
    if (directSupervisor) {
      await prisma.notification.create({
        data: {
          recipientId: directSupervisor.id,
          message: `A new leave request from ${user.name} (ID: ${leave.id}) requires your approval as INCHARGE.`,
          leaveRequestId: leave.id,
        },
      });
    } else {
      console.warn("No matching INCHARGE found for the provided name.");
    }

    // Return response with the created leave request details
    return new Response(JSON.stringify({ message: "Leave request created successfully.", leave }), { status: 201 });
  } catch (error) {
    console.error("Error creating leave request:", error);
    return new Response(JSON.stringify({ error: "Failed to create leave request." }), { status: 500 });
  }
}

