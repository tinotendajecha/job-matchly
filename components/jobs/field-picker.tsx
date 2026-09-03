'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Target, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DISMISS_KEY = 'jm_field_prompt_dismissed_at';
const SNOOZE_DAYS = 30;

interface FieldData {
  brackets: string[];
  current: string | null;
  answered: boolean;
  suggestion: { bracket: string; jobTitle: string } | null;
}

/**
 * Asks one question — which field are you in — instead of sending people to
 * full onboarding.
 *
 * Onboarding has been completed by 2 of 188 users, so anything that navigates
 * away is effectively never answered. This is a single tap in place.
 *
 * Where a shared job link brought them here, that job's field is pre-selected.
 * It is a prior, not a conclusion: the tag is only written once the person
 * confirms it, because a wrong silent tag means a feed full of jobs they don't
 * want and no obvious way to understand why.
 */
export function FieldPicker({ onSaved }: { onSaved?: (bracket: string) => void }) {
  const [data, setData] = useState<FieldData | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
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

    fetch('/api/profile/field', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j: FieldData & { ok: boolean }) => {
        if (!j?.ok || j.answered) return;
        setData(j);
        // Pre-select the arrival hint, else whatever we previously inferred.
        setSelected(j.suggestion?.bracket ?? j.current ?? null);
      })
      .catch(() => {});
  }, []);

  function dismiss() {
    setHidden(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* dismissal just won't persist */
    }
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch('/api/profile/field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bracket: selected }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Could not save');
      toast.success(`Showing you ${selected} jobs`);
      setHidden(true);
      onSaved?.(selected);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save your field');
    } finally {
      setSaving(false);
    }
  }

  if (!data || hidden) return null;

  const suggested = data.suggestion?.bracket ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:p-5"
    >
      <button
        onClick={dismiss}
        aria-label="Not now"
        className="absolute right-3 top-3 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="pr-6">
        <h3 className="flex items-center gap-2 font-semibold text-foreground">
          <Target className="h-4 w-4 text-primary flex-shrink-0" />
          What kind of work are you looking for?
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.suggestion ? (
            <>
              You came here from a {data.suggestion.bracket.toLowerCase()} role, so we&apos;ve
              picked that. Change it if it&apos;s not right — one tap and we&apos;ll only show you
              jobs in your field.
            </>
          ) : (
            <>Pick one and we&apos;ll only show you jobs in your field. You can change it later.</>
          )}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {data.brackets.map((bracket) => {
          const active = selected === bracket;
          return (
            <button
              key={bracket}
              onClick={() => setSelected(bracket)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border/60 bg-background text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              {active && <Check className="h-3 w-3" />}
              {bracket}
              {!active && bracket === suggested && (
                <span className="text-[10px] text-primary">suggested</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button size="sm" onClick={save} disabled={!selected || saving}>
          {saving ? 'Saving…' : 'Show me these jobs'}
        </Button>
        <Button size="sm" variant="ghost" onClick={dismiss}>
          Not now
        </Button>
      </div>
    </motion.div>
  );
}
