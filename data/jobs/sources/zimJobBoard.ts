// data/jobs/sources/zimJobBoard.ts
//
// Shared crawler for Zimbabwean job boards running the same platform.
//
// vacancymail.co.zw and ihararejobs.com are the same software: identical
// schema.org JobPosting JSON-LD, the same "Sept. 2, 2026, 1:20 p.m." date
// format, and the same habit of emitting raw newlines inside JSON string
// literals so the block will not parse as served. Duplicating the parser for
// each would mean fixing every quirk twice, and several are already fixed here.
//
// Only the base URL, the job path prefix, the source name and the category map
// differ, so those are configuration.

import { JSDOM } from 'jsdom';
import {
  SENIORITY_CATEGORIES,
  EXCLUDED_CATEGORIES,
  resolveBracket,
  seniorityFromTitle,
  type Bracket,
} from '@/lib/jobs/brackets';
import type { JobSource } from '@prisma/client';
import type { RawJob, SourceCoverage } from '../types';

const USER_AGENT = 'Mozilla/5.0 (compatible; JobMatchlyBot/1.0; +https://jobmatchly.site)';

export interface BoardConfig {
  /** Origin, no trailing slash. */
  base: string;
  source: JobSource;
  /** Where job detail pages live: "/jobs/" or "/job/". */
  jobPath: string;
  /** Source category slug -> our bracket. */
  brackets: Record<string, Bracket>;
}

/** JSON-LD values arrive with raw HTML entities ("Media &amp; IT"). */
export function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    .trim();
}

export async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow' });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/**
 * Their JSON-LD is not valid JSON — `description` contains raw unescaped
 * newlines, so JSON.parse throws on the block as served. Escape control
 * characters that appear inside string literals, then retry.
 */
export function parseLooseJson(raw: string): any | null {
  try {
    return JSON.parse(raw);
  } catch {
    /* fall through to repair */
  }

  let repaired = '';
  let inString = false;
  let escaped = false;
  for (const char of raw) {
    if (escaped) {
      repaired += char;
      escaped = false;
      continue;
    }
    if (char === '\\') {
      repaired += char;
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      repaired += char;
      continue;
    }
    if (inString && (char === '\n' || char === '\r' || char === '\t')) {
      repaired += char === '\n' ? '\\n' : char === '\r' ? '\\r' : '\\t';
      continue;
    }
    repaired += char;
  }

  try {
    return JSON.parse(repaired);
  } catch {
    return null;
  }
}

/** e.g. "Aug. 25, 2026, 7:46 p.m." — not ISO, so new Date() alone won't do. */
export function parseBoardDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const cleaned = value
    .replace(/\./g, '')
    .replace(/\b(a|p)m\b/gi, (m) => m.toUpperCase().replace(/\s/g, ''))
    .replace(/\s+/g, ' ')
    .trim();
  const parsed = new Date(cleaned);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  const dateOnly = cleaned.match(/([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})/);
  if (dateOnly) {
    const d = new Date(`${dateOnly[1]} ${dateOnly[2]}, ${dateOnly[3]}`);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

/** "Expires 28 Aug 2026" on the listing card. */
export function parseExpiry(text: string | null | undefined): Date | null {
  if (!text) return null;
  const m = text.match(/(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})/);
  if (!m) return null;
  const d = new Date(`${m[2]} ${m[1]}, ${m[3]}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Both boards end a job URL with a numeric id ("...-cimas-health-6300/"), but
 * one serves them under /jobs/ and the other under /job/, so the prefix is
 * supplied by the caller.
 */
export function jobIdFromUrl(url: string, pathPrefix: string): string | null {
  // Deliberately not a built RegExp: interpolating the prefix into a template
  // literal silently ate the backslashes in \d, so the pattern matched a
  // literal "d" and every listing was dropped. Two plain checks instead.
  if (!url.includes(pathPrefix)) return null;
  const m = url.match(/-(\d+)\/?$/);
  return m ? m[1] : null;
}

/** Drops repeated parts, case-insensitively: ["Ngezi","Ngezi"] -> "Ngezi". */
export function dedupePlace(parts: Array<string | null | undefined>): string {
  const seen = new Set<string>();
  return parts
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter((p) => {
      const key = p.toLowerCase();
      if (!p || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(', ');
}

/** The JSON-LD description is a stub; the real content is in the page body. */
export function extractBodyDescription(document: Document): string {
  const wanted = /job description|duties|responsibilit|qualification|experience|how to apply/i;
  const parts: string[] = [];
  document.querySelectorAll('h3').forEach((heading) => {
    const label = heading.textContent?.trim() ?? '';
    if (!wanted.test(label)) return;
    const chunk: string[] = [];
    let node = heading.nextElementSibling;
    while (node && node.tagName !== 'H3') {
      const text = node.textContent?.trim();
      if (text) chunk.push(text);
      node = node.nextElementSibling;
    }
    if (chunk.length) parts.push(`${label}\n${chunk.join('\n')}`);
  });
  return parts.join('\n\n').replace(/\n{3,}/g, '\n\n').slice(0, 8000);
}


async function fetchJob(
  cfg: BoardConfig,
  url: string,
  categorySlug: string | null
): Promise<RawJob | null> {
  const html = await fetchHtml(url);
  if (!html) return null;

  const dom = new JSDOM(html, { url });
  const document = dom.window.document;

  let ld: any = null;
  document.querySelectorAll('script[type="application/ld+json"]').forEach((node) => {
    if (ld) return;
    const parsed = parseLooseJson(node.textContent ?? '');
    if (parsed && parsed['@type'] === 'JobPosting') ld = parsed;
  });

  const title = decodeEntities(ld?.title || document.querySelector('h1')?.textContent || '');
  if (!title) return null;

  const sourceRef = jobIdFromUrl(url, cfg.jobPath);
  if (!sourceRef) return null;

  const description = extractBodyDescription(document) || String(ld?.description ?? '').trim();
  if (description.length < 40) return null;

  const address = ld?.jobLocation?.address ?? {};
  // These boards routinely repeat the city as its own region — "Ngezi, Ngezi",
  // "HARARE, HARARE" — which then shows up everywhere the location does,
  // including shared preview cards.
  const location =
    dedupePlace([address.addressLocality, address.addressRegion]) ||
    address.streetAddress ||
    null;

  // Title first: it describes the ROLE, whereas a source category often
  // describes the employer's INDUSTRY (an HR Specialist listed under
  // healthcare is an HR job, not a healthcare one). Category is the fallback.
  const bracket = resolveBracket(title, categorySlug ? cfg.brackets[categorySlug] ?? null : null);
  const categorySeniority = categorySlug ? SENIORITY_CATEGORIES[categorySlug] ?? null : null;
  const salary = typeof ld?.baseSalary === 'string' ? ld.baseSalary.trim() : null;

  return {
    source: cfg.source,
    sourceRef,
    url,
    title,
    company: ld?.hiringOrganization?.name ? decodeEntities(ld.hiringOrganization.name) || null : null,
    companyLogo: ld?.hiringOrganization?.logo || null,
    location,
    market: 'ZW',
    employmentType: typeof ld?.employmentType === 'string' ? ld.employmentType : null,
    salaryText: salary && salary.toUpperCase() !== 'TBA' ? salary : null,
    description,
    bracket,
    sourceCategory: categorySlug,
    seniority: categorySeniority ?? seniorityFromTitle(title),
    postedAt: parseBoardDate(ld?.datePosted),
    expiresAt: parseBoardDate(ld?.validThrough),
  };
}

function collectJobLinks(
  cfg: BoardConfig,
  html: string
): Array<{ url: string; expiresText: string | null }> {
  const dom = new JSDOM(html);
  const seen = new Map<string, string | null>();
  dom.window.document.querySelectorAll(`a[href^="${cfg.jobPath}"]`).forEach((a) => {
    const href = a.getAttribute('href');
    if (!href || !jobIdFromUrl(href, cfg.jobPath)) return;
    const card = a.closest('div, li, article');
    const expires = card?.textContent?.match(/Expires[^,\n]*/i)?.[0] ?? null;
    const url = `${cfg.base}${href}`;
    if (!seen.has(url)) seen.set(url, expires);
  });
  return Array.from(seen.entries()).map(([url, expiresText]) => ({ url, expiresText }));
}

/**
 * Crawls the categories that map to brackets our users actually occupy, so a
 * job's bracket comes from the source's own taxonomy rather than an AI call.
 */
export async function crawlZimJobBoard(options: {
  config: BoardConfig;
  categories: string[];
  maxPerCategory: number;
  isKnownUrl: (url: string) => Promise<boolean>;
  onProgress?: (message: string) => void;
}): Promise<{ jobs: RawJob[]; seenUrls: string[]; coverage: SourceCoverage }> {
  const { config, categories, maxPerCategory, isKnownUrl, onProgress } = options;
  const jobs: RawJob[] = [];

  // Every URL the source still advertises, whether or not we already hold it.
  // Collected from the category listing before the per-category cap applies —
  // a listing we chose not to re-fetch is still demonstrably still open.
  const seen = new Set<string>();
  const attempted: string[] = [];
  const failed: string[] = [];
  const capped: string[] = [];

  for (const slug of categories) {
    if (EXCLUDED_CATEGORIES.has(slug)) continue;
    attempted.push(slug);

    const listHtml = await fetchHtml(`${config.base}/categories/${slug}/`);
    if (!listHtml) {
      onProgress?.(`  [skip] could not load ${slug}`);
      failed.push(slug);
      continue;
    }

    const links = collectJobLinks(config, listHtml);
    onProgress?.(`  [${slug}] ${links.length} listings`);
    links.forEach((l) => seen.add(l.url));

    let added = 0;
    for (const { url, expiresText } of links) {
      if (added >= maxPerCategory) {
        capped.push(slug);
        break;
      }
      if (await isKnownUrl(url)) continue;

      const job = await fetchJob(config, url, slug);
      if (!job) continue;

      if (!job.expiresAt) job.expiresAt = parseExpiry(expiresText);
      jobs.push(job);
      added++;
    }
  }

  return {
    jobs,
    seenUrls: [...seen],
    coverage: {
      categoriesAttempted: attempted.length,
      categoriesOk: attempted.length - failed.length,
      categoriesFailed: failed,
      listingsSeen: seen.size,
      cappedCategories: capped,
    },
  };
}
