'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { JobCard, type JobItem } from './components/job-card';
import { FieldPicker } from '@/components/jobs/field-picker';

type MarketFilter = 'ZW' | 'ZA' | 'ALL';

interface JobsResponse {
  ok: boolean;
  personalized: boolean;
  hasProfession: boolean;
  matchedTotal: number;
  market: MarketFilter;
  defaultMarket: 'ZW' | 'ZA';
  counts: { ZW: number; ZA: number; ALL: number };
  profession: { bracket: string; primaryRole: string | null; seniority: string | null } | null;
  allFields: boolean;
  jobs: JobItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const PER_PAGE = 9;

const MARKET_TABS: Array<{ key: MarketFilter; label: string }> = [
  { key: 'ZA', label: 'South Africa' },
  { key: 'ZW', label: 'Zimbabwe' },
  { key: 'ALL', label: 'All' },
];

function CardSkeleton() {
  return <div className="h-[168px] rounded-2xl border border-border/60 bg-card animate-pulse" />;
}

export default function JobsPage() {
  const [data, setData] = useState<JobsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  // null until the first response tells us which country this visitor is in.
  const [market, setMarket] = useState<MarketFilter | null>(null);
  // Off by default: a tagged user should see their own field, not everything.
  const [allFields, setAllFields] = useState(false);

  const load = useCallback(
    async (opts: { page: number; market: MarketFilter | null; allFields: boolean }) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(opts.page), limit: String(PER_PAGE) });
        if (opts.market) params.set('market', opts.market);
        if (opts.allFields) params.set('allFields', '1');

        const res = await fetch(`/api/jobs?${params}`, { cache: 'no-store' });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || 'Failed to load jobs');
        setData(json);
        // Adopt the server's resolved market so the right tab is highlighted.
        setMarket((current) => current ?? json.market);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load({ page, market, allFields });
  }, [page, market, allFields, load]);

  function changeMarket(next: MarketFilter) {
    if (next === market) return;
    setMarket(next);
    setPage(1); // a different country is a different result set
  }

  function changeFields(next: boolean) {
    if (next === allFields) return;
    setAllFields(next);
    setPage(1);
  }

  const pagination = data?.pagination;
  const canPrev = page > 1;
  const canNext = pagination ? page < pagination.totalPages : false;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <AppSidebar />
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 md:py-8 max-w-[1440px] mx-auto space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <h1 className="text-2xl sm:text-3xl font-bold font-display">Jobs for you</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {data?.hasProfession && data.profession
                  ? allFields
                    ? 'Every open vacancy, newest first'
                    : `${data.profession.bracket} roles only, best matches first`
                  : 'Live vacancies from Zimbabwe and South Africa'}
              </p>
            </motion.div>

            {/* Country filter — defaults to the visitor's own market */}
            <div className="flex flex-wrap items-center gap-2">
              {MARKET_TABS.map((tab) => {
                const active = market === tab.key;
                const count = data?.counts?.[tab.key];
                return (
                  <button
                    key={tab.key}
                    onClick={() => changeMarket(tab.key)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                      active
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent'
                    )}
                  >
                    {tab.label}
                    {typeof count === 'number' && (
                      <span className={cn('text-[10px]', active ? 'text-primary/70' : 'text-muted-foreground/70')}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
              {data && market && market !== data.defaultMarket && (
                <button
                  onClick={() => changeMarket(data.defaultMarket)}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  Back to my country
                </button>
              )}
            </div>

            {/* Field filter — a tagged user's own bracket is the default, but
                they can deliberately widen to browse everything. */}
            {data?.hasProfession && data.profession && (
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { key: false, label: data.profession.bracket },
                  { key: true, label: 'All fields' },
                ].map((opt) => {
                  const active = allFields === opt.key;
                  return (
                    <button
                      key={String(opt.key)}
                      onClick={() => changeFields(opt.key)}
                      className={cn(
                        'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                        active
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent'
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Answering this changes the feed underneath, so reload it. */}
            <FieldPicker
              onSaved={() => {
                setPage(1);
                load({ page: 1, market, allFields: false });
              }}
            />

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Couldn&apos;t load jobs</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!loading && data && !data.hasProfession && data.jobs.length > 0 && (
              <Alert>
                <Briefcase className="h-4 w-4" />
                <AlertTitle>Showing the latest jobs</AlertTitle>
                <AlertDescription>
                  Tailor a CV to a role you want and we&apos;ll learn what you&apos;re looking for, then put
                  matching vacancies at the top of this page.
                </AlertDescription>
              </Alert>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: PER_PAGE }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : data && data.jobs.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {data.jobs.map((job, i) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, delay: Math.min(i * 0.03, 0.3) }}
                    >
                      <JobCard job={job} />
                    </motion.div>
                  ))}
                </div>

                {pagination && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <p className="text-xs text-muted-foreground">
                      Showing {(page - 1) * pagination.limit + 1}–
                      {Math.min(page * pagination.limit, pagination.total)} of {pagination.total}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={!canPrev}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Page {page} of {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={!canNext}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              !error && (
                <div className="rounded-2xl border border-border/60 bg-card p-10 text-center">
                  <Briefcase className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 font-medium">
                    No {!allFields && data?.profession ? `${data.profession.bracket} ` : 'open '}vacancies
                    {market && market !== 'ALL'
                      ? ` in ${market === 'ZA' ? 'South Africa' : 'Zimbabwe'}`
                      : ''}{' '}
                    right now
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {!allFields && data?.profession
                      ? 'We only show roles in your field, so this page is thin when your field is quiet. Widen it or try another country.'
                      : 'Listings expire quickly — try another country or check back shortly.'}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    {market !== 'ALL' && (
                      <Button variant="outline" size="sm" onClick={() => changeMarket('ALL')}>
                        Show all countries
                      </Button>
                    )}
                    {!allFields && data?.hasProfession && (
                      <Button variant="outline" size="sm" onClick={() => changeFields(true)}>
                        Show all fields
                      </Button>
                    )}
                  </div>
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
