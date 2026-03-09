import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/jwt';

const authRoutes = ['/login', '/register', '/verify'];
const publicRoutes = ['/'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Exclude static files, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Read session directly from request cookie (safe in middleware Edge context)
  const sessionCookie = request.cookies.get('session')?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;
  const isValidSession = !!session?.userId;
  const isAdmin = isValidSession && session.role === 'admin';

  const isAuthRoute = authRoutes.includes(pathname);
  const isPublicRoute = publicRoutes.includes(pathname);

  if (isAuthRoute) {
    if (isValidSession) return NextResponse.redirect(new URL('/dashboard', request.url));
    return NextResponse.next();
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (!isValidSession && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
