'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, ExternalLink, Newspaper, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Article {
  id: string;
  title: string;
  summary: string;
  category: string;
  source: string;
  sourceDetail: string | null;
  image: string | null;
  readTime: string;
  url: string;
  featured: boolean;
  createdAt: string;
}

interface ArticlesResponse {
  items: Article[];
  categories: Array<{ name: string; count: number }>;
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

function CardSkeleton() {
  return <div className="h-[300px] rounded-2xl border border-border/60 bg-card animate-pulse" />;
}

export default function ArticlesPage() {
  const [data, setData] = useState<ArticlesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/articles?page=${page}&category=${encodeURIComponent(category)}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Failed to load');
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [page, category]);

  useEffect(() => {
    load();
  }, [load]);

  function changeCategory(next: string) {
    if (next === category) return;
    setCategory(next);
    setPage(1);
  }

  const pagination = data?.pagination;

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
              <h1 className="text-2xl sm:text-3xl font-bold font-display">Career articles</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Advice on applying, interviewing and getting hired, gathered each week.
              </p>
            </motion.div>

            {data && data.categories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {[{ name: 'all', count: data.pagination.total }, ...data.categories].map((c) => {
                  const active = category === c.name;
                  return (
                    <button
                      key={c.name}
                      onClick={() => changeCategory(c.name)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                        active
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent'
                      )}
                    >
                      {c.name === 'all' ? 'All' : c.name}
                      <span className={cn('text-[10px]', active ? 'text-primary/70' : 'text-muted-foreground/70')}>
                        {c.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Couldn&apos;t load articles</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : data && data.items.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {data.items.map((a, i) => (
                    <motion.a
                      key={a.id}
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, delay: Math.min(i * 0.03, 0.3) }}
                      className="group flex flex-col rounded-2xl border border-border/60 bg-card overflow-hidden transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                    >
                      {a.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.image}
                          alt=""
                          className="h-40 w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-40 w-full bg-muted flex items-center justify-center">
                          <Newspaper className="h-7 w-7 text-muted-foreground" />
                        </div>
                      )}

                      <div className="flex flex-col flex-1 p-4">
                        <span className="text-[10px] uppercase tracking-wide text-primary font-medium">
                          {a.category}
                        </span>
                        <h2 className="mt-1.5 font-semibold font-display leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                          {a.title}
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{a.summary}</p>

                        <div className="mt-auto pt-3 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1 truncate">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            {a.readTime}
                          </span>
                          <span className="inline-flex items-center gap-1 truncate">
                            {a.sourceDetail || a.source}
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </span>
                        </div>
                      </div>
                    </motion.a>
                  ))}
                </div>

                {pagination && pagination.totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <p className="text-xs text-muted-foreground">
                      Showing {(page - 1) * pagination.pageSize + 1}–
                      {Math.min(page * pagination.pageSize, pagination.total)} of {pagination.total}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
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
                        disabled={page >= pagination.totalPages}
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
                  <Newspaper className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 font-medium">
                    {category === 'all' ? 'No articles yet' : `Nothing in ${category} yet`}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    New pieces are gathered every week.
                  </p>
                  {category !== 'all' && (
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => changeCategory('all')}>
                      Show all articles
                    </Button>
                  )}
                </div>
              )
            )}

            {data && data.items.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Articles link out to the original publisher.
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
