import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await verifySession();

    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const auctions = await prisma.auction.findMany({
      where: { finalized: false },
      orderBy: { endsAt: 'asc' },
      select: {
        id: true,
        endsAt: true,
      },
    });

    return NextResponse.json(
      {
        auctions: auctions.map((auction) => ({
          id: auction.id,
          endsAt: auction.endsAt.toISOString(),
        })),
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: 'Failed to load auction timers' }, { status: 500 });
  }
}