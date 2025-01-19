import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
