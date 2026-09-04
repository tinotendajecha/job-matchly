// data/jobs/sources/ihararejobs.ts
//
// Zimbabwe job listings from ihararejobs.com.
//
// Added because Zimbabwe coverage was 88 live jobs against South Africa's
// 3,527 — and only 3 of those were Software & IT, the thinnest bracket of the
// twelve.
//
// Their robots.txt disallows /login/, /register/, /static/, /candidate/,
// /employer_admin/, /admin/ and /vacancy/apply/ — none of which we touch. The
// /categories/ and /job/ paths we read are not disallowed, and job pages
// publish schema.org JobPosting JSON-LD, which is data meant to be machine-read.
//
// The site runs the same platform as vacancymail.co.zw, so the parsing lives in
// zimJobBoard.ts and this file is configuration.
import { IHARAREJOBS_BRACKETS } from '@/lib/jobs/brackets';
import { crawlZimJobBoard, type BoardConfig } from './zimJobBoard';
import type { RawJob, SourceCoverage } from '../types';

const CONFIG: BoardConfig = {
  base: 'https://www.ihararejobs.com',
  source: 'IHARAREJOBS',
  // Singular, unlike VacancyMail's /jobs/.
  jobPath: '/job/',
  brackets: IHARAREJOBS_BRACKETS,
};

export function ihararejobsConfig(): BoardConfig {
  return CONFIG;
}

export async function fetchIhararejobs(options: {
  categories: string[];
  maxPerCategory: number;
  isKnownUrl: (url: string) => Promise<boolean>;
  onProgress?: (message: string) => void;
}): Promise<{ jobs: RawJob[]; seenUrls: string[]; coverage: SourceCoverage }> {
  return crawlZimJobBoard({ config: CONFIG, ...options });
}
