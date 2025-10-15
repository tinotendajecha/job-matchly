// lib/pricing.ts
// export function pricePerCreditUSD(credits: number) {
//   return credits >= 10 ? 0.30 : 0.24;
// }
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
