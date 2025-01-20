// pages/api/users/route.js

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { middleware } from './../../middleware'; // Adjust path if needed

const prisma = new PrismaClient();

const generateDefaultPassword = () => {
    return 'password123'; // Modify as needed, can also generate randomly
};
// GET /api/users (Fetch all users)
// GET /api/users?id=<id> (Fetch a user by ID)
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (id) {
            // Fetch user by ID
            const user = await prisma.user.findUnique({
                where: { id: Number(id) },
            })

            if (user) {
                return NextResponse.json(user)
            } else {
                return NextResponse.json({ error: 'User not found' }, { status: 404 })
            }
        } else {
            // Fetch all users
            const users = await prisma.user.findMany()
            return NextResponse.json(users)
        }
    } catch (error) {
        console.error('Error fetching user(s):', error)
        return NextResponse.json({ error: 'Error fetching user(s)' }, { status: 500 })
    }
}

// POST handler function
export async function POST(req) {
    try {
        // Apply adminMiddleware to check if the user is an admin
        const { error, status, user } = await middleware(req);
        if (error) {
            return NextResponse.json({ error }, { status }); // Return the error response if no admin or unauthorized
        }

        // Extract user data from request body
        const { name, email, password, role, department, address, hireDate, endDate, reportsTo, manager, weight, height, leaveDays, phone, facility, pay, title, location } = await req.json();

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
                passwordResetToken: null, // Set password reset fields to null
                passwordResetTokenExpiry: null,
                pay,
                title,
            },
        });

        // Send the default password back to the admin
        return NextResponse.json({
            message: "User created successfully",
            newUser,
            defaultPassword: finalPassword, // Send default password
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: error.message || 'Error creating user' }, { status: 500 });
    }
}
