'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { COACH_STARTERS } from '../data/briefing';

export function CoachCard() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.08 }}
      className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
          Career Coach
        </p>
        <Badge
          variant="outline"
          className="text-[10px] border-primary/30 text-primary bg-background/60"
        >
          Early access
        </Badge>
      </div>

      <h3 className="text-base font-bold font-display leading-snug mb-1.5">
        Your personal career mentor
      </h3>
      <p className="text-xs text-muted-foreground leading-relaxed mb-4">
        Guidance whenever you need it — resumes, interviews, salary conversations
        and everything in between.
      </p>

      <div className="space-y-1.5 mb-4">
        {COACH_STARTERS.map((starter) => (
          <div
            key={starter}
            className="rounded-lg border border-border/50 bg-card/70 px-3 py-2 text-xs text-muted-foreground"
          >
            “{starter}”
          </div>
        ))}
      </div>

      <Button asChild size="sm" className="w-full h-9 text-xs font-semibold gap-1.5">
        <Link href="/app/coming-soon">
          <MessageCircle className="h-3.5 w-3.5" />
          Chat with your Career Coach
        </Link>
      </Button>
    </motion.div>
  );
}
