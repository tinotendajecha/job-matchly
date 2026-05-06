import { formatMinorCurrency, getMarketConfig, type MarketCode } from "@/lib/market/config";

type AccessDocument = {
  kind: string;
  market: MarketCode | string;
  downloadPriceMinor: number | null;
  downloadCurrency: string | null;
  unlockedAt: Date | string | null;
};

export type DocumentDownloadState = {
  market: MarketCode;
  requiresPayment: boolean;
  isUnlocked: boolean;
  isLocked: boolean;
  canDownload: boolean;
  priceMinor: number | null;
  currency: string | null;
  priceDisplay: string | null;
};

export function getDocumentDownloadState(document: AccessDocument): DocumentDownloadState {
  const market = (document.market === "ZA" ? "ZA" : "ZW") as MarketCode;
  const marketConfig = getMarketConfig(market);
  const requiresPayment =
    document.kind === "TAILORED_RESUME" &&
    marketConfig.downloadRequiresPayment &&
    (document.downloadPriceMinor ?? marketConfig.pricePerDownloadMinor ?? 0) > 0;
  const isUnlocked = !requiresPayment || Boolean(document.unlockedAt);
  const priceMinor = document.downloadPriceMinor ?? marketConfig.pricePerDownloadMinor;
  const currency = document.downloadCurrency ?? marketConfig.currency;

  return {
    market,
    requiresPayment,
    isUnlocked,
    isLocked: requiresPayment && !isUnlocked,
    canDownload: isUnlocked,
    priceMinor,
    currency,
    priceDisplay:
      priceMinor != null && currency
        ? formatMinorCurrency(priceMinor, currency, marketConfig.locale)
        : null,
  };
}
