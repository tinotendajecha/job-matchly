// data/jobs/sources/adzuna.ts
//
// South African listings via Adzuna's official REST API — a licensed
// aggregator, no scraping involved. Free tier is ~1000 calls/month, so this
// requests one page per category rather than paginating greedily.

import { ADZUNA_BRACKETS, resolveBracket, seniorityFromTitle } from '@/lib/jobs/brackets';
import type { RawJob, SourceCoverage } from '../types';

const API = 'https://api.adzuna.com/v1/api/jobs/za/search';

/** Adzuna 503s on rapid-fire requests; spacing them out keeps the run useful. */
const REQUEST_SPACING_MS = 1200;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function adzunaConfigured(): boolean {
  return Boolean(process.env.ADZUNA_APP_ID?.trim() && process.env.ADZUNA_APP_KEY?.trim());
}

interface AdzunaResult {
  id?: string;
  title?: string;
  description?: string;
  redirect_url?: string;
  created?: string;
  contract_time?: string;
  contract_type?: string;
  salary_min?: number;
  salary_max?: number;
  company?: { display_name?: string };
  location?: { display_name?: string };
  category?: { tag?: string; label?: string };
}

function salaryText(r: AdzunaResult): string | null {
  if (!r.salary_min && !r.salary_max) return null;
  const fmt = (n: number) => `R${Math.round(n).toLocaleString('en-ZA')}`;
  if (r.salary_min && r.salary_max && r.salary_min !== r.salary_max) {
    return `${fmt(r.salary_min)} – ${fmt(r.salary_max)}`;
  }
  return fmt((r.salary_min || r.salary_max) as number);
}

/**
 * One request per category tag. `resultsPerPage` is capped by Adzuna at 50.
 */
export async function fetchAdzunaJobs(options: {
  categoryTags: string[];
  resultsPerPage: number;
  maxAgeDays?: number;
  /** Hard ceiling on requests, to stay inside the free monthly quota. */
  maxCalls?: number;
  onProgress?: (message: string) => void;
}): Promise<{ jobs: RawJob[]; seenUrls: string[]; coverage: SourceCoverage }> {
  const { categoryTags, resultsPerPage, maxAgeDays = 14, maxCalls = 12, onProgress } = options;
  if (!adzunaConfigured()) {
    onProgress?.('  [adzuna] no API keys configured — skipping South Africa');
    return {
      jobs: [],
      seenUrls: [],
      coverage: {
        categoriesAttempted: 0,
        categoriesOk: 0,
        categoriesFailed: [],
        listingsSeen: 0,
        callsUsed: 0,
      },
    };
  }

  const appId = process.env.ADZUNA_APP_ID as string;
  const appKey = process.env.ADZUNA_APP_KEY as string;
  const jobs: RawJob[] = [];
  const seen = new Set<string>();
  const attempted: string[] = [];
  const failed: string[] = [];
  let callsUsed = 0;
  let budgetHit = false;

  for (const tag of categoryTags) {
    if (callsUsed >= maxCalls) {
      onProgress?.(`  [adzuna] call budget reached (${maxCalls}) — stopping`);
      budgetHit = true;
      break;
    }
    attempted.push(tag);
    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      results_per_page: String(Math.min(resultsPerPage, 50)),
      category: tag,
      max_days_old: String(maxAgeDays),
      'content-type': 'application/json',
    });

    try {
      // Adzuna returns 503 when called too fast — pace the requests rather than
      // burning quota on failures.
      if (callsUsed > 0) await sleep(REQUEST_SPACING_MS);

      callsUsed++;
      let res = await fetch(`${API}/1?${params}`, { headers: { Accept: 'application/json' } });

      if (res.status === 503) {
        await sleep(REQUEST_SPACING_MS * 3);
        callsUsed++;
        res = await fetch(`${API}/1?${params}`, { headers: { Accept: 'application/json' } });
      }

      if (!res.ok) {
        onProgress?.(`  [adzuna:${tag}] HTTP ${res.status}`);
        failed.push(tag);
        continue;
      }
      const json = (await res.json()) as { results?: AdzunaResult[] };
      const results = json.results ?? [];
      onProgress?.(`  [adzuna:${tag}] ${results.length} listings`);

      for (const r of results) {
        if (!r.id || !r.title || !r.redirect_url) continue;
        seen.add(r.redirect_url);
        const description = String(r.description ?? '').trim();
        if (description.length < 40) continue;

        const bracket = resolveBracket(r.title, ADZUNA_BRACKETS[r.category?.tag ?? ''] ?? null);

        jobs.push({
          source: 'ADZUNA',
          sourceRef: String(r.id),
          url: r.redirect_url,
          title: r.title.trim(),
          company: r.company?.display_name?.trim() || null,
          companyLogo: null,
          location: r.location?.display_name?.trim() || null,
          market: 'ZA',
          employmentType: r.contract_time || r.contract_type || null,
          salaryText: salaryText(r),
          description,
          bracket,
          sourceCategory: r.category?.tag ?? null,
          seniority: seniorityFromTitle(r.title),
          postedAt: r.created ? new Date(r.created) : null,
          expiresAt: null, // Adzuna doesn't publish one; ageing handles staleness
        });
      }
    } catch (e) {
      onProgress?.(`  [adzuna:${tag}] failed: ${(e as Error).message}`);
      failed.push(tag);
    }
  }

  onProgress?.(`  [adzuna] ${callsUsed} API call(s) used, ${jobs.length} jobs`);
  return {
    jobs,
    seenUrls: [...seen],
    coverage: {
      categoriesAttempted: attempted.length,
      categoriesOk: attempted.length - failed.length,
      categoriesFailed: failed,
      listingsSeen: seen.size,
      callsUsed,
      // A truncated run under-reports the market rather than the market shrinking.
      cappedCategories: budgetHit ? ['__call_budget_reached__'] : [],
    },
  };
}
