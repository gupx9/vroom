import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

type ToggleField = 'forSale' | 'forTrade';

interface ToggleRequestBody {
  id?: string;
  field?: ToggleField;
}

function isToggleField(value: string): value is ToggleField {
  return value === 'forSale' || value === 'forTrade';
}

export async function PATCH(request: Request) {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = (await request.json()) as ToggleRequestBody;
    const id = body.id?.trim();
    const field = body.field;

    if (!id || !field || !isToggleField(field)) {
      return NextResponse.json({ error: 'id and valid field (forSale | forTrade) are required' }, { status: 400 });
    }

    const car = await prisma.car.findFirst({
      where: { id, userId: session.userId },
    });

    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }

    await prisma.car.update({
      where: { id },
      data: { [field]: !car[field] },
    });

    revalidatePath('/garage');

    return NextResponse.json({ success: true, [field]: !car[field] }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to toggle car status' }, { status: 500 });
  }
}
