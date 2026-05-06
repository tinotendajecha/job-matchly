import { headers } from "next/headers";
import { getMarketConfig, resolveMarket, type MarketCode } from "./config";
import { getMarketPrefix } from "./path";

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

export function getMarketFromRequest(source?: HeaderSource): MarketCode {
  if (source instanceof Request) {
    const marketFromPath = getMarketPrefix(new URL(source.url).pathname);
    if (marketFromPath) return marketFromPath;
  }

  return resolveMarket(getHostnameFromRequest(source));
}

export function getCurrentMarket(): MarketCode {
  const headerStore = headers();
  const marketHeader = headerStore.get("x-market");
  if (marketHeader === "ZW" || marketHeader === "ZA") return marketHeader;

  const cookieHeader = headerStore.get("cookie") || "";
  const cookieMarket = cookieHeader.match(/(?:^|;\s*)jm_market=(ZW|ZA)(?:;|$)/i)?.[1];
  if (cookieMarket === "ZW" || cookieMarket === "ZA") return cookieMarket;

  return resolveMarket(headerStore.get("x-forwarded-host") || headerStore.get("host"));
}

export function getCurrentMarketConfig() {
  return getMarketConfig(getCurrentMarket());
}
