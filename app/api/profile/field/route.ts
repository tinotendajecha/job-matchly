// app/api/profile/field/route.ts
//
// The one-question alternative to full onboarding: which field are you in.
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { BRACKETS } from '@/lib/jobs/brackets';

// BRACKETS is a const tuple; widen it for runtime membership checks on input.
const VALID: readonly string[] = BRACKETS;
import { rebuildMatchesForUser } from '@/lib/jobs/match';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The bracket of the job that brought this visitor here, if we know it. */
function arrivalHint(): { bracket: string; jobTitle: string } | null {
  try {
    const raw = cookies().get('jm_arrival')?.value;
    if (!raw) return null;
    const parsed = JSON.parse(decodeURIComponent(raw));
    // Only trust a value that is actually one of ours.
    if (typeof parsed?.bracket !== 'string' || !VALID.includes(parsed.bracket)) return null;
    return { bracket: parsed.bracket, jobTitle: String(parsed.jobTitle ?? '').slice(0, 120) };
  } catch {
    return null;
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

  const profession = await prisma.userProfession.findUnique({
    where: { userId: user.id },
    select: { bracket: true, method: true },
  });

  return NextResponse.json({
    ok: true,
    brackets: BRACKETS,
    current: profession?.bracket ?? null,
    // Only a self-made choice counts as answered. A rules guess still deserves
    // to be confirmed, since it is what drives their whole feed.
    answered: profession?.method === 'SELF',
    suggestion: arrivalHint(),
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

  try {
    const { bracket } = await req.json();
    if (typeof bracket !== 'string' || !VALID.includes(bracket)) {
      return NextResponse.json({ ok: false, error: 'Unknown field' }, { status: 400 });
    }

    const hint = arrivalHint();
    // Record how they got here, so a surprising tag can be explained later.
    const evidence =
      hint?.bracket === bracket
        ? `self-selected, arrived from "${hint.jobTitle}"`
        : hint
          ? `self-selected (arrived from a ${hint.bracket} job)`
          : 'self-selected';

    await prisma.userProfession.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        bracket,
        // SELF outranks every inferred source, and the taggers skip it.
        method: 'SELF',
        confidence: 1,
        evidence,
      },
      update: { bracket, method: 'SELF', confidence: 1, evidence, derivedAt: new Date() },
    });

    // Rules-based, no AI: rebuilding here means their feed is right on the very
    // next page load rather than after the weekly run.
    const matches = await rebuildMatchesForUser(user.id);

    return NextResponse.json({ ok: true, bracket, matches });
  } catch (error) {
    console.error('field save error:', error);
    return NextResponse.json({ ok: false, error: 'Could not save your field' }, { status: 500 });
  }
}
