import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

const SEND_OTP_EMAIL = false;
const DEFAULT_OTP = '000000';

interface RegisterRequestBody {
  username?: string;
  email?: string;
  password?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterRequestBody;
    const username = body.username?.trim();
    const email = body.email?.trim();
    const password = body.password;

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Username or email already in use' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const generatedOtp = SEND_OTP_EMAIL
      ? Math.floor(100000 + Math.random() * 900000).toString()
      : DEFAULT_OTP;

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        otp: generatedOtp,
        isVerified: false,
      },
    });

    if (SEND_OTP_EMAIL) {
      console.log(`Sending email to ${email} with OTP: ${generatedOtp}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'User registered. Please verify OTP.',
        user: { id: newUser.id, email: newUser.email, username: newUser.username },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 });
  }
}
