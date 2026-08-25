// data/jobs/pipeline.ts
//
// Ingests jobs from every configured source, classifies them from the source's
// OWN taxonomy (zero AI), and records the run in IngestRun.

import { prisma } from '@/lib/prisma';
import { fetchVacancyMailJobs } from './sources/vacancymail';
import { fetchAdzunaJobs, adzunaConfigured } from './sources/adzuna';
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

/** Adzuna tags mirroring the same brackets. One API call each — quota is finite. */
const ADZUNA_CATEGORIES = [
  'it-jobs',
  'accounting-finance-jobs',
  'sales-jobs',
  'admin-jobs',
  'engineering-jobs',
  'graduate-jobs',
  'pr-advertising-marketing-jobs',
  'healthcare-nursing-jobs',
];

const MAX_PER_CATEGORY = 8;
const ADZUNA_RESULTS_PER_PAGE = 20;

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
    const za = (
      await fetchAdzunaJobs({
        categoryTags: ADZUNA_CATEGORIES,
        resultsPerPage: ADZUNA_RESULTS_PER_PAGE,
        onProgress: log,
      })
    ).filter((j) => !knownUrls.has(j.url));

    log('');
    const persisted = await persist([...zw, ...za], log);
    result.saved = persisted.saved;
    result.skipped = persisted.skipped;

    // Anything past its advertised closing date drops out of the feed.
    const expired = await prisma.jobPost.updateMany({
      where: { status: 'ACTIVE', expiresAt: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    });
    result.expired = expired.count;
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
