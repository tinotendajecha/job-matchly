// app/api/profile/export/route.ts
//
// Right of access: a copy of everything we hold about the signed-in person.
//
// The counterpart to account deletion. Both are POPIA rights, and having a
// delete button without a "show me what you have" button is the wrong half.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

  try {
    const [account, profile, profession, documents, matches, consents, purchases, shares, deliveries] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            emailVerified: true,
            createdAt: true,
            onboardingComplete: true,
            marketingOptOut: true,
            jobAlertsOptOut: true,
            recruiterVisible: true,
            recruiterVisibleAt: true,
            consentGiven: true,
            consentGivenAt: true,
            consentVersion: true,
            freeTailorsUsed: true,
            lastJobDigestAt: true,
          },
        }),
        prisma.profile.findUnique({ where: { userId: user.id } }),
        prisma.userProfession.findUnique({ where: { userId: user.id } }),
        // Full content, not just titles — these are documents the person wrote
        // and the main thing they'd actually want out.
        prisma.document.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            kind: true,
            title: true,
            markdown: true,
            market: true,
            createdAt: true,
            updatedAt: true,
            unlockedAt: true,
          },
        }),
        prisma.jobMatch.findMany({
          where: { userId: user.id },
          select: {
            score: true,
            reasons: true,
            createdAt: true,
            job: { select: { title: true, company: true, location: true, url: true, bracket: true } },
          },
        }),
        prisma.consentRecord.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'asc' },
          select: { purpose: true, granted: true, version: true, source: true, createdAt: true },
        }),
        prisma.purchase.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            type: true,
            amount: true,
            currency: true,
            status: true,
            market: true,
            provider: true,
            createdAt: true,
          },
        }),
        prisma.jobShareEvent.findMany({
          where: { userId: user.id },
          select: { kind: true, createdAt: true, job: { select: { title: true } } },
        }),
        prisma.emailDelivery.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'asc' },
          select: { email: true, accepted: true, lastEvent: true, createdAt: true },
        }),
      ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      about:
        'Everything JobMatchly holds about your account. Amounts are in minor units (cents). ' +
        'If something here looks wrong, email hello@jobmatchly.site.',
      account,
      profile,
      profession,
      documents,
      jobMatches: matches,
      consentHistory: consents,
      purchases,
      shareActivity: shares,
      emailsWeSentYou: deliveries,
    };

    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="jobmatchly-data-${stamp}.json"`,
        // A copy of someone's personal data should not sit in a shared cache.
        'Cache-Control': 'no-store, private',
      },
    });
  } catch (error) {
    console.error('data export error:', error);
    return NextResponse.json({ ok: false, error: 'Could not build your export' }, { status: 500 });
  }
}
