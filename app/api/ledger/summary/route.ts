// app/api/ledger/summary/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { startOfMonth } from 'date-fns';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

    const start = startOfMonth(new Date());

    // All ledger entries for this user since month start
    const entries = await prisma.ledger.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: start },
      },
      orderBy: { createdAt: 'desc' },
    });

    // compute summary: credits consumed this month (negative credits are spends)
    const creditsThisMonth = entries.reduce((acc, e) => acc + Math.abs(e.credits), 0);

    // breakdown by type
    const breakdownMap: Record<string, { count: number; credits: number }> = {};
    for (const e of entries) {
      const t = e.type || 'UNKNOWN';
      if (!breakdownMap[t]) breakdownMap[t] = { count: 0, credits: 0 };
      breakdownMap[t].count += 1;
      breakdownMap[t].credits += Math.abs(e.credits);
    }

    // simple totals for dashboard (map common names)
    const totals = {
      resumes: entries.filter(e => e.type?.includes('RESUME')).length,
      tailorings: entries.filter(e => e.type?.includes('TAILOR') || e.type?.includes('TAILORED')).length,
      coverLetters: entries.filter(e => e.type?.includes('COVER_LETTER') || e.type?.includes('COVER')).length,
    };

    const breakdown = Object.entries(breakdownMap).map(([type, { count, credits }]) => ({ type, count, credits }));

    return NextResponse.json({
      ok: true,
      summary: {
        creditsThisMonth,
        monthLimit: 150, // optional, change if you have a per-month quota
        breakdown,
        totals,
      },
    });
  } catch (err: any) {
    console.error('ledger/summary error', err);
    console.log(err)
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
