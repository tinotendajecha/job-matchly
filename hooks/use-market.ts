'use client';

import { useEffect, useMemo, useState } from "react";
import { getMarketConfig, normalizeMarketCode, resolveMarket, type MarketCode } from "@/lib/market/config";

export function useMarket() {
  const [market, setMarket] = useState<MarketCode>(() => resolveMarket(null));

  useEffect(() => {
    // Cookie is set by middleware on every request — most reliable source on client
    const cookieMatch = document.cookie.match(/(?:^|;\s*)jm_market=(ZW|ZA)(?:;|$)/i);
    const cookieMarket = normalizeMarketCode(cookieMatch?.[1]);
    // Fallback to hostname resolution if cookie is missing
    setMarket(cookieMarket ?? resolveMarket(window.location.hostname));
  }, []);

  return useMemo(() => {
    const config = getMarketConfig(market);
    return {
      market,
      config,
      isSouthAfrica: market === "ZA",
      isZimbabwe: market === "ZW",
    };
  }, [market]);
}
