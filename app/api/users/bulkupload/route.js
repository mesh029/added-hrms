import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { PrismaClient } from '@prisma/client';
import { middleware } from "./../../../middleware";
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const generateDefaultPassword = () => {
  return 'password123'; // Consider using crypto.randomBytes(16).toString('hex') for random passwords
};

export async function POST(req) {
  try {
    // Apply middleware to verify admin permissions
    const { error, status } = await middleware(req);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    // Parse the incoming JSON data
    const { users: incomingUsers } = await req.json();

    if (!Array.isArray(incomingUsers)) {
      return NextResponse.json(
        { error: "Invalid data format. Expected array of users" },
        { status: 400 }
      );
    }

    // Validate required fields and transform data
    const validatedUsers = incomingUsers.map((user, index) => {
      if (!user.name || !user.email || !user.role) {
        throw new Error(`User at index ${index} is missing required fields`);
      }

      if (!/\S+@\S+\.\S+/.test(user.email)) {
        throw new Error(`Invalid email format for user at index ${index}`);
      }

      return {
        name: user.name,
        email: user.email.toLowerCase(),
        role: user.role,
        department: user.department || null,
        address: user.address || null,
        hireDate: user.hireDate ? new Date(user.hireDate) : new Date(),
        endDate: user.endDate ? new Date(user.endDate) : null,
        reportsTo: user.reportsTo || null,
        manager: user.manager || null,
        phone: user.phone ? user.phone.toString().replace(/\D/g, '') : null,
        title: user.title || null,
        location: user.location || null,
        leaveDays: user.leaveDays ? parseInt(user.leaveDays, 10) : null,
      };
    });

    // Check for duplicate emails in the batch
    const emails = new Set();
    for (const user of validatedUsers) {
      if (emails.has(user.email)) {
        throw new Error(`Duplicate email found: ${user.email}`);
      }
      emails.add(user.email);
    }

    // Check for existing emails in database
    const existingUsers = await prisma.user.findMany({
      where: {
        email: { in: Array.from(emails) }
      }
    });

    if (existingUsers.length > 0) {
      const existingEmails = existingUsers.map(u => u.email);
      return NextResponse.json(
        { error: "Users already exist", emails: existingEmails },
        { status: 409 }
      );
    }

    // Process users in transaction
    const createdUsers = [];
    const defaultPassword = generateDefaultPassword();
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    await prisma.$transaction(async (tx) => {
      for (const user of validatedUsers) {
        const newUser = await tx.user.create({
          data: {
            ...user,
            password: hashedPassword,
            passwordResetToken: null,
            passwordResetTokenExpiry: null,
          }
        });
        createdUsers.push({ ...newUser, defaultPassword });
      }
    });

    return NextResponse.json(
      {
        message: "Bulk upload successful",
        createdCount: createdUsers.length,
        createdUsers
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error processing bulk upload:", error);
    return NextResponse.json(
      { error: error.message || "Error processing upload" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}