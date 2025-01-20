import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config()

const prisma = new PrismaClient();

// Middleware to authenticate user and check if they are admin
export const adminMiddleware = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        console.log('No token provided');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // Ensure the secret key is available
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });

        if (!user || user.role !== 'admin') {
            console.log('User not found or not an admin');
            return res.status(403).json({ error: 'Forbidden: Admins only' });
        }

        req.user = user; // Add user to request object
        next(); // Continue to the next middleware or route handler
    } catch (error) {
        console.error('Error verifying token:', error); // Log any errors
        return res.status(401).json({ error: 'Unauthorized' });
    }
};

// Secret key for verifying JWTs
// Replace with your own secret key

export const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1]; // Extract token from the Authorization header

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }

        req.user = user; // Store user info in the request object
        next(); // Proceed to the next middleware or route handler
    });
};

//Authenticate token


export const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    console.log("Received Token:", token);
    
    if (!token) {
        console.log("No token found");
        return res.sendStatus(401); // Unauthorized
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log("JWT verification error:", err);
            return res.sendStatus(403); // Forbidden
        }
    
        req.user = user;
        next();
    });
};
