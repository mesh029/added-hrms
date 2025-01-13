// userController.js

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; 
import dotenv from 'dotenv';

dotenv.config()
const prisma = new PrismaClient();


// Create a new user
export const createUser = async (req, res) => {
    const { name, email, password, role, department, address, hireDate, endDate, reportsTo, manager, weight, height, leaveDays, phone, facility, pay, title, location } = req.body;

    // Generate a default password for the new user
const generateDefaultPassword = () => {
    return 'password123'; // You can modify this as needed, or make it random
};

try {
    // Use default password if no password is provided
    const finalPassword = password || generateDefaultPassword();

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(finalPassword, 10);

    // Create the user in the database
    const newUser = await prisma.user.create({
        data: {
            name,
            location,
            email,
            password: hashedPassword,
            role,
            department,
            address,
            hireDate,
            endDate,
            reportsTo,
            manager,
            weight,
            height,
            leaveDays,
            phone,
            facility,
            // Set password reset fields to null at creation
            passwordResetToken: null,
            passwordResetTokenExpiry: null,
            pay,
            title
        },
    });

    // Send the default password back to the admin
    res.status(201).json({
        message: "User created successfully",
        newUser,
        defaultPassword: finalPassword, // send default password
    });
} catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Error creating user' });
}
};




// Get all users
export const getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching users' });
    }
};

// Get a user by ID
export const getUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await prisma.user.findUnique({
            where: { id: Number(id) },
        });
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error fetching user' });
    }
};

// Endpoint to fetch notifications for the user
export const getNotifications = async (req, res) => {
  const { userId } = req.params;

  try {
    const notifications = await prisma.notification.findMany({
      where: { recipientId: Number(userId) },
      orderBy: { createdAt: 'desc' }, // Show the latest notifications first
    });

    if (notifications.length > 0) {
      res.json(notifications);
    } else {
      res.status(404).json({ error: 'No notifications found' });
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Error fetching notifications' });
  }
};


// Update a user
export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, role, department } = req.body;

    try {
        const updatedUser = await prisma.user.update({
            where: { id: Number(id) },
            data: { name, email, role, department },
        });
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: 'Error updating user' });
    }
};

// Delete a user
export const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.user.delete({
            where: { id: Number(id) },
        });
        res.status(204).send(); // No content
    } catch (error) {
        res.status(500).json({ error: 'Error deleting user' });
    }
};


//login


// Secret key for signing JWTs
const JWT_SECRET = process.env.JWT_SECRET// Replace with your own secret key

// Function to log in and get a JWT token
export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find the user by email
        const user = await prisma.user.findUnique({
            where: { email },
        });

        // If user not found or password does not match
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Create a JWT token
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
            expiresIn: '1h', // Token expiration time
        });

        res.json({ token }); // Send token back to the client
    } catch (error) {
        res.status(500).json({ error: 'Error logging in' });
        console.log(error)
    }
};

// timesheetController.js


export const submitTimesheet = async (req, res) => {
    try {
        const { userId, year, month, entries, status } = req.body;

        // Validate request body
        if (!userId || !year || !month || !entries || !status) {
            return res.status(400).json({ error: 'Missing required fields in the request body.' });
        }

        // Validate entries
        if (!Array.isArray(entries) || entries.length === 0) {
            return res.status(400).json({ error: 'Invalid timesheet entries: Entries must be an array with at least one entry.' });
        }

        // Ensure all days of the month are accounted for
        // Get the total days in the month
const daysInMonth = new Date(year, month, 0).getDate();

// Calculate the weekdays (excluding weekends)
const weekdaysInMonth = Array.from({ length: daysInMonth }, (_, dayIndex) => {
  const currentDay = new Date(year, month - 1, dayIndex + 1); // Use month - 1 for 0-based month
  const dayOfWeek = currentDay.getDay();
  return dayOfWeek !== 0 && dayOfWeek !== 6; // Exclude weekends (Sunday = 0, Saturday = 6)
}).filter(Boolean).length; // Filter out weekends and count weekdays

// Optional: Ensure entries match the number of weekdays in the month
if (entries.length !== weekdaysInMonth) {
  return res.status(400).json({
    error: `Entries count does not match the number of weekdays in the month. Expected ${weekdaysInMonth} entries, but got ${entries.length}.`
  });
}
        // Iterate through entries and validate individual fields
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            if (!entry.type || !['Regular', 'Holiday',"Sick", 'Other'].includes(entry.type)) {
                return res.status(400).json({
                    error: `Invalid entry type at index ${i}. Expected one of 'Regular', 'Holiday', or 'Other'.`
                });
            }

            if (isNaN(parseFloat(entry.hours))) {
                return res.status(400).json({
                    error: `Invalid hours at index ${i}. Expected a valid number, but got: ${entry.hours}`
                });
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
                        }))
                    }
                }
            });
        } catch (dbError) {
            console.error('Error creating timesheet in database:', dbError);
            return res.status(500).json({ error: 'Database error: Unable to create timesheet.' });
        }

        res.status(201).json({
            message: 'Timesheet submitted successfully',
            timesheet: timesheet,
        });
    } catch (error) {
        console.error('Error in submitTimesheet function:', error);
        res.status(500).json({ error: `Internal server error: ${error.message || 'Error submitting timesheet'}` });
    }
};

export const getTimesheetsByUser = async (req, res) => {
    const { userId } = req.params;

    try {
        const timesheets = await prisma.timesheet.findMany({
            where: { userId: parseInt(userId, 10) },
            orderBy: { date: 'asc' }, // Sort by date
        });

        res.json(timesheets);
    } catch (error) {
        console.error('Error fetching timesheets:', error);
        res.status(500).json({ error: 'Error fetching timesheets' });
    }
};

export const getTimesheetForApprovers = async (req, res) => {
    const { userId } = req.query; // Get userId from query parameters
  
    if (!userId) {
      return res.status(400).json({ error: "Missing userId parameter." });
    }
  
    try {
      const approver = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
  
      if (!approver) {
        return res.status(404).json({ error: "Approver not found." });
      }
  
      // If the user is an admin, fetch all timesheets and include user names
      if (approver.role === "admin") {
        const timesheets = await prisma.timesheet.findMany({
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
        return res.json(timesheets);
      }
  
      const approvalOrder = ["INCHARGE", "PO", "HR", "PADM", "STAFF"]; // Include STAFF in the approval order
      const approverIndex = approvalOrder.indexOf(approver.role);
  
      if (approverIndex === -1) {
        return res.status(403).json({ error: "Invalid approver role." });
      }
  
      let timesheets;
  
      if (approver.role === "INCHARGE") {
        // INCHARGE sees all timesheets for their subordinates
        timesheets = await prisma.timesheet.findMany({
          where: { user: { reportsTo: approver.name } },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
      } else if (approver.role === "STAFF") {
        // STAFF sees only their own timesheets
        timesheets = await prisma.timesheet.findMany({
          where: { userId: approver.id }, // Filter by the staff member's userId
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
      } else {
        // Other approvers see timesheets approved by the previous role
        const previousRole = approvalOrder[approverIndex - 1];
  
        // Fetch timesheet IDs approved by the previous role
        const approvedTimesheets = await prisma.approval.findMany({
          where: {
            approverRole: previousRole,
            status: "APPROVED",
          },
          select: { timesheetId: true },
        });
  
        const approvedTimesheetIds = approvedTimesheets.map((approval) => approval.timesheetId);
  
        // Fetch timesheets based on approved IDs
        timesheets = await prisma.timesheet.findMany({
          where: { id: { in: approvedTimesheetIds } },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
      }
  
      res.json(timesheets);
    } catch (error) {
      console.error("Error fetching timesheets:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  };
  
  
  
  export const getApprovalFlow = async (req, res) => {
    try {
        const { id: timesheetId } = req.params;
        // Validate the timesheetId
        if (!timesheetId) {
            return res.status(400).json({ error: "Timesheet ID is required." });
        }

        // Fetch the approval flow for the timesheet
        const approvals = await prisma.approval.findMany({
            where: {
                timesheetId: parseInt(timesheetId, 10), // Ensure timesheetId is a valid number
            },
            orderBy: {
                timestamp: "asc", // Order by timestamp to show the approval flow
            },
            include: {
                approver: true, // Include approver details
                timesheet: true, // Include timesheet details
            },
        });

        // Check if approvals exist for the given timesheetId
        if (approvals.length === 0) {
            return res.status(404).json({ error: "No approval flow found for the provided timesheet." });
        }

        // Respond with the approval flow data
        return res.status(200).json(approvals);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "An error occurred while fetching the approval flow." });
    }
};


export const getLeaveApprovalFlow = async (req, res) => {
  try {
      const { id: leaveId } = req.params;
      // Validate the timesheetId
      if (!leaveId) {
          return res.status(400).json({ error: "Leave ID is required." });
      }

      // Fetch the approval flow for the timesheet
      const approvals = await prisma.approval.findMany({
          where: {
              leaveRequestId: parseInt(leaveId, 10), // Ensure timesheetId is a valid number
          },
          orderBy: {
              timestamp: "asc", // Order by timestamp to show the approval flow
          },
          include: {
              approver: true, // Include approver details
              timesheet: true, // Include timesheet details
          },
      });

      // Check if approvals exist for the given timesheetId
      if (approvals.length === 0) {
          return res.status(404).json({ error: "No approval flow found for the provided leave." });
      }

      // Respond with the approval flow data
      return res.status(200).json(approvals);
  } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "An error occurred while fetching the approval flow." });
  }
};
  

export const createLeaveRequest = async (req, res) => {
  try {
      const { userId, startDate, endDate, reason, leaveType } = req.body;

      // Validate request body
      if (!userId || !startDate || !endDate || !reason) {
          return res.status(400).json({ error: "Missing required fields in the request body." });
      }

      // Validate dates
      if (new Date(startDate) > new Date(endDate)) {
          return res.status(400).json({ error: "Start date must be earlier than or equal to end date." });
      }

      // Fetch user details to get their supervisor's name from `reportsTo`
      const user = await prisma.user.findUnique({
          where: { id: userId }
      });

      if (!user) {
          return res.status(404).json({ error: "User not found." });
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
      res.status(201).json({ message: "Leave request created successfully.", leave });
  } catch (error) {
      console.error("Error creating leave request:", error);
      res.status(500).json({ error: "Failed to create leave request." });
  }
};

export const getTimesheets = async (req, res) => {
    try {
        // Fetch all leave requests without any filters
        const timeSheets = await prisma.timesheet.findMany({
            include: { user: true }, // Include user details for context
        });

        res.status(200).json({ message: "Timesheets retrieved successfully.", timeSheets });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to retrieve timesheet requests." });
    }
};

export const getTimesheet = async (req, res) => {
    try {
        // Get the timesheetId from request params
        const { id } = req.params;

        // Fetch the timesheet by the provided id
        const timeSheet = await prisma.timesheet.findUnique({
            where: { id: parseInt(id) }, // Filter by the provided timesheet ID
            include: { user: true }, // Include user details for context
        });

        if (!timeSheet) {
            return res.status(404).json({ error: "Timesheet not found." });
        }

        res.status(200).json({ message: "Timesheet retrieved successfully.", timeSheet });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to retrieve timesheet." });
    }
};

export const getTimesheetEntry= async (req, res) => {
    try {
        const { timesheetId } = req.params;

        // Validate that `timesheetId` exists
        if (!timesheetId) {
            return res.status(400).json({ error: "Timesheet ID is required." });
        }

        // Fetch the timesheet entries based on the timesheet ID
        const timesheetEntries = await prisma.timesheetEntry.findMany({
            where: { timesheetId: parseInt(timesheetId) },
        });

        // If no entries found
        if (timesheetEntries.length === 0) {
            return res.status(404).json({ error: "No timesheet entries found for the given Timesheet ID." });
        }

        res.status(200).json({
            message: "Timesheet entries fetched successfully.",
            timesheetEntries,
        });
    } catch (error) {
        console.error("Error fetching timesheet entries:", error);
        res.status(500).json({ error: "Failed to fetch timesheet entries." });
    }
};


export const approveTimesheet = async (req, res) => {
    const { id: timesheetId } = req.params; // Get timesheet ID from URL parameter
    const { approverId } = req.query; // Get approver ID from query parameters
  
    if (!timesheetId || !approverId) {
      return res.status(400).json({ error: "Missing timesheetId or approverId parameter." });
    }
  
    try {
      // Find the approver details
      const approver = await prisma.user.findUnique({ where: { id: parseInt(approverId) } });
  
      if (!approver) {
        return res.status(404).json({ error: "Approver not found." });
      }
  
      const approvalOrder = ["INCHARGE", "PO", "HR", "PADM"]; // Approval hierarchy
      const approverIndex = approvalOrder.indexOf(approver.role);
  
      if (approverIndex === -1) {
        return res.status(403).json({ error: "Invalid approver role." });
      }
  
      // Fetch the timesheet and its approvals
      const timesheet = await prisma.timesheet.findUnique({
        where: { id: parseInt(timesheetId) },
        include: { approvals: true },
      });
  
      if (!timesheet) {
        return res.status(404).json({ error: "Timesheet not found." });
      }
  
      // Check if the previous approver has approved (if applicable)
      if (approverIndex > 0) {
        const previousRole = approvalOrder[approverIndex - 1];
        const previousApproval = timesheet.approvals.find(
          (approval) => approval.approverRole === previousRole && approval.status === "Approved"
        );
  
        if (!previousApproval) {
          return res.status(403).json({
            error: `Cannot approve. Waiting for approval from ${previousRole}.`,
          });
        }
      }
  
      // Add the approval to the database
      await prisma.approval.create({
        data: {
          timesheetId: parseInt(timesheetId),
          approverId: parseInt(approverId),
          approverRole: approver.role,
          approverName: approver.name,
          signature: approver.title, // Assuming signature is derived from the title or stored in the user model
          status: "Approved",
        },
      });
  
      // Fetch all approvals for the current timesheet
      const approvals = await prisma.approval.findMany({ where: { timesheetId: parseInt(timesheetId) } });
  
      // Construct the approvers data with name, role, and title
      const approversDetails = approvals.map((approval) => ({
        name: approval.approverName,
        role: approval.approverRole,
        title: approval.signature, // Assuming `signature` is a field in the approval model
      }));
  
      // Update the timesheet's approvers details
      await prisma.timesheet.update({
        where: { id: parseInt(timesheetId) },
        data: { approvers: approversDetails },
      });
  
      // Check if all approvals are complete
      const allApproved = approvalOrder.every((role) =>
        approvals.some((approval) => approval.approverRole === role && approval.status === "Approved")
      );
  
      // Update the timesheet status
      const status = allApproved ? "Fully Approved" : `Approved by: ${approver.role}`;
      await prisma.timesheet.update({
        where: { id: parseInt(timesheetId) },
        data: { status },
      });
  
      res.status(200).json({ message: "Timesheet approved successfully." });
    } catch (error) {
      console.error("Error approving timesheet:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  };
  
  export const rejectTimesheet = async (req, res) => {
    const { id: timesheetId } = req.params;
    const { reason } = req.body;
    const { approverId } = req.query;
  
    if (!timesheetId || !reason || !approverId) {
      return res.status(400).json({ error: "Missing timesheetId, reason, or approverId." });
    }
  
    try {
      const approver = await prisma.user.findUnique({ where: { id: parseInt(approverId) } });
  
      if (!approver) {
        return res.status(404).json({ error: "Approver not found." });
      }
  
      const timesheet = await prisma.timesheet.findUnique({
        where: { id: parseInt(timesheetId) },
      });
  
      if (!timesheet) {
        return res.status(404).json({ error: "Timesheet not found." });
      }
  
      await prisma.timesheet.update({
        where: { id: parseInt(timesheetId) },
        data: {
          status: `Rejected by: ${approver.name} for: [${reason}]`, // Embed approver's name and reason
        },
      });
  
      res.status(200).json({ message: "Timesheet rejected successfully." });
    } catch (error) {
      console.error("Error rejecting timesheet:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  };
  


export const getLeaveRequests = async (req, res) => {
    try {
        // Fetch all leave requests without any filters
        const leaveRequests = await prisma.leave.findMany({
            include: { user: true }, // Include user details for context
        });

        res.status(200).json({ message: "Leave requests retrieved successfully.", leaveRequests });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to retrieve leave requests." });
    }
};


export const getLeaveRequests2 = async (req, res) => {
  try {
    const { userId, userRole } = req.query;

    console.log("Received userId:", userId);
    console.log("Received userRole:", userRole);

    if (!userId || !userRole) {
      return res.status(400).json({ error: "User ID and role are required." });
    }

    let leaveRequests = [];

    // Parse userId to integer
    const parsedUserId = parseInt(userId, 10);

    if (isNaN(parsedUserId)) {
      return res.status(400).json({ error: "Invalid User ID." });
    }

    // Fetch the user to get their name
    const user = await prisma.user.findUnique({
      where: { id: parsedUserId }, // Use parsedUserId here
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const userName = user.name; // This is the 'reportsTo' comparison name

    // Fetch all leave requests first
    const allLeaveRequests = await prisma.leave.findMany({
      include: {
        user: true, // Including the related user data with each leave request
      },
    });

    // Now filter the leaves based on the user's role
    if (userRole === "INCHARGE") {
      leaveRequests = allLeaveRequests.filter(
        (leaveRequest) => leaveRequest.user.reportsTo === userName
      );
    } else if (userRole === "PO") {
      const inchargeUsers = await prisma.user.findMany({
        where: { reportsTo: userName, role: "INCHARGE" }, // Find the Incharges that the PO reports to
      });

      const inchargeNames = inchargeUsers.map((user) => user.name); // Use the 'name' of Incharge (reportsTo is a name)

      leaveRequests = allLeaveRequests.filter((leaveRequest) =>
        inchargeNames.includes(leaveRequest.user.reportsTo)
      );
    } else if (userRole === "HR") {
      // Assuming relatedLocations is available
      const relatedLocations = {
        Kisumu: ["Kisumu", "Kakamega", "Vihiga"],
        Nyamira: ["Nyamira", "Kisii", "Migori"],
        Kakamega: ["Kisumu", "Kakamega", "Vihiga"],
        // Add other locations and their related locations here
      };

      const userLocation = user.location;
      const relatedLocation = relatedLocations[userLocation] || [userLocation]; // Default to user's own location if not found in map

      leaveRequests = allLeaveRequests.filter((leaveRequest) =>
        relatedLocation.includes(leaveRequest.user.location)
      );
    } else {
      return res.status(403).json({ error: "Invalid role." });
    }

    res.status(200).json({ message: "Leave requests retrieved successfully.", leaveRequests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve leave requests." });
  }
};



/** 
export const approveLeave = async (req, res) => {
    const { id: leaveId } = req.params; // Get leave ID from URL parameter
    const { approverId } = req.query; // Get approver ID from query parameters

    if (!leaveId || !approverId) {
        return res.status(400).json({ error: "Missing leaveId or approverId parameter." });
    }

    try {
        // Find the approver details
        const approver = await prisma.user.findUnique({ where: { id: parseInt(approverId) } });

        if (!approver) {
            return res.status(404).json({ error: "Approver not found." });
        }

        const approvalOrder = ["INCHARGE", "PO", "HR"]; // Approval hierarchy
        const approverIndex = approvalOrder.indexOf(approver.role);

        if (approverIndex === -1) {
            return res.status(403).json({ error: "Invalid approver role." });
        }

        // Fetch the leave request and its approvals
        const leave = await prisma.leave.findUnique({
            where: { id: parseInt(leaveId) },
            include: { approvals: true },
        });

        if (!leave) {
            return res.status(404).json({ error: "Leave request not found." });
        }

        // Check if the previous approver has approved (if applicable)
        if (approverIndex > 0) {
            const previousRole = approvalOrder[approverIndex - 1];
            const previousApproval = leave.approvals.find(
                (approval) => approval.approverRole === previousRole && approval.status === "Approved"
            );

            if (!previousApproval) {
                return res.status(403).json({
                    error: `Cannot approve. Waiting for approval from ${previousRole}.`,
                });
            }
        }

        // Add the approval to the database
        await prisma.approval.create({
            data: {
                leaveRequestId: parseInt(leaveId),
                approverId: parseInt(approverId),
                approverRole: approver.role,
                approverName: approver.name,
                signature: approver.title, // Assuming signature is derived from the title or stored in the user model
                status: "Approved",
            },
        });

        // Fetch all approvals for the current leave request
        const approvals = await prisma.approval.findMany({ where: { leaveRequestId: parseInt(leaveId) } });

        // Construct the approvers data with name, role, and title
        const approversDetails = approvals.map((approval) => ({
            name: approval.approverName,
            role: approval.approverRole,
            title: approval.signature, // Assuming `signature` is a field in the approval model
        }));

        // Update the leave request's approvers details
        await prisma.leave.update({
            where: { id: parseInt(leaveId) },
            data: { approvers: approversDetails },
        });

        // Check if all approvals are complete
        const allApproved = approvalOrder.every((role) =>
            approvals.some((approval) => approval.approverRole === role && approval.status === "Approved")
        );

        // Update the leave request status
        const status = allApproved ? "Fully Approved" : `Approved by: ${approver.role}`;
        await prisma.leave.update({
            where: { id: parseInt(leaveId) },
            data: { status },
        });

        res.status(200).json({ message: "Leave approved successfully." });
    } catch (error) {
        console.error("Error approving leave request:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};

*/
export const approveLeave = async (req, res) => {
  const { id: leaveId } = req.params;
  const { approverId } = req.query;

  if (!leaveId || !approverId) {
      return res.status(400).json({ error: "Missing leaveId or approverId parameter." });
  }

  try {
      const approver = await prisma.user.findUnique({ where: { id: parseInt(approverId) } });
      if (!approver) {
          return res.status(404).json({ error: "Approver not found." });
      }

      const approvalOrder = ["INCHARGE", "PO", "HR"];
      const approverIndex = approvalOrder.indexOf(approver.role);

      if (approverIndex === -1) {
          return res.status(403).json({ error: "Invalid approver role." });
      }

      const leave = await prisma.leave.findUnique({
          where: { id: parseInt(leaveId) },
          include: { approvals: true, user: true },
      });

      if (!leave) {
          return res.status(404).json({ error: "Leave request not found." });
      }

      const requestingUserName = leave.user.name;

      // Check approval order
      if (approverIndex > 0) {
          const previousRole = approvalOrder[approverIndex - 1];
          const previousApproval = leave.approvals.find(
              (approval) => approval.approverRole === previousRole && approval.status === "Approved"
          );

          if (!previousApproval) {
              return res.status(403).json({
                  error: `Cannot approve. Waiting for approval from ${previousRole}.`,
              });
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

      // Define the related locations map
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
              where: { 
                  role: nextRole, 
                  name: approver.reportsTo  // Find the next person based on reportsTo
              },
          });
      } else if (approver.role === "PO") {
          nextRole = "HR";
          // Get the HR's location and find HR who can approve the leave
          const approverLocation = leave.user.location;
          const validLocations = relatedLocations[approverLocation] || [];
          
          // Find the HR whose location matches one of the valid locations
          nextApprover = await prisma.user.findFirst({
              where: {
                  role: nextRole,
                  location: { in: validLocations }, // Check if HR's location is in the valid locations list
              },
          });
      }

      // Debugging: Log the next approver
      console.log("Next approver:", nextApprover);

      // Notify the next approver if available
      if (nextApprover) {
          await prisma.notification.create({
              data: {
                  recipientId: nextApprover.id,
                  message: `Leave request from ${requestingUserName} (ID: ${leaveId}) is awaiting your approval as ${nextRole}.`,
                  leaveRequestId: parseInt(leaveId),
              },
          });
      } else {
          console.warn("No next approver found.");
      }

      // Notify all involved when fully approved
      if (allApproved) {
          const recipients = [
              ...approvals.map(a => a.approverId),
              leave.user.id // Notify the person who submitted the request
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
      } else {
          // Notify the previous approvers about the current approval
          for (const previousApproval of leave.approvals) {
              await prisma.notification.create({
                  data: {
                      recipientId: previousApproval.approverId,
                      message: `Leave request from ${requestingUserName} (ID: ${leaveId}) has been approved by ${approver.role}.`,
                      leaveRequestId: parseInt(leaveId),
                  },
              });
          }
      }

      res.status(200).json({ message: "Leave approved successfully." });
  } catch (error) {
      console.error("Error approving leave request:", error);
      res.status(500).json({ error: "Internal server error." });
  }
};


export const getLeaveRequestsByRole = async (req, res) => {
  const { userId } = req.params;  // Get the userId from the URL parameter (current user)

  // Validate userId
  if (!userId) {
      return res.status(400).json({ error: "Missing userId parameter." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { 
          id: true, 
          name: true, 
          role: true,   // Directly select the role field
          location: true, 
          reportsTo: true 
      },
  });
  
  console.log(user);  
      if (!user) {
          return res.status(404).json({ error: "User not found." });
      }

      const { role, location, reportsTo, name } = user;

      // Fetch all users
      const allUsers = await prisma.user.findMany();

      // Fetch all leave requests, including user and approval details
      let leaveRequests = await prisma.leave.findMany({
          include: {
              approvals: true,
              user: true,  // Include user details with each leave request
          },
      });


      // Map the leave requests to their associated users
      leaveRequests = leaveRequests.map(leaveRequest => {
          const user = allUsers.find(u => u.id === leaveRequest.userId);
          return { ...leaveRequest, user }; // Attach the user details to each leave request
      });

      // Filter based on role and user attributes
      if (role === "HR") {
        // HR sees leave requests approved by PO and from users in HR's location or related locations
        const relatedLocations = {
            "Kisumu": ["Kisumu", "Kakamega", "Vihiga"],
            "Nyamira": ["Nyamira", "Kisii", "Migori"],
            "Kakamega": ["Kisumu", "Kakamega", "Vihiga"],
            // Add other locations and their related locations here
        };
    
        // Get the list of related locations for the HR's location
        const userLocation = location; // HR's location
        const possibleLocations = relatedLocations[userLocation] || [userLocation]; // Default to HR's location if not in the map
    
        // Filter leave requests
        leaveRequests = leaveRequests.filter(leave => {
            // Check if the leave's status is "Approved by PO"
            const isApprovedByPO = leave.status === "Approved by: PO";
            
            // Check if any of the approvals are from PO
            const isApprovedByPOApproval = leave.approvals.some(approval => approval.approverRole === "PO");
    
            // Check if the leave is from a user in HR's location or related locations
            const isInRelatedLocation = possibleLocations.includes(leave.user.location);
    
            // Only include leave requests that are approved by PO (status and approval check) and are from users in related locations
            return isApprovedByPO && isApprovedByPOApproval && isInRelatedLocation;
        });
    
        console.log(leaveRequests); // Debug filtered leave requests
    }
    

    else if (role === "INCHARGE") {
      // Facility Incharge sees leaves from users who report to them and whose status is 'Pending'
      leaveRequests = leaveRequests.filter(leave => {
        return leave.user.reportsTo === name && leave.status === "Pending";
      });
      console.log(leaveRequests);
    }
    

      else if (role === "PO") {
        // PO sees leave requests approved by Facility Incharges who report to them
        leaveRequests = await Promise.all(
            leaveRequests.map(async leave => {
                // Filter approvals to find relevant INCHARGE approvals
                const relevantInchargeApproval = await Promise.all(
                    leave.approvals.map(async approval => {
                        if (approval.approverRole === "INCHARGE") {
                            // Fetch the Facility Incharge from the Users table
                            const facilityIncharge = await prisma.user.findUnique({
                                where: { name: approval.approverName },
                                select: { reportsTo: true }
                            });
    
                            // Check if the Facility Incharge reports to the current PO
                            if (facilityIncharge?.reportsTo === name) {
                                // Check if the leave status is 'Approved by: INCHARGE'
                                if (leave.status === "Approved by: INCHARGE") {
                                    return leave; // Return the leave request if the INCHARGE reports to PO and status is 'Approved by: INCHARGE'
                                }
                            }
                        }
                        return null;
                    })
                );
    
                // Return the leave request if a relevant incharge approval with the correct status was found
                return relevantInchargeApproval.find(Boolean); // Return the leave request or null
            })
        );
    
        // Remove any null entries from the result array
        leaveRequests = leaveRequests.filter(Boolean);
    
        console.log(leaveRequests); // Debug filtered leave requests
    }
    
    
    
      

    else if (role === "PADM") {
      // First, filter out the leave requests where HR has already marked approval
      leaveRequests = leaveRequests.filter(leave => {
          // Check if there's an HR approval
          const hrApproval = leave.approvals.find(approval => approval.approverRole === "HR" && approval.status === "Approved");
  
          // If HR has approved, we filter by leave status
          return hrApproval && leave.status === "Approved by: HR";
      });
  }
  
      // If no leave requests match the filters
      if (!leaveRequests || leaveRequests.length === 0) {
          return res.status(404).json({ error: "No leave requests found for this role." });
      }

      // Respond with the filtered leave requests
      res.status(200).json(leaveRequests);
  } catch (error) {
      console.error("Error fetching leave requests:", error);
      res.status(500).json({ error: "Internal server error." });
  }
};


export const updateLeaveStatus = async (req, res) => {
    try {
        const { id, action } = req.params;
        // `action` should be "approve" or "deny"

        // Validate inputs
        if (!id) {
            return res.status(400).json({ error: "Leave ID is required." });
        }
        if (!action || !["approve", "denied"].includes(action.toLowerCase())) {
            return res.status(400).json({ error: "Invalid action. Allowed values: 'approve' or 'deny'." });
        }

        // Determine status based on the action
        const status = action.toLowerCase() === "approve" ? "Approved" : "Denied";

        // Update leave status
        const updatedLeave = await prisma.leave.update({
            where: { id: parseInt(id) },
            data: { status },
        });

        res.status(200).json({
            message: `Leave ${action}d successfully.`,
            updatedLeave,
        });
    } catch (error) {
        console.error("Error updating leave status:", error);
        res.status(500).json({ error: "Failed to update leave status." });
    }
};

export const denyLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { approverId } = req.query; // Get approver ID from query parameters

    // Validate that `id` and `approverId` exist
    if (!id || !approverId) {
      return res.status(400).json({ error: "Leave ID and approverId are required." });
    }

    // Find the approver details
    const approver = await prisma.user.findUnique({ where: { id: parseInt(approverId) } });
    if (!approver) {
      return res.status(404).json({ error: "Approver not found." });
    }

    const approvalOrder = ["INCHARGE", "PO", "HR", "PADM"]; // Approval hierarchy
    const approverIndex = approvalOrder.indexOf(approver.role);

    if (approverIndex === -1) {
      return res.status(403).json({ error: "Invalid approver role." });
    }

    // Fetch the leave request and its approvals
    const leaveRequest = await prisma.leave.findUnique({
      where: { id: parseInt(id) },
      include: { approvals: true },
    });

    if (!leaveRequest) {
      return res.status(404).json({ error: "Leave request not found." });
    }

    // Check if the previous approver has approved (if applicable)
    if (approverIndex > 0) {
      const previousRole = approvalOrder[approverIndex - 1];
      const previousApproval = leaveRequest.approvals.find(
        (approval) => approval.approverRole === previousRole && approval.status === "Approved"
      );

      if (!previousApproval) {
        return res.status(403).json({
          error: `Cannot deny. Waiting for approval from ${previousRole}.`,
        });
      }
    }

    // Log the denial in the approvals table
    await prisma.approval.create({
      data: {
        leaveRequestId: parseInt(id),
        approverId: parseInt(approverId),
        approverRole: approver.role,
        approverName: approver.name,
        signature: approver.title, // Assuming signature is derived from title or stored in the user model
        status: "Denied",
      },
    });

    // Fetch all approvals for the current leave request
    const approvals = await prisma.approval.findMany({ where: { leaveRequestId: parseInt(id) } });

    // Construct the approvers data with name, role, and title
    const approversDetails = approvals.map((approval) => ({
      name: approval.approverName,
      role: approval.approverRole,
      title: approval.signature,
      action: approval.status,
    }));

    // Update the leave request's approvers details
    await prisma.leave.update({
      where: { id: parseInt(id) },
      data: {
        approvers: approversDetails,
        status: "Denied",
      },
    });

    // Notify all involved parties (requester and prior approvers)
    const involvedApprovers = approvals.filter(approval => approval.status !== "Denied");
    
    // Notify the previous approvers about the denial
    for (const approval of involvedApprovers) {
      await prisma.notification.create({
        data: {
          recipientId: approval.approverId,
          message: `Leave request from ${leaveRequest.user.name} (ID: ${id}) has been denied by ${approver.role}.`,
          leaveRequestId: parseInt(id),
        },
      });
    }

    // Optional: Notify the user who requested the leave about the denial
    await prisma.notification.create({
      data: {
        recipientId: leaveRequest.user.id,
        message: `Your leave request (ID: ${id}) has been denied by ${approver.role}.`,
        leaveRequestId: parseInt(id),
      },
    });

    res.status(200).json({
      message: "Leave denied successfully.",
      approvers: approversDetails,
    });
  } catch (error) {
    console.error("Error denying leave request:", error);
    res.status(500).json({ error: "Failed to deny leave request." });
  }
};




export const getUserLeaves = async (req, res) => {
    try {
      const { userId } = req.params;
  
      // Validate the input
      if (!userId) {
        return res.status(400).json({ error: "User ID is required." });
      }
  
      // Fetch the leave requests for the specified user
      const leaves = await prisma.leave.findMany({
        where: {
          userId: parseInt(userId, 10), // Convert userId to an integer
        },
        include: {
          user: true, // Optionally include user details
        },
      });
  
      return res.status(200).json(leaves);
    } catch (error) {
      console.error("Error fetching user leaves:", error);
      return res.status(500).json({ error: "An error occurred while fetching leave requests." });
    }
  };
