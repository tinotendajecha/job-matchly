'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Check, X, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMarket } from '@/hooks/use-market';
import { PLAN_PRICES, PLAN_LIMITS, FREE_TAILOR_LIFETIME_LIMIT } from '@/lib/pricing/plans';

type Cycle = 'monthly' | 'yearly';

/**
 * Comparison rows derived from PLAN_LIMITS so they cannot drift from what the
 * API actually enforces. The `free` column reflects what is genuinely ungated
 * in code today. ("Priority support" was removed — no support tier exists.)
 */
const countLabel = (n: number | null) => (n === null ? 'Unlimited' : `${n} / month`);

const FEATURES: Array<{
  label: string;
  free: boolean | string;
  starter: boolean | string;
  pro: boolean | string;
  plus: boolean | string;
}> = [
  { label: 'Resume builder', free: true, starter: true, pro: true, plus: true },
  { label: 'AI writing suggestions', free: true, starter: true, pro: true, plus: true },
  { label: 'Browse live vacancies', free: true, starter: true, pro: true, plus: true },
  { label: 'Weekly job alerts', free: true, starter: true, pro: true, plus: true },
  { label: 'Career articles', free: true, starter: true, pro: true, plus: true },
  {
    label: 'AI resume tailoring',
    // Matches FREE_TAILOR_LIFETIME_LIMIT, which is what the gate enforces.
    free: FREE_TAILOR_LIFETIME_LIMIT === 1 ? '1 total' : `${FREE_TAILOR_LIFETIME_LIMIT} total`,
    starter: countLabel(PLAN_LIMITS.STARTER.tailorsPerMonth),
    pro: countLabel(PLAN_LIMITS.PRO.tailorsPerMonth),
    plus: countLabel(PLAN_LIMITS.PLUS.tailorsPerMonth),
  },
  {
    label: 'Cover letters',
    free: false,
    starter: countLabel(PLAN_LIMITS.STARTER.coverLettersPerMonth),
    pro: countLabel(PLAN_LIMITS.PRO.coverLettersPerMonth),
    plus: countLabel(PLAN_LIMITS.PLUS.coverLettersPerMonth),
  },
  {
    label: 'Downloads',
    free: false,
    starter: countLabel(PLAN_LIMITS.STARTER.downloadsPerMonth),
    pro: countLabel(PLAN_LIMITS.PRO.downloadsPerMonth),
    plus: countLabel(PLAN_LIMITS.PLUS.downloadsPerMonth),
  },
  {
    label: 'DOCX download',
    free: false,
    starter: PLAN_LIMITS.STARTER.docxDownloads,
    pro: PLAN_LIMITS.PRO.docxDownloads,
    plus: PLAN_LIMITS.PLUS.docxDownloads,
  },
  {
    label: 'All templates',
    free: false,
    starter: PLAN_LIMITS.STARTER.allTemplates,
    pro: PLAN_LIMITS.PRO.allTemplates,
    plus: PLAN_LIMITS.PLUS.allTemplates,
  },
];

const FAQS = [
  {
    q: 'Do I need a credit card to start the free trial?',
    a: 'For ZW users — no card needed at all. For ZA users, we tokenize your card with a R1 charge (refunded immediately) so Paystack can automatically bill you after day 14.',
  },
  {
    q: 'What happens when I reach my monthly limit?',
    a: "You'll see a clear upgrade prompt. We never silently charge you extra — it's a hard limit, and you can upgrade at any time to get more.",
  },
  {
    q: 'Can I cancel at any time?',
    a: 'Yes. Cancellation takes effect at the end of your current billing period, so you keep access until then.',
  },
  {
    q: 'What is the difference between monthly and yearly billing?',
    a: 'Yearly billing saves you roughly 30–35% compared to monthly. The full amount is charged upfront for the year.',
  },
  {
    q: 'Does my usage reset every month?',
    a: 'Yes — tailor, download, and cover letter counts reset on the 1st of each calendar month.',
  },
];

function FeatureCell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="h-4 w-4 text-emerald-400 mx-auto" />;
  if (value === false) return <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />;
  return <span className="text-xs text-foreground/80">{value}</span>;
}

export default function PricingPage() {
  const { market } = useMarket();
  const [cycle, setCycle] = useState<Cycle>('monthly');

  const prices = {
    STARTER: PLAN_PRICES.STARTER[market],
    PRO: PLAN_PRICES.PRO[market],
    PLUS: PLAN_PRICES.PLUS[market],
  };

  function displayPrice(tier: 'STARTER' | 'PRO' | 'PLUS') {
    const p = prices[tier];
    return cycle === 'yearly' ? p.yearlyMonthlyDisplay : p.monthlyDisplay;
  }

  function totalBilled(tier: 'STARTER' | 'PRO' | 'PLUS') {
    return cycle === 'yearly' ? prices[tier].yearlyDisplay : null;
  }

  /**
   * What every account gets without paying. These are genuinely ungated in
   * code — the resume builder and /api/resume-builder/ai-suggest have no
   * subscription check, the jobs feed is open to any signed-in user, and job
   * alert emails go to free users too (they're the re-engagement hook).
   */
  const freeFeatures = [
    'Resume builder with live preview',
    'AI writing suggestions',
    `${FREE_TAILOR_LIFETIME_LIMIT === 1 ? 'One' : FREE_TAILOR_LIFETIME_LIMIT} free AI-tailored CV`,
    'Browse all live vacancies',
    'Weekly job alerts by email',
    'Career articles & advice',
  ];

  /**
   * Paid feature lists are derived from PLAN_LIMITS — the same constants the
   * API gates enforce — so this page cannot drift from what users actually get.
   */
  function limitLabel(n: number | null, noun: string) {
    return n === null ? `Unlimited ${noun}` : `${n} ${noun} / month`;
  }

  const plans = (['STARTER', 'PRO', 'PLUS'] as const).map((key) => {
    const limits = PLAN_LIMITS[key];
    return {
      key,
      name: key === 'STARTER' ? 'Starter' : key === 'PRO' ? 'Pro' : 'Plus',
      description:
        key === 'STARTER'
          ? 'Perfect for a focused job search'
          : key === 'PRO'
            ? 'For serious job seekers'
            : 'Unlimited access, no limits',
      popular: key === 'PRO',
      features: [
        limitLabel(limits.tailorsPerMonth, 'resume tailors'),
        limitLabel(limits.coverLettersPerMonth, 'cover letters'),
        limitLabel(limits.downloadsPerMonth, 'downloads'),
        'PDF download',
      ],
      missing: [
        ...(limits.docxDownloads ? [] : ['DOCX download']),
        ...(limits.allTemplates ? [] : ['All templates']),
      ],
      extras: [
        ...(limits.docxDownloads ? ['DOCX download'] : []),
        ...(limits.allTemplates ? ['All premium templates'] : []),
        ...(key === 'STARTER' ? ['14-day free trial'] : []),
      ],
    };
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="px-4 pt-16 pb-10 text-center max-w-3xl mx-auto">
          <Badge variant="outline" className="mb-4 text-xs font-medium border-primary/30 text-primary">
            14-day free trial on the Starter plan
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-muted-foreground">
            Start free. No commitment. Cancel anytime.
          </p>
        </section>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <button
            onClick={() => setCycle('monthly')}
            className={cn(
              'text-sm font-medium transition-colors',
              cycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setCycle(cycle === 'monthly' ? 'yearly' : 'monthly')}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              cycle === 'yearly' ? 'bg-primary' : 'bg-muted',
            )}
            aria-label="Toggle billing cycle"
          >
            <span
              className={cn(
                'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
                cycle === 'yearly' ? 'translate-x-6' : 'translate-x-1',
              )}
            />
          </button>
          <button
            onClick={() => setCycle('yearly')}
            className={cn(
              'text-sm font-medium transition-colors flex items-center gap-1.5',
              cycle === 'yearly' ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            Yearly
            <Badge className="text-[10px] py-0 px-1.5 bg-emerald-500/15 text-emerald-400 border-0">
              Save ~30%
            </Badge>
          </button>
        </div>

        {/* Free tier — shown first so visitors can see what costs nothing */}
        <section className="px-4 max-w-5xl mx-auto mb-6">
          <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-bold font-display">
                  Free <span className="text-muted-foreground font-normal text-sm">— no card needed</span>
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Build a resume, find jobs, and tailor your CV once — at no cost. Upgrade when you
                  want to tailor for every role you apply to.
                </p>
              </div>
              <Button asChild variant="outline" size="lg" className="flex-shrink-0">
                <Link href="/auth/signup">Get started free</Link>
              </Button>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm mt-5">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Paid plans */}
        <section className="px-4 max-w-5xl mx-auto mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.key}
                className={cn(
                  'relative rounded-2xl border bg-card flex flex-col',
                  plan.popular
                    ? 'border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20'
                    : 'border-border/60',
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-0.5 flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <div className="p-6 flex-1">
                  <div className="mb-4">
                    <h2 className="text-lg font-bold font-display">{plan.name}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">{plan.description}</p>
                  </div>

                  <div className="mb-5">
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-bold tracking-tight">{displayPrice(plan.key)}</span>
                      <span className="text-muted-foreground text-sm mb-1">/mo</span>
                    </div>
                    {cycle === 'yearly' && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Billed {totalBilled(plan.key)} yearly
                      </p>
                    )}
                  </div>

                  <p className="text-xs font-medium text-muted-foreground mb-3">
                    Everything in Free, plus:
                  </p>
                  <ul className="space-y-2.5 text-sm mb-6">
                    {[...plan.features, ...plan.extras].map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                    {plan.missing.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-muted-foreground/60">
                        <X className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 pt-0">
                  <Button
                    asChild
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                  >
                    <Link href={`/subscribe?tier=${plan.key}&cycle=${cycle}`}>
                      {plan.key === 'STARTER' ? 'Start free trial' : 'Subscribe now'}
                    </Link>
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {plan.key === 'STARTER'
                      ? (market === 'ZA' ? 'Card required · Cancel anytime' : 'No card required · Cancel anytime')
                      : 'Cancel anytime'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature comparison table */}
        <section className="px-4 max-w-4xl mx-auto mb-20">
          <h2 className="text-xl font-bold font-display text-center mb-6">Compare plans</h2>
          <div className="rounded-xl border border-border/60 overflow-x-auto">
            <div className="grid grid-cols-5 bg-muted/30 px-3 sm:px-4 py-3 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border/60">
              <div>Feature</div>
              <div className="text-center">Free</div>
              <div className="text-center">Starter</div>
              <div className="text-center">Pro</div>
              <div className="text-center">Plus</div>
            </div>
            {FEATURES.map((f, i) => (
              <div
                key={f.label}
                className={cn(
                  'grid grid-cols-5 px-3 sm:px-4 py-3 text-xs sm:text-sm items-center gap-1',
                  i % 2 === 0 ? '' : 'bg-muted/10',
                )}
              >
                <div className="text-foreground/80">{f.label}</div>
                <div className="text-center"><FeatureCell value={f.free} /></div>
                <div className="text-center"><FeatureCell value={f.starter} /></div>
                <div className="text-center"><FeatureCell value={f.pro} /></div>
                <div className="text-center"><FeatureCell value={f.plus} /></div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section className="px-4 max-w-2xl mx-auto mb-20">
          <h2 className="text-xl font-bold font-display text-center mb-6">Frequently asked questions</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border/60 rounded-lg px-4">
                <AccordionTrigger className="text-sm font-medium text-left py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      <Footer />
    </div>
  );
}
