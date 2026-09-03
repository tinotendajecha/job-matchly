'use client';

import { MapPin, Building2, Clock, ArrowUpRight, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ShareJobButton } from './share-job-button';

export interface JobItem {
  id: string;
  title: string;
  company: string | null;
  companyLogo: string | null;
  location: string | null;
  market: string;
  employmentType: string | null;
  salaryText: string | null;
  bracket: string | null;
  seniority: string | null;
  url: string;
  postedAt: string;
  expiresAt: string | null;
  reasons: string[];
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

function postedLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function JobCard({ job, compact = false }: { job: JobItem; compact?: boolean }) {
  const closingIn = daysUntil(job.expiresAt);
  // These listings genuinely expire in days, so surface it rather than bury it.
  const urgent = closingIn !== null && closingIn <= 3;

  return (
    <div className="group relative h-full">
      <article
        className={cn(
          'flex flex-col h-full rounded-2xl border border-border/60 bg-card transition-all',
          'group-hover:border-primary/30 group-hover:shadow-lg group-hover:shadow-primary/5',
          compact ? 'p-4' : 'p-5'
        )}
      >
        {/* Covers the card so the whole surface stays clickable, while leaving
            the share control reachable above it. */}
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 rounded-2xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          aria-label={`${job.title}${job.company ? ` at ${job.company}` : ''} — open listing`}
        />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3
              className={cn(
                'font-semibold font-display leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2',
                compact ? 'text-sm' : 'text-base'
              )}
            >
              {job.title}
            </h3>
            {job.company && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{job.company}</span>
              </p>
            )}
          </div>
          <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
          {job.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate max-w-[160px]">{job.location}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {postedLabel(job.postedAt)}
          </span>
          {job.salaryText && (
            <span className="inline-flex items-center gap-1">
              <Banknote className="h-3 w-3" />
              {job.salaryText}
            </span>
          )}
        </div>

        {!compact && job.reasons.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.reasons.slice(0, 3).map((reason) => (
              <span
                key={reason}
                className="rounded-full border border-primary/25 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary"
              >
                {reason}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {job.market === 'ZW' ? 'Zimbabwe' : 'South Africa'}
          </span>
          <div className="flex items-center gap-1.5">
            {closingIn !== null && closingIn >= 0 && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-medium',
                  urgent
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {closingIn === 0 ? 'Closes today' : `Closes in ${closingIn}d`}
              </span>
            )}
            {/* Above the overlay link, so sharing never opens the listing. */}
            <div className="relative">
              <ShareJobButton job={job} />
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
