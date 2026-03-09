/**
 * Edge-safe JWT helpers — no Node.js modules, no Prisma.
 * Safe to import from middleware (Edge runtime).
 */
import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-key-that-should-be-in-env';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch {
    return null;
  }
}
