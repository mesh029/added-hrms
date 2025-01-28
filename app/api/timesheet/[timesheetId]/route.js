import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET(req, context) {

    const {params} = await context;
    const {timesheetId} = params


    if (!timesheetId) {
        return NextResponse.json({ error: "Timesheet not found." }, { status: 400 });
    }

    try {
        
        const timesheet = await prisma.timesheet.findUnique({
            where: { id: parseInt(timesheetId) }, // Filter by the provided timesheet ID
            include: { user: true }, // Include user details for context
        });

        if (!timesheet) {
            return NextResponse.json({ error: "Timesheet not found." }, { status: 404 });
        }

        return NextResponse.json(timesheet, { status: 200 });

    } catch (error) {
        console.error("Error fetching timesheets:", error);
        return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }
}
