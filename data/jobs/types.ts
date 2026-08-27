// data/jobs/types.ts
import type { JobSource, MarketCode } from '@prisma/client';

/** A job as a source hands it over, before it's persisted. */
export interface RawJob {
  source: JobSource;
  sourceRef: string;
  url: string;
  title: string;
  company: string | null;
  companyLogo: string | null;
  location: string | null;
  market: MarketCode;
  employmentType: string | null;
  salaryText: string | null;
  description: string;
  bracket: string;
  sourceCategory: string | null;
  seniority: string | null;
  postedAt: Date | null;
  expiresAt: Date | null;
}

/**
 * What a source actually managed to cover in one run.
 *
 * This is the denominator for every later trend question. A jump in listings
 * means nothing unless we know whether we crawled more ground than last time.
 */
export interface SourceCoverage {
  categoriesAttempted: number;
  categoriesOk: number;
  categoriesFailed: string[];
  /** Distinct listing URLs observed on the source, including ones we already had. */
  listingsSeen: number;
  /** API calls spent, for sources with a quota. */
  callsUsed?: number;
  /** Categories where we hit the per-category cap, so coverage there is partial. */
  cappedCategories?: string[];
}

export interface JobIngestResult {
  saved: number;
  skipped: number;
  errors: number;
  expired: number;
  /** Listings confirmed still present on their source this run. */
  refreshed?: number;
}
