'use client';

import { useEffect, useMemo, useState } from "react";
import { getMarketConfig, resolveMarket, type MarketCode } from "@/lib/market/config";
import { getMarketPrefix } from "@/lib/market/path";

export function useMarket() {
  const [market, setMarket] = useState<MarketCode>(() => resolveMarket(null));

  useEffect(() => {
    const marketFromPath = getMarketPrefix(window.location.pathname);
    setMarket(marketFromPath || resolveMarket(window.location.hostname));
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
