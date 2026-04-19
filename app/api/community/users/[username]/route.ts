import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface Params {
  params: Promise<{ username: string }>;
}

export async function GET(_: Request, { params }: Params) {
  const session = await verifySession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      reputation: true,
      createdAt: true,
      cars: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          imageData: true,
          brand: true,
          carModel: true,
          size: true,
          condition: true,
          forSale: true,
          forTrade: true,
          sellingPrice: true,
        },
      },
      dioramas: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          imageData: true,
          description: true,
          forSale: true,
          forTrade: true,
          sellingPrice: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const [existingReview, existingReport] = await Promise.all([
    prisma.userReview.findUnique({
      where: {
        authorId_targetId: {
          authorId: session.userId,
          targetId: user.id,
        },
      },
      select: {
        stars: true,
        status: true,
      },
    }),
    prisma.userReport.findUnique({
      where: {
        authorId_targetId: {
          authorId: session.userId,
          targetId: user.id,
        },
      },
      select: {
        status: true,
      },
    }),
  ]);

  return NextResponse.json(
    {
      profile: user,
      currentUserId: session.userId,
      existingReview,
      existingReport,
    },
    { status: 200 },
  );
}
