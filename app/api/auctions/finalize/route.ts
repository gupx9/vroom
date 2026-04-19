import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { finalizeAuctionById } from '@/app/actions/auctions';

export async function POST(request: Request) {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = (await request.json()) as { auctionId?: string };
    const auctionId = body.auctionId?.trim();

    if (!auctionId) {
      return NextResponse.json({ error: 'auctionId is required' }, { status: 400 });
    }

    const result = await finalizeAuctionById(auctionId);

    if (!result) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        finalized: result.finalized,
        auctionId,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: 'Failed to finalize auction' }, { status: 500 });
  }
}