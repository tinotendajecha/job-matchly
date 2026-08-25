// lib/analytics/normalizePath.ts
// Path normalization for page-view telemetry.
//
// This is both an efficiency measure and an abuse control: collapsing record
// ids keeps groupBy(['path']) cardinality to tens of values instead of one per
// document, and stops anyone stuffing the table with unique paths to make the
// top-pages aggregate useless.

/** cuid, uuid, or a bare number — the id shapes this app puts in URLs. */
const ID_SEGMENT =
  /^(c[a-z0-9]{20,}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d+)$/i;

const MAX_PATH_LENGTH = 512;

export function normalizePath(raw: string): string | null {
  if (!raw) return null;

  // Accept a full URL or a bare path; keep only the pathname.
  let pathname = raw;
  try {
    if (/^https?:\/\//i.test(raw)) pathname = new URL(raw).pathname;
  } catch {
    return null;
  }

  pathname = pathname.split("?")[0].split("#")[0].trim();
  if (!pathname.startsWith("/")) return null;

  const normalized =
    "/" +
    pathname
      .split("/")
      .filter(Boolean)
      .map((segment) => (ID_SEGMENT.test(segment) ? "[id]" : segment.toLowerCase()))
      .join("/");

  if (normalized.length > MAX_PATH_LENGTH) return null;
  return normalized;
}

/** Host only — we never store a full referring URL (it can carry personal data). */
export function referrerHost(raw: string | null | undefined, selfHost?: string | null): string | null {
  if (!raw) return null;
  try {
    const host = new URL(raw).hostname.replace(/^www\./i, "").toLowerCase();
    if (!host) return null;
    if (selfHost && host === selfHost.replace(/^www\./i, "").toLowerCase()) return null; // internal
    return host.slice(0, 128);
  } catch {
    return null;
  }
}
