// lib/analytics/rateLimit.ts
//
// Best-effort, in-memory rate limiting for the public page-view endpoint.
//
// IMPORTANT: serverless instances do not share memory, so this caps a single
// instance rather than the fleet. It is a cheap guard against a runaway client
// or casual abuse, NOT a security boundary. The real controls on that endpoint
// are the origin allow-list and the required httpOnly cookie.

interface Bucket {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 60_000;
const buckets = new Map<string, Bucket>();

// Stop the map growing without bound on a long-lived instance.
const MAX_KEYS = 5_000;

export function rateLimit(key: string, limit: number): boolean {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    if (buckets.size > MAX_KEYS) {
      for (const [k, v] of buckets) if (now >= v.resetAt) buckets.delete(k);
      if (buckets.size > MAX_KEYS) buckets.clear();
    }
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (existing.count >= limit) return false;
  existing.count += 1;
  return true;
}

/** Per-instance circuit breaker so a bug can't run up the database bill. */
const HOURLY_CAP = 20_000;
let hourly = { count: 0, resetAt: Date.now() + 3_600_000 };

export function underGlobalCap(): boolean {
  const now = Date.now();
  if (now >= hourly.resetAt) hourly = { count: 0, resetAt: now + 3_600_000 };
  if (hourly.count >= HOURLY_CAP) return false;
  hourly.count += 1;
  return true;
}
