// app/jobs/[id]/opengraph-image.tsx
//
// The card that renders when a job link is pasted into WhatsApp, LinkedIn or
// X. Generated rather than static so the role, employer and location are
// legible in the preview itself — the difference between "some link" and
// "a Senior Data Engineer job in Johannesburg".
import { ImageResponse } from 'next/server';

// Edge, not Node. ImageResponse's stream swallows any error thrown while
// starting, so a failure surfaces as a 200 with an empty body rather than a
// stack trace — which is how this shipped broken the first time. The Node build
// of @vercel/og reads its wasm and fallback font off disk and those reads don't
// survive bundling; the edge build inlines them. Edge can't reach Prisma, hence
// the fetch below.
export const runtime = 'edge';
export const alt = 'Job vacancy on JobMatchly';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// JobMatchly's primary, hsl(84 90% 38%). Hard-coded because an OG image is
// rendered outside the app's CSS and has no access to the token.
const LIME = '#72B80A';
const INK = '#101208';
const MUTED = '#8A9179';

// Fonts are supplied explicitly rather than left to the default: @vercel/og's
// bundled fallback mis-resolves its own path and renders a zero-byte image with
// a 200, which would have shipped as a silently broken preview. These are also
// the brand face, so the card matches the site.
//
// Read from disk rather than fetched via import.meta.url — that pattern only
// works on the edge runtime, and this route needs Node for Prisma. Read once at
// module scope so it costs nothing per render; next.config.js traces the files
// into the serverless bundle.
/**
 * Brand fonts, or null if they can't be loaded.
 *
 * Never allowed to throw: an exception here would blank the whole card. The
 * fallback face is a cosmetic loss, no preview at all is the failure this route
 * exists to prevent.
 */
async function brandFonts() {
  try {
    const [regular, bold] = await Promise.all([
      fetch(new URL('./dm-sans-regular.ttf', import.meta.url)).then((r) => r.arrayBuffer()),
      fetch(new URL('./dm-sans-bold.ttf', import.meta.url)).then((r) => r.arrayBuffer()),
    ]);
    return [
      { name: 'DM Sans', data: regular, weight: 400 as const, style: 'normal' as const },
      { name: 'DM Sans', data: bold, weight: 700 as const, style: 'normal' as const },
    ];
  } catch (err) {
    console.error('OG brand fonts unavailable, using default face', err);
    return null;
  }
}

/** Absolute origin for the data fetch. Edge has no request context here. */
function origin(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'https://www.jobmatchly.site';
}

function dedupePlace(location: string | null | undefined): string {
  if (!location) return '';
  const seen = new Set<string>();
  return location
    .split(',')
    .map((part) => part.trim())
    .filter((part) => {
      const key = part.toLowerCase();
      if (!part || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(', ');
}

type OgJob = {
  title: string;
  company: string | null;
  location: string | null;
  market: string;
  salaryText: string | null;
  bracket: string | null;
  employmentType: string | null;
};

async function loadJob(id: string): Promise<OgJob | null> {
  try {
    const res = await fetch(`${origin()}/api/public/job/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.ok ? (json.job as OgJob) : null;
  } catch (err) {
    console.error('OG job lookup failed', err);
    return null;
  }
}

export default async function Image({ params }: { params: { id: string } }) {
  // Both are allowed to come back empty; the card still renders.
  const [fonts, job] = await Promise.all([brandFonts(), loadJob(params.id)]);

  const title = job?.title ?? 'Job vacancy';
  const company = job?.company ?? null;
  // Sources often repeat the city as its own province ("Harare, Harare"), which
  // looks careless on a card people forward to each other.
  const place = dedupePlace(job?.location) || (job?.market === 'ZA' ? 'South Africa' : 'Zimbabwe');

  // Long scraped titles are common; shrink rather than clip so the role stays
  // readable at thumbnail size.
  const titleSize = title.length > 78 ? 50 : title.length > 46 ? 62 : 74;

  const facts = [job?.employmentType, job?.salaryText].filter(Boolean) as string[];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: INK,
          padding: '68px 72px',
          fontFamily: 'DM Sans, sans-serif',
          position: 'relative',
        }}
      >
        {/* A lime edge carries the brand without loading a logo file, which
            would add a fetch to every preview render. */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 14,
            height: size.height,
            background: LIME,
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40 }}>
            <div
              style={{
                display: 'flex',
                fontSize: 26,
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
              }}
            >
              Job<span style={{ color: LIME }}>Matchly</span>
            </div>
            {job?.bracket && (
              <div
                style={{
                  display: 'flex',
                  fontSize: 19,
                  color: LIME,
                  border: `1px solid ${LIME}`,
                  borderRadius: 999,
                  padding: '5px 16px',
                }}
              >
                {job.bracket}
              </div>
            )}
          </div>

          <div
            style={{
              fontSize: titleSize,
              fontWeight: 700,
              color: '#FFFFFF',
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              display: 'flex',
            }}
          >
            {title}
          </div>

          {company && (
            <div style={{ fontSize: 34, color: '#D8DECB', marginTop: 24, display: 'flex' }}>
              {company}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 28, color: '#FFFFFF', display: 'flex' }}>{place}</div>
            {facts.map((f) => (
              <div key={f} style={{ fontSize: 28, color: MUTED, display: 'flex' }}>
                {f}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 24, color: MUTED, display: 'flex' }}>
            Sign in on JobMatchly to open this listing
          </div>
        </div>
      </div>
    ),
    { ...size, ...(fonts ? { fonts } : {}) }
  );
}
