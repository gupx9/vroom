import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { NextResponse } from 'next/server';

// GET /api/trading/listings
// Returns all cars and dioramas that are marked forTrade, excluding the logged-in user's own items.
// Query params: type=car|diorama (optional filter), page, limit
export async function GET(request: Request) {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // "car" | "diorama" | null (both)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const skip = (page - 1) * limit;

    const results: {
      cars: object[];
      dioramas: object[];
      pagination: object;
    } = { cars: [], dioramas: [], pagination: {} };

    if (!type || type === 'car') {
      const [cars, carCount] = await Promise.all([
        prisma.car.findMany({
          where: { forTrade: true, NOT: { userId: session.userId } },
          select: {
            id: true,
            brand: true,
            carModel: true,
            size: true,
            condition: true,
            price: true,
            description: true,
            imageData: true,
            createdAt: true,
            user: { select: { id: true, username: true, reputation: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: type ? skip : 0,
          take: type ? limit : 20,
        }),
        prisma.car.count({ where: { forTrade: true, NOT: { userId: session.userId } } }),
      ]);
      results.cars = cars;
      if (type === 'car') {
        results.pagination = { page, limit, total: carCount, totalPages: Math.ceil(carCount / limit) };
      }
    }

    if (!type || type === 'diorama') {
      const [dioramas, dioramaCount] = await Promise.all([
        prisma.diorama.findMany({
          where: { forTrade: true, NOT: { userId: session.userId } },
          select: {
            id: true,
            description: true,
            price: true,
            imageData: true,
            createdAt: true,
            user: { select: { id: true, username: true, reputation: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: type ? skip : 0,
          take: type ? limit : 20,
        }),
        prisma.diorama.count({ where: { forTrade: true, NOT: { userId: session.userId } } }),
      ]);
      results.dioramas = dioramas;
      if (type === 'diorama') {
        results.pagination = { page, limit, total: dioramaCount, totalPages: Math.ceil(dioramaCount / limit) };
      }
    }

    return NextResponse.json({ success: true, ...results }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch trade listings' }, { status: 500 });
  }
}
