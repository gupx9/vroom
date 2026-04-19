import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface Params {
  params: Promise<{ replyId: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const session = await verifySession();

  if (!session?.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { replyId } = await params;
  const body = (await request.json()) as { value?: number };
  const value = body.value;

  if (value !== 1 && value !== -1) {
    return NextResponse.json({ error: 'Vote must be 1 or -1' }, { status: 400 });
  }

  const reply = await prisma.communityReply.findUnique({
    where: { id: replyId },
    select: { id: true, deletedAt: true },
  });

  if (!reply) {
    return NextResponse.json({ error: 'Reply not found' }, { status: 404 });
  }

  if (reply.deletedAt) {
    return NextResponse.json({ error: 'Cannot vote on deleted reply' }, { status: 400 });
  }

  const existing = await prisma.communityReaction.findUnique({
    where: {
      userId_replyId: {
        userId: session.userId,
        replyId,
      },
    },
    select: {
      id: true,
      value: true,
    },
  });

  if (!existing) {
    await prisma.communityReaction.create({
      data: {
        userId: session.userId,
        replyId,
        value,
      },
    });
  } else if (existing.value === value) {
    await prisma.communityReaction.delete({
      where: { id: existing.id },
    });
  } else {
    await prisma.communityReaction.update({
      where: { id: existing.id },
      data: { value },
    });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
