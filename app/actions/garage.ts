'use server';

import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function addCar(formData: FormData) {
  const session = await verifySession();
  if (!session?.userId) return { error: 'Not authenticated' };

  const imageData = formData.get('imageData') as string;
  const brand = (formData.get('brand') as string)?.trim();
  const carModel = (formData.get('carModel') as string)?.trim();
  const size = formData.get('size') as string;
  const condition = formData.get('condition') as string;
  const price = parseFloat(formData.get('price') as string) || 0;

  if (!imageData) return { error: 'Image is required' };
  if (!brand || !carModel) return { error: 'Brand and model are required' };

  await prisma.car.create({
    data: {
      userId: session.userId,
      imageData,
      brand,
      carModel,
      size,
      condition,
      price,
    },
  });

  revalidatePath('/garage');
  return { success: true };
}

export async function addDiorama(formData: FormData) {
  const session = await verifySession();
  if (!session?.userId) return { error: 'Not authenticated' };

  const description = (formData.get('description') as string)?.trim();
  const price = parseFloat(formData.get('price') as string) || 0;
  const imageData = formData.get('imageData') as string;

  if (!description) return { error: 'Description is required' };

  await prisma.diorama.create({
    data: {
      userId: session.userId,
      description,
      price,
      imageData: imageData || null,
    },
  });

  revalidatePath('/garage');
  return { success: true };
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

export async function toggleDioramaStatus(dioramaId: string, field: 'forSale' | 'forTrade') {
  const session = await verifySession();
  if (!session?.userId) return { error: 'Not authenticated' };

  const diorama = await prisma.diorama.findFirst({
    where: { id: dioramaId, userId: session.userId },
  });

  if (!diorama) return { error: 'Diorama not found' };

  await prisma.diorama.update({
    where: { id: dioramaId },
    data: { [field]: !diorama[field] },
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

export async function deleteDiorama(dioramaId: string) {
  const session = await verifySession();
  if (!session?.userId) return { error: 'Not authenticated' };

  await prisma.diorama.deleteMany({
    where: { id: dioramaId, userId: session.userId },
  });

  revalidatePath('/garage');
}
