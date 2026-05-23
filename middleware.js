import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { JWT_SECRET } from '@/lib/jwt-secret';

const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/setup',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/setup',
  '/api/auth/setup-check',
  '/api/auth/logout'
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip static assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Electron / desktop mode: skip authentication entirely
  if (process.env.AUTH_ENABLED === 'false') {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', 'local');
    requestHeaders.set('x-user-role', 'admin');
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Public paths: no authentication required
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Read token from cookie
  const token = request.cookies.get('token')?.value;

  if (!token) {
    // API routes: return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Page routes: redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-role', payload.role);
    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    // Token expired or invalid
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('token', '', { maxAge: 0, path: '/' });
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
