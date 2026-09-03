// app/api/profile/me/route.ts
//
// Everything the profile page shows. Previously that page rendered a hardcoded
// "John Doe" with an invented activity log, so this exists to replace fiction
// with the user's own record.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getEffectiveTier } from '@/lib/subscription/service';
import { FREE_TAILOR_LIFETIME_LIMIT } from '@/lib/pricing/plans';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ACTIVITY_LIMIT = 8;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

  const [row, profile, documents, counts, profession, tier] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        name: true,
        email: true,
        image: true,
        createdAt: true,
        emailVerified: true,
        freeTailorsUsed: true,
      },
    }),
    prisma.profile.findUnique({
      where: { userId: user.id },
      select: { headline: true, location: true, targetRoles: true },
    }),
    prisma.document.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: ACTIVITY_LIMIT,
      select: { id: true, kind: true, title: true, createdAt: true },
    }),
    prisma.document.groupBy({ by: ['kind'], where: { userId: user.id }, _count: true }),
    prisma.userProfession.findUnique({
      where: { userId: user.id },
      select: { bracket: true },
    }),
    getEffectiveTier(user.id),
  ]);

  if (!row) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

  const countOf = (kind: string) => counts.find((c) => c.kind === kind)?._count ?? 0;

  return NextResponse.json({
    ok: true,
    profile: {
      name: row.name ?? '',
      email: row.email ?? '',
      image: row.image,
      headline: profile?.headline ?? '',
      location: profile?.location ?? '',
      targetRoles: profile?.targetRoles ?? '',
      joinedAt: row.createdAt.toISOString(),
      emailVerified: Boolean(row.emailVerified),
      bracket: profession?.bracket ?? null,
    },
    stats: {
      tailored: countOf('TAILORED_RESUME'),
      coverLetters: countOf('COVER_LETTER'),
      created: countOf('CREATED_RESUME'),
      tier,
      // Only meaningful for someone without a plan.
      freeTailorsLeft: tier ? null : Math.max(0, FREE_TAILOR_LIFETIME_LIMIT - row.freeTailorsUsed),
    },
    // Real documents, newest first. The page used to invent these, including
    // an "ATS check passed" entry for a feature that does not exist.
    activity: documents.map((d) => ({
      id: d.id,
      kind: d.kind,
      title: d.title || 'Untitled',
      createdAt: d.createdAt.toISOString(),
    })),
  });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

  try {
    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : undefined;
    const headline = typeof body.headline === 'string' ? body.headline.trim().slice(0, 160) : undefined;
    const location = typeof body.location === 'string' ? body.location.trim().slice(0, 120) : undefined;

    if (name !== undefined) {
      await prisma.user.update({ where: { id: user.id }, data: { name } });
    }

    if (headline !== undefined || location !== undefined) {
      // Profile may not exist yet for someone who never went through onboarding.
      await prisma.profile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          ...(headline !== undefined ? { headline } : {}),
          ...(location !== undefined ? { location } : {}),
        },
        update: {
          ...(headline !== undefined ? { headline } : {}),
          ...(location !== undefined ? { location } : {}),
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('profile update error:', error);
    return NextResponse.json({ ok: false, error: 'Could not save your profile' }, { status: 500 });
  }
}
