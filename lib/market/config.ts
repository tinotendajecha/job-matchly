export type MarketCode = "ZW" | "ZA";
export type MarketPaymentProvider = "PESEPAY" | "PAYSTACK";

export type MarketConfig = {
  code: MarketCode;
  country: string;
  currency: string;
  paymentProvider: MarketPaymentProvider;
  pricePerDownloadMinor: number | null;
  pricePerDownloadDisplay: string | null;
  tailoringRequiresCreditsUpfront: boolean;
  downloadRequiresPayment: boolean;
  defaultDisplayCurrency: string;
  locale: string;
};

const MARKET_CONFIGS: Record<MarketCode, MarketConfig> = {
  ZW: {
    code: "ZW",
    country: "Zimbabwe",
    currency: "USD",
    paymentProvider: "PESEPAY",
    pricePerDownloadMinor: null,
    pricePerDownloadDisplay: null,
    tailoringRequiresCreditsUpfront: true,
    downloadRequiresPayment: false,
    defaultDisplayCurrency: "USD",
    locale: "en-ZW",
  },
  ZA: {
    code: "ZA",
    country: "South Africa",
    currency: "ZAR",
    paymentProvider: "PAYSTACK",
    pricePerDownloadMinor: 2500,
    pricePerDownloadDisplay: "R25",
    tailoringRequiresCreditsUpfront: false,
    downloadRequiresPayment: true,
    defaultDisplayCurrency: "ZAR",
    locale: "en-ZA",
  },
};

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export function normalizeMarketCode(value?: string | null): MarketCode | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  if (normalized === "ZW" || normalized === "ZA") return normalized;
  return null;
}

export function getDefaultMarket(): MarketCode {
  return (
    normalizeMarketCode(process.env.DEFAULT_MARKET) ??
    normalizeMarketCode(process.env.NEXT_PUBLIC_DEFAULT_MARKET) ??
    "ZW"
  );
}

export function resolveMarket(hostname?: string | null): MarketCode {
  const normalizedHost = String(hostname || "")
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "");

  if (!normalizedHost || LOCAL_HOSTS.has(normalizedHost) || normalizedHost.endsWith(".vercel.app")) {
    return getDefaultMarket();
  }

  if (normalizedHost === "jobmatchly.co.za" || normalizedHost.endsWith(".jobmatchly.co.za")) {
    return "ZA";
  }

  if (normalizedHost === "jobmatchly.site" || normalizedHost.endsWith(".jobmatchly.site")) {
    return "ZW";
  }

  return getDefaultMarket();
}

export function getMarketConfig(market: MarketCode): MarketConfig {
  return MARKET_CONFIGS[market];
}

export function formatMinorCurrency(amountMinor: number, currency: string, locale = "en-US") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}
