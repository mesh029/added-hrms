import express from 'express';
import {
    getAllUsers,
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    submitTimesheet,
    getTimesheetsByUser,
} from '../controllers/userController.js';
import authMiddleware from '../middlewares/authMiddleWare.js';

const router = express.Router();

// Define routes
router.get('/', getAllUsers); // Anyone can access this route
router.post('/', createUser); // Only admin can create a user
router.get('/:id', getUserById); // Anyone can access this route
router.put('/:id', authMiddleware, updateUser); // Only admin can update a user
router.delete('/:id', authMiddleware, deleteUser); // Only admin can delete a user
// Submit timesheet
router.post('/timesheets', submitTimesheet);

// Get timesheets for a user
router.get('/timesheets/:userId', getTimesheetsByUser);


export default router;
