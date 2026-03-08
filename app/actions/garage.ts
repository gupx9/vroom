'use server';

import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function addCar(formData: FormData) {
  const session = await verifySession();
  if (!session?.userId) return { error: 'Not authenticated' };

  const imageData = formData.get('imageData') as string;
  const description = formData.get('description') as string;

  if (!imageData || !description?.trim()) return { error: 'Image and description are required' };

  await prisma.car.create({
    data: {
      userId: session.userId,
      imageData,
      description: description.trim(),
    },
  });

  revalidatePath('/garage');
}

export async function toggleCarStatus(carId: string, field: 'forSale' | 'forTrade') {
  const session = await verifySession();
  if (!session?.userId) return { error: 'Not authenticated' };

  const car = await prisma.car.findFirst({
    where: { id: carId, userId: session.userId },
  });

  if (!car) return { error: 'Car not found' };

  await prisma.car.update({
    where: { id: carId },
    data: { [field]: !car[field] },
  });

  revalidatePath('/garage');
}

export async function deleteCar(carId: string) {
  const session = await verifySession();
  if (!session?.userId) return { error: 'Not authenticated' };

  await prisma.car.deleteMany({
    where: { id: carId, userId: session.userId },
  });

  revalidatePath('/garage');
}
