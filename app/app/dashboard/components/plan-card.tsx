'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { CreditCard, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { differenceInDays, format } from 'date-fns';

export type SubData = {
  tier: string;
  status: string;
  isActive: boolean;
  trialEndsAt: string | null;
  currentPeriodEnd: string;
  market: string;
};

interface PlanCardProps {
  subData: SubData | null | undefined; // undefined = loading
}

export function PlanCard({ subData }: PlanCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.14 }}
      className="rounded-2xl border border-border/60 bg-card p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Your Plan</h3>
        <Link href="/app/billing">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs px-2 text-primary hover:text-primary hover:bg-primary/10"
          >
            Manage
          </Button>
        </Link>
      </div>

      {/* Loading */}
      {subData === undefined && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading…
        </div>
      )}

      {/* No subscription record — brand new user */}
      {subData === null && (
        <div className="space-y-2.5">
          <p className="text-xs text-muted-foreground">
            No active plan. Start your free 14-day trial.
          </p>
          <Link href="/pricing">
            <Button size="sm" className="w-full h-8 text-xs font-semibold">
              Start free trial
            </Button>
          </Link>
        </div>
      )}

      {/* Subscription exists but expired / canceled */}
      {subData && !subData.isActive && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
            <span className="text-sm font-medium text-amber-400">Subscription ended</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Your {subData.tier} plan has ended. Choose a plan to continue.
          </p>
          <Link href="/pricing">
            <Button size="sm" className="w-full h-8 text-xs font-semibold mt-5">
              Choose a plan
            </Button>
          </Link>
        </div>
      )}

      {/* Active trial */}
      {subData?.isActive &&
        subData.status === 'TRIALING' &&
        (() => {
          const daysLeft = subData.trialEndsAt
            ? Math.max(0, differenceInDays(new Date(subData.trialEndsAt), new Date()))
            : 0;
          const isUrgent = daysLeft <= 3;
          return (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <CreditCard className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm font-medium">{subData.tier} plan</span>
                <Badge variant="outline" className="text-[10px] border-blue-400/40 text-blue-400">
                  Trial
                </Badge>
              </div>
              <p
                className={cn(
                  'text-xs',
                  isUrgent ? 'text-amber-400 font-medium' : 'text-muted-foreground'
                )}
              >
                {daysLeft === 0
                  ? 'Trial ends today — subscribe to keep access.'
                  : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in your trial.`}
              </p>
              <Link href="/pricing">
                <Button
                  size="sm"
                  variant={isUrgent ? 'default' : 'outline'}
                  className="w-full h-8 text-xs font-semibold"
                >
                  Subscribe now
                </Button>
              </Link>
            </div>
          );
        })()}

      {/* Past due */}
      {subData?.isActive && subData.status === 'PAST_DUE' && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
            <span className="text-sm font-medium">{subData.tier} plan</span>
            <Badge variant="outline" className="text-[10px] border-amber-400/40 text-amber-400">
              Past due
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Payment issue — update billing to keep access.
          </p>
          <Link href="/app/billing">
            <Button size="sm" className="w-full h-8 text-xs font-semibold">
              Update billing
            </Button>
          </Link>
        </div>
      )}

      {/* Active paid subscription */}
      {subData?.isActive && subData.status === 'ACTIVE' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span className="text-sm font-medium">{subData.tier} plan</span>
            <Badge variant="outline" className="text-[10px] border-emerald-400/40 text-emerald-400">
              Active
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Renews {format(new Date(subData.currentPeriodEnd), 'dd MMM yyyy')}
          </p>
        </div>
      )}
    </motion.div>
  );
}
