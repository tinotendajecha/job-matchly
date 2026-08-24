// data/save.ts
// Persists an extracted + enriched article into the BriefingItem table.

import type { BriefingSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ExtractedArticle } from "./extract";
import type { EnrichResult } from "./enrich";

const CATEGORY_IMAGE_FALLBACK: Record<string, string> = {
  Resumes: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80",
  Interviews: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80",
  Salary: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=80",
  Offers: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80",
  "Career Growth": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
  "Job Search": "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80",
  Workplace: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80",
};

function estimateReadTime(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

function sourceForUrl(url: string): { source: BriefingSource; sourceDetail: string } {
  const hostname = new URL(url).hostname.replace(/^www\./, "");
  if (hostname.endsWith("reddit.com")) {
    const match = url.match(/reddit\.com\/(r\/[^/]+)/i);
    return { source: "REDDIT", sourceDetail: match ? match[1] : "reddit.com" };
  }
  if (hostname.includes("substack.com")) {
    return { source: "NEWSLETTER", sourceDetail: hostname };
  }
  return { source: "ARTICLE", sourceDetail: hostname };
}

export async function saveBriefingItem(params: {
  url: string;
  extracted: ExtractedArticle;
  enriched: EnrichResult;
}): Promise<void> {
  const { url, extracted, enriched } = params;
  const { source, sourceDetail } = sourceForUrl(url);

  await prisma.briefingItem.upsert({
    where: { url },
    create: {
      url,
      source,
      sourceDetail,
      category: enriched.category,
      title: enriched.title,
      summary: enriched.summary,
      image: extracted.image ?? CATEGORY_IMAGE_FALLBACK[enriched.category] ?? null,
      readTime: estimateReadTime(extracted.text),
      stat: extracted.stat,
      publishedAt: new Date(),
    },
    update: {
      category: enriched.category,
      title: enriched.title,
      summary: enriched.summary,
      stat: extracted.stat,
    },
  });
}
