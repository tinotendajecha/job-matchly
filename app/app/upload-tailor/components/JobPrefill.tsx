'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Briefcase, X, ExternalLink, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PrefillJob {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  url: string;
  description: string;
}

/**
 * Below this, a description is almost certainly a truncated summary rather
 * than the full posting — Adzuna returns roughly 500 characters and links out
 * for the rest. Tailoring against a partial brief gives a weaker result, so we
 * say so instead of implying the box is complete.
 */
const LIKELY_TRUNCATED = 700;

/**
 * Fills the job description from ?jobId when someone arrives from a listing.
 *
 * We already hold the description, so asking them to paste it back is busywork
 * at exactly the point they are most likely to give up. Fetched rather than
 * passed through the URL — a full job description does not belong in a query
 * string or in browser history.
 */
export function JobPrefill({
  onPrefill,
}: {
  onPrefill: (description: string) => void;
}) {
  const params = useSearchParams();
  const jobId = params.get('jobId');
  const [job, setJob] = useState<PrefillJob | null>(null);
  const [cleared, setCleared] = useState(false);
  const [freeLeft, setFreeLeft] = useState<number | null>(null);
  // Prefill is a one-time action; re-running it would overwrite edits.
  const applied = useRef(false);

  useEffect(() => {
    if (!jobId || applied.current) return;

    fetch(`/api/jobs/${jobId}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (!j?.ok || applied.current) return;
        applied.current = true;
        setJob(j.job);
        onPrefill(j.job.description);
      })
      .catch(() => {
        /* the paste box still works */
      });
  }, [jobId, onPrefill]);

  // Tailoring may cost them their only free run, so say so before they start
  // rather than after the attempt is refused.
  useEffect(() => {
    fetch('/api/profile/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok) setFreeLeft(j.stats.freeTailorsLeft);
      })
      .catch(() => {});
  }, []);

  if (!job || cleared) {
    return freeLeft !== null && freeLeft <= 0 ? <FreeTailorNotice used /> : null;
  }

  return (
    <div className="mb-6 space-y-3">
      <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3 min-w-0">
            <Briefcase className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                Tailoring for <span className="text-primary">{job.title}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {job.company || 'Unknown employer'}
                {job.location ? ` · ${job.location}` : ''}
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">
                {job.description.length < LIKELY_TRUNCATED ? (
                  <>
                    We&apos;ve filled in what this source gives us. It&apos;s a summary rather than
                    the full posting — paste more from the employer&apos;s page below for a sharper
                    result.
                  </>
                ) : (
                  <>We&apos;ve filled in the job description for you — no need to paste it.</>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setCleared(true);
              onPrefill('');
            }}
            aria-label="Clear this job"
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/jobs/${job.id}`}>View the listing</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <a href={job.url} target="_blank" rel="noopener noreferrer nofollow">
              Employer&apos;s posting
              <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
            </a>
          </Button>
        </div>
      </div>

      {freeLeft !== null && <FreeTailorNotice used={freeLeft <= 0} remaining={freeLeft} />}
    </div>
  );
}

function FreeTailorNotice({ used, remaining }: { used: boolean; remaining?: number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/40 p-3 flex gap-2.5 text-xs">
      <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
      <p className="text-muted-foreground">
        {used ? (
          <>
            You&apos;ve used your free tailored CV.{' '}
            <Link href="/pricing" className="text-foreground underline underline-offset-2">
              See plans
            </Link>{' '}
            to keep tailoring for every job you apply to.
          </>
        ) : (
          <>
            This will use your {remaining === 1 ? 'one free' : `${remaining} free`} tailored CV.
            After that you&apos;ll need a plan to keep tailoring.
          </>
        )}
      </p>
    </div>
  );
}
