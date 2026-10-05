// middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { marketFromCountry, normalizeMarketCode, resolveMarket, type MarketCode } from '@/lib/market/config';

const MARKET_COOKIE = 'jm_market';
const VISITOR_COOKIE = 'jm_vid';
const CANONICAL_ORIGIN = 'https://www.jobmatchly.co.za';
const RETIRED_DOMAIN = 'jobmatchly.site';

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

// jobmatchly.site was dropped; anything still reaching it goes to the one
// domain we keep, same path and query.
function retiredDomainRedirect(req: NextRequest, hostname: string): string | null {
  if (hostname !== RETIRED_DOMAIN && !hostname.endsWith(`.${RETIRED_DOMAIN}`)) return null;
  return `${CANONICAL_ORIGIN}${req.nextUrl.pathname}${req.nextUrl.search}`;
}

// Both markets live on jobmatchly.co.za, so the host no longer says which one a
// visitor belongs to. The market already chosen this session (the cookie) wins,
// so it can't flip mid-checkout; otherwise the visitor's country decides;
// otherwise the host (ZA in production, DEFAULT_MARKET locally).
function resolveRequestMarket(req: NextRequest, hostname: string): MarketCode {
  const geoCountry =
    req.headers.get('x-vercel-ip-country') || ((req as any).geo?.country as string | undefined);
  return (
    normalizeMarketCode(req.cookies.get(MARKET_COOKIE)?.value) ??
    marketFromCountry(geoCountry) ??
    resolveMarket(hostname)
  );
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

  const retired = retiredDomainRedirect(req, hostname);
  if (retired) return NextResponse.redirect(retired, 308);

  const market: MarketCode = resolveRequestMarket(req, hostname);

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
