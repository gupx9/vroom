import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import prisma from '@/lib/prisma';

const MAX_REPLY_LENGTH = 800;

interface Params {
  params: Promise<{ messageId: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const session = await verifySession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { messageId } = await params;
  const body = (await request.json()) as { content?: string };
  const content = body.content?.trim() ?? '';

  if (!content) {
    return NextResponse.json({ error: 'Reply is required' }, { status: 400 });
  }

  if (content.length > MAX_REPLY_LENGTH) {
    return NextResponse.json({ error: `Reply is too long (max ${MAX_REPLY_LENGTH} chars)` }, { status: 400 });
  }

  const message = await prisma.communityMessage.findUnique({
    where: { id: messageId },
    select: { id: true, deletedAt: true },
  });

  if (!message) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }

  if (message.deletedAt) {
    return NextResponse.json({ error: 'Cannot reply to a deleted message' }, { status: 400 });
  }

  await prisma.communityReply.create({
    data: {
      messageId,
      authorId: session.userId,
      content,
    },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
