'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Users,
  Sparkles,
  Check,
  Building2,
  Clock,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface PublicStats {
  liveJobs: number;
  employers: number;
  fieldsCovered: number;
}

/**
 * What we can build on, stated as things we hold rather than things we promise.
 * Each maps to something real: JobPost rows, the bracket taxonomy, the daily
 * crawl, and lastSeenAt-based time-on-market.
 */
const CAPABILITIES = [
  {
    icon: BarChart3,
    title: 'Who is hiring, and for what',
    body: 'Every vacancy we track, by employer, city, profession and seniority. Which companies are ramping up, which have gone quiet, and how that has moved since last quarter.',
  },
  {
    icon: Clock,
    title: 'How long roles stay open',
    body: 'We record when a listing appears and when it stops being advertised. That is a time-to-fill signal for a market where almost nobody measures one.',
  },
  {
    icon: Users,
    title: 'Candidates who opted in',
    body: 'Job seekers who have explicitly agreed to be found by recruiters — never a scraped list. You reach them through us, and they decide whether to share contact details.',
  },
  {
    icon: Sparkles,
    title: 'Ask it in plain language',
    body: 'The end goal: an agent you can ask "which Joburg firms hired three or more backend engineers this quarter, and how long did those roles stay open?" and get an answer with its working shown.',
  },
];

export default function ForRecruitersPage() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    hiresPerYear: '',
    note: '',
  });

  useEffect(() => {
    fetch('/api/public/stats')
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok) setStats(j);
      })
      .catch(() => {
        /* the page reads fine without numbers */
      });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/public/recruiter-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Could not save that');
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isPublic />

      <main className="flex-1">
        {/* ══ HERO ══ */}
        <section className="relative overflow-hidden py-20 md:py-28">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[420px] rounded-full bg-primary/8 blur-[140px] pointer-events-none" />

          <div className="container relative px-4 mx-auto max-w-4xl text-center">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Badge variant="outline" className="mb-6 border-primary/30 bg-primary/8 text-primary px-4 py-1.5">
                <span className="text-xs font-medium">In development — talking to recruiters now</span>
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] mb-6"
            >
              Hiring intelligence for
              <br className="hidden md:block" /> <span className="text-primary">African markets</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8"
            >
              We already track what is being hired across Zimbabwe and South Africa — who is
              advertising, for which roles, in which cities, and for how long. We are turning that
              into something recruiters and staffing firms can query.
            </motion.p>

            {stats && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.24 }}
                className="flex flex-wrap gap-8 justify-center mb-10"
              >
                {[
                  { value: `${stats.liveJobs.toLocaleString()}+`, label: 'Live vacancies tracked' },
                  { value: `${stats.employers.toLocaleString()}+`, label: 'Employers seen hiring' },
                  { value: `${stats.fieldsCovered}`, label: 'Professions classified' },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="text-2xl font-bold text-primary font-display">{s.value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                  </div>
                ))}
              </motion.div>
            )}

            <Button asChild size="lg" className="text-base px-8 py-6 font-semibold">
              <a href="#waitlist">
                Get early access
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </section>

        {/* ══ WHAT IT DOES ══ */}
        <section className="py-20 bg-card/40 border-y border-border/50">
          <div className="container px-4 mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">What we are building</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Three of these run on data we already collect. The fourth is where it is going.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {CAPABILITIES.map((c) => (
                <div key={c.title} className="rounded-2xl border border-border/60 bg-background p-6">
                  <c.icon className="h-5 w-5 text-primary mb-3" />
                  <h3 className="font-bold font-display mb-2">{c.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ HOW WE HANDLE CANDIDATES ══
            Leading with consent is not a legal footnote here. A recruiter
            working a properly opted-in pool gets better replies than one
            cold-mailing scraped CVs, and can tell their own clients so. */}
        <section className="py-20">
          <div className="container px-4 mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold mb-4">Nobody is in our pool by accident</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Plenty of candidate databases in this market were assembled without anyone asking.
              Ours is not one of them, and that is a feature you can pass on to your clients.
            </p>
            <ul className="space-y-3">
              {[
                'Candidates opt in explicitly. It is off by default and nothing is shared until someone turns it on.',
                'They can withdraw in one click, and are removed from search immediately.',
                'Contact details stay hidden until the candidate accepts your approach.',
                'Recruiters accept written terms covering what they may do with what they see.',
                'Every grant and withdrawal is dated and recorded, so what was agreed is provable.',
              ].map((line) => (
                <li key={line} className="flex items-start gap-3 text-sm">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{line}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-6">
              Built to South Africa&apos;s POPIA. Read the{' '}
              <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
                data protection agreement
              </Link>{' '}
              if you want the detail.
            </p>
          </div>
        </section>

        {/* ══ WAITLIST ══ */}
        <section id="waitlist" className="py-20 bg-card/40 border-t border-border/50 scroll-mt-20">
          <div className="container px-4 mx-auto max-w-xl">
            {sent ? (
              <div className="rounded-2xl border border-primary/25 bg-primary/5 p-8 text-center">
                <Check className="h-8 w-8 text-primary mx-auto mb-3" />
                <h2 className="text-2xl font-bold font-display mb-2">Thanks — you&apos;re on the list</h2>
                <p className="text-sm text-muted-foreground">
                  We&apos;ll be in touch as this gets closer, and we may ask what you&apos;d want
                  from it. If you&apos;d rather talk sooner, email{' '}
                  <a href="mailto:hello@jobmatchly.site" className="text-foreground underline underline-offset-2">
                    hello@jobmatchly.site
                  </a>
                  .
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-3">Get early access</h2>
                  <p className="text-muted-foreground">
                    It isn&apos;t live yet. Tell us how you hire and we&apos;ll build toward it —
                    the people on this list shape what ships first.
                  </p>
                </div>

                <form onSubmit={submit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Your name</Label>
                      <Input
                        id="name"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        required
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Work email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hires">Roughly how many people do you hire a year?</Label>
                    <Input
                      id="hires"
                      placeholder="e.g. 20–50"
                      value={form.hiresPerYear}
                      onChange={(e) => setForm({ ...form, hiresPerYear: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="note">
                      What is hardest about hiring right now?{' '}
                      <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Textarea
                      id="note"
                      rows={3}
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      placeholder="The more specific, the more useful."
                    />
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <Button type="submit" size="lg" className="w-full font-semibold" disabled={submitting}>
                    {submitting ? 'Sending…' : 'Join the waitlist'}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    We&apos;ll only email you about this. No newsletter.
                  </p>
                </form>
              </>
            )}
          </div>
        </section>

        {/* ══ FOR CANDIDATES ══ */}
        <section className="py-14">
          <div className="container px-4 mx-auto max-w-3xl">
            <div className="rounded-2xl border border-border/60 bg-card p-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <Building2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <p className="text-sm text-muted-foreground flex-1">
                Looking for a job rather than hiring for one? The candidate side is live and free.
              </p>
              <Button asChild variant="outline" size="sm" className="flex-shrink-0">
                <Link href="/">Find jobs</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
