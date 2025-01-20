import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { middleware } from './../../../middleware'; // Adjust path if needed

const prisma = new PrismaClient();

export async function PUT(req, context) {
    try {
        // Apply adminMiddleware to check if the user is an admin
        const { error, status, user } = await middleware(req);
        if (error) {
            return NextResponse.json({ error }, { status }); // Return error response if unauthorized
        }

        // Get leaveId from the URL path (params)
        const { params } = context;
        const { id } = params;

        // Extract the user data from the request body
        const { name, email, role, department, hireDate, location, endDate, leaveDays, phone } = await req.json();

        // Validate that required fields are provided
        if (!id || !name || !email || !role) {
            return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
        }

        // Update the user in the database
        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: { name, email, role, department, hireDate, location, endDate, leaveDays, phone },
        });

        // Return the updated user as a response
        return NextResponse.json(updatedUser, { status: 200 });
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}

export async function GET(req, context) {
    const { id } = context.params; // Get `id` from the URL path

    if (!id) {
        return NextResponse.json({ error: "Missing user ID." }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found." }, { status: 404 });
        }

        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        console.error("Error retrieving user:", error);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}

export async function DELETE(req, context) {
    const { params } = await context;  // Await params here\
    const { id } = params;
    if (!id) {
        return NextResponse.json({ error: "Missing user ID." }, { status: 400 });
    }

    try {
        // Attempt to delete the user
        await prisma.user.delete({
            where: { id: parseInt(id) },
        });

        // Send a 204 No Content response if successful
        return NextResponse.json({}, { status: 204 });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ error: "Error deleting user" }, { status: 500 });
    }
}

