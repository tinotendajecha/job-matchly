// app/api/jobs/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 24;

function serialize(job: {
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
}, reasons: string[] = []) {
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
    const limit = Math.min(Number(url.searchParams.get('limit')) || DEFAULT_LIMIT, 50);
    const bracketFilter = url.searchParams.get('bracket');

    const profession = await prisma.userProfession.findUnique({
      where: { userId: user.id },
      select: { bracket: true, primaryRole: true, seniority: true },
    });

    const liveJob = {
      status: 'ACTIVE' as const,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    };

    // Personalized path: ranked matches built by the (AI-free) matcher.
    if (profession && !bracketFilter) {
      const matches = await prisma.jobMatch.findMany({
        where: { userId: user.id, job: liveJob },
        orderBy: { score: 'desc' },
        take: limit,
        include: { job: true },
      });

      if (matches.length > 0) {
        return NextResponse.json({
          ok: true,
          personalized: true,
          profession,
          jobs: matches.map((m) => serialize(m.job, Array.isArray(m.reasons) ? (m.reasons as string[]) : [])),
        });
      }
    }

    // Fallback: newest live jobs, optionally filtered by bracket. Used for
    // untagged users and when a bracket has nothing matched yet.
    const jobs = await prisma.jobPost.findMany({
      where: { ...liveJob, ...(bracketFilter ? { bracket: bracketFilter } : {}) },
      orderBy: [{ postedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });

    return NextResponse.json({
      ok: true,
      personalized: false,
      profession,
      jobs: jobs.map((j) => serialize(j)),
    });
  } catch (error) {
    console.error('jobs route error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to load jobs' }, { status: 500 });
  }
}
