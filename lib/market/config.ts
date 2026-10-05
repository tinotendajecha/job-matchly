export type MarketCode = "ZW" | "ZA";
export type MarketPaymentProvider = "PESEPAY" | "PAYSTACK";

export type MarketConfig = {
  code: MarketCode;
  country: string;
  currency: string;
  paymentProvider: MarketPaymentProvider;
  defaultDisplayCurrency: string;
  locale: string;
};

const MARKET_CONFIGS: Record<MarketCode, MarketConfig> = {
  ZW: {
    code: "ZW",
    country: "Zimbabwe",
    currency: "USD",
    paymentProvider: "PESEPAY",
    defaultDisplayCurrency: "USD",
    locale: "en-ZW",
  },
  ZA: {
    code: "ZA",
    country: "South Africa",
    currency: "ZAR",
    paymentProvider: "PAYSTACK",
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

  return getDefaultMarket();
}

/**
 * Both markets are served from jobmatchly.co.za (jobmatchly.site was dropped),
 * so the host can no longer tell a Zimbabwean visitor from a South African one.
 * The visitor's country does. Anything other than ZW or ZA returns null and the
 * caller falls back to the host, which resolves to ZA in production.
 */
export function marketFromCountry(country?: string | null): MarketCode | null {
  const normalized = String(country || "").trim().toUpperCase();
  if (normalized === "ZW" || normalized === "ZA") return normalized;
  return null;
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
