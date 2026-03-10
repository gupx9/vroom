import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { NextResponse } from 'next/server';

interface CreateTradeOfferBody {
  receiverId?: string;         // optional — null means open/public offer
  offeredCarIds?: string[];
  requestedCarIds?: string[];  // optional — only used when targeting a specific listing
  wantDescription?: string;    // free-text "what I want in exchange"
  message?: string;
}

// POST /api/trading/offers  — send a new trade offer
// GET  /api/trading/offers  — get sent + received offers for the logged-in user
export async function POST(request: Request) {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = (await request.json()) as CreateTradeOfferBody;
    const { receiverId, offeredCarIds = [], requestedCarIds = [], wantDescription, message } = body;

    if (!wantDescription?.trim()) {
      return NextResponse.json({ error: 'Please describe what you want in exchange.' }, { status: 400 });
    }
    if (offeredCarIds.length === 0) {
      return NextResponse.json({ error: 'Select at least one item you are offering.' }, { status: 400 });
    }
    if (receiverId && receiverId === session.userId) {
      return NextResponse.json({ error: 'Cannot send a trade offer to yourself' }, { status: 400 });
    }

    // If targeting a specific receiver, validate they exist
    if (receiverId) {
      const receiver = await prisma.user.findUnique({ where: { id: receiverId }, select: { id: true } });
      if (!receiver) {
        return NextResponse.json({ error: 'Receiver not found' }, { status: 404 });
      }
    }

    // Verify the offerer actually owns all offered items and they are marked forTrade
    const offeredCars = await prisma.car.findMany({
      where: { id: { in: offeredCarIds }, userId: session.userId, forTrade: true },
      select: { id: true },
    });
    const offeredDioramas = await prisma.diorama.findMany({
      where: { id: { in: offeredCarIds }, userId: session.userId, forTrade: true },
      select: { id: true },
    });
    const ownedOfferedIds = new Set([
      ...offeredCars.map((c) => c.id),
      ...offeredDioramas.map((d) => d.id),
    ]);
    const invalidOffered = offeredCarIds.filter((id) => !ownedOfferedIds.has(id));
    if (invalidOffered.length > 0) {
      return NextResponse.json(
        { error: `Some offered items are not yours or not marked for trade: ${invalidOffered.join(', ')}` },
        { status: 400 },
      );
    }

    // If requestedCarIds provided with a receiver, validate they belong to the receiver
    if (receiverId && requestedCarIds.length > 0) {
      const requestedCars = await prisma.car.findMany({
        where: { id: { in: requestedCarIds }, userId: receiverId, forTrade: true },
        select: { id: true },
      });
      const requestedDioramas = await prisma.diorama.findMany({
        where: { id: { in: requestedCarIds }, userId: receiverId, forTrade: true },
        select: { id: true },
      });
      const validRequestedIds = new Set([
        ...requestedCars.map((c) => c.id),
        ...requestedDioramas.map((d) => d.id),
      ]);
      const invalidRequested = requestedCarIds.filter((id) => !validRequestedIds.has(id));
      if (invalidRequested.length > 0) {
        return NextResponse.json(
          { error: `Some requested items don't belong to the receiver or aren't marked for trade: ${invalidRequested.join(', ')}` },
          { status: 400 },
        );
      }
    }

    const offer = await prisma.tradeOffer.create({
      data: {
        offererId: session.userId,
        ...(receiverId ? { receiverId } : {}),
        offeredCarIds,
        requestedCarIds: receiverId ? requestedCarIds : [],
        wantDescription: wantDescription.trim(),
        message: message?.trim() || null,
      },
      select: { id: true, status: true, createdAt: true },
    });

    return NextResponse.json({ success: true, offer }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create trade offer' }, { status: 500 });
  }
}

// GET /api/trading/offers?filter=sent|received|all (default: all)
export async function GET(request: Request) {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') ?? 'all'; // "sent" | "received" | "all"

    const selectFields = {
      id: true,
      offeredCarIds: true,
      requestedCarIds: true,
      wantDescription: true,
      message: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      offerer: { select: { id: true, username: true, reputation: true } },
      receiver: { select: { id: true, username: true, reputation: true } },
    };

    const [sent, received] = await Promise.all([
      filter !== 'received'
        ? prisma.tradeOffer.findMany({
            where: { offererId: session.userId },
            select: selectFields,
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
      filter !== 'sent'
        ? prisma.tradeOffer.findMany({
            where: { receiverId: session.userId },
            select: selectFields,
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
    ]);

    // Resolve all item IDs to their details for display
    const allIds = [
      ...new Set([
        ...sent.flatMap((o) => [...o.offeredCarIds, ...o.requestedCarIds]),
        ...received.flatMap((o) => [...o.offeredCarIds, ...o.requestedCarIds]),
      ]),
    ];

    const [cars, dioramas] = allIds.length
      ? await Promise.all([
          prisma.car.findMany({
            where: { id: { in: allIds } },
            select: { id: true, brand: true, carModel: true, size: true, imageData: true },
          }),
          prisma.diorama.findMany({
            where: { id: { in: allIds } },
            select: { id: true, description: true, imageData: true },
          }),
        ])
      : [[], []];

    const itemMap: Record<string, { type: 'car' | 'diorama'; [key: string]: unknown }> = {};
    cars.forEach((c) => { itemMap[c.id] = { type: 'car', ...c }; });
    dioramas.forEach((d) => { itemMap[d.id] = { type: 'diorama', ...d }; });

    return NextResponse.json({ success: true, sent, received, itemMap }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch trade offers' }, { status: 500 });
  }
}
