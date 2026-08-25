// lib/admin/userFilter.ts
// Shared audience/user filtering used by the admin users list and the broadcast
// audience preview + send. The preview count and the actual send MUST use the
// same logic, or the send confirmation would show a different number than what
// actually gets emailed.

import type { Prisma } from "@prisma/client";
import { subDays } from "date-fns";

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

  if (filter.accountType === "paid") {
    and.push({ purchases: { some: { status: "PAID" } } });
  } else if (filter.accountType === "free") {
    and.push({ purchases: { none: { status: "PAID" } } });
  }

  if (options.emailableOnly) {
    and.push({ marketingOptOut: false });
    and.push({ email: { not: null } });
  }

  return and.length ? { AND: and } : {};
}

export function describeUserFilter(filter: UserFilter): string {
  const parts: string[] = [];
  if (filter.status && filter.status !== "all") parts.push(`${filter.status} users`);
  if (filter.accountType && filter.accountType !== "all") parts.push(`${filter.accountType} plan`);
  if (filter.search) parts.push(`matching "${filter.search}"`);
  return parts.length ? parts.join(", ") : "all users";
}
