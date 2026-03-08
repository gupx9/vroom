'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createSession, removeSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const SEND_OTP_EMAIL = false; // Toggle to true to enable actual email sending.
const DEFAULT_OTP = '000000';

export async function register(formData: FormData) {
  const username = formData.get('username') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!username || !email || !password) {
    return { error: 'Missing required fields' };
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existingUser) {
    return { error: 'Username or email already in use' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const generatedOtp = SEND_OTP_EMAIL ? Math.floor(100000 + Math.random() * 900000).toString() : DEFAULT_OTP;

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
    // Send email logic would go here
    console.log(`Sending email to ${email} with OTP: ${generatedOtp}`);
  }

  // Set a temporary cookie to hold the user's email for the verification step
  redirect(`/verify?email=${encodeURIComponent(email)}`);
}

export async function verifyOtp(formData: FormData) {
  const email = formData.get('email') as string;
  const otp = formData.get('otp') as string;

  if (!email || !otp) {
    return { error: 'Email and OTP are required' };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || user.otp !== otp) {
    return { error: 'Invalid OTP or User not found' };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true, otp: null },
  });

  redirect('/login');
}

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and Password are required' };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.isVerified) {
    return { error: 'Invalid credentials or account not verified' };
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return { error: 'Invalid credentials' };
  }

  await createSession(user.id);

  redirect('/dashboard');
}

export async function logout() {
  await removeSession();
  redirect('/login');
}
