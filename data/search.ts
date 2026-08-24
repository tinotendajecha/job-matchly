// data/search.ts
// Thin wrapper around the Tavily search API.

export interface SearchResult {
  url: string;
  title: string;
  snippet: string;
}

interface TavilyRawResult {
  url: string;
  title: string;
  content: string;
}

interface SearchOptions {
  /** Restrict results to these domains (e.g. ['reddit.com']). */
  includeDomains?: string[];
  maxResults?: number;
}

export async function searchWeb(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY is not set");
  }

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "basic",
      max_results: options.maxResults ?? 5,
      include_domains: options.includeDomains,
    }),
  });

  if (!res.ok) {
    throw new Error(`Tavily search failed (${res.status}): ${await res.text().catch(() => "")}`);
  }

  const json = (await res.json()) as { results?: TavilyRawResult[] };
  return (json.results ?? []).map((r) => ({
    url: r.url,
    title: r.title,
    snippet: r.content,
  }));
}
