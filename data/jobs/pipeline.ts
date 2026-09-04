// data/jobs/pipeline.ts
//
// Ingests jobs from every configured source, classifies them from the source's
// OWN taxonomy (zero AI), and records the run in IngestRun.

import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { fetchVacancyMailJobs } from './sources/vacancymail';
import { fetchIhararejobs } from './sources/ihararejobs';
import { fetchAdzunaJobs, adzunaConfigured } from './sources/adzuna';
import { ADZUNA_BRACKETS } from '@/lib/jobs/brackets';
import {
  UNDATED_JOB_MAX_AGE_DAYS,
  EXPIRED_JOB_ARCHIVE_DAYS,
  undatedJobCutoff,
  seenRecentlyCutoff,
} from '@/lib/jobs/policy';
import type { JobIngestResult, RawJob, SourceCoverage } from './types';

/**
 * VacancyMail categories worth crawling. Ordered so the brackets our users
 * actually occupy (heavily IT/graduate in Zimbabwe) come first.
 */
/**
 * ihararejobs.com categories worth crawling.
 *
 * Weighted towards the brackets our Zimbabwean feed is thinnest in — Software
 * & IT had 3 live listings against South Africa's 100-plus, so the technical
 * categories come first and the cap is spent on them.
 */
const IHARAREJOBS_CATEGORIES = [
  'ict',
  'software-engineering',
  'telecommunications',
  'engineering',
  'accounting',
  'banking-and-finance-jobs',
  'finance',
  'sales-and-marketing',
  'admin-and-office-jobs',
  'human-resources',
  'healthcare',
  'nursing-jobs-in-zimbabwe',
  'ngo-jobs-in-zimbabwe',
  'education',
  'logistics',
  'purchasing-and-supply',
  'law',
  'construction',
  'mining',
  'graduate-jobs-in-zimbabwe',
  'internship',
  'general-jobs',
];

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
  let coverage: Record<string, SourceCoverage> | null = null;

  try {
    const knownUrls = new Set(
      (await prisma.jobPost.findMany({ select: { url: true } })).map((j) => j.url)
    );
    const isKnownUrl = async (url: string) => knownUrls.has(url);

    log('\n[vacancymail] Zimbabwe');
    const vmResult = await fetchVacancyMailJobs({
      categories: VACANCYMAIL_CATEGORIES,
      maxPerCategory: MAX_PER_CATEGORY,
      isKnownUrl,
      onProgress: log,
    });

    log('\n[ihararejobs] Zimbabwe');
    const ihResult = await fetchIhararejobs({
      categories: IHARAREJOBS_CATEGORIES,
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
    const zw = [...vmResult.jobs, ...ihResult.jobs];
    const za = adzunaResult.jobs.filter((j) => !knownUrls.has(j.url));

    log('');
    const persisted = await persist([...zw, ...za], log);
    result.saved = persisted.saved;
    result.skipped = persisted.skipped;

    // Anything still advertised on its source is confirmed open, regardless of
    // whether we re-fetched it. This is the observation that later separates a
    // listing the market closed from one our own ageing rule hid.
    const seenUrls = [
      ...new Set([...vmResult.seenUrls, ...ihResult.seenUrls, ...adzunaResult.seenUrls]),
    ];
    const seenAt = new Date();
    let refreshed = 0;
    for (let i = 0; i < seenUrls.length; i += 500) {
      const { count } = await prisma.jobPost.updateMany({
        where: { url: { in: seenUrls.slice(i, i + 500) } },
        data: { lastSeenAt: seenAt },
      });
      refreshed += count;
    }
    result.refreshed = refreshed;
    log(`
[presence] ${refreshed} of ${seenUrls.length} observed listings confirmed still open`);

    coverage = {
      VACANCYMAIL: vmResult.coverage,
      IHARAREJOBS: ihResult.coverage,
      ADZUNA: adzunaResult.coverage,
    };

    // 1) Anything past its advertised closing date drops out of the feed.
    const closedAt = new Date();
    const expiredByDate = await prisma.jobPost.updateMany({
      where: { status: 'ACTIVE', expiresAt: { lt: closedAt } },
      data: { status: 'EXPIRED', closedAt },
    });

    // 2) Adzuna publishes no closing date, so undated listings would otherwise
    // stay ACTIVE forever. Age them out instead — a listing this old is usually
    // filled, and sending someone to a closed vacancy is worse than a shorter feed.
    //
    // Unless the source still carries it. The age rule is a guess standing in
    // for a closing date we don't have; a listing seen in this very run is
    // evidence against that guess, and expiring it anyway hid jobs people could
    // still apply to.
    const staleCutoff = undatedJobCutoff();
    const expiredByAge = await prisma.jobPost.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: null,
        OR: [{ postedAt: { lt: staleCutoff } }, { postedAt: null, createdAt: { lt: staleCutoff } }],
        NOT: { lastSeenAt: { gte: seenRecentlyCutoff() } },
      },
      data: { status: 'EXPIRED', closedAt },
    });

    // A listing we previously aged out but have now seen again is open after
    // all, so put it back rather than leaving it buried until the next crawl.
    const revived = await prisma.jobPost.updateMany({
      where: {
        status: 'EXPIRED',
        expiresAt: null,
        lastSeenAt: { gte: seenAt },
      },
      data: { status: 'ACTIVE', closedAt: null },
    });
    if (revived.count > 0) {
      log(`[revived] ${revived.count} listing(s) the source still advertises`);
    }

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
        // Written even on failure — a run that died halfway is exactly the case
        // where a later trend query would otherwise read our outage as the
        // market going quiet.
        meta: (coverage
          ? { sources: coverage, refreshed: result.refreshed ?? 0 }
          : { sources: null, refreshed: 0 }) as unknown as Prisma.InputJsonValue,
      },
    });
  }

  return result;
}
