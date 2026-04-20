import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import prisma from '@/lib/prisma';

const MAX_MESSAGE_LENGTH = 1200;

type ReactionValue = -1 | 0 | 1;

type CommunityMessageReaction = {
  userId: string;
  value: number;
};

type CommunityReply = {
  id: string;
  messageId: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    reputation: number;
  };
  content: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  reactions: CommunityMessageReaction[];
};

type CommunityMessage = {
  id: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    reputation: number;
  };
  content: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  reactions: CommunityMessageReaction[];
  replies: CommunityReply[];
};

function toReactionSummary(
  reactions: Array<{ userId: string; value: number }>,
  viewerId: string,
): { likes: number; dislikes: number; viewerReaction: ReactionValue } {
  let likes = 0;
  let dislikes = 0;
  let viewerReaction: ReactionValue = 0;

  for (const reaction of reactions) {
    if (reaction.value === 1) likes += 1;
    if (reaction.value === -1) dislikes += 1;
    if (reaction.userId === viewerId && (reaction.value === 1 || reaction.value === -1)) {
      viewerReaction = reaction.value;
    }
  }

  return { likes, dislikes, viewerReaction };
}

export async function GET() {
  const session = await verifySession();

  if (!session?.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const messages: CommunityMessage[] = await prisma.communityMessage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 60,
    include: {
      author: {
        select: {
          id: true,
          username: true,
          reputation: true,
        },
      },
      reactions: {
        select: {
          userId: true,
          value: true,
        },
      },
      replies: {
        orderBy: { createdAt: 'asc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              reputation: true,
            },
          },
          reactions: {
            select: {
              userId: true,
              value: true,
            },
          },
        },
      },
    },
  });

  const payload = messages.map((message: CommunityMessage) => {
    const summary = toReactionSummary(message.reactions, session.userId);

    return {
      id: message.id,
      authorId: message.authorId,
      author: message.author,
      content: message.deletedAt ? '' : message.content,
      isDeleted: Boolean(message.deletedAt),
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      likes: summary.likes,
      dislikes: summary.dislikes,
      viewerReaction: summary.viewerReaction,
      replies: message.replies
        .filter((reply) => !reply.deletedAt)
        .map((reply: CommunityReply) => {
          const replySummary = toReactionSummary(reply.reactions, session.userId);

          return {
            id: reply.id,
            messageId: reply.messageId,
            authorId: reply.authorId,
            author: reply.author,
            content: reply.content,
            isDeleted: false,
            createdAt: reply.createdAt,
            updatedAt: reply.updatedAt,
            likes: replySummary.likes,
            dislikes: replySummary.dislikes,
            viewerReaction: replySummary.viewerReaction,
          };
        }),
    };
  });

  return NextResponse.json({ currentUserId: session.userId, messages: payload }, { status: 200 });
}

export async function POST(request: Request) {
  const session = await verifySession();

  if (!session?.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = (await request.json()) as { content?: string };
  const content = body.content?.trim() ?? '';

  if (!content) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  if (content.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: `Message is too long (max ${MAX_MESSAGE_LENGTH} chars)` }, { status: 400 });
  }

  await prisma.communityMessage.create({
    data: {
      authorId: session.userId,
      content,
    },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
