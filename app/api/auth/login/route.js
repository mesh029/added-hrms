import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Initialize Prisma client
const prisma = new PrismaClient();

// Ensure environment variables are available
const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
    try {
        // Parse request body
        const { email, password } = await req.json();

        // Find the user by email
        const user = await prisma.user.findUnique({
            where: { email },
        });

        // If user not found or password does not match
        if (!user) {
            console.error(`Login attempt with unknown email: ${email}`);
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            console.error(`Invalid password attempt for user: ${email}`);
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Create a JWT token
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
            expiresIn: '1h', // Token expiration time
        });

        // Return token to client
        return NextResponse.json({ token }, { status: 200 });

    } catch (error) {
        // Log the error details for internal debugging
        console.error("Error logging in:", error);

        // Return a generic message for the frontend
        return NextResponse.json({ error: 'Server error. Please try again later.' }, { status: 500 });
    }
}
