// lib/unsubscribeToken.ts
// Stateless unsubscribe links: HMAC of the user id, so an opt-out link works
// without a login and without storing a per-user token.

import crypto from "crypto";

function secret(): string {
  const s = process.env.UNSUBSCRIBE_SECRET;
  if (!s) throw new Error("UNSUBSCRIBE_SECRET is not set — required to sign unsubscribe links");
  return s;
}

export function makeUnsubscribeToken(userId: string): string {
  return crypto.createHmac("sha256", secret()).update(userId).digest("hex");
}

export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  const expected = makeUnsubscribeToken(userId);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function buildUnsubscribeUrl(userId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || "https://www.jobmatchly.site";
  return `${base.replace(/\/+$/, "")}/api/unsubscribe?uid=${encodeURIComponent(userId)}&token=${makeUnsubscribeToken(userId)}`;
}
