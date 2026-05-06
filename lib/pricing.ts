// lib/pricing.ts
export function pricePerCreditUSD(credits: number) {
  return credits >= 10 ? 0.30 : 0.34;
}
export function computeSubtotalUSD(credits: number) {
  const c = Math.max(3, Math.floor(credits || 3));
  return +(c * pricePerCreditUSD(c)).toFixed(2);
}
export function toMinorUnits(amountUSD: number) {
  return Math.round(amountUSD * 100);
}

// ZAR pricing for South Africa (credits are optional extras)
export function pricePerCreditZAR(credits: number): number {
  return credits >= 10 ? 6 : 7; // R6 or R7 per credit
}
export function computeSubtotalZAR(credits: number): number {
  const c = Math.max(3, Math.floor(credits || 3));
  return c * pricePerCreditZAR(c);
}
export function toMinorUnitsZAR(amountZAR: number): number {
  return Math.round(amountZAR * 100);
}
