import { headers } from "next/headers";
import { getMarketConfig, marketFromCountry, resolveMarket, type MarketCode } from "./config";

type HeaderSource =
  | Headers
  | Request
  | { headers?: Headers | Record<string, string | string[] | undefined> | null }
  | null
  | undefined;

function readHeaderValue(
  source: Headers | Record<string, string | string[] | undefined> | undefined,
  name: string
) {
  if (!source) return null;
  if (source instanceof Headers) return source.get(name);
  const raw = source[name] ?? source[name.toLowerCase()];
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw ?? null;
}

export function getHostnameFromRequest(source?: HeaderSource) {
  if (!source) return null;
  if (source instanceof Request) {
    return source.headers.get("x-forwarded-host") || source.headers.get("host");
  }
  if (source instanceof Headers) {
    return source.get("x-forwarded-host") || source.get("host");
  }
  return (
    readHeaderValue(source.headers as Headers | Record<string, string | string[] | undefined> | undefined, "x-forwarded-host") ||
    readHeaderValue(source.headers as Headers | Record<string, string | string[] | undefined> | undefined, "host")
  );
}

function readHeader(source: HeaderSource, name: string): string | null {
  if (!source) return null;
  if (source instanceof Request) return source.headers.get(name);
  if (source instanceof Headers) return source.get(name);
  return readHeaderValue(
    source.headers as Headers | Record<string, string | string[] | undefined> | undefined,
    name
  );
}

function marketFromCookieHeader(cookieHeader: string | null): MarketCode | null {
  const match = (cookieHeader || "").match(/(?:^|;\s*)jm_market=(ZW|ZA)(?:;|$)/i)?.[1];
  return match ? (match.toUpperCase() as MarketCode) : null;
}

// Both markets share one domain, so the host is the last resort, not the answer.
// Order: middleware's x-market header (pages only; middleware skips /api), the
// jm_market cookie it sets, the visitor's country from Vercel, then the host.
export function getMarketFromRequest(source?: HeaderSource): MarketCode {
  const headerMarket = readHeader(source, "x-market");
  if (headerMarket === "ZA" || headerMarket === "ZW") return headerMarket;

  return (
    marketFromCookieHeader(readHeader(source, "cookie")) ??
    marketFromCountry(readHeader(source, "x-vercel-ip-country")) ??
    resolveMarket(getHostnameFromRequest(source))
  );
}

export function getCurrentMarket(): MarketCode {
  // Copy into a plain Headers so the instanceof checks above hold for Next's
  // read-only header store.
  return getMarketFromRequest(new Headers(headers()));
}

export function getCurrentMarketConfig() {
  return getMarketConfig(getCurrentMarket());
}
