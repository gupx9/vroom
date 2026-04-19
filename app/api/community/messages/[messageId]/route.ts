import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import prisma from '@/lib/prisma';

const MAX_MESSAGE_LENGTH = 1200;

interface Params {
  params: Promise<{ messageId: string }>;
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await verifySession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { messageId } = await params;
  const body = (await request.json()) as { content?: string };
  const content = body.content?.trim() ?? '';

  if (!content) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  if (content.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: `Message is too long (max ${MAX_MESSAGE_LENGTH} chars)` }, { status: 400 });
  }

  const existing = await prisma.communityMessage.findUnique({
    where: { id: messageId },
    select: { authorId: true, deletedAt: true },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }

  if (existing.authorId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (existing.deletedAt) {
    return NextResponse.json({ error: 'Cannot edit deleted message' }, { status: 400 });
  }

  await prisma.communityMessage.update({
    where: { id: messageId },
    data: { content },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}

export async function DELETE(_: Request, { params }: Params) {
  const session = await verifySession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { messageId } = await params;

  const existing = await prisma.communityMessage.findUnique({
    where: { id: messageId },
    select: { authorId: true, deletedAt: true },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }

  if (existing.authorId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (existing.deletedAt) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  await prisma.communityMessage.update({
    where: { id: messageId },
    data: {
      content: '',
      deletedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
