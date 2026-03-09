import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

interface VerifyRequestBody {
  email?: string;
  otp?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VerifyRequestBody;
    const email = body.email?.trim();
    const otp = body.otp?.trim();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.otp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP or User not found' }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, otp: null },
    });

    return NextResponse.json(
      { success: true, message: 'Account verified. You can now log in.' },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
