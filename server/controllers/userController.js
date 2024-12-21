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
            if (!entry.type || !['Regular', 'Holiday', 'Other'].includes(entry.type)) {
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
    const { userId } = req.body;

    const approver = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
  
    let timesheets;
    if (approver.role === 'INCHARGE') {
      timesheets = await prisma.timesheet.findMany({
        where: { user: { reportsTo: approver.name } },
        include: { approvals: true },
      });
    } else {
      timesheets = await prisma.timesheet.findMany({
        where: { user: { location: approver.location } },
        include: { approvals: true },
      });
    }
  
    res.json(timesheets);
};


export const createLeaveRequest = async (req, res) => {
    try {
        const { userId, startDate, endDate, reason } = req.body;

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


// Approve timesheet logic
export const approveTimesheet = async (req, res) => {
    try {
      const { id } = req.params; // Get the timesheet ID from the request parameters
      const { role } = req.query; // Get the approver's role from the query params
      const { approverName, approverTitle } = req.body; // Get the approver's name and title from the request body
  
      // Validate that `id`, `role`, `approverName`, and `approverTitle` are provided
      if (!id || !role || !approverName || !approverTitle) {
        return res.status(400).json({ error: "All fields (id, role, approverName, approverTitle) are required." });
      }
  
      // Fetch the current timesheet from the database
      const timesheet = await prisma.timesheet.findUnique({
        where: { id: parseInt(id) },
      });
  
      if (!timesheet) {
        return res.status(404).json({ error: "Timesheet not found." });
      }
  
      // Ensure approvers array exists and add the new approver
      const updatedApprovers = [
        ...(timesheet.approvers || []), // Initialize as empty array if approvers is null
        { name: approverName, title: approverTitle }
      ];
  
      // Determine the status based on the role
      let updatedStatus;
      switch (role) {
        case 'incharge':
          updatedStatus = "Approved(FI)";
          break;
        case 'hr':
          updatedStatus = "Approved(HR)";
          break;
        case 'po':
          updatedStatus = "Approved(PO)";
          break;
        case 'padm':
          updatedStatus = "Approved(PADM)";
          break;
        default:
          updatedStatus = "Ready"; // Default status
          break;
      }
  
      // Update the timesheet with the new approvers and status
      const updatedTimesheet = await prisma.timesheet.update({
        where: { id: parseInt(id) },
        data: {
          status: updatedStatus,
          approvers: updatedApprovers, // Updated approvers list
        },
      });
  
      // Respond with the updated timesheet and success message
      res.status(200).json({
        message: `Timesheet approved by ${approverName} (${approverTitle}).`,
        updatedTimesheet,
      });
    } catch (error) {
      console.error("Error approving timesheet:", error);
      res.status(500).json({ error: "Failed to approve timesheet." });
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
    try {
        const { id } = req.params;

        // Validate that `id` exists
        if (!id) {
            return res.status(400).json({ error: "Leave ID is required." });
        }

        // Update leave status to "Approved"
        const updatedLeave = await prisma.leave.update({
            where: { id: parseInt(id) },
            data: { status: "Approved" },
        });

        res.status(200).json({
            message: "Leave approved successfully.",
            updatedLeave,
        });
    } catch (error) {
        console.error("Error approving leave request:", error);
        res.status(500).json({ error: "Failed to approve leave request." });
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

        // Validate that `id` exists
        if (!id) {
            return res.status(400).json({ error: "Leave ID is required." });
        }

        // Update leave status to "Denied"
        const updatedLeave = await prisma.leave.update({
            where: { id: parseInt(id) },
            data: { status: "Denied" },
        });

        res.status(200).json({
            message: "Leave denied successfully.",
            updatedLeave,
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
