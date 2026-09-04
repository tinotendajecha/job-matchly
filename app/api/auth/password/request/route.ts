// app/api/auth/password/request/route.ts
import { NextResponse } from 'next/server';
import { createResetForEmail, RESET_TOKEN_TTL_MINUTES } from '@/lib/auth/passwordReset';
import { sendPasswordResetEmail } from '@/lib/mail';
import { shareBaseUrl } from '@/lib/jobs/share';
import { getMarketFromRequest } from '@/lib/market/request';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Always answers the same way.
 *
 * Confirming whether an address has an account would make this a free account
 * enumeration endpoint, so a missing user, a rate-limited user and a successful
 * send are indistinguishable from outside.
 */
const SAME_ANSWER = {
  ok: true,
  message: "If that email has an account, we've sent a reset link.",
};

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(SAME_ANSWER);
    }

    const reset = await createResetForEmail(email);
    if (!reset) return NextResponse.json(SAME_ANSWER);

    const base = shareBaseUrl(getMarketFromRequest(req));
    const resetUrl = `${base}/auth/reset?token=${reset.token}`;

    try {
      await sendPasswordResetEmail({
        to: email.trim().toLowerCase(),
        name: reset.name,
        resetUrl,
        ttlMinutes: RESET_TOKEN_TTL_MINUTES,
      });
    } catch (err) {
      // Logged, not surfaced: telling the caller the send failed would reveal
      // that the address exists.
      console.error('password reset email failed to send', err);
    }

    return NextResponse.json(SAME_ANSWER);
  } catch (error) {
    console.error('password reset request error:', error);
    return NextResponse.json(SAME_ANSWER);
  }
}
