'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Sparkles, AlertCircle } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { JobCard, type JobItem } from './components/job-card';

interface JobsResponse {
  ok: boolean;
  personalized: boolean;
  profession: { bracket: string; primaryRole: string | null; seniority: string | null } | null;
  jobs: JobItem[];
}

function CardSkeleton() {
  return <div className="h-[168px] rounded-2xl border border-border/60 bg-card animate-pulse" />;
}

export default function JobsPage() {
  const [data, setData] = useState<JobsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/jobs?limit=36', { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (!json.ok) throw new Error(json.error || 'Failed to load jobs');
        setData(json);
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Something went wrong'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <AppSidebar />
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 md:py-8 max-w-[1440px] mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <h1 className="text-2xl sm:text-3xl font-bold font-display">Jobs for you</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {data?.personalized && data.profession
                  ? `Matched to your ${data.profession.bracket} background — newest first`
                  : 'Live vacancies from Zimbabwe and South Africa'}
              </p>
            </motion.div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Couldn&apos;t load jobs</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Honest about WHY the list looks the way it does. */}
            {!loading && data && !data.personalized && (
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertTitle>Showing the latest jobs</AlertTitle>
                <AlertDescription>
                  Tailor a CV to a role you want and we&apos;ll learn what you&apos;re looking for, then put
                  matching vacancies at the top of this page.
                </AlertDescription>
              </Alert>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : data && data.jobs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {data.jobs.map((job, i) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.4) }}
                  >
                    <JobCard job={job} />
                  </motion.div>
                ))}
              </div>
            ) : (
              !error && (
                <div className="rounded-2xl border border-border/60 bg-card p-10 text-center">
                  <Briefcase className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 font-medium">No open vacancies right now</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Listings expire quickly. Check back shortly — we refresh daily.
                  </p>
                </div>
              )
            )}

            {data && data.jobs.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Listings link out to the original posting — applications happen on the employer&apos;s own site.
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
