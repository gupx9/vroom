import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

type ItemType = 'car' | 'diorama';

interface SellRequestBody {
  id?: string;
  type?: ItemType;
  sellingPrice?: number;
}

function isItemType(value: string): value is ItemType {
  return value === 'car' || value === 'diorama';
}

export async function POST(request: Request) {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = (await request.json()) as SellRequestBody;
    const id = body.id?.trim();
    const type = body.type;
    const sellingPrice = Number(body.sellingPrice);

    if (!id || !type || !isItemType(type)) {
      return NextResponse.json({ error: 'id and valid type are required' }, { status: 400 });
    }

    if (!Number.isFinite(sellingPrice) || sellingPrice <= 0) {
      return NextResponse.json({ error: 'Selling price must be greater than 0' }, { status: 400 });
    }

    if (type === 'car') {
      const car = await prisma.car.findFirst({ where: { id, userId: session.userId } });
      if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 });
      await prisma.car.update({ where: { id }, data: { forSale: true, sellingPrice } });
    } else {
      const diorama = await prisma.diorama.findFirst({ where: { id, userId: session.userId } });
      if (!diorama) return NextResponse.json({ error: 'Diorama not found' }, { status: 404 });
      await prisma.diorama.update({ where: { id }, data: { forSale: true, sellingPrice } });
    }

    revalidatePath('/garage');
    revalidatePath('/marketplace');

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to create sell post' }, { status: 500 });
  }
}
