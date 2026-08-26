// app/api/public/stats/route.ts
//
// Real product numbers for the landing page.
//
// These replace hardcoded claims ("12K+ Active Users", "94% ATS Pass Rate")
// that were not true. Everything here is counted from the database, and figures
// are rounded DOWN so a number can never overstate reality between cache
// refreshes.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { liveJobWhere } from '@/lib/jobs/policy';

export const runtime = 'nodejs';
// Cached for an hour — a marketing page must not hammer the database.
export const revalidate = 3600;

/** 779 -> 750, 247 -> 200. Always downward, never a number we can't back up. */
function roundDown(n: number): number {
  if (n < 10) return n;
  if (n < 100) return Math.floor(n / 10) * 10;
  if (n < 1000) return Math.floor(n / 50) * 50;
  return Math.floor(n / 500) * 500;
}

export async function GET() {
  try {
    const [liveJobs, resumesTailored, documentsCreated, careerArticles] = await Promise.all([
      prisma.jobPost.count({ where: liveJobWhere() }),
      prisma.document.count({ where: { kind: 'TAILORED_RESUME' } }),
      prisma.document.count(),
      prisma.briefingItem.count({ where: { status: 'PUBLISHED' } }),
    ]);

    return NextResponse.json(
      {
        ok: true,
        liveJobs: roundDown(liveJobs),
        resumesTailored: roundDown(resumesTailored),
        documentsCreated: roundDown(documentsCreated),
        careerArticles: roundDown(careerArticles),
        markets: ['ZW', 'ZA'],
      },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
    );
  } catch (error) {
    console.error('public stats error:', error);
    // Never invent a number on failure — the page renders without one.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
