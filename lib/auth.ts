import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/jwt';
export { encrypt, decrypt } from '@/lib/jwt';

export async function createSession(userId: string, role: string = 'user') {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
  const session = await encrypt({ userId, role, expires });

  const cookieStore = await cookies();
  cookieStore.set('session', session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

/**
 * Verifies the session cookie and always returns the live role from the DB.
 * This ensures that role changes (e.g. promoting a user to admin) are
 * reflected immediately without requiring a new login.
 */
export async function verifySession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;

  if (!session) return null;

  const payload = await decrypt(session);
  if (!payload?.userId) return null;

  // Always fetch role from DB so stale JWTs or manual role changes work instantly
  const user = await prisma.user.findUnique({
    where: { id: payload.userId as string },
    select: { id: true, role: true },
  });

  if (!user) return null;

  return { userId: user.id, role: user.role };
}

export async function removeSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}
