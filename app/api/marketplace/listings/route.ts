import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [cars, dioramas] = await Promise.all([
      prisma.car.findMany({
        where: { forSale: true },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          imageData: true,
          brand: true,
          carModel: true,
          size: true,
          condition: true,
          sellingPrice: true,
          userId: true,
          user: { select: { username: true } },
        },
      }),
      prisma.diorama.findMany({
        where: { forSale: true },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          imageData: true,
          description: true,
          sellingPrice: true,
          userId: true,
          user: { select: { username: true } },
        },
      }),
    ]);

    return NextResponse.json({ cars, dioramas }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch marketplace listings' }, { status: 500 });
  }
}
