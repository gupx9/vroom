import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

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
      select: {
        id: true,
        offererId: true,
        receiverId: true,
        status: true,
        offeredCarIds: true,
        requestedCarIds: true,
      },
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

    let updated;

    if (action === 'accept') {
      if (offer.requestedCarIds.length === 0) {
        return NextResponse.json(
          { error: 'Trade cannot be accepted without requested items to exchange.' },
          { status: 400 },
        );
      }

      const offeredIds = offer.offeredCarIds;
      const requestedIds = offer.requestedCarIds;

      updated = await prisma.$transaction(async (tx) => {
        const [offeredCars, offeredDioramas, requestedCars, requestedDioramas] = await Promise.all([
          tx.car.findMany({
            where: { id: { in: offeredIds }, userId: offer.offererId, forTrade: true },
            select: { id: true },
          }),
          tx.diorama.findMany({
            where: { id: { in: offeredIds }, userId: offer.offererId, forTrade: true },
            select: { id: true },
          }),
          tx.car.findMany({
            where: { id: { in: requestedIds }, userId: offer.receiverId!, forTrade: true },
            select: { id: true },
          }),
          tx.diorama.findMany({
            where: { id: { in: requestedIds }, userId: offer.receiverId!, forTrade: true },
            select: { id: true },
          }),
        ]);

        const offeredFound = offeredCars.length + offeredDioramas.length;
        const requestedFound = requestedCars.length + requestedDioramas.length;

        if (offeredFound !== offeredIds.length || requestedFound !== requestedIds.length) {
          throw new Error('One or more trade items are no longer available for trade.');
        }

        const offeredCarOnlyIds = offeredCars.map((item) => item.id);
        const offeredDioramaOnlyIds = offeredDioramas.map((item) => item.id);
        const requestedCarOnlyIds = requestedCars.map((item) => item.id);
        const requestedDioramaOnlyIds = requestedDioramas.map((item) => item.id);

        await Promise.all([
          offeredCarOnlyIds.length
            ? tx.car.updateMany({
                where: { id: { in: offeredCarOnlyIds } },
                data: {
                  userId: offer.receiverId!,
                  forTrade: false,
                  forSale: false,
                  sellingPrice: 0,
                },
              })
            : Promise.resolve(),
          offeredDioramaOnlyIds.length
            ? tx.diorama.updateMany({
                where: { id: { in: offeredDioramaOnlyIds } },
                data: {
                  userId: offer.receiverId!,
                  forTrade: false,
                  forSale: false,
                  sellingPrice: 0,
                },
              })
            : Promise.resolve(),
          requestedCarOnlyIds.length
            ? tx.car.updateMany({
                where: { id: { in: requestedCarOnlyIds } },
                data: {
                  userId: offer.offererId,
                  forTrade: false,
                  forSale: false,
                  sellingPrice: 0,
                },
              })
            : Promise.resolve(),
          requestedDioramaOnlyIds.length
            ? tx.diorama.updateMany({
                where: { id: { in: requestedDioramaOnlyIds } },
                data: {
                  userId: offer.offererId,
                  forTrade: false,
                  forSale: false,
                  sellingPrice: 0,
                },
              })
            : Promise.resolve(),
        ]);

        const transferredIds = [...offeredIds, ...requestedIds];

        await tx.tradeOffer.updateMany({
          where: {
            id: { not: id },
            status: 'pending',
            OR: [
              { offeredCarIds: { hasSome: transferredIds } },
              { requestedCarIds: { hasSome: transferredIds } },
            ],
          },
          data: { status: 'cancelled' },
        });

        return tx.tradeOffer.update({
          where: { id },
          data: { status: 'accepted' },
          select: { id: true, status: true, updatedAt: true },
        });
      });
    } else {
      const statusMap = { reject: 'rejected', cancel: 'cancelled' } as const;
      updated = await prisma.tradeOffer.update({
        where: { id },
        data: { status: statusMap[action] },
        select: { id: true, status: true, updatedAt: true },
      });
    }

    revalidatePath('/garage');
    revalidatePath('/trading');
    revalidatePath('/marketplace');

    return NextResponse.json({ success: true, offer: updated }, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
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
