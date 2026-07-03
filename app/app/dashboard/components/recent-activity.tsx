'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { FileText, Upload, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface Activity {
  action: string;
  item: string;
  time: string;
  type: 'create' | 'tailor' | 'cover' | 'check';
}

const typeConfig = {
  create: { label: 'Created', bg: 'bg-blue-500/15', text: 'text-blue-400', icon: FileText },
  tailor: { label: 'Tailored', bg: 'bg-emerald-500/15', text: 'text-emerald-400', icon: Upload },
  cover: { label: 'Cover Letter', bg: 'bg-violet-500/15', text: 'text-violet-400', icon: FileText },
  check: { label: 'ATS Check', bg: 'bg-amber-500/15', text: 'text-amber-400', icon: CheckCircle },
};

const VISIBLE_COUNT = 5;

export function RecentActivity({ activities }: { activities: Activity[] }) {
  const visible = activities.slice(0, VISIBLE_COUNT);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.18 }}
      className="rounded-2xl border border-border/60 bg-card overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Recent Activity</h2>
        </div>
        <Link href="/app/documents">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
          >
            View all
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>

      <div className="divide-y divide-border/40">
        {visible.map((activity, index) => {
          const cfg = typeConfig[activity.type];
          const Icon = cfg.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
            >
              <div
                className={cn(
                  'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0',
                  cfg.bg
                )}
              >
                <Icon className={cn('h-3.5 w-3.5', cfg.text)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{activity.item}</p>
                <p className="text-xs text-muted-foreground">{activity.action}</p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] font-medium hidden sm:inline-flex border-0',
                  cfg.bg,
                  cfg.text
                )}
              >
                {cfg.label}
              </Badge>
              <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 hidden md:block">
                {activity.time}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
