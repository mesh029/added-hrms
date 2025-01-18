import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/users/:id
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { id: Number(id) },
        })

        if (user) {
            return NextResponse.json(user)
        } else {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
    } catch (error) {
        console.error('Error fetching user:', error)
        return NextResponse.json({ error: 'Error fetching user' }, { status: 500 })
    }
}
