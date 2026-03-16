'use server';

import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuctionListItem = {
  id: string;
  carId: string;
  startingBid: number;
  endsAt: string;
  car: {
    imageData: string;
    brand: string;
    carModel: string;
    size: string;
    condition: string;
    description: string | null;
  };
  seller: { username: string };
  topBid: number;
  bidCount: number;
};

export type AuctionDetail = {
  id: string;
  carId: string;
  startingBid: number;
  endsAt: string;
  finalized: boolean;
  sellerId: string;
  winnerId: string | null;
  car: {
    id: string;
    imageData: string;
    brand: string;
    carModel: string;
    size: string;
    condition: string;
    description: string | null;
    price: number;
  };
  seller: { username: string };
  winner: { username: string } | null;
  bids: Array<{
    id: string;
    bidderId: string;
    amount: number;
    bidder: { username: string };
  }>;
  myBid: number | null;
};

// ─── Get all active (non-finalized, not expired) auctions ────────────────────

export async function getActiveAuctions(): Promise<{ auctions: AuctionListItem[] }> {
  const now = new Date();
  const auctions = await prisma.auction.findMany({
    where: { finalized: false, endsAt: { gt: now } },
    orderBy: { endsAt: 'asc' },
    select: {
      id: true,
      carId: true,
      startingBid: true,
      endsAt: true,
      seller: { select: { username: true } },
      car: {
        select: {
          imageData: true,
          brand: true,
          carModel: true,
          size: true,
          condition: true,
          description: true,
        },
      },
      bids: {
        select: { amount: true },
        orderBy: { amount: 'desc' as const },
      },
    },
  });

  return {
    auctions: auctions.map((a) => ({
      id: a.id,
      carId: a.carId,
      startingBid: a.startingBid,
      endsAt: a.endsAt.toISOString(),
      car: a.car,
      seller: a.seller,
      topBid: a.bids[0]?.amount ?? 0,
      bidCount: a.bids.length,
    })),
  };
}

// ─── Get current user's cars eligible for auction ────────────────────────────

export async function getMyEligibleCars() {
  const session = await verifySession();
  if (!session?.userId) return { error: 'Not authenticated', cars: [] };

  const cars = await prisma.car.findMany({
    where: {
      userId: session.userId,
      forAuction: false,
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      imageData: true,
      brand: true,
      carModel: true,
      size: true,
      condition: true,
      description: true,
      price: true,
    },
  });

  return { cars };
}

// ─── Create an auction ────────────────────────────────────────────────────────

export async function createAuction(
  carId: string,
  startingBid: number,
  durationHours: number
) {
  const session = await verifySession();
  if (!session?.userId) return { error: 'Not authenticated' };

  if (startingBid <= 0) return { error: 'Starting bid must be greater than 0' };
  if (durationHours <= 0) return { error: 'Invalid duration' };

  // Check ban
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { bannedUntil: true },
  });
  if (user?.bannedUntil && user.bannedUntil > new Date()) {
    return { error: 'You are temporarily banned and cannot create auctions' };
  }

  // Verify car belongs to user and isn't already in auction
  const car = await prisma.car.findFirst({
    where: { id: carId, userId: session.userId, forAuction: false },
  });
  if (!car) return { error: 'Car not found or already in auction' };

  const endsAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.car.update({ where: { id: carId }, data: { forAuction: true } }),
    prisma.auction.create({
      data: {
        carId,
        sellerId: session.userId,
        startingBid,
        endsAt,
      },
    }),
  ]);

  revalidatePath('/auctions');
  return { success: true };
}

// ─── Get full auction detail (also finalizes if expired) ─────────────────────

export async function getAuctionDetail(auctionId: string): Promise<
  { auction: AuctionDetail; currentUserId: string } | { error: string }
> {
  const session = await verifySession();
  if (!session?.userId) return { error: 'Not authenticated' };

  let auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    select: {
      id: true,
      carId: true,
      startingBid: true,
      endsAt: true,
      finalized: true,
      sellerId: true,
      winnerId: true,
      seller: { select: { username: true } },
      winner: { select: { username: true } },
      car: {
        select: {
          id: true,
          imageData: true,
          brand: true,
          carModel: true,
          size: true,
          condition: true,
          description: true,
          price: true,
        },
      },
      bids: {
        select: {
          id: true,
          bidderId: true,
          amount: true,
          bidder: { select: { username: true } },
        },
        orderBy: { amount: 'desc' },
      },
    },
  });

  if (!auction) return { error: 'Auction not found' };

  // Finalize if expired and not yet finalized
  if (!auction.finalized && new Date() >= auction.endsAt) {
    const topBid = auction.bids[0];
    const updates: Parameters<typeof prisma.auction.update>[0]['data'] = {
      finalized: true,
    };

    if (topBid) {
      updates.winnerId = topBid.bidderId;
      // Transfer car to winner
      await prisma.$transaction([
        prisma.auction.update({ where: { id: auctionId }, data: updates }),
        prisma.car.update({
          where: { id: auction.carId },
          data: { userId: topBid.bidderId, forAuction: false },
        }),
      ]);
    } else {
      // No bids — just finalize and reset car flag
      await prisma.$transaction([
        prisma.auction.update({ where: { id: auctionId }, data: updates }),
        prisma.car.update({
          where: { id: auction.carId },
          data: { forAuction: false },
        }),
      ]);
    }

    revalidatePath('/auctions');
    revalidatePath(`/auctions/${auctionId}`);
    revalidatePath('/garage');

    // Re-fetch updated auction
    auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      select: {
        id: true,
        carId: true,
        startingBid: true,
        endsAt: true,
        finalized: true,
        sellerId: true,
        winnerId: true,
        seller: { select: { username: true } },
        winner: { select: { username: true } },
        car: {
          select: {
            id: true,
            imageData: true,
            brand: true,
            carModel: true,
            size: true,
            condition: true,
            description: true,
            price: true,
          },
        },
        bids: {
          select: {
            id: true,
            bidderId: true,
            amount: true,
            bidder: { select: { username: true } },
          },
          orderBy: { amount: 'desc' },
        },
      },
    });
    if (!auction) return { error: 'Auction not found' };
  }

  const myBid = auction.bids.find((b) => b.bidderId === session.userId)?.amount ?? null;

  return {
    auction: {
      id: auction.id,
      carId: auction.carId,
      startingBid: auction.startingBid,
      endsAt: auction.endsAt.toISOString(),
      finalized: auction.finalized,
      sellerId: auction.sellerId,
      winnerId: auction.winnerId,
      car: auction.car,
      seller: auction.seller,
      winner: auction.winner,
      bids: auction.bids,
      myBid,
    },
    currentUserId: session.userId,
  };
}

// ─── Place / raise a bid ──────────────────────────────────────────────────────

export async function placeBid(auctionId: string, amount: number) {
  const session = await verifySession();
  if (!session?.userId) return { error: 'Not authenticated' };

  if (amount <= 0) return { error: 'Invalid bid amount' };

  // Check ban
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { bannedUntil: true },
  });
  if (user?.bannedUntil && user.bannedUntil > new Date()) {
    return { error: 'You are temporarily banned and cannot place bids' };
  }

  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: {
      bids: { orderBy: { amount: 'desc' }, take: 1 },
    },
  });

  if (!auction) return { error: 'Auction not found' };
  if (auction.finalized) return { error: 'Auction has ended' };
  if (new Date() >= auction.endsAt) return { error: 'Auction has expired' };
  if (auction.sellerId === session.userId) return { error: "You can't bid on your own auction" };

  const currentTop = auction.bids[0]?.amount ?? auction.startingBid - 1;
  if (amount <= currentTop) {
    return { error: `Bid must be greater than current top bid (৳${currentTop.toLocaleString()})` };
  }

  // Upsert — update if exists, create if not
  const existingBid = await prisma.auctionBid.findUnique({
    where: { auctionId_bidderId: { auctionId, bidderId: session.userId } },
  });

  if (existingBid) {
    await prisma.auctionBid.update({
      where: { auctionId_bidderId: { auctionId, bidderId: session.userId } },
      data: { amount },
    });
  } else {
    await prisma.auctionBid.create({
      data: { auctionId, bidderId: session.userId, amount },
    });
  }

  revalidatePath(`/auctions/${auctionId}`);
  revalidatePath('/auctions');
  return { success: true };
}
