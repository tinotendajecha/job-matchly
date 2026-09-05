// lib/admin/userFilter.ts
// Shared audience/user filtering used by the admin users list and the broadcast
// audience preview + send. The preview count and the actual send MUST use the
// same logic, or the send confirmation would show a different number than what
// actually gets emailed.

import type { Prisma } from "@prisma/client";
import { subDays } from "date-fns";

/** RFC 2606 reserved domains plus the usual local-only suffixes. */
export const RESERVED_EMAIL_SUFFIXES = [
  "@example.com",
  "@example.net",
  "@example.org",
  ".example",
  ".invalid",
  ".test",
  ".local",
  ".localhost",
];

/** Last-line guard before handing an address to the mail provider. */
export function isSendableEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const value = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return false;
  return !RESERVED_EMAIL_SUFFIXES.some((suffix) => value.endsWith(suffix));
}

export interface UserFilter {
  search?: string;
  status?: string; // 'all' | 'active' | 'inactive'
  accountType?: string; // 'all' | 'free' | 'paid'
}

export function parseUserFilter(searchParams: URLSearchParams): UserFilter {
  return {
    search: searchParams.get("search") || "",
    status: searchParams.get("status") || "all",
    accountType: searchParams.get("accountType") || "all",
  };
}

/**
 * `emailableOnly` adds the constraints that only matter for sending mail:
 * a real address on file, and not opted out of marketing.
 */
export function buildUserFilterWhere(
  filter: UserFilter,
  options: { emailableOnly?: boolean } = {}
): Prisma.UserWhereInput {
  const thirtyDaysAgo = subDays(new Date(), 30);
  const and: Prisma.UserWhereInput[] = [];

  if (filter.search) {
    and.push({
      OR: [
        { name: { contains: filter.search, mode: "insensitive" } },
        { email: { contains: filter.search, mode: "insensitive" } },
      ],
    });
  }

  if (filter.status === "active") {
    and.push({ sessions: { some: { createdAt: { gte: thirtyDaysAgo } } } });
  } else if (filter.status === "inactive") {
    and.push({
      OR: [
        { sessions: { none: {} } },
        { sessions: { every: { createdAt: { lt: thirtyDaysAgo } } } },
      ],
    });
  }

  // "Paying" means a COMPLETED download unlock or a live subscription.
  // Deliberately NOT "any PAID purchase": SYSTEM_BONUS grants carry status
  // PAID, which would classify ~78 users who have never paid as customers.
  const payingConditions: Prisma.UserWhereInput[] = [
    { purchases: { some: { status: "PAID", type: "RESUME_DOWNLOAD_UNLOCK" } } },
    { subscription: { status: "ACTIVE" } },
  ];

  if (filter.accountType === "paid") {
    and.push({ OR: payingConditions });
  } else if (filter.accountType === "free") {
    and.push({ NOT: { OR: payingConditions } });
  }

  if (options.emailableOnly) {
    and.push({ marketingOptOut: false });
    and.push({ email: { not: null } });
    // A deleted account keeps a row so its purchase history stays valid, but
    // must never be mailed. Its tombstone address ends in .invalid so the
    // reserved-suffix rule below would catch it anyway; this is explicit.
    and.push({ deletedAt: null });
    // Reserved/test domains (RFC 2606) are rejected by the mail provider, and a
    // single rejected address fails the whole batch it travels in — so they must
    // never reach a send. Excluded here so the previewed count matches reality.
    and.push({
      NOT: RESERVED_EMAIL_SUFFIXES.map((suffix) => ({
        email: { endsWith: suffix, mode: "insensitive" as const },
      })),
    });
  }

  return and.length ? { AND: and } : {};
}

export function describeUserFilter(filter: UserFilter): string {
  const parts: string[] = [];
  if (filter.status && filter.status !== "all") parts.push(`${filter.status} users`);
  if (filter.accountType === "paid") parts.push("paying customers");
  else if (filter.accountType === "free") parts.push("non-paying");
  if (filter.search) parts.push(`matching "${filter.search}"`);
  return parts.length ? parts.join(", ") : "all users";
}
