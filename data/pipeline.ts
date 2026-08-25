// data/pipeline.ts
// Orchestrates: search -> dedupe -> extract -> enrich -> save.

import { prisma } from "@/lib/prisma";
import { searchWeb } from "./search";
import { extractArticle } from "./extract";
import { enrichArticle } from "./enrich";
import { saveBriefingItem } from "./save";

interface TopicQuery {
  query: string;
}

const TOPICS: TopicQuery[] = [
  { query: "resume mistakes recruiters notice" },
  { query: "how to write a resume that gets interviews" },
  { query: "job interview mistakes that cost offers" },
  { query: "salary negotiation advice" },
  { query: "how to negotiate a raise" },
  { query: "job offer negotiation tips" },
  { query: "career growth advice for early career professionals" },
  { query: "job search tips" },
  { query: "workplace advice dealing with a difficult boss" },
];

const MAX_NEW_PER_TOPIC = 2;

// Automated scraping is intentionally limited to the open web (LinkedIn blocks
// scraping via its ToS; Quora's pages are unreliable client-rendered JS).
const EXCLUDED_HOSTNAMES = ["linkedin.com", "quora.com"];

function isExcludedUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return EXCLUDED_HOSTNAMES.some((h) => hostname === h || hostname.endsWith(`.${h}`));
  } catch {
    return true;
  }
}

export interface PipelineResult {
  saved: number;
  skipped: number;
  errors: number;
}

async function runIngest(): Promise<PipelineResult> {
  let saved = 0;
  let skipped = 0;
  let errors = 0;

  for (const topic of TOPICS) {
    console.log(`\n[search] ${topic.query}`);

    let results;
    try {
      results = await searchWeb(topic.query, { maxResults: 5 });
    } catch (e) {
      console.error(`  search failed: ${(e as Error).message}`);
      errors++;
      continue;
    }

    let newForTopic = 0;
    for (const result of results) {
      if (newForTopic >= MAX_NEW_PER_TOPIC) break;
      if (isExcludedUrl(result.url)) {
        skipped++;
        continue;
      }

      const existing = await prisma.briefingItem.findUnique({
        where: { url: result.url },
        select: { id: true },
      });
      if (existing) {
        skipped++;
        continue;
      }

      console.log(`  [extract] ${result.url}`);
      const extracted = await extractArticle(result.url).catch((e) => {
        console.warn(`    extract failed: ${(e as Error)?.message || e}`);
        return null;
      });
      if (!extracted) {
        skipped++;
        continue;
      }

      const enriched = await enrichArticle({ title: extracted.title, text: extracted.text, url: result.url });
      if (!enriched || !enriched.relevant) {
        console.log(`  [skip] not relevant or enrich failed: ${extracted.title}`);
        skipped++;
        continue;
      }

      await saveBriefingItem({ url: result.url, extracted, enriched });
      console.log(`  [saved] "${enriched.title}" [${enriched.category}]`);
      saved++;
      newForTopic++;
    }
  }

  return { saved, skipped, errors };
}

export async function runPipeline(trigger: "MANUAL" | "CRON" = "MANUAL"): Promise<PipelineResult> {
  const run = await prisma.ingestRun.create({ data: { trigger, status: "RUNNING" } });

  let result: PipelineResult = { saved: 0, skipped: 0, errors: 0 };
  let failed = false;
  let errorMessage: string | undefined;

  try {
    result = await runIngest();
  } catch (e) {
    failed = true;
    errorMessage = (e as Error)?.message || String(e);
    throw e;
  } finally {
    await prisma.ingestRun.update({
      where: { id: run.id },
      data: {
        status: failed ? "FAILED" : "SUCCESS",
        saved: result.saved,
        skipped: result.skipped,
        errors: result.errors,
        errorMessage,
        finishedAt: new Date(),
      },
    });
  }

  return result;
}
