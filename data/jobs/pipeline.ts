// data/jobs/pipeline.ts
//
// Ingests jobs from every configured source, classifies them from the source's
// OWN taxonomy (zero AI), and records the run in IngestRun.

import { prisma } from '@/lib/prisma';
import { fetchVacancyMailJobs } from './sources/vacancymail';
import { fetchAdzunaJobs, adzunaConfigured } from './sources/adzuna';
import { ADZUNA_BRACKETS } from '@/lib/jobs/brackets';
import { UNDATED_JOB_MAX_AGE_DAYS, EXPIRED_JOB_ARCHIVE_DAYS, undatedJobCutoff } from '@/lib/jobs/policy';
import type { JobIngestResult, RawJob } from './types';

/**
 * VacancyMail categories worth crawling. Ordered so the brackets our users
 * actually occupy (heavily IT/graduate in Zimbabwe) come first.
 */
const VACANCYMAIL_CATEGORIES = [
  'ict-computer-jobs-in-zimbabwe',
  'graduate-trainee-jobs-in-zimbabwe',
  'attachment-internship-jobs-in-zimbabwe',
  'accounting-finance-jobs-in-zimbabwe',
  'sales-marketing-jobs-in-zimbabwe',
  'admin-office-jobs-in-zimbabwe',
  'engineering-jobs-in-zimbabwe',
  'ngo-social-services-jobs-in-zimbabwe',
  'healthcare-jobs-in-zimbabwe',
  'human-resources-jobs-in-zimbabwe',
  'banking-jobs-in-zimbabwe',
  'procurement-and-supply-chain-management-jobs-in-zimbabwe',
  'education-teaching-jobs-in-zimbabwe',
  'pr-communication-graphic-design-jobs-in-zimbabwe',
];

/**
 * Adzuna tags, ordered by how many tagged users sit in each bracket at run
 * time — quota should be spent where our users actually are.
 */
const ADZUNA_CATEGORIES = [
  'it-jobs',
  'accounting-finance-jobs',
  'sales-jobs',
  'admin-jobs',
  'engineering-jobs',
  'graduate-jobs',
  'pr-advertising-marketing-jobs',
  'healthcare-nursing-jobs',
  'logistics-warehouse-jobs',
  'teaching-jobs',
  'trade-construction-jobs',
  'legal-jobs',
];

const MAX_PER_CATEGORY = 8;

/**
 * Adzuna's maximum. Crucially this costs NO extra quota — one request returning
 * 50 jobs bills the same as one returning 20 — so it is free coverage.
 */
const ADZUNA_RESULTS_PER_PAGE = 50;

/**
 * Hard ceiling per run: 12 × 30 days = 360 calls/month against a ~1000 free
 * tier, leaving headroom for retries and manual runs.
 */
const ADZUNA_MAX_CALLS_PER_RUN = 12;

/** Puts the brackets our users occupy at the front of the queue. */
async function orderCategoriesByDemand(tags: string[]): Promise<string[]> {
  const byBracket = await prisma.userProfession.groupBy({ by: ['bracket'], _count: true });
  const demand = new Map(byBracket.map((b) => [b.bracket, b._count]));
  return [...tags].sort(
    (a, b) =>
      (demand.get(ADZUNA_BRACKETS[b] ?? '') ?? 0) - (demand.get(ADZUNA_BRACKETS[a] ?? '') ?? 0)
  );
}

/**
 * Moves long-expired listings into the archive. Nothing is deleted.
 *
 * This used to hard-delete after the retention window, which quietly destroyed
 * the only dataset we can't re-acquire: what the market looked like last month.
 * Job seekers are unaffected either way — liveJobWhere() matches ACTIVE only.
 */
export async function archiveExpiredJobs(): Promise<{ archived: number }> {
  const cutoff = new Date(Date.now() - EXPIRED_JOB_ARCHIVE_DAYS * 86_400_000);
  const { count } = await prisma.jobPost.updateMany({
    where: { status: 'EXPIRED', closedAt: { lt: cutoff } },
    data: { status: 'ARCHIVED' },
  });
  return { archived: count };
}

async function persist(jobs: RawJob[], log: (m: string) => void) {
  let saved = 0;
  let skipped = 0;

  for (const job of jobs) {
    try {
      const existing = await prisma.jobPost.findUnique({
        where: { source_sourceRef: { source: job.source, sourceRef: job.sourceRef } },
        select: { id: true },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.jobPost.create({
        data: {
          source: job.source,
          sourceRef: job.sourceRef,
          url: job.url,
          title: job.title,
          company: job.company,
          companyLogo: job.companyLogo,
          location: job.location,
          market: job.market,
          employmentType: job.employmentType,
          salaryText: job.salaryText,
          description: job.description,
          bracket: job.bracket,
          sourceCategory: job.sourceCategory,
          seniority: job.seniority,
          postedAt: job.postedAt,
          expiresAt: job.expiresAt,
        },
      });
      log(`  [saved] ${job.title} — ${job.company ?? 'unknown'} [${job.bracket}]`);
      saved++;
    } catch (e) {
      // A duplicate url from a different sourceRef lands here; treat as skip.
      skipped++;
    }
  }

  return { saved, skipped };
}

export async function runJobsPipeline(
  trigger: 'MANUAL' | 'CRON' = 'MANUAL'
): Promise<JobIngestResult> {
  const run = await prisma.ingestRun.create({
    data: { kind: 'JOBS', trigger, status: 'RUNNING' },
  });

  const log = (m: string) => console.log(m);
  let result: JobIngestResult = { saved: 0, skipped: 0, errors: 0, expired: 0 };
  let failed = false;
  let errorMessage: string | undefined;

  try {
    const knownUrls = new Set(
      (await prisma.jobPost.findMany({ select: { url: true } })).map((j) => j.url)
    );
    const isKnownUrl = async (url: string) => knownUrls.has(url);

    log('\n[vacancymail] Zimbabwe');
    const zw = await fetchVacancyMailJobs({
      categories: VACANCYMAIL_CATEGORIES,
      maxPerCategory: MAX_PER_CATEGORY,
      isKnownUrl,
      onProgress: log,
    });

    log(`\n[adzuna] South Africa${adzunaConfigured() ? '' : ' (not configured)'}`);
    const adzunaResult = await fetchAdzunaJobs({
      categoryTags: await orderCategoriesByDemand(ADZUNA_CATEGORIES),
      resultsPerPage: ADZUNA_RESULTS_PER_PAGE,
      maxAgeDays: UNDATED_JOB_MAX_AGE_DAYS, // don't ingest what expiry will hide
      maxCalls: ADZUNA_MAX_CALLS_PER_RUN,
      onProgress: log,
    });
    const za = adzunaResult.jobs.filter((j) => !knownUrls.has(j.url));

    log('');
    const persisted = await persist([...zw, ...za], log);
    result.saved = persisted.saved;
    result.skipped = persisted.skipped;

    // 1) Anything past its advertised closing date drops out of the feed.
    const closedAt = new Date();
    const expiredByDate = await prisma.jobPost.updateMany({
      where: { status: 'ACTIVE', expiresAt: { lt: closedAt } },
      data: { status: 'EXPIRED', closedAt },
    });

    // 2) Adzuna publishes no closing date, so undated listings would otherwise
    // stay ACTIVE forever. Age them out instead — a listing this old is usually
    // filled, and sending someone to a closed vacancy is worse than a shorter feed.
    const staleCutoff = undatedJobCutoff();
    const expiredByAge = await prisma.jobPost.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: null,
        OR: [{ postedAt: { lt: staleCutoff } }, { postedAt: null, createdAt: { lt: staleCutoff } }],
      },
      data: { status: 'EXPIRED', closedAt },
    });

    result.expired = expiredByDate.count + expiredByAge.count;
    log(
      `\n[expiry] ${expiredByDate.count} past closing date, ${expiredByAge.count} aged out (>${UNDATED_JOB_MAX_AGE_DAYS}d, no closing date)`
    );
  } catch (e) {
    failed = true;
    errorMessage = (e as Error)?.message || String(e);
    throw e;
  } finally {
    await prisma.ingestRun.update({
      where: { id: run.id },
      data: {
        status: failed ? 'FAILED' : 'SUCCESS',
        saved: result.saved,
        skipped: result.skipped,
        errors: result.errors,
        errorMessage,
        finishedAt: new Date(),
      },
    });
  }

  return result;
}
