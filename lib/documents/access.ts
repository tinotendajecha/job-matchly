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
  requiresCredits: boolean;
  isUnlocked: boolean;
  isLocked: boolean;
  canDownload: boolean;
  priceMinor: number | null;
  currency: string | null;
  /** Human-readable price: "R25.00" for ZA, "1 credit" for ZW, null otherwise. */
  priceDisplay: string | null;
};

export function getDocumentDownloadState(document: AccessDocument): DocumentDownloadState {
  const market = (document.market === "ZA" ? "ZA" : "ZW") as MarketCode;
  const marketConfig = getMarketConfig(market);

  const isTailored = document.kind === "TAILORED_RESUME";

  // ZA: real-money payment required
  const requiresPayment =
    isTailored &&
    marketConfig.downloadRequiresPayment &&
    (document.downloadPriceMinor ?? marketConfig.pricePerDownloadMinor ?? 0) > 0;

  // ZW: 1-credit required to download
  const requiresCredits = isTailored && marketConfig.downloadRequiresCredits;

  // A document is unlocked when neither gate applies, OR when it has been explicitly unlocked
  const isUnlocked = (!requiresPayment && !requiresCredits) || Boolean(document.unlockedAt);

  const priceMinor = document.downloadPriceMinor ?? marketConfig.pricePerDownloadMinor ?? null;
  const currency = document.downloadCurrency ?? (requiresPayment ? marketConfig.currency : null);

  let priceDisplay: string | null = null;
  if (requiresCredits) {
    priceDisplay = marketConfig.downloadPriceLabel ?? "1 credit";
  } else if (priceMinor != null && currency) {
    priceDisplay = formatMinorCurrency(priceMinor, currency, marketConfig.locale);
  }

  return {
    market,
    requiresPayment,
    requiresCredits,
    isUnlocked,
    isLocked: (requiresPayment || requiresCredits) && !isUnlocked,
    canDownload: isUnlocked,
    priceMinor,
    currency,
    priceDisplay,
  };
}
