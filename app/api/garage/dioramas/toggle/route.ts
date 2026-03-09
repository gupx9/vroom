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

    const diorama = await prisma.diorama.findFirst({
      where: { id, userId: session.userId },
    });

    if (!diorama) {
      return NextResponse.json({ error: 'Diorama not found' }, { status: 404 });
    }

    await prisma.diorama.update({
      where: { id },
      data: { [field]: !diorama[field] },
    });

    revalidatePath('/garage');

    return NextResponse.json({ success: true, [field]: !diorama[field] }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to toggle diorama status' }, { status: 500 });
  }
}
