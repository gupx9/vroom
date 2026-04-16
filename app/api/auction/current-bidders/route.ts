import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const prismaAny = prisma as any;
    const { searchParams } = new URL(request.url);
    const carId = searchParams.get('carId')?.trim();

    if (!carId) {
      return NextResponse.json({ error: 'carId query parameter is required' }, { status: 400 });
    }

    const auctionItem = await prismaAny.auctionItem.findUnique({
      where: { carId },
      select: {
        id: true,
        carId: true,
        ownerId: true,
        bids: {
          orderBy: { updatedAt: 'desc' },
          select: {
            bidderId: true,
            bidAmount: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!auctionItem) {
      return NextResponse.json(
        {
          auctionItem: null,
          bidders: [],
          highestBid: 0,
        },
        { status: 200 }
      );
    }

    const highestBid =
      auctionItem.bids.length > 0
        ? Math.max(...auctionItem.bids.map((bid: { bidAmount: number }) => bid.bidAmount))
        : 0;

    return NextResponse.json(
      {
        auctionItem: {
          id: auctionItem.id,
          carId: auctionItem.carId,
          ownerId: auctionItem.ownerId,
        },
        bidders: auctionItem.bids,
        highestBid,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: 'Failed to fetch current bidders' }, { status: 500 });
  }
}
