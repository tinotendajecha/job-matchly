// app/jobs/[id]/page.tsx
//
// Public, shareable job page. This is the landing point for every shared link,
// so it has two jobs: read well to someone who has never heard of JobMatchly,
// and be worth indexing.
//
// The whole listing is public. Only the outbound link to the employer is behind
// a sign-in, because that is the moment intent is highest and the ask is
// smallest. Hiding the details instead would make the shared link a bait — the
// person who sent it would look bad, and nobody would share a second one.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  MapPin,
  Building2,
  Banknote,
  Clock,
  Briefcase,
  ArrowUpRight,
  Lock,
  CalendarClock,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { liveJobWhere } from '@/lib/jobs/policy';
import { shareBaseUrl, shareUrlFor, summarize, trackShareEvent } from '@/lib/jobs/share';
import { ShareButton } from './share-button';
import { ArrivalTracker } from '@/components/jobs/arrival-tracker';

export const runtime = 'nodejs';
// A listing's status changes between crawls, and a stale "still open" is the
// one error that wastes someone's time.
export const dynamic = 'force-dynamic';

async function getJob(id: string) {
  return prisma.jobPost.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      company: true,
      companyLogo: true,
      location: true,
      market: true,
      employmentType: true,
      salaryText: true,
      description: true,
      bracket: true,
      seniority: true,
      url: true,
      status: true,
      postedAt: true,
      expiresAt: true,
      createdAt: true,
    },
  });
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const job = await getJob(params.id);
  if (!job) return { title: 'Job not found | JobMatchly' };

  const where = job.location || (job.market === 'ZA' ? 'South Africa' : 'Zimbabwe');
  const title = `${job.title}${job.company ? ` at ${job.company}` : ''} — ${where}`;
  const description = summarize(job.description, 200);
  const url = shareUrlFor(job.id, job.market);

  return {
    title: `${title} | JobMatchly`,
    description,
    // Without this, the generated OG image resolves against localhost and the
    // preview breaks everywhere the link is actually pasted.
    metadataBase: new URL(shareBaseUrl(job.market)),
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'JobMatchly',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

function postedLabel(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return 'Posted today';
  if (days === 1) return 'Posted yesterday';
  if (days < 7) return `Posted ${days} days ago`;
  return `Posted ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`;
}

export default async function PublicJobPage({ params }: { params: { id: string } }) {
  const [job, user] = await Promise.all([getJob(params.id), getCurrentUser()]);
  if (!job) notFound();

  // Whether this listing is still live uses the same rule as the signed-in
  // feed, so a shared link never claims a job is open that the app has hidden.
  const stillLive = await prisma.jobPost.count({
    where: { ...liveJobWhere(), id: job.id },
  });
  const isLive = stillLive > 0;

  await trackShareEvent(job.id, 'VIEWED', user?.id);

  const where = job.location || (job.market === 'ZA' ? 'South Africa' : 'Zimbabwe');
  const shareUrl = shareUrlFor(job.id, job.market);
  const signInHref = `/auth/signin?next=${encodeURIComponent(`/jobs/${job.id}`)}`;

  // schema.org JobPosting so the listing is eligible for Google Jobs. Only
  // fields we genuinely hold are emitted — an invented validThrough or salary
  // would be both wrong and a structured-data violation.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: (job.postedAt ?? job.createdAt).toISOString(),
    ...(job.expiresAt ? { validThrough: job.expiresAt.toISOString() } : {}),
    ...(job.employmentType ? { employmentType: job.employmentType } : {}),
    ...(job.company ? { hiringOrganization: { '@type': 'Organization', name: job.company } } : {}),
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location ?? undefined,
        addressCountry: job.market === 'ZA' ? 'ZA' : 'ZW',
      },
    },
    directApply: false,
    url: shareUrl,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Only for visitors without an account — anyone signed in already has
          a field, or will be asked directly. */}
      {!user && <ArrivalTracker bracket={job.bracket} jobTitle={job.title} />}
      <Header />

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {!isLive && (
            <div className="mb-6 rounded-xl border border-border/60 bg-muted/50 p-4 flex gap-3">
              <CalendarClock className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">This vacancy has closed</p>
                <p className="text-muted-foreground mt-0.5">
                  It&apos;s kept here for reference.{' '}
                  <Link href="/app/jobs" className="underline underline-offset-2">
                    Browse jobs that are still open
                  </Link>
                  .
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-4 mb-6">
            {job.companyLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={job.companyLogo}
                alt=""
                className="h-14 w-14 rounded-xl object-contain border border-border/60 bg-card flex-shrink-0"
              />
            ) : (
              <div className="h-14 w-14 rounded-xl border border-border/60 bg-muted flex items-center justify-center flex-shrink-0">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold font-display leading-tight text-balance">
                {job.title}
              </h1>
              {job.company && (
                <p className="text-muted-foreground mt-1 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" />
                  {job.company}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-6">
            {job.bracket && <Badge variant="secondary">{job.bracket}</Badge>}
            {job.seniority && <Badge variant="outline">{job.seniority}</Badge>}
            {isLive && <Badge>Open</Badge>}
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {[
              { icon: MapPin, label: 'Location', value: where },
              { icon: Briefcase, label: 'Type', value: job.employmentType },
              { icon: Banknote, label: 'Salary', value: job.salaryText },
              { icon: Clock, label: 'Posted', value: postedLabel(job.postedAt ?? job.createdAt) },
            ]
              .filter((f) => f.value)
              .map((f) => (
                <div
                  key={f.label}
                  className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4"
                >
                  <f.icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      {f.label}
                    </dt>
                    <dd className="text-sm font-medium mt-0.5 break-words">{f.value}</dd>
                  </div>
                </div>
              ))}
          </dl>

          {/* The gate. Everything above is public; this is the one thing that
              asks for an account. */}
          <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5 sm:p-6 mb-8">
            {user ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">Ready to apply?</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    This opens the employer&apos;s own posting. Tailor your CV to it first and you
                    stand a better chance.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 flex-shrink-0">
                  <Button asChild variant="outline">
                    <Link href="/app/upload-tailor">Tailor my CV</Link>
                  </Button>
                  <Button asChild>
                    <a href={job.url} target="_blank" rel="noopener noreferrer nofollow">
                      View listing
                      <ArrowUpRight className="h-4 w-4 ml-1.5" />
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" />
                    Sign in to open this listing
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Free account. You&apos;ll come straight back here, and you&apos;ll get weekly
                    alerts for {job.bracket ? `${job.bracket} roles` : 'roles like this'} if you want
                    them.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 flex-shrink-0">
                  <Button asChild variant="outline">
                    <Link href={signInHref}>Sign in</Link>
                  </Button>
                  <Button asChild>
                    <Link href={`/auth/signup?next=${encodeURIComponent(`/jobs/${job.id}`)}`}>
                      Create free account
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>

          <section className="mb-8">
            <h2 className="text-lg font-semibold font-display mb-3">About this role</h2>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-line text-muted-foreground leading-relaxed">
              {job.description}
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-border/60">
            <ShareButton
              jobId={job.id}
              url={shareUrl}
              title={job.title}
              company={job.company}
            />
            <Button asChild variant="ghost" size="sm">
              <Link href="/app/jobs">See more {job.bracket ?? ''} jobs</Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            JobMatchly lists this vacancy from a public source. Applications happen on the
            employer&apos;s own site — we never charge to apply.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
