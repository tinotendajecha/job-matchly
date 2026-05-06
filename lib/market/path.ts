import type { MarketCode } from "./config";

export function getMarketPrefix(pathname: string): MarketCode | null {
  const match = pathname.match(/^\/(zw|za)(?=\/|$)/i);
  return (match?.[1]?.toUpperCase() as MarketCode | undefined) ?? null;
}

export function stripMarketPrefix(pathname: string) {
  return pathname.replace(/^\/(zw|za)(?=\/|$)/i, "") || "/";
}

export function addMarketPrefix(pathname: string, market: MarketCode) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const pathWithoutPrefix = stripMarketPrefix(normalizedPath);
  return pathWithoutPrefix === "/" ? `/${market.toLowerCase()}` : `/${market.toLowerCase()}${pathWithoutPrefix}`;
}
