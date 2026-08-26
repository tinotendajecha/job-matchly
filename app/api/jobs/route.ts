// app/api/jobs/route.ts
import { NextResponse } from 'next/server';
import type { MarketCode, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { resolveMarket } from '@/lib/market/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 9;
const MAX_LIMIT = 24;

/**
 * Which country's jobs to show by default.
 *
 * Middleware doesn't run on /api, so there's no x-market header here. The
 * jm_market cookie it sets is the most reliable signal; the host is the
 * fallback (jobmatchly.site -> ZW, jobmatchly.co.za -> ZA).
 */
function defaultMarket(req: Request): MarketCode {
  const cookie = req.headers.get('cookie') || '';
  const fromCookie = cookie.match(/(?:^|;\s*)jm_market=(ZW|ZA)(?:;|$)/i)?.[1];
  if (fromCookie === 'ZW' || fromCookie === 'ZA') return fromCookie;
  return resolveMarket(req.headers.get('x-forwarded-host') || req.headers.get('host'));
}

type JobRow = {
  id: string;
  title: string;
  company: string | null;
  companyLogo: string | null;
  location: string | null;
  market: string;
  employmentType: string | null;
  salaryText: string | null;
  bracket: string | null;
  seniority: string | null;
  url: string;
  postedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
};

function serialize(job: JobRow, reasons: string[] = []) {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    companyLogo: job.companyLogo,
    location: job.location,
    market: job.market,
    employmentType: job.employmentType,
    salaryText: job.salaryText,
    bracket: job.bracket,
    seniority: job.seniority,
    url: job.url,
    postedAt: (job.postedAt ?? job.createdAt).toISOString(),
    expiresAt: job.expiresAt ? job.expiresAt.toISOString() : null,
    reasons,
  };
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

    const url = new URL(req.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || DEFAULT_LIMIT, 1), MAX_LIMIT);
    const page = Math.max(Number(url.searchParams.get('page')) || 1, 1);
    const skip = (page - 1) * limit;

    const requested = (url.searchParams.get('market') || '').toUpperCase();
    const resolvedDefault = defaultMarket(req);
    // "ALL" is an explicit opt-in; anything unrecognised falls back to the
    // visitor's own country rather than silently showing everything.
    const market: MarketCode | 'ALL' =
      requested === 'ALL' ? 'ALL' : requested === 'ZW' || requested === 'ZA' ? requested : resolvedDefault;

    const marketWhere = market === 'ALL' ? {} : { market: market as MarketCode };
    const liveJob: Prisma.JobPostWhereInput = {
      status: 'ACTIVE',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      ...marketWhere,
    };

    const profession = await prisma.userProfession.findUnique({
      where: { userId: user.id },
      select: { bracket: true, primaryRole: true, seniority: true },
    });

    // Counts per market power the filter tabs, so an empty tab is visible
    // before the user clicks it.
    const countsRaw = await prisma.jobPost.groupBy({
      by: ['market'],
      where: { status: 'ACTIVE', OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      _count: true,
    });
    const counts = {
      ZW: countsRaw.find((c) => c.market === 'ZW')?._count ?? 0,
      ZA: countsRaw.find((c) => c.market === 'ZA')?._count ?? 0,
      ALL: countsRaw.reduce((sum, c) => sum + c._count, 0),
    };

    const meta = {
      market,
      defaultMarket: resolvedDefault,
      counts,
      profession,
    };

    const total = await prisma.jobPost.count({ where: liveJob });

    // Matched jobs rank first, then the rest of that country's live jobs by
    // recency. Matches are capped per user, so without this top-up filtering to
    // a country would show a handful of jobs while the tab advertised dozens.
    const matched = profession
      ? await prisma.jobMatch.findMany({
          where: { userId: user.id, job: liveJob },
          orderBy: { score: 'desc' },
          include: { job: true },
        })
      : [];

    const matchedIds = matched.map((m) => m.jobId);
    const jobs: Array<ReturnType<typeof serialize>> = [];

    // Page may straddle the boundary between matched and unmatched jobs.
    const fromMatched = matched.slice(skip, skip + limit);
    jobs.push(
      ...fromMatched.map((m) => serialize(m.job, Array.isArray(m.reasons) ? (m.reasons as string[]) : []))
    );

    if (jobs.length < limit) {
      const restSkip = Math.max(0, skip - matched.length);
      const rest = await prisma.jobPost.findMany({
        where: { ...liveJob, ...(matchedIds.length ? { id: { notIn: matchedIds } } : {}) },
        orderBy: [{ postedAt: 'desc' }, { createdAt: 'desc' }],
        skip: restSkip,
        take: limit - jobs.length,
      });
      jobs.push(...rest.map((j) => serialize(j)));
    }

    return NextResponse.json({
      ok: true,
      // "Personalized" describes this page of results, not the account.
      personalized: fromMatched.length > 0,
      hasProfession: Boolean(profession),
      matchedTotal: matched.length,
      ...meta,
      jobs,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    console.error('jobs route error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to load jobs' }, { status: 500 });
  }
}
