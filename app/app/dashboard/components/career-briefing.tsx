'use client';

import { useEffect, useState } from 'react';
import { Clock, MessageSquare, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  BRIEFING_FEATURED,
  BRIEFING_ITEMS,
  SOURCE_META,
  type BriefingItem,
} from '../data/briefing';

function SourceBadge({ item, className }: { item: BriefingItem; className?: string }) {
  const meta = SOURCE_META[item.source];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-background/90 backdrop-blur px-2.5 py-1 text-[11px] font-medium shadow-sm',
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

function ItemMeta({ item }: { item: BriefingItem }) {
  return (
    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {item.readTime}
      </span>
      {item.stat && (
        <span className="inline-flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          {item.stat}
        </span>
      )}
    </div>
  );
}

export function CareerBriefing() {
  const [featured, setFeatured] = useState<BriefingItem>(BRIEFING_FEATURED);
  const [items, setItems] = useState<BriefingItem[]>(BRIEFING_ITEMS);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/dashboard/briefing', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled || !json?.ok) return;
        if (json.featured) setFeatured(json.featured);
        if (Array.isArray(json.items) && json.items.length) setItems(json.items);
      })
      .catch((err) => console.warn('Failed to load career briefing', err));

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="space-y-4"
    >
      {/* Section header */}
      <div className="flex flex-wrap items-end justify-between gap-2 pt-2">
        <div>
          <h2 className="text-lg sm:text-xl font-bold font-display">Your Career Briefing</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            The best career conversations from around the web, curated for you
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          Refreshed daily
        </span>
      </div>

      {/* Featured story */}
      <a
        href={featured.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
      >
        <article className="grid grid-cols-1 md:grid-cols-[5fr_4fr] rounded-2xl border border-border/60 bg-card overflow-hidden transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
          <div className="relative aspect-[16/9] md:aspect-auto md:min-h-[240px] overflow-hidden">
            <img
              src={featured.image}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <SourceBadge item={featured} className="absolute top-3 left-3" />
          </div>
          <div className="flex flex-col justify-center gap-3 p-5 sm:p-6">
            <div className="flex items-center gap-2 text-[11px] font-medium">
              <span className="uppercase tracking-wide text-primary">{featured.category}</span>
              <span className="text-muted-foreground/60">·</span>
              <span className="text-muted-foreground">{featured.sourceDetail}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold font-display leading-snug group-hover:text-primary transition-colors">
              {featured.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {featured.summary}
            </p>
            <div className="flex items-center justify-between pt-1">
              <ItemMeta item={featured} />
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                Read more
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </article>
      </a>

      {/* Secondary stories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item, index) => (
          <motion.a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 + index * 0.05 }}
            className="group block"
          >
            <article className="flex flex-col rounded-2xl border border-border/60 bg-card overflow-hidden h-full transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
              <div className="relative aspect-[16/9] overflow-hidden">
                <img
                  src={item.image}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <SourceBadge item={item} className="absolute top-3 left-3" />
              </div>
              <div className="flex flex-col gap-2 p-4 sm:p-5 flex-1">
                <div className="flex items-center gap-2 text-[11px] font-medium">
                  <span className="uppercase tracking-wide text-primary">{item.category}</span>
                  <span className="text-muted-foreground/60">·</span>
                  <span className="text-muted-foreground">{item.sourceDetail}</span>
                </div>
                <h3 className="text-[15px] font-semibold font-display leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2">
                  {item.summary}
                </p>
                <div className="mt-auto pt-2">
                  <ItemMeta item={item} />
                </div>
              </div>
            </article>
          </motion.a>
        ))}
      </div>
    </motion.section>
  );
}
