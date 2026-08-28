'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Search, Mail, BellRing, Check, X } from 'lucide-react';

interface Preferences {
  marketingEmails: boolean;
  jobAlerts: boolean;
  recruiterVisible: boolean;
  recruiterVisibleAt: string | null;
}

const EMAIL_PREFS: Array<{ key: 'jobAlerts' | 'marketingEmails'; label: string; description: string; icon: typeof Mail }> = [
  {
    key: 'jobAlerts',
    label: 'Job alerts',
    description: 'A weekly email with new vacancies matched to your profession.',
    icon: BellRing,
  },
  {
    key: 'marketingEmails',
    label: 'Product news',
    description: 'Occasional updates about new features. No more than once a month.',
    icon: Mail,
  },
];

export function PreferencesPanel() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/profile/preferences', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok) setPrefs(j.preferences);
      })
      .catch(() => toast.error('Could not load your preferences'));
  }, []);

  async function update(key: keyof Preferences, value: boolean) {
    if (!prefs) return;
    const previous = prefs;
    // Optimistic, but rolled back on failure — a toggle that appears to stick
    // while the server rejected it is the one bug this screen must not have.
    setPrefs({ ...prefs, [key]: value });
    setSaving(key);
    try {
      const res = await fetch('/api/profile/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Save failed');
      setPrefs(json.preferences);
      toast.success('Saved');
    } catch (e) {
      setPrefs(previous);
      toast.error(e instanceof Error ? e.message : 'Could not save that change');
    } finally {
      setSaving(null);
    }
  }

  if (!prefs) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[220px] rounded-xl" />
        <Skeleton className="h-[260px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle>Emails</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {EMAIL_PREFS.map((pref) => (
              <div
                key={pref.key}
                className="flex items-start justify-between gap-4 rounded-lg border border-border/60 p-4"
              >
                <div className="flex gap-3 min-w-0">
                  <pref.icon className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium">{pref.label}</p>
                    <p className="text-sm text-muted-foreground">{pref.description}</p>
                  </div>
                </div>
                <Switch
                  checked={prefs[pref.key]}
                  disabled={saving === pref.key}
                  onCheckedChange={(v) => update(pref.key, v)}
                  aria-label={pref.label}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3 min-w-0">
                <Search className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <CardTitle>Let recruiters find you</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Off by default. Nothing is shared with anyone unless you turn this on.
                  </p>
                </div>
              </div>
              <Switch
                checked={prefs.recruiterVisible}
                disabled={saving === 'recruiterVisible'}
                onCheckedChange={(v) => update('recruiterVisible', v)}
                aria-label="Let recruiters find you"
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* The specific purpose, stated where the decision is made rather
                than only in the agreement. */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-border/60 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                  Recruiters would see
                </p>
                <ul className="space-y-1.5 text-sm">
                  {[
                    'Your name and professional headline',
                    'Your city and country',
                    'Your profession and experience level',
                    'The skills on your JobMatchly profile',
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <Check className="h-3.5 w-3.5 mt-1 text-primary flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-border/60 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                  They would not see
                </p>
                <ul className="space-y-1.5 text-sm">
                  {[
                    'Your email address or phone number',
                    'Your uploaded CV files',
                    'Documents you have tailored',
                    'Anything until you accept their approach',
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <X className="h-3.5 w-3.5 mt-1 text-muted-foreground flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Saying this plainly matters more than it costs: recruiter search
                does not exist yet, and implying otherwise would make the consent
                misinformed. */}
            <div className="rounded-lg bg-muted/50 border border-border/60 p-4 text-sm">
              <Badge variant="secondary" className="mb-2">
                Not live yet
              </Badge>
              <p className="text-muted-foreground">
                We haven&apos;t built recruiter search yet. Turning this on now means you&apos;ll be
                included when it launches, and we&apos;ll email you before it does. You can turn it
                off at any time — including before launch — and you&apos;re removed straight away.
              </p>
            </div>

            {prefs.recruiterVisible && prefs.recruiterVisibleAt && (
              <p className="text-xs text-muted-foreground">
                You turned this on{' '}
                {new Date(prefs.recruiterVisibleAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
                .
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              How we handle your data is set out in the{' '}
              <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
                Data Protection &amp; Consent Agreement
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
