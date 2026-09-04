// app/api/profile/delete/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';
import { deleteAccount } from '@/lib/auth/deleteAccount';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

  try {
    const { confirmEmail } = await req.json();

    // Typing the address is the confirmation. A modal alone is too easy to
    // click through for something with no undo.
    if (
      typeof confirmEmail !== 'string' ||
      confirmEmail.trim().toLowerCase() !== (user.email ?? '').toLowerCase()
    ) {
      return NextResponse.json(
        { ok: false, error: 'Type your email address exactly to confirm.' },
        { status: 400 }
      );
    }

    const summary = await deleteAccount(user.id);

    // Every session is already gone server-side; clear the cookie so the
    // browser doesn't keep presenting a token that no longer resolves.
    const res = NextResponse.json({ ok: true, summary });
    res.cookies.set('session_token', '', { path: '/', maxAge: 0 });
    return res;
  } catch (error) {
    const message = (error as Error)?.message;
    if (message === 'ALREADY_DELETED') {
      return NextResponse.json({ ok: false, error: 'This account is already deleted.' }, { status: 410 });
    }
    console.error('account deletion error:', error);
    return NextResponse.json({ ok: false, error: 'Could not delete your account' }, { status: 500 });
  }
}
