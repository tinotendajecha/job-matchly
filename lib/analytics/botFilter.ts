// lib/analytics/botFilter.ts
import type { DeviceType } from "@prisma/client";

// Second line of defence — the tracker is client-side JS, so most crawlers
// never reach the endpoint at all. This catches headless/scripted clients.
const BOT_RE =
  /bot|crawl|spider|slurp|headlesschrome|phantomjs|puppeteer|playwright|lighthouse|curl|wget|python-requests|axios|go-http-client|okhttp|java\/|facebookexternalhit|whatsapp|twitterbot|discordbot|slackbot|telegrambot|semrush|ahrefs|dotbot|mj12|petalbot|yandex|applebot|gptbot|claudebot|ccbot|perplexitybot|bytespider|preview|monitor|pingdom|uptime/i;

export function isBot(userAgent: string | null | undefined): boolean {
  if (!userAgent || !userAgent.trim()) return true; // no UA at all = scripted
  return BOT_RE.test(userAgent);
}

const TABLET_RE = /ipad|tablet|playbook|silk|(android(?!.*mobile))/i;
const MOBILE_RE = /mobile|iphone|ipod|android|blackberry|opera mini|iemobile|windows phone/i;

export function classifyDevice(userAgent: string | null | undefined): DeviceType {
  if (!userAgent) return "UNKNOWN";
  if (TABLET_RE.test(userAgent)) return "TABLET";
  if (MOBILE_RE.test(userAgent)) return "MOBILE";
  return "DESKTOP";
}
