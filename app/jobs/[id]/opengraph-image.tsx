// app/jobs/[id]/opengraph-image.tsx
//
// The card that renders when a job link is pasted into WhatsApp, LinkedIn or
// X. Generated rather than static so the role, employer and location are
// legible in the preview itself — the difference between "some link" and
// "a Senior Data Engineer job in Johannesburg".
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ImageResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
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
const FONT_DIR = join(process.cwd(), 'assets', 'fonts');

/**
 * Returns null rather than throwing if the files aren't in the bundle.
 *
 * Loading at module scope would take the whole route down on a file-tracing
 * miss. A preview in the fallback face is a cosmetic problem; a 500 means no
 * preview at all, which is the thing this route exists to prevent.
 */
function brandFonts() {
  try {
    return [
      {
        name: 'DM Sans',
        data: readFileSync(join(FONT_DIR, 'dm-sans-regular.ttf')),
        weight: 400 as const,
        style: 'normal' as const,
      },
      {
        name: 'DM Sans',
        data: readFileSync(join(FONT_DIR, 'dm-sans-bold.ttf')),
        weight: 700 as const,
        style: 'normal' as const,
      },
    ];
  } catch (err) {
    console.error('OG brand fonts unavailable, falling back to default', err);
    return null;
  }
}

export default async function Image({ params }: { params: { id: string } }) {
  const fonts = brandFonts();
  const job = await prisma.jobPost.findUnique({
    where: { id: params.id },
    select: {
      title: true,
      company: true,
      location: true,
      market: true,
      salaryText: true,
      bracket: true,
      employmentType: true,
    },
  });

  const title = job?.title ?? 'Job vacancy';
  const company = job?.company ?? null;
  const place = job?.location || (job?.market === 'ZA' ? 'South Africa' : 'Zimbabwe');

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
            height: '100%',
            background: LIME,
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40 }}>
            <div
              style={{
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
