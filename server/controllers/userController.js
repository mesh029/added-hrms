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
          return res.status(400).json({ error: "Timesheet ID is required." });
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

        res.status(201).json({ message: "Leave request created successfully.", leave });
    } catch (error) {
        console.error(error);
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

        const approvalOrder = ["INCHARGE", "PO", "HR", "PADM"]; // Approval hierarchy
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
          // HR sees leave requests approved by PO and submitted by users in HR's location
          leaveRequests = leaveRequests.filter(leave => {
              const isApprovedByPO = leave.approvals.some(approval => approval.approverRole === "PO");
              const isInHRLocation = leave.user.location === location;
              return isApprovedByPO && isInHRLocation;
          });
      }

      else if (role === "INCHARGE") {
          // Facility Incharge sees leaves from users who report to them
          leaveRequests = leaveRequests.filter(leave => {
              return leave.user.reportsTo === name 
          });
          console.log(leaveRequests)

      }
      else if (role === "PO") {
        // PO sees leave requests from users who report to them and have been approved by a Facility Incharge who reports to them
        leaveRequests = leaveRequests.filter(leave => {
            // Check if the leave has been approved by any Facility Incharge
            const isApprovedByFacilityIncharge = leave.approvals.some(approval => {
                // Check if the approver is a Facility Incharge
                if (approval.approverRole === "INCHARGE") {
                    // Fetch the Facility Incharge (from the approval) and check if they report to the PO
                    return leave.user.reportsTo === approval.approverName; // Check if the Facility Incharge reports to PO
                }
                return false;
            });
    
            // Check if the leave request user reports to the PO
            const isFromUserReportingToPO = leave.user.reportsTo === name;
    
            // Return the leave request if both conditions are met
            return isApprovedByFacilityIncharge && isFromUserReportingToPO;
        });
    
        console.log(leaveRequests); // Log filtered leave requests
    }
    
    
      

      else if (role === "PADM") {
          // PADM sees leave requests approved by HR
          leaveRequests = leaveRequests.filter(leave => {
              const isApprovedByHR = leave.approvals.some(approval => approval.approverRole === "HR");
              return isApprovedByHR;
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
