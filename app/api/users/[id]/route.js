import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { middleware } from './../../../middleware'; // Adjust path if needed

const prisma = new PrismaClient();

export async function PUT(req, context) {
    try {
        // Await params to ensure they are resolved
        const { id } = await context.params;

        // Validate that the id is present
        if (!id) {
            return NextResponse.json({ error: "Missing user ID." }, { status: 400 });
        }

        // Extract data from the request body
        const { name, email, role, department, hireDate, location, endDate, leaveDays, phone, address } = await req.json();

        // Validate required fields
        if (!name || !email || !role) {
            return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
        }

        // Update the user in the database
        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: { name, email, role, department, hireDate, location, endDate, leaveDays, phone, address },
        });

        // Return the updated user as a response
        return NextResponse.json(updatedUser, { status: 200 });
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}




export async function GET(req, context) {
    const { id } = await context.params;

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
    const { id } = await context.params;
    if (!id) {
        return NextResponse.json({ error: "Missing user ID." }, { status: 400 });
    }

    try {
        // Attempt to delete the user
        await prisma.user.delete({
            where: { id: parseInt(id) },
        });

        // Return a 200 OK response with a success message
        return NextResponse.json({ message: "User deleted successfully." }, { status: 200 });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ error: "Error deleting user" }, { status: 500 });
    }
}
