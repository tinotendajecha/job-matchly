// app/api/profile/preferences/route.ts
//
// Email preferences and recruiter discoverability. Every change here is a
// consent event, so each one is logged as well as applied.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getCurrentMarket } from '@/lib/market/request';
import {
  consentVersionFor,
  getConsentHistory,
  recordConsent,
  setRecruiterVisibility,
} from '@/lib/consent/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

  const [row, history] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        marketingOptOut: true,
        jobAlertsOptOut: true,
        recruiterVisible: true,
        recruiterVisibleAt: true,
        consentVersion: true,
      },
    }),
    getConsentHistory(user.id),
  ]);

  if (!row) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    ok: true,
    preferences: {
      // Stored as opt-OUT, shown as opt-IN. The UI asks "send me these", so
      // inverting here keeps the checkbox meaning what it says.
      marketingEmails: !row.marketingOptOut,
      jobAlerts: !row.jobAlertsOptOut,
      recruiterVisible: row.recruiterVisible,
      recruiterVisibleAt: row.recruiterVisibleAt?.toISOString() ?? null,
    },
    agreedVersion: row.consentVersion,
    currentVersion: consentVersionFor(getCurrentMarket()),
    history: history.map((h) => ({ ...h, createdAt: h.createdAt.toISOString() })),
  });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

  try {
    const body = await req.json();
    const version = consentVersionFor(getCurrentMarket());

    // One field per request: each is a separate consent decision, and batching
    // them would make the log ambiguous about what the user actually acted on.
    if (typeof body.marketingEmails === 'boolean') {
      await prisma.user.update({
        where: { id: user.id },
        data: { marketingOptOut: !body.marketingEmails },
      });
      await recordConsent({
        userId: user.id,
        purpose: 'MARKETING_EMAIL',
        granted: body.marketingEmails,
        version,
        source: 'profile',
      });
    }

    if (typeof body.jobAlerts === 'boolean') {
      await prisma.user.update({
        where: { id: user.id },
        data: { jobAlertsOptOut: !body.jobAlerts },
      });
      await recordConsent({
        userId: user.id,
        purpose: 'JOB_ALERTS',
        granted: body.jobAlerts,
        version,
        source: 'profile',
      });
    }

    if (typeof body.recruiterVisible === 'boolean') {
      await setRecruiterVisibility({
        userId: user.id,
        granted: body.recruiterVisible,
        version,
        source: 'profile',
      });
    }

    const row = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        marketingOptOut: true,
        jobAlertsOptOut: true,
        recruiterVisible: true,
        recruiterVisibleAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      preferences: {
        marketingEmails: !row?.marketingOptOut,
        jobAlerts: !row?.jobAlertsOptOut,
        recruiterVisible: row?.recruiterVisible ?? false,
        recruiterVisibleAt: row?.recruiterVisibleAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error('preferences update error:', error);
    return NextResponse.json({ ok: false, error: 'Could not save your preferences' }, { status: 500 });
  }
}
