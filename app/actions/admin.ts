'use server';

import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const session = await verifySession();
  if (!session?.userId || session.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  return session;
}

/** Fetch all pending reports and pending reviews for the moderation panel */
export async function getModerationQueue() {
  await requireAdmin();

  const [reports, reviews] = await Promise.all([
    prisma.userReport.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { username: true } },
        target: { select: { id: true, username: true, reputation: true, bannedUntil: true } },
      },
    }),
    prisma.userReview.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { username: true } },
        target: { select: { id: true, username: true, reputation: true } },
      },
    }),
  ]);

  return { reports, reviews };
}

/** Approve a report: deduct 20 reputation from reported user */
export async function approveReport(reportId: string) {
  await requireAdmin();

  const report = await prisma.userReport.findUnique({
    where: { id: reportId },
    select: { id: true, targetId: true, status: true },
  });
  if (!report || report.status !== 'pending') return { error: 'Report not found or already processed' };

  await prisma.$transaction([
    prisma.userReport.update({ where: { id: reportId }, data: { status: 'approved' } }),
    prisma.user.update({ where: { id: report.targetId }, data: { reputation: { decrement: 20 } } }),
  ]);

  revalidatePath('/admin/moderation');
  return { success: true };
}

/** Reject a report: no reputation change */
export async function rejectReport(reportId: string) {
  await requireAdmin();

  await prisma.userReport.update({
    where: { id: reportId },
    data: { status: 'rejected' },
  });

  revalidatePath('/admin/moderation');
  return { success: true };
}

/** Approve a pending review: add stars × 5 reputation to reviewed user */
export async function approveReview(reviewId: string) {
  await requireAdmin();

  const review = await prisma.userReview.findUnique({
    where: { id: reviewId },
    select: { id: true, targetId: true, stars: true, status: true },
  });
  if (!review || review.status !== 'pending') return { error: 'Review not found or already processed' };

  await prisma.$transaction([
    prisma.userReview.update({ where: { id: reviewId }, data: { status: 'approved' } }),
    prisma.user.update({ where: { id: review.targetId }, data: { reputation: { increment: review.stars * 5 } } }),
  ]);

  revalidatePath('/admin/moderation');
  return { success: true };
}

/** Reject a pending review: no reputation change */
export async function rejectReview(reviewId: string) {
  await requireAdmin();

  await prisma.userReview.update({
    where: { id: reviewId },
    data: { status: 'rejected' },
  });

  revalidatePath('/admin/moderation');
  return { success: true };
}

/** Temporarily ban a user for X days */
export async function banUser(userId: string, days: number) {
  await requireAdmin();
  if (days <= 0) return { error: 'Ban duration must be positive' };

  const bannedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  await prisma.user.update({ where: { id: userId }, data: { bannedUntil } });

  revalidatePath('/admin/moderation');
  return { success: true };
}

/** Lift an active ban */
export async function unbanUser(userId: string) {
  await requireAdmin();

  await prisma.user.update({ where: { id: userId }, data: { bannedUntil: null } });

  revalidatePath('/admin/moderation');
  return { success: true };
}
