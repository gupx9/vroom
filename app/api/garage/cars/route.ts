import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

interface AddCarRequestBody {
  imageData?: string;
  brand?: string;
  carModel?: string;
  size?: string;
  condition?: string;
  price?: number;
}

export async function POST(request: Request) {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = (await request.json()) as AddCarRequestBody;
    const imageData = body.imageData;
    const brand = body.brand?.trim();
    const carModel = body.carModel?.trim();
    const size = body.size || '';
    const condition = body.condition || '';
    const price = parseFloat(String(body.price)) || 0;

    if (!imageData) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }
    if (!brand || !carModel) {
      return NextResponse.json({ error: 'Brand and model are required' }, { status: 400 });
    }

    const car = await prisma.car.create({
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

    return NextResponse.json({ success: true, car: { id: car.id } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to add car' }, { status: 500 });
  }
}

interface DeleteCarRequestBody {
  id?: string;
}

export async function DELETE(request: Request) {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = (await request.json()) as DeleteCarRequestBody;
    const id = body.id?.trim();

    if (!id) {
      return NextResponse.json({ error: 'Car id is required' }, { status: 400 });
    }

    const deleted = await prisma.car.deleteMany({
      where: { id, userId: session.userId },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }

    revalidatePath('/garage');

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to delete car' }, { status: 500 });
  }
}
