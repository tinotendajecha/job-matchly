'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DISMISS_KEY = 'jm_onboarding_prompt_dismissed_at';
const SNOOZE_DAYS = 14;

/**
 * Invites — never forces — a user to finish their profile.
 *
 * Only 2 of 188 users have onboardingComplete set, because nothing ever brings
 * them back to it. A forced redirect would be hostile to people already using
 * the product happily, so this is a dismissible card instead. Completing it
 * also gives the job matcher real evidence to work from.
 */
export function OnboardingPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // localStorage throws in some privacy modes — never let that break the page.
    let snoozed = false;
    try {
      const raw = window.localStorage.getItem(DISMISS_KEY);
      if (raw) {
        const at = Number(raw);
        snoozed = Number.isFinite(at) && Date.now() - at < SNOOZE_DAYS * 86_400_000;
      }
    } catch {
      /* treat as not snoozed */
    }
    if (snoozed) return;

    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j?.ok && j.user && j.user.onboardingComplete === false) setVisible(true);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* dismissal just won't persist */
    }
  }

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:p-5"
    >
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pr-6">
        <div className="flex-1 min-w-0">
          <h3 className="flex items-center gap-2 font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
            Get better job matches
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Tell us the role you&apos;re targeting and we&apos;ll put the right vacancies at the top of your
            jobs page. Takes about a minute.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button size="sm" variant="ghost" onClick={dismiss}>
            Not now
          </Button>
          <Button size="sm" asChild>
            <Link href="/onboarding">Complete profile</Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
