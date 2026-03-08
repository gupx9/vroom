'use server';

import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

/** List an item for sale (sets forSale=true and sellingPrice) */
export async function listItemForSale(
  id: string,
  type: 'car' | 'diorama',
  sellingPrice: number
) {
  const session = await verifySession();
  if (!session?.userId) return { error: 'Not authenticated' };
  if (sellingPrice <= 0) return { error: 'Selling price must be greater than 0' };

  if (type === 'car') {
    const car = await prisma.car.findFirst({ where: { id, userId: session.userId } });
    if (!car) return { error: 'Car not found' };
    await prisma.car.update({ where: { id }, data: { forSale: true, sellingPrice } });
  } else {
    const diorama = await prisma.diorama.findFirst({ where: { id, userId: session.userId } });
    if (!diorama) return { error: 'Diorama not found' };
    await prisma.diorama.update({ where: { id }, data: { forSale: true, sellingPrice } });
  }

  revalidatePath('/garage');
  revalidatePath('/marketplace');
  return { success: true };
}

/** Unlist an item from the marketplace (sets forSale=false) */
export async function unlistItemFromSale(id: string, type: 'car' | 'diorama') {
  const session = await verifySession();
  if (!session?.userId) return { error: 'Not authenticated' };

  if (type === 'car') {
    const car = await prisma.car.findFirst({ where: { id, userId: session.userId } });
    if (!car) return { error: 'Car not found' };
    await prisma.car.update({ where: { id }, data: { forSale: false, sellingPrice: 0 } });
  } else {
    const diorama = await prisma.diorama.findFirst({ where: { id, userId: session.userId } });
    if (!diorama) return { error: 'Diorama not found' };
    await prisma.diorama.update({ where: { id }, data: { forSale: false, sellingPrice: 0 } });
  }

  revalidatePath('/garage');
  revalidatePath('/marketplace');
  return { success: true };
}

/** Get all marketplace listings (forSale=true) */
export async function getMarketplaceListings() {
  const [cars, dioramas] = await Promise.all([
    prisma.car.findMany({
      where: { forSale: true },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        imageData: true,
        brand: true,
        carModel: true,
        size: true,
        condition: true,
        sellingPrice: true,
        userId: true,
        user: { select: { username: true } },
      },
    }),
    prisma.diorama.findMany({
      where: { forSale: true },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        imageData: true,
        description: true,
        sellingPrice: true,
        userId: true,
        user: { select: { username: true } },
      },
    }),
  ]);

  return { cars, dioramas };
}

/** Get current user's unlisted garage items (forSale=false) for the AddSellPostModal */
export async function getMyUnlistedItems() {
  const session = await verifySession();
  if (!session?.userId) return { error: 'Not authenticated', cars: [], dioramas: [] };

  const [cars, dioramas] = await Promise.all([
    prisma.car.findMany({
      where: { userId: session.userId, forSale: false },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        imageData: true,
        brand: true,
        carModel: true,
        condition: true,
        sellingPrice: true,
      },
    }),
    prisma.diorama.findMany({
      where: { userId: session.userId, forSale: false },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        imageData: true,
        description: true,
        sellingPrice: true,
      },
    }),
  ]);

  return { cars, dioramas };
}
