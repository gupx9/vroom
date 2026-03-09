import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

interface LoginRequestBody {
  email?: string;
  password?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginRequestBody;
    const email = body.email?.trim();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and Password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isVerified) {
      return NextResponse.json({ error: 'Invalid credentials or account not verified' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await createSession(user.id);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: 'Failed to login' }, { status: 500 });
  }
}
