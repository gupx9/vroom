import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const [cars, dioramas] = await Promise.all([
      prisma.car.findMany({
        where: { userId: session.userId, forSale: false },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          imageData: true,
          brand: true,
          carModel: true,
          condition: true,
          sellingPrice: true,
        },
      }),
      prisma.diorama.findMany({
        where: { userId: session.userId, forSale: false },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          imageData: true,
          description: true,
          sellingPrice: true,
        },
      }),
    ]);

    return NextResponse.json({ cars, dioramas }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch unlisted items' }, { status: 500 });
  }
}
