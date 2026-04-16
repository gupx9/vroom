import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

interface PlaceBidRequestBody {
  carId?: string;
  bidAmount?: number;
}

export async function POST(request: Request) {
  try {
    const prismaAny = prisma as any;
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = (await request.json()) as PlaceBidRequestBody;
    const carId = body.carId?.trim();
    const bidAmount = Number(body.bidAmount);

    if (!carId) {
      return NextResponse.json({ error: 'carId is required' }, { status: 400 });
    }

    if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
      return NextResponse.json({ error: 'Bid amount must be greater than 0' }, { status: 400 });
    }

    const car = await prisma.car.findFirst({
      where: { id: carId, forAuction: true },
      select: { id: true, userId: true },
    });

    if (!car) {
      return NextResponse.json({ error: 'Car not found or not up for auction' }, { status: 404 });
    }

    if (car.userId === session.userId) {
      return NextResponse.json({ error: 'You cannot bid on your own car' }, { status: 400 });
    }

    const auctionItem = await prismaAny.auctionItem.upsert({
      where: { carId },
      create: {
        carId,
        ownerId: car.userId,
      },
      update: {
        ownerId: car.userId,
      },
      select: { id: true },
    });

    const bid = await prismaAny.auctionBid.upsert({
      where: {
        auctionItemId_bidderId: {
          auctionItemId: auctionItem.id,
          bidderId: session.userId,
        },
      },
      create: {
        auctionItemId: auctionItem.id,
        bidderId: session.userId,
        bidAmount,
      },
      update: {
        bidAmount,
      },
      select: {
        id: true,
        auctionItemId: true,
        bidderId: true,
        bidAmount: true,
        updatedAt: true,
      },
    });

    const highestBidResult = await prismaAny.auctionBid.aggregate({
      where: { auctionItemId: auctionItem.id },
      _max: { bidAmount: true },
    });

    revalidatePath('/auctions');

    return NextResponse.json(
      {
        success: true,
        bid,
        highestBid: highestBidResult._max.bidAmount ?? bid.bidAmount,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: 'Failed to place bid' }, { status: 500 });
  }
}
