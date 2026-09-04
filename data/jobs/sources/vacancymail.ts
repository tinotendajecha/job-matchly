// data/jobs/sources/vacancymail.ts
//
// Zimbabwe job listings from vacancymail.co.zw.
//
// Their robots.txt disallows /login/, /register/, /static/, /candidate/,
// /employer_admin/, /admin/ and /vacancy/apply/ — none of which we touch. The
// /jobs/ and /categories/ paths we read are not disallowed, and individual job
// pages publish schema.org JobPosting JSON-LD, which is data meant to be
// machine-read.
//
// The parsing lives in zimJobBoard.ts: ihararejobs.com runs the same platform,
// down to the malformed JSON-LD and the "Sept. 2, 2026, 1:20 p.m." dates, so
// every quirk fixed there is fixed for both.
import { VACANCYMAIL_BRACKETS } from '@/lib/jobs/brackets';
import { crawlZimJobBoard, type BoardConfig } from './zimJobBoard';
import type { RawJob, SourceCoverage } from '../types';

export { parseBoardDate as parseVacancyMailDate } from './zimJobBoard';

const CONFIG: BoardConfig = {
  base: 'https://vacancymail.co.zw',
  source: 'VACANCYMAIL',
  jobPath: '/jobs/',
  brackets: VACANCYMAIL_BRACKETS,
};

export async function fetchVacancyMailJobs(options: {
  categories: string[];
  maxPerCategory: number;
  isKnownUrl: (url: string) => Promise<boolean>;
  onProgress?: (message: string) => void;
}): Promise<{ jobs: RawJob[]; seenUrls: string[]; coverage: SourceCoverage }> {
  return crawlZimJobBoard({ config: CONFIG, ...options });
}
