'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Briefcase } from 'lucide-react';
import { JobCard, type JobItem } from '@/app/app/jobs/components/job-card';

/**
 * Compact jobs row on the dashboard. Deliberately kept as its own section
 * rather than blended into the article feed: these listings expire within days,
 * so they must not compete for position with evergreen reading.
 */
export function JobsStrip() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [personalized, setPersonalized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/jobs?limit=3', { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled || !json?.ok) return;
        setJobs(json.jobs ?? []);
        setPersonalized(Boolean(json.personalized));
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Nothing to show and nothing loading — stay out of the way entirely.
  if (!loading && jobs.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="space-y-3"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-xl font-bold font-display flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            {personalized ? 'Jobs for you' : 'Latest vacancies'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {personalized
              ? 'Matched to the roles you tailor for'
              : 'Fresh openings from Zimbabwe and South Africa'}
          </p>
        </div>
        <Link
          href="/app/jobs"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          See all
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[136px] rounded-2xl border border-border/60 bg-card animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} compact />
          ))}
        </div>
      )}
    </motion.section>
  );
}
