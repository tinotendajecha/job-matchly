// middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { resolveMarket, type MarketCode } from '@/lib/market/config';

const MARKET_COOKIE = 'jm_market';
const VISITOR_COOKIE = 'jm_vid';
const ZA_DOMAIN = 'jobmatchly.co.za';
const ZW_DOMAIN = 'jobmatchly.site';

function isSkippablePath(pathname: string) {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  );
}

function getHostname(req: NextRequest): string {
  return (req.headers.get('x-forwarded-host') || req.headers.get('host') || '')
    .replace(/:\d+$/, '')
    .toLowerCase();
}

function isLocalOrPreview(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.endsWith('.vercel.app')
  );
}

// Vercel provides req.geo.country for the visitor's ISO country code.
// Redirect visitors to the correct market domain when they land on the wrong one.
// On localhost / Vercel preview URLs we skip this so dev/testing is unaffected.
function getGeoRedirectUrl(req: NextRequest, pathname: string, hostname: string): string | null {
  if (isLocalOrPreview(hostname)) return null;

  const geoCountry = (req as any).geo?.country as string | undefined;
  if (!geoCountry) return null;

  const onZA = hostname === ZA_DOMAIN || hostname.endsWith(`.${ZA_DOMAIN}`);
  const onZW = hostname === ZW_DOMAIN || hostname.endsWith(`.${ZW_DOMAIN}`);

  if (geoCountry === 'ZA' && !onZA) return `https://${ZA_DOMAIN}${pathname}`;
  if (geoCountry === 'ZW' && !onZW) return `https://${ZW_DOMAIN}${pathname}`;
  return null;
}

// Anonymous visitor id for page-view counts. Minted server-side so it exists
// before the first tracking beacon fires (otherwise two in-flight beacons each
// mint their own id and one visitor is counted as two), and httpOnly so page
// JS can neither read nor forge it. Not linked to any user record.
function withVisitorCookie(res: NextResponse, req: NextRequest): NextResponse {
  if (!req.cookies.get(VISITOR_COOKIE)?.value) {
    res.cookies.set(VISITOR_COOKIE, crypto.randomUUID(), {
      path: '/',
      maxAge: 60 * 60 * 24 * 180,
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });
  }
  return res;
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  if (isSkippablePath(pathname)) return NextResponse.next();

  const hostname = getHostname(req);
  const hasSession = !!req.cookies.get('session_token')?.value;

  // Geo-redirect to correct market domain in production
  const geoRedirect = getGeoRedirectUrl(req, pathname, hostname);
  if (geoRedirect) return withVisitorCookie(NextResponse.redirect(geoRedirect), req);

  // Market is determined entirely by hostname (or DEFAULT_MARKET on localhost)
  const market: MarketCode = resolveMarket(hostname);

  // Pass market downstream via header so server components and API routes can read it
  const rewriteHeaders = new Headers(req.headers);
  rewriteHeaders.set('x-market', market);

  // Protect /app/* and /onboarding
  if (pathname.startsWith('/app') || pathname === '/onboarding') {
    if (!hasSession) {
      const signInUrl = req.nextUrl.clone();
      signInUrl.pathname = '/auth/signin';
      signInUrl.searchParams.set(
        'next',
        pathname + (searchParams.toString() ? `?${searchParams}` : '')
      );
      const res = NextResponse.redirect(signInUrl);
      res.cookies.set(MARKET_COOKIE, market, { path: '/', sameSite: 'lax', httpOnly: false });
      return withVisitorCookie(res, req);
    }
  }

  // Keep logged-in users out of auth pages
  if (hasSession && (pathname === '/auth/signin' || pathname === '/auth/signup')) {
    const url = req.nextUrl.clone();
    url.pathname = '/app/dashboard';
    return withVisitorCookie(NextResponse.redirect(url), req);
  }

  const res = NextResponse.next({ request: { headers: rewriteHeaders } });
  res.cookies.set(MARKET_COOKIE, market, { path: '/', sameSite: 'lax', httpOnly: false });
  return withVisitorCookie(res, req);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api).*)'],
};
