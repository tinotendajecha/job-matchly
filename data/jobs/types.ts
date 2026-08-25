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

export interface JobIngestResult {
  saved: number;
  skipped: number;
  errors: number;
  expired: number;
}
