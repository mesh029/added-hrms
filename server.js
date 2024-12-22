import express from 'express';
import { adminMiddleware, authenticateJWT, authenticateToken } from './server/middlewares/authMiddleWare.js';
import { createUser, getUsers, getUserById, updateUser, deleteUser, login, submitTimesheet,getTimesheetsByUser, createLeaveRequest, getLeaveRequests, getUserLeaves, approveLeave, denyLeave, updateLeaveStatus, getTimesheets, getTimesheetEntry, getTimesheet, approveTimesheet, getTimesheetForApprovers, getApprovalFlow } from './server/controllers/userController.js';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import cors from 'cors';
const app = express();
const PORT = process.env.PORT || 3030;
const prisma = new PrismaClient();


app.use(cors({ origin: 'http://localhost:3000' }));

// Middleware to parse JSON request bodies
app.use(express.json());
// Route to log in and get a JWT token
app.post('/login', login);

// Middleware to authenticate JWT
//app.use(authenticateJWT); 
// Routes
app.post('/api/users', adminMiddleware, createUser); // Ensure only admin can create users
app.get('/api/users', getUsers);
app.get('/api/users/:id', getUserById);
app.put('/api/users/:id', updateUser);
app.delete('/api/users/:id', deleteUser);


app.post('/api/timesheets', submitTimesheet);
app.post('/api/timesheets/:id/approve', approveTimesheet);

app.patch('/api/leaves/:id/approve', approveLeave);
app.patch('/api/leaves/:id/deny', denyLeave);

app.post('/api/leaves', createLeaveRequest);
app.patch('/api/leaves/:id/:action', updateLeaveStatus);


// Get timesheets for a user
app.get('/api/timesheets', getTimesheets);
app.get('/api/timesheets/approve', getTimesheetForApprovers);


app.get('/api/timesheets/:timesheetId', getTimesheetEntry);
app.get('/api/timesheet/:id', getTimesheet);
app.get('/api/timesheet/:id/approval-flow', getApprovalFlow);





// Get leaves for a user
app.get('/api/leaves/:userId', getUserLeaves);
app.get('/api/leaves', getLeaveRequests);




app.get('/api/user/me', authenticateToken,
(req, res) => {
    // req.user will have the user information after token verification
    try {
        res.json(req.user);

    } catch (error) {
        console.log(error)
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
