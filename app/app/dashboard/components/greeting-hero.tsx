'use client';

import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface GreetingHeroProps {
  name: string;
  planLabel?: string | null;
}

function getGreeting(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function GreetingHero({ name, planLabel }: GreetingHeroProps) {
  const now = new Date();
  const greeting = getGreeting(now.getHours());
  const firstName = name ? name.split(' ')[0] : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="pt-1"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-2">
        {format(now, 'EEEE, d MMMM')}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl sm:text-[28px] font-bold font-display leading-tight">
          {greeting}
          {firstName ? `, ${firstName}` : ''}
        </h1>
        {planLabel && (
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/10 text-primary text-[10px] font-medium"
          >
            {planLabel}
          </Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground mt-1.5">
        Here’s what’s waiting for you today.
      </p>
    </motion.div>
  );
}
