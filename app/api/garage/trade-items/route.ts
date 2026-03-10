import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { NextResponse } from 'next/server';

// GET /api/garage/trade-items
// Returns the current user's cars and dioramas that are marked forTrade.
export async function GET() {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const [cars, dioramas] = await Promise.all([
      prisma.car.findMany({
        where: { userId: session.userId, forTrade: true },
        select: {
          id: true,
          brand: true,
          carModel: true,
          size: true,
          condition: true,
          imageData: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.diorama.findMany({
        where: { userId: session.userId, forTrade: true },
        select: {
          id: true,
          description: true,
          imageData: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({ success: true, cars, dioramas }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch trade items' }, { status: 500 });
  }
}
