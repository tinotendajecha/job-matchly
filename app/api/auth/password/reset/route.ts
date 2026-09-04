// app/api/auth/password/reset/route.ts
import { NextResponse } from 'next/server';
import { consumeResetToken, MIN_PASSWORD_LENGTH } from '@/lib/auth/passwordReset';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REASON_MESSAGE: Record<string, string> = {
  invalid: 'This reset link is not valid. Request a new one.',
  expired: 'This reset link has expired. Request a new one.',
  used: 'This reset link has already been used. Request a new one.',
  weak: `Choose a password of at least ${MIN_PASSWORD_LENGTH} characters.`,
};

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();
    const result = await consumeResetToken(token, password);

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, reason: result.reason, error: REASON_MESSAGE[result.reason] },
        // A bad password is the caller's input; a dead token is not an auth
        // failure worth a 401, since there is nobody to authenticate yet.
        { status: result.reason === 'weak' ? 400 : 410 }
      );
    }

    // Every session was destroyed, so they sign in fresh with the new password.
    return NextResponse.json({
      ok: true,
      message: 'Password updated. Sign in with your new password.',
    });
  } catch (error) {
    console.error('password reset error:', error);
    return NextResponse.json({ ok: false, error: 'Could not reset your password' }, { status: 500 });
  }
}
