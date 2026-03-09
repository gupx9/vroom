import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

interface AddDioramaRequestBody {
  description?: string;
  price?: number;
  imageData?: string;
}

export async function POST(request: Request) {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = (await request.json()) as AddDioramaRequestBody;
    const description = body.description?.trim();
    const price = parseFloat(String(body.price)) || 0;
    const imageData = body.imageData || null;

    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    const diorama = await prisma.diorama.create({
      data: {
        userId: session.userId,
        description,
        price,
        imageData,
      },
    });

    revalidatePath('/garage');

    return NextResponse.json({ success: true, diorama: { id: diorama.id } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to add diorama' }, { status: 500 });
  }
}

interface DeleteDioramaRequestBody {
  id?: string;
}

export async function DELETE(request: Request) {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = (await request.json()) as DeleteDioramaRequestBody;
    const id = body.id?.trim();

    if (!id) {
      return NextResponse.json({ error: 'Diorama id is required' }, { status: 400 });
    }

    const deleted = await prisma.diorama.deleteMany({
      where: { id, userId: session.userId },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Diorama not found' }, { status: 404 });
    }

    revalidatePath('/garage');

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to delete diorama' }, { status: 500 });
  }
}
