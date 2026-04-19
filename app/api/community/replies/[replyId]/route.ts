import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import prisma from '@/lib/prisma';

const MAX_REPLY_LENGTH = 800;

interface Params {
  params: Promise<{ replyId: string }>;
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await verifySession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { replyId } = await params;
  const body = (await request.json()) as { content?: string };
  const content = body.content?.trim() ?? '';

  if (!content) {
    return NextResponse.json({ error: 'Reply is required' }, { status: 400 });
  }

  if (content.length > MAX_REPLY_LENGTH) {
    return NextResponse.json({ error: `Reply is too long (max ${MAX_REPLY_LENGTH} chars)` }, { status: 400 });
  }

  const existing = await prisma.communityReply.findUnique({
    where: { id: replyId },
    select: { authorId: true, deletedAt: true },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Reply not found' }, { status: 404 });
  }

  if (existing.authorId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (existing.deletedAt) {
    return NextResponse.json({ error: 'Cannot edit deleted reply' }, { status: 400 });
  }

  await prisma.communityReply.update({
    where: { id: replyId },
    data: { content },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}

export async function DELETE(_: Request, { params }: Params) {
  const session = await verifySession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { replyId } = await params;

  const existing = await prisma.communityReply.findUnique({
    where: { id: replyId },
    select: { authorId: true, deletedAt: true },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Reply not found' }, { status: 404 });
  }

  if (existing.authorId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (existing.deletedAt) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  await prisma.communityReply.update({
    where: { id: replyId },
    data: {
      content: '',
      deletedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
