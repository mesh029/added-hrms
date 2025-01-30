import * as XLSX from "xlsx"; // For exporting to Excel
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { PrismaClient } from '@prisma/client';
import { middleware }  from "./../../../middleware"; // Your admin middleware for authentication/authorization
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();


const generateDefaultPassword = () => {
  return 'password123'; // Modify as needed, can also generate randomly
};
export async function POST(req) {
    try {
        // Apply middleware to verify admin permissions
        const { error, status } = await middleware(req);
        if (error) {
            return NextResponse.json({ error }, { status }); // Return error if unauthorized
        }

        // Parse the uploaded file
        const formData = await req.formData();
        const file = formData.get("file");

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Read the file as a Buffer
        const buffer = Buffer.from(await file.arrayBuffer());
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]]; // Read the first sheet
        const data = XLSX.utils.sheet_to_json(sheet);

        // Map data to user schema and validate fields
        const users = data.map((row) => ({
            name: row["Name"],
            email: row["Email"],
            role: row["Role"],
            department: row["Department"],
            address: row["Address"],
            hireDate: row["Hire Date"] ? new Date(row["Hire Date"]) : null,
            endDate: row["End Date"] ? new Date(row["End Date"]) : null,
            reportsTo: row["Reports To"],
            manager: row["Manager"],
            weight: row["Weight"],
            height: row["Height"],
            leaveDays: row["Leave Days"],
            phone: row["Phone"] ? row["Phone"].toString().replace(/\D/g, '') : null, // Keep phone as a string            pay: row["Pay"],
            title: row["Title"],
            location: row["Location"],
        }));

        // Process each user: hash passwords and insert into DB
        const createdUsers = [];
        for (const user of users) {
            const defaultPassword = generateDefaultPassword();
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);

            const newUser = await prisma.user.create({
                data: {
                    ...user,
                    password: hashedPassword,
                    passwordResetToken: null,
                    passwordResetTokenExpiry: null,
                },
            });

            createdUsers.push({ ...newUser, defaultPassword }); // Add to the list of created users
        }

        return NextResponse.json({
            message: "Bulk upload successful",
            createdUsers,
        }, { status: 201 });
    } catch (error) {
        console.error("Error processing bulk upload:", error);
        return NextResponse.json({ error: error.message || "Error processing upload" }, { status: 500 });
    }
}
