// middleware.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

export async function middleware(req) {
    // Extract token from the request header
    const token = req.headers.get('Authorization')?.split(' ')[1];

    if (!token) {
        return new NextResponse('Unauthorized: No token provided', { status: 401 });
    }

    try {
        // Verify the token using the secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch the user based on the decoded JWT
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
        });

        if (!user || user.role !== 'admin') {
            // If no user found or the user is not an admin
            return new NextResponse('Forbidden: Admins only', { status: 403 });
        }

        // Attach user data to the request for later use
        req.user = user;

        return NextResponse.next(); // Proceed to the next step
    } catch (error) {
        // Handle JWT verification errors
        return new NextResponse('Unauthorized: Invalid token', { status: 401 });
    }
}

export const config = {
    matcher: ['/api/*'], // Apply to API routes only
};
