import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req, context) {
  const { userId } = context.params;

  try {
    const notifications = await prisma.notification.findMany({
      where: { recipientId: Number(userId) },
      orderBy: { createdAt: 'desc' }, // Show the latest notifications first
    });

    if (notifications.length > 0) {
      return NextResponse.json(notifications);
    } else {
      return NextResponse.json({ error: 'No notifications found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Error fetching notifications' }, { status: 500 });
  }
}
