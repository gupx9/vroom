'use server';

import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

/** Fetch a user's public profile by username */
export async function getPublicProfile(username: string) {
  const session = await verifySession();
  if (!session?.userId) return { error: 'Not authenticated' };

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

  if (!user) return { error: 'User not found' };

  // Check if the current viewer has already reviewed/reported this user
  const [existingReview, existingReport] = await Promise.all([
    prisma.userReview.findUnique({
      where: { authorId_targetId: { authorId: session.userId, targetId: user.id } },
      select: { stars: true, status: true },
    }),
    prisma.userReport.findUnique({
      where: { authorId_targetId: { authorId: session.userId, targetId: user.id } },
      select: { status: true },
    }),
  ]);

  return {
    user,
    currentUserId: session.userId,
    existingReview,
    existingReport,
  };
}

/** Submit a review for a user */
export async function submitReview(targetId: string, stars: number, comment?: string) {
  const session = await verifySession();
  if (!session?.userId) return { error: 'Not authenticated' };
  if (session.userId === targetId) return { error: 'Cannot review yourself' };
  if (stars < 1 || stars > 5) return { error: 'Stars must be between 1 and 5' };
  if (stars < 3 && (!comment || comment.trim().length < 10)) {
    return { error: 'Please provide a reason (at least 10 characters) for a low review' };
  }

  // Check if already reviewed
  const existing = await prisma.userReview.findUnique({
    where: { authorId_targetId: { authorId: session.userId, targetId } },
  });
  if (existing) {
    if (existing.status === 'rejected') {
      // Delete rejected review so user can re-submit
      await prisma.userReview.delete({
        where: { authorId_targetId: { authorId: session.userId, targetId } },
      });
    } else {
      return { error: 'You have already reviewed this user' };
    }
  }

  // Stars >= 3: immediately approved and reputation updated
  // Stars < 3: pending admin approval
  const status = stars >= 3 ? 'approved' : 'pending';

  await prisma.$transaction(async (tx) => {
    await tx.userReview.create({
      data: {
        targetId,
        authorId: session.userId,
        stars,
        comment: comment?.trim() || null,
        status,
      },
    });

    if (status === 'approved') {
      await tx.user.update({
        where: { id: targetId },
        data: { reputation: { increment: stars * 5 } },
      });
    }
  });

  revalidatePath(`/profile`);
  return { success: true, status };
}

/** Submit a report for a user */
export async function submitReport(targetId: string, reason: string) {
  const session = await verifySession();
  if (!session?.userId) return { error: 'Not authenticated' };
  if (session.userId === targetId) return { error: 'Cannot report yourself' };
  if (!reason || reason.trim().length < 10) {
    return { error: 'Please provide a reason (at least 10 characters)' };
  }

  // Check if already reported
  const existing = await prisma.userReport.findUnique({
    where: { authorId_targetId: { authorId: session.userId, targetId } },
  });
  if (existing) {
    if (existing.status === 'rejected') {
      // Delete rejected report so user can re-submit
      await prisma.userReport.delete({
        where: { authorId_targetId: { authorId: session.userId, targetId } },
      });
    } else {
      return { error: 'You have already reported this user' };
    }
  }

  // Reports always go to admin for approval
  await prisma.userReport.create({
    data: {
      targetId,
      authorId: session.userId,
      reason: reason.trim(),
      status: 'pending',
    },
  });

  return { success: true };
}
