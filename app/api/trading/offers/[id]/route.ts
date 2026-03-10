import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { NextResponse } from 'next/server';

interface UpdateTradeOfferBody {
  action?: 'accept' | 'reject' | 'cancel';
}

// PATCH /api/trading/offers/[id]
// - Receiver can accept or reject a pending offer
// - Offerer can cancel a pending offer
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json()) as UpdateTradeOfferBody;
    const { action } = body;

    if (!action || !['accept', 'reject', 'cancel'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be one of: accept, reject, cancel' },
        { status: 400 },
      );
    }

    const offer = await prisma.tradeOffer.findUnique({
      where: { id },
      select: { id: true, offererId: true, receiverId: true, status: true },
    });

    if (!offer) {
      return NextResponse.json({ error: 'Trade offer not found' }, { status: 404 });
    }

    if (offer.status !== 'pending') {
      return NextResponse.json(
        { error: `Offer is already ${offer.status} and cannot be modified` },
        { status: 409 },
      );
    }

    // Permission check
    if (action === 'cancel') {
      if (offer.offererId !== session.userId) {
        return NextResponse.json({ error: 'Only the offerer can cancel this offer' }, { status: 403 });
      }
    } else {
      // accept or reject — requires a receiver
      if (!offer.receiverId) {
        return NextResponse.json({ error: 'This is an open offer with no receiver' }, { status: 400 });
      }
      if (offer.receiverId !== session.userId) {
        return NextResponse.json({ error: 'Only the receiver can accept or reject this offer' }, { status: 403 });
      }
    }

    const statusMap = { accept: 'accepted', reject: 'rejected', cancel: 'cancelled' } as const;
    const newStatus = statusMap[action];

    const updated = await prisma.tradeOffer.update({
      where: { id },
      data: { status: newStatus },
      select: { id: true, status: true, updatedAt: true },
    });

    return NextResponse.json({ success: true, offer: updated }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to update trade offer' }, { status: 500 });
  }
}

// GET /api/trading/offers/[id] — view a single trade offer (either party can view it)
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    const offer = await prisma.tradeOffer.findUnique({
      where: { id },
      select: {
        id: true,
        offeredCarIds: true,
        requestedCarIds: true,
        message: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        offerer: { select: { id: true, username: true, reputation: true } },
        receiver: { select: { id: true, username: true, reputation: true } },
      },
    });

    if (!offer) {
      return NextResponse.json({ error: 'Trade offer not found' }, { status: 404 });
    }

    // Only the offerer or receiver may view the offer details
    if (offer.offerer.id !== session.userId && offer.receiver.id !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, offer }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch trade offer' }, { status: 500 });
  }
}
