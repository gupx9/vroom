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
      auctions: {
        none: {
          finalized: false,
          endsAt: { gt: new Date() },
        },
      },
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
  if (!Number.isFinite(durationHours) || durationHours <= 0) {
    return { error: 'Invalid duration in hours' };
  }

  const now = new Date();
  const endsAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

  // Check ban
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { bannedUntil: true },
  });
  if (user?.bannedUntil && user.bannedUntil > new Date()) {
    return { error: 'You are temporarily banned and cannot create auctions' };
  }

  const result = await prisma.$transaction(async (tx) => {
    // Lock the car row so concurrent requests cannot create multiple active auctions for the same car.
    await tx.$queryRaw`SELECT id FROM "Car" WHERE id = ${carId} FOR UPDATE`;

    const car = await tx.car.findFirst({
      where: { id: carId, userId: session.userId },
      select: { id: true },
    });

    if (!car) {
      return { error: 'Car not found' } as const;
    }

    const activeAuction = await tx.auction.findFirst({
      where: {
        carId,
        finalized: false,
        endsAt: { gt: now },
      },
      select: { id: true },
    });

    if (activeAuction) {
      return { error: 'This car is already in an active auction' } as const;
    }

    await tx.car.update({ where: { id: carId }, data: { forAuction: true } });
    await tx.auction.create({
      data: {
        carId,
        sellerId: session.userId,
        startingBid,
        endsAt,
      },
    });

    return { success: true } as const;
  });

  if ('error' in result) return result;

  revalidatePath('/auctions');
  return { success: true };
}

// ─── Get full auction detail (also finalizes if expired) ─────────────────────

export async function getAuctionDetail(auctionId: string): Promise<
  { auction: AuctionDetail; currentUserId: string } | { error: string }
> {
  const session = await verifySession();
  if (!session?.userId) return { error: 'Not authenticated' };

  let auction = await fetchAuctionDetailRecord(auctionId);

  if (!auction) return { error: 'Auction not found' };

  // Finalize if expired and not yet finalized
  if (!auction.finalized && new Date() >= auction.endsAt) {
    const finalized = await finalizeAuctionById(auctionId);
    if (finalized) {
      auction = finalized.auction;
    }
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

async function fetchAuctionDetailRecord(auctionId: string) {
  return prisma.auction.findUnique({
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
}

export async function finalizeAuctionById(auctionId: string) {
  const auction = await fetchAuctionDetailRecord(auctionId);

  if (!auction) {
    return null;
  }

  if (auction.finalized || new Date() < auction.endsAt) {
    return { auction, finalized: false } as const;
  }

  const topBid = auction.bids[0];
  const notifications = buildAuctionResultNotifications(auction, topBid?.bidderId ?? null, topBid?.amount ?? null);

  if (topBid) {
    await prisma.$transaction([
      prisma.auction.update({
        where: { id: auctionId },
        data: {
          finalized: true,
          winnerId: topBid.bidderId,
        },
      }),
      prisma.car.update({
        where: { id: auction.carId },
        data: { userId: topBid.bidderId, forAuction: false },
      }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.auction.update({
        where: { id: auctionId },
        data: { finalized: true },
      }),
      prisma.car.update({
        where: { id: auction.carId },
        data: { forAuction: false },
      }),
    ]);
  }

  await persistAuctionNotifications(notifications);

  const finalizedAuction = await fetchAuctionDetailRecord(auctionId);

  return finalizedAuction
    ? ({ auction: finalizedAuction, finalized: true } as const)
    : null;
}

async function persistAuctionNotifications(
  notifications: ReturnType<typeof buildAuctionResultNotifications>,
) {
  if (notifications.length === 0) {
    return;
  }

  try {
    await prisma.notification.createMany({
      data: notifications,
      skipDuplicates: true,
    });
  } catch (error) {
    // Notification delivery should never block finalizing auction ownership transfer.
    if (
      !isKnownRequestError(error) ||
      (error.code !== 'P2021' && error.code !== 'P2022')
    ) {
      throw error;
    }
  }
}

function isKnownRequestError(error: unknown): error is { code: string } {
  return !!error && typeof error === 'object' && 'code' in error && typeof (error as { code?: unknown }).code === 'string';
}

function buildAuctionResultNotifications(
  auction: Awaited<ReturnType<typeof fetchAuctionDetailRecord>>,
  winnerId: string | null,
  winningAmount: number | null,
) {
  if (!auction) {
    return [];
  }

  const participantIds = new Set<string>([
    auction.sellerId,
    ...auction.bids.map((bid) => bid.bidderId),
  ]);

  return Array.from(participantIds).map((userId) => {
    const isSeller = userId === auction.sellerId;
    const isWinner = winnerId !== null && userId === winnerId;

    let title = `Auction ended: ${auction.car.brand} ${auction.car.carModel}`;
    let body = 'The auction has finished.';

    if (winnerId) {
      const winnerUsername = auction.winner?.username ?? 'the winner';

      if (isWinner) {
        title = `You won: ${auction.car.brand} ${auction.car.carModel}`;
        body = winningAmount
          ? `You won the auction with a bid of ৳${winningAmount.toLocaleString()}. The car has been moved to your garage.`
          : 'You won the auction. The car has been moved to your garage.';
      } else if (isSeller) {
        title = `Your auction ended: ${auction.car.brand} ${auction.car.carModel}`;
        body = winningAmount
          ? `${winnerUsername} won your auction with ৳${winningAmount.toLocaleString()}. The car has been moved to their garage.`
          : `${winnerUsername} won your auction. The car has been moved to their garage.`;
      } else {
        title = `Auction ended: ${auction.car.brand} ${auction.car.carModel}`;
        body = winningAmount
          ? `${winnerUsername} won the auction with ৳${winningAmount.toLocaleString()}.`
          : `${winnerUsername} won the auction.`;
      }
    } else if (isSeller) {
      title = `Auction ended with no bids: ${auction.car.brand} ${auction.car.carModel}`;
      body = 'No one bid on your auction. The car has returned to your garage.';
    } else {
      title = `Auction ended: ${auction.car.brand} ${auction.car.carModel}`;
      body = 'The auction ended with no bids.';
    }

    return {
      userId,
      auctionId: auction.id,
      kind: 'auction_result',
      title,
      body,
    };
  });
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
