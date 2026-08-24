// data/extract.ts
// Pulls clean article text (+ a hero image) out of a URL via Readability.
//
// Note: Reddit's public .json endpoints now 403 non-browser requests and
// old.reddit.com redirects to a login wall, so Reddit isn't scraped here —
// see data/pipeline.ts for the open-web-only query list.

import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export interface ExtractedArticle {
  title: string;
  text: string;
  image: string | null;
  stat: string | null;
}

const USER_AGENT = "Mozilla/5.0 (compatible; JobMatchlyBriefingBot/1.0; +https://jobmatchly.app)";

// og:image often points at a site logo/favicon rather than a real hero photo —
// reject those so the fallback category image is used instead.
const LOGO_HINTS = /logo|icon|favicon|sprite/i;

function isLikelyLogo(imageUrl: string): boolean {
  try {
    return LOGO_HINTS.test(new URL(imageUrl).pathname);
  } catch {
    return true;
  }
}

export async function extractArticle(url: string): Promise<ExtractedArticle | null> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, redirect: "follow" });
  if (!res.ok) return null;
  const html = await res.text();

  const dom = new JSDOM(html, { url });
  const rawOgImage = dom.window.document.querySelector('meta[property="og:image"]')?.getAttribute("content") ?? null;
  const ogImage = rawOgImage && !isLikelyLogo(rawOgImage) ? rawOgImage : null;

  const parsed = new Readability(dom.window.document).parse();
  if (!parsed?.textContent || parsed.textContent.trim().length < 200) return null;

  return {
    title: parsed.title ?? "",
    text: parsed.textContent.trim(),
    image: ogImage,
    stat: null,
  };
}
