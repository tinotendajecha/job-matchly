// middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { addMarketPrefix, getMarketPrefix, stripMarketPrefix } from '@/lib/market/path';
import { resolveMarket, type MarketCode } from '@/lib/market/config';

const MARKET_COOKIE = 'jm_market';

function isSkippablePath(pathname: string) {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  );
}

// On Vercel, req.geo.country is the visitor's ISO country code.
// We only resolve ZA and ZW — all other countries fall through to
// the hostname / DEFAULT_MARKET fallback.
function getGeoMarket(req: NextRequest): MarketCode | null {
  const country = (req as any).geo?.country as string | undefined;
  if (country === 'ZA') return 'ZA';
  if (country === 'ZW') return 'ZW';
  return null;
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  if (isSkippablePath(pathname)) {
    return NextResponse.next();
  }

  const hasSession = !!req.cookies.get('session_token')?.value;

  // Market resolution order:
  // 1. Explicit /za/ or /zw/ path prefix (user or link already chose a market)
  // 2. Vercel geo detection (SA visitor → ZA, ZW visitor → ZW)
  // 3. Hostname mapping (jobmatchly.co.za → ZA, jobmatchly.site → ZW)
  // 4. DEFAULT_MARKET env var
  const marketFromPath = getMarketPrefix(pathname);
  const marketFromGeo = !marketFromPath ? getGeoMarket(req) : null;
  const marketFromHost = resolveMarket(req.headers.get('x-forwarded-host') || req.headers.get('host'));
  const market: MarketCode = marketFromPath || marketFromGeo || marketFromHost;

  const rewriteHeaders = new Headers(req.headers);
  rewriteHeaders.set('x-market', market);
  rewriteHeaders.set('x-market-path', pathname);

  // Path already has a market prefix — strip it and rewrite internally
  if (marketFromPath) {
    const rewrittenUrl = req.nextUrl.clone();
    rewrittenUrl.pathname = stripMarketPrefix(pathname);

    const response = NextResponse.rewrite(rewrittenUrl, { request: { headers: rewriteHeaders } });
    response.cookies.set(MARKET_COOKIE, market, { path: '/', sameSite: 'lax', httpOnly: false });
    return response;
  }

  // Protect /app/* and /onboarding
  if (pathname.startsWith('/app') || pathname === '/onboarding') {
    if (!hasSession) {
      const signInUrl = req.nextUrl.clone();
      signInUrl.pathname = addMarketPrefix('/auth/signin', market);
      signInUrl.searchParams.set('next', pathname + (searchParams.toString() ? `?${searchParams}` : ''));

      const response = NextResponse.redirect(signInUrl);
      response.cookies.set(MARKET_COOKIE, market, { path: '/', sameSite: 'lax', httpOnly: false });
      return response;
    }
  }

  // Keep logged-in users out of auth pages
  if (hasSession && (pathname === '/auth/signin' || pathname === '/auth/signup')) {
    const url = req.nextUrl.clone();
    url.pathname = addMarketPrefix('/app/dashboard', market);
    return NextResponse.redirect(url);
  }

  // Add the market prefix to the URL so every page has an explicit /za/ or /zw/ prefix.
  // This is where geo-detected or hostname-detected market gets stamped into the URL.
  const redirectUrl = req.nextUrl.clone();
  redirectUrl.pathname = addMarketPrefix(pathname, market);

  const response =
    pathname === redirectUrl.pathname ? NextResponse.next() : NextResponse.redirect(redirectUrl);
  response.cookies.set(MARKET_COOKIE, market, { path: '/', sameSite: 'lax', httpOnly: false });
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api).*)'],
};
