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
  needsTrial: boolean;
};

export function getDocumentDownloadState(
  document: AccessDocument,
  opts?: { hasActiveSub?: boolean },
): DocumentDownloadState {
  const market = (document.market === "ZA" ? "ZA" : "ZW") as MarketCode;
  const marketConfig = getMarketConfig(market);

  const isTailored = document.kind === "TAILORED_RESUME";

  // A document requires payment if it has a price set (ZA per-unlock flow)
  const requiresPayment = isTailored && (document.downloadPriceMinor ?? 0) > 0;
  const isPaymentUnlocked = !requiresPayment || Boolean(document.unlockedAt);

  // User needs to start their free trial to download
  const needsTrial = isTailored && opts?.hasActiveSub === false;

  const isLocked = !isPaymentUnlocked || needsTrial;

  const priceMinor = document.downloadPriceMinor ?? null;
  const currency = document.downloadCurrency ?? (requiresPayment ? marketConfig.currency : null);

  let priceDisplay: string | null = null;
  if (priceMinor != null && currency) {
    priceDisplay = formatMinorCurrency(priceMinor, currency, marketConfig.locale);
  }

  return {
    market,
    requiresPayment,
    isUnlocked: !isLocked,
    isLocked,
    canDownload: !isLocked,
    priceMinor,
    currency,
    priceDisplay,
    needsTrial,
  };
}
