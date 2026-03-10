import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const prismaAny = prisma as any;

    const cars = await prismaAny.car.findMany({
      where: { forAuction: true },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        imageData: true,
        brand: true,
        carModel: true,
        size: true,
        condition: true,
        userId: true,
        user: { select: { username: true } },
        auctionItem: {
          select: {
            id: true,
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
        },
      },
    });

    const carsWithHighestBid = (cars as Array<any>).map((car) => ({
      ...car,
      highestBid:
        car.auctionItem && car.auctionItem.bids.length > 0
          ? Math.max(...car.auctionItem.bids.map((bid: { bidAmount: number }) => bid.bidAmount))
          : 0,
    }));

    return NextResponse.json({ cars: carsWithHighestBid }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch auction listings' }, { status: 500 });
  }
}
