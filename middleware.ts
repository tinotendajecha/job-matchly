// middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const hasSession = !!req.cookies.get('session_token')?.value;

  // Protect /app/* and /onboarding
  if (pathname.startsWith('/app') || pathname === '/onboarding') {
    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = '/auth/signin';
      url.searchParams.set('next', pathname + (searchParams.toString() ? `?${searchParams}` : ''));
      return NextResponse.redirect(url);
    }
  }

  // (Optional) If already logged in, keep users out of auth pages
  if (hasSession && (pathname === '/auth/signin' || pathname === '/auth/signup')) {
    const url = req.nextUrl.clone();
    url.pathname = '/app/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/onboarding', '/auth/:path*'],
};
