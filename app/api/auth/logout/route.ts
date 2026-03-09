import { removeSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    await removeSession();
    return NextResponse.json({ success: true, message: 'Logged out' }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
