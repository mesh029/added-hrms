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

        // Helper function for role-based filtering
        const filterTimesheetsByRole = async (timesheets) => {
            if (role === "HR") {
                const relatedLocations = {
                    "Kisumu": ["Kisumu", "Kakamega", "Vihiga"],
                    "Nyamira": ["Nyamira", "Kisii", "Migori"],
                    "Kakamega": ["Kisumu", "Kakamega", "Vihiga"],
                };
                const possibleLocations = relatedLocations[location] || [location];
                return timesheets.filter(timesheet =>
                    possibleLocations.includes(timesheet.user.location)
                );
            } 
            else if (role === "INCHARGE") {
                return timesheets.filter(
                    timesheet => timesheet.user.reportsTo === name
                );
            } 
            else if (role === "PO") {
                timesheets = await Promise.all(
                    timesheets.map(async (timesheet) => {
                        const relevantInchargeApproval = await Promise.all(
                            timesheet.approvals.map(async (approval) => {
                                if (approval.approverRole === "INCHARGE") {
                                    const facilityIncharge = await prisma.user.findUnique({
                                        where: { name: approval.approverName },
                                        select: { reportsTo: true },
                                    });
                                    if (facilityIncharge?.reportsTo === name) {
                                        return timesheet;
                                    }
                                }
                                return null;
                            })
                        );
                        return relevantInchargeApproval.find(Boolean);
                    })
                );
                return timesheets.filter(Boolean);
            } 
            else if (role === "PADM") {
                return timesheets.filter(timesheet =>
                    timesheet.approvals.some(approval =>
                        approval.approverRole === "HR" && approval.status === "Approved"
                    )
                );
            } 
            else if (role === "STAFF") {
                return timesheets.filter(timesheet =>
                    timesheet.user.id === user.id
                );
            }
            else if (role === "admin") {
                return timesheets
            }


            // Fallback for undefined roles
            return [];
        };

        // Apply role-based filtering
        let roleBasedTimesheets = await filterTimesheetsByRole(timesheets);

        // Pending Timesheets (role-specific logic)
        let pendingTimesheets = roleBasedTimesheets.filter((timesheet) => {
            if (role === "INCHARGE") {
                return timesheet.status === "Ready";
            } else if (role === "PO") {
                return timesheet.status === "Approved by: INCHARGE";
            } else if (role === "HR") {
                return timesheet.status === "Approved by: PO";
            } else if (role === "PADM") {
                return timesheet.status === "Approved by: HR";
            } else if (role === "STAFF") {
                return timesheet.status !== "Fully Approved" && !timesheet.status.startsWith("Rejected by:");
            }
            else if (role === "admin") {
                return timesheet.status !== "Fully Approved" && !timesheet.status.startsWith("Rejected by:");
            }
            return false;
        }).map(timesheet => ({ ...timesheet, label: "Pending" }));

        // Fully Approved Timesheets
        let fullyApprovedTimesheets = roleBasedTimesheets.filter(
            (timesheet) => timesheet.status === "Fully Approved"
        ).map(timesheet => ({ ...timesheet, label: "Fully Approved" }));

        // Rejected Timesheets
        let rejectedTimesheets = roleBasedTimesheets.filter(
            (timesheet) => timesheet.status.startsWith("Rejected by:")
        ).map(timesheet => ({ ...timesheet, label: "Rejected" }));

        // Timesheets Awaiting Next Approver (NEW FILTER ADDED)
        let awaitingNextApproverTimesheets = roleBasedTimesheets.filter(
            (timesheet) => timesheet.status === `Approved by: ${role}`
        ).map(timesheet => ({ ...timesheet, label: "Awaiting Next Approver" }));

        // Return categorized timesheets
        return NextResponse.json({
            roleBasedTimesheets,     
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

export async function POST(req) {
    try {
        const body = await req.json(); // Parse the request body
        const { userId, year, month, entries, status } = body;

        // Validate request body
        if (!userId || !year || !month || !entries || !status) {
            return NextResponse.json({ error: 'Missing required fields in the request body.' }, { status: 400 });
        }

        // Validate entries
        if (!Array.isArray(entries) || entries.length === 0) {
            return NextResponse.json({
                error: 'Invalid timesheet entries: Entries must be an array with at least one entry.',
            }, { status: 400 });
        }

        // Ensure all days of the month are accounted for
        const daysInMonth = new Date(year, month, 0).getDate();

        // Calculate the weekdays (excluding weekends)
        const weekdaysInMonth = Array.from({ length: daysInMonth }, (_, dayIndex) => {
            const currentDay = new Date(year, month - 1, dayIndex + 1); // Use month - 1 for 0-based month
            const dayOfWeek = currentDay.getDay();
            return dayOfWeek !== 0 && dayOfWeek !== 6; // Exclude weekends (Sunday = 0, Saturday = 6)
        }).filter(Boolean).length;

        // Optional: Ensure entries match the number of weekdays in the month
        if (entries.length !== weekdaysInMonth) {
            return NextResponse.json({
                error: `Entries count does not match the number of weekdays in the month. Expected ${weekdaysInMonth} entries, but got ${entries.length}.`,
            }, { status: 400 });
        }

        // Iterate through entries and validate individual fields
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            if (!entry.type || !['Regular', 'Holiday', 'Sick', 'VACA', 'BRV', 'Other'].includes(entry.type)) {
                return NextResponse.json({
                    error: `Invalid entry type at index ${i}. Expected one of 'Regular', 'Holiday', 'Sick', 'VACA', 'BRV', or 'Other'.`,
                }, { status: 400 });
            }

            if (isNaN(parseFloat(entry.hours))) {
                return NextResponse.json({
                    error: `Invalid hours at index ${i}. Expected a valid number, but got: ${entry.hours}`,
                }, { status: 400 });
            }
        }

        // Create the Timesheet
        let timesheet;
        try {
            timesheet = await prisma.timesheet.create({
                data: {
                    userId,
                    year,
                    month,
                    status,
                    entries: {
                        create: entries.map(entry => ({
                            date: new Date(entry.date), // Convert date string to Date object
                            hours: parseFloat(entry.hours), // Ensure hours are stored as a float
                            type: entry.type, // 'Regular', 'Holiday', etc.
                            description: entry.description || '', // Optional description, default to empty string if undefined
                        })),
                    },
                },
            });
        } catch (dbError) {
            console.error('Error creating timesheet in database:', dbError);
            return NextResponse.json({ error: 'Database error: Unable to create timesheet.' }, { status: 500 });
        }

        return NextResponse.json({
            message: 'Timesheet submitted successfully',
            timesheet: timesheet,
        }, { status: 201 });
    } catch (error) {
        console.error('Error in submitTimesheet function:', error);
        return NextResponse.json({
            error: `Internal server error: ${error.message || 'Error submitting timesheet'}`,
        }, { status: 500 });
    }
}
