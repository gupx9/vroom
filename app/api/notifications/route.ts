import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { verifySession } from '@/lib/auth';
import prisma from '@/lib/prisma';

function isNotificationTableMissing(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === 'P2021' || error.code === 'P2022';
  }

  return false;
}

export async function GET() {
  try {
    const session = await verifySession();

    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.userId,
        readAt: null,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        auctionId: true,
        kind: true,
        title: true,
        body: true,
        createdAt: true,
      },
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.userId,
        readAt: null,
      },
    });

    return NextResponse.json(
      {
        notifications,
        unreadCount,
      },
      { status: 200 },
    );
  } catch (error) {
    if (isNotificationTableMissing(error)) {
      return NextResponse.json(
        {
          notifications: [],
          unreadCount: 0,
        },
        { status: 200 },
      );
    }

    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifySession();

    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = (await request.json()) as {
      notificationIds?: string[];
      markAll?: boolean;
    };

    if (body.markAll || !body.notificationIds || body.notificationIds.length === 0) {
      await prisma.notification.updateMany({
        where: {
          userId: session.userId,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });
    } else {
      await prisma.notification.updateMany({
        where: {
          userId: session.userId,
          id: { in: body.notificationIds },
        },
        data: {
          readAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (isNotificationTableMissing(error)) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}