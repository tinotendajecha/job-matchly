import { prisma } from "@/lib/prisma";

// lib/files.ts
export function safeFileName(s: string, max = 100) {
  return s.replace(/[\\/:*?"<>|]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, max);
}

