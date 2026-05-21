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
import { PLAN_PRICES } from '@/lib/pricing/plans';

type Cycle = 'monthly' | 'yearly';

const FEATURES = [
  { label: 'AI Resume Tailoring', starter: true, pro: true, plus: true },
  { label: 'Cover Letters', starter: '2 / month', pro: '10 / month', plus: 'Unlimited' },
  { label: 'PDF Download', starter: true, pro: true, plus: true },
  { label: 'DOCX Download', starter: false, pro: true, plus: true },
  { label: 'Resume Templates', starter: 'Classic + Modern', pro: 'All templates', plus: 'All templates' },
  { label: 'Documents saved', starter: true, pro: true, plus: true },
  { label: 'Priority support', starter: false, pro: true, plus: true },
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

  const plans = [
    {
      key: 'STARTER' as const,
      name: 'Starter',
      description: 'Perfect for a focused job search',
      tailors: '5 tailors / month',
      downloads: '5 downloads / month',
      popular: false,
    },
    {
      key: 'PRO' as const,
      name: 'Pro',
      description: 'For serious job seekers',
      tailors: '20 tailors / month',
      downloads: '20 downloads / month',
      popular: true,
    },
    {
      key: 'PLUS' as const,
      name: 'Plus',
      description: 'Unlimited access, no limits',
      tailors: 'Unlimited tailors',
      downloads: 'Unlimited downloads',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="px-4 pt-16 pb-10 text-center max-w-3xl mx-auto">
          <Badge variant="outline" className="mb-4 text-xs font-medium border-primary/30 text-primary">
            14-day free trial on all plans
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

        {/* Plan cards */}
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

                  <ul className="space-y-2.5 text-sm mb-6">
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                      <span>{plan.tailors}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                      <span>{plan.downloads}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                      <span>PDF download</span>
                    </li>
                    {plan.key !== 'STARTER' && (
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                        <span>DOCX download</span>
                      </li>
                    )}
                    {plan.key === 'STARTER' && (
                      <li className="flex items-center gap-2 text-muted-foreground/60">
                        <X className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>DOCX download</span>
                      </li>
                    )}
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                      <span>14-day free trial</span>
                    </li>
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
                      Start free trial
                    </Link>
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {market === 'ZA' ? 'Card required · Cancel anytime' : 'No card required · Cancel anytime'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature comparison table */}
        <section className="px-4 max-w-4xl mx-auto mb-20">
          <h2 className="text-xl font-bold font-display text-center mb-6">Compare plans</h2>
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <div className="grid grid-cols-4 bg-muted/30 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border/60">
              <div>Feature</div>
              <div className="text-center">Starter</div>
              <div className="text-center">Pro</div>
              <div className="text-center">Plus</div>
            </div>
            {FEATURES.map((f, i) => (
              <div
                key={f.label}
                className={cn(
                  'grid grid-cols-4 px-4 py-3 text-sm items-center',
                  i % 2 === 0 ? '' : 'bg-muted/10',
                )}
              >
                <div className="text-foreground/80">{f.label}</div>
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
