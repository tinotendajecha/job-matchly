'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Share2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { JobItem } from './job-card';

/**
 * Shares a job from the in-app feed.
 *
 * Shares the JobMatchly page for the job, not the employer's URL — the point is
 * that whoever receives it lands somewhere that can introduce them to the
 * product, and the sender's own link is what gets them there.
 */
export function ShareJobButton({ job }: { job: JobItem }) {
  const [copied, setCopied] = useState(false);

  async function share(e: React.MouseEvent) {
    // The card is covered by a link overlay; without this, sharing would also
    // open the listing in a new tab.
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}/jobs/${job.id}`;
    const text = job.company ? `${job.title} at ${job.company}` : job.title;

    fetch('/api/jobs/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: job.id }),
      keepalive: true,
    }).catch(() => {});

    if (navigator.share) {
      try {
        await navigator.share({ title: text, text: `${text} — on JobMatchly`, url });
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copied — paste it anywhere');
    } catch {
      toast.error('Could not copy the link');
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label={`Share ${job.title}`}
      className={cn(
        'inline-flex items-center justify-center rounded-full p-1.5 transition-colors',
        'text-muted-foreground hover:bg-accent hover:text-foreground',
        'focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
    </button>
  );
}
