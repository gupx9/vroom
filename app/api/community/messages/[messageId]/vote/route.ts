import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface Params {
  params: Promise<{ messageId: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const session = await verifySession();

  if (!session?.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { messageId } = await params;
  const body = (await request.json()) as { value?: number };
  const value = body.value;

  if (value !== 1 && value !== -1) {
    return NextResponse.json({ error: 'Vote must be 1 or -1' }, { status: 400 });
  }

  const message = await prisma.communityMessage.findUnique({
    where: { id: messageId },
    select: { id: true, deletedAt: true },
  });

  if (!message) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }

  if (message.deletedAt) {
    return NextResponse.json({ error: 'Cannot vote on deleted message' }, { status: 400 });
  }

  const existing = await prisma.communityReaction.findUnique({
    where: {
      userId_messageId: {
        userId: session.userId,
        messageId,
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
        messageId,
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
