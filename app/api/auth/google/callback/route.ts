import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { consentVersionFor, recordConsent } from '@/lib/consent/service';
import { recordArrivalSignup } from '@/lib/jobs/share';
import { createSession } from '@/lib/auth';
import { getMarketFromRequest } from '@/lib/market/request';

export const runtime = 'nodejs';

function parseCookie(cookieHeader: string, name: string): string | null {
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    if (part.substring(0, eq).trim() === name) {
      return decodeURIComponent(part.substring(eq + 1).trim());
    }
  }
  return null;
}

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const fail = (reason: string) =>
    NextResponse.redirect(`${origin}/auth/signin?error=${reason}`);

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const googleError = searchParams.get('error');

  if (googleError) return fail('google_cancelled');
  if (!code || !state) return fail('google_failed');

  // Verify CSRF state
  const cookieHeader = req.headers.get('cookie') ?? '';
  const storedState = parseCookie(cookieHeader, 'google_oauth_state');
  if (!storedState || storedState !== state) return fail('google_failed');

  try {
    const redirectUri = `${origin}/api/auth/google/callback`;

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error) {
      console.error('[google-callback] token exchange failed:', tokenData);
      return fail('google_failed');
    }

    // Fetch Google profile
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    if (!profile.id || !profile.email) return fail('google_failed');

    const market = getMarketFromRequest(req);
    const consentVersion = consentVersionFor(market);
    const expiresAt = tokenData.expires_in
      ? Math.floor(Date.now() / 1000) + tokenData.expires_in
      : null;

    // Find existing user by OAuth account or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { oauthAccounts: { some: { provider: 'google', providerAccountId: profile.id } } },
          { email: profile.email },
        ],
      },
    });

    if (!user) {
      // Brand-new user — create account. Clicking "Continue with Google" constitutes consent.
      user = await prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name ?? null,
          image: profile.picture ?? null,
          emailVerified: new Date(),
          onboardingComplete: false,
          consentGiven: true,
          consentGivenAt: new Date(),
          consentVersion,
          oauthAccounts: {
            create: {
              provider: 'google',
              providerAccountId: profile.id,
              accessToken: tokenData.access_token,
              refreshToken: tokenData.refresh_token ?? null,
              expiresAt,
            },
          },
        },
      });

      await recordArrivalSignup(user.id);

      // Same rule as password signup: the agreement only. Recruiter visibility
      // stays off until the user turns it on themselves.
      await recordConsent({
        userId: user.id,
        purpose: 'ACCOUNT_TERMS',
        granted: true,
        version: consentVersion,
        source: 'signup',
      });
    } else {
      // Existing user — upsert the OAuth link and ensure email is verified
      await prisma.oAuthAccount.upsert({
        where: { provider_providerAccountId: { provider: 'google', providerAccountId: profile.id } },
        create: {
          userId: user.id,
          provider: 'google',
          providerAccountId: profile.id,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token ?? null,
          expiresAt,
        },
        update: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token ?? null,
          expiresAt,
        },
      });

      // Google is the source of truth for the photo, so take the current one.
      // Name is only filled in when we don't already have one — someone who
      // edited their name in our profile should not have it overwritten on
      // their next sign-in.
      const refresh: { emailVerified?: Date; image?: string; name?: string } = {};
      if (!user.emailVerified) refresh.emailVerified = new Date();
      if (profile.picture && profile.picture !== user.image) refresh.image = profile.picture;
      if (!user.name?.trim() && profile.name) refresh.name = profile.name;

      if (Object.keys(refresh).length > 0) {
        await prisma.user.update({ where: { id: user.id }, data: refresh });
      }
    }

    // Create session
    const { token, expires } = await createSession(user.id);
    const destination = user.onboardingComplete ? '/app/dashboard' : '/onboarding';

    const res = NextResponse.redirect(`${origin}${destination}`);

    res.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires,
    });

    // Clear the CSRF state cookie
    res.cookies.set('google_oauth_state', '', { path: '/', maxAge: 0 });

    return res;
  } catch (err) {
    console.error('[google-callback] error:', err);
    return fail('google_failed');
  }
}
