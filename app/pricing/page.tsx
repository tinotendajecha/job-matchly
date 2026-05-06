'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { CheckCircle, Sparkles, ArrowRight, Calculator } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'react-toastify';
import { useMarket } from '@/hooks/use-market';

type Plan = {
  name: string;
  description: string;
  price: string;
  period: string;
  credits: string;
  features: string[];
  limitations: string[];
  cta: string;
  ctaHref?: string;
  popular?: boolean;
};

const plansZW: Plan[] = [
  {
    name: 'Free',
    description: 'Try JobMatchly at zero cost',
    price: '$0',
    period: 'forever',
    credits: '3 credits on signup',
    features: ['1 resume build', 'Basic templates', 'PDF download', 'ATS basic check', 'Community support'],
    limitations: ['No cover letter generation', 'No advanced ATS insights'],
    cta: 'Start Free',
    ctaHref: '/auth/signup',
  },
  {
    name: 'Pay-as-you-go',
    description: 'Buy credits when you need them',
    price: 'From $0.34',
    period: 'per credit',
    credits: 'No commitment',
    features: [
      'Everything in Free',
      'Cover letter generation',
      'Advanced ATS insights',
      'Priority support',
      'Bulk discounts',
      'Credits never expire',
    ],
    limitations: [],
    cta: 'Buy Credits',
    ctaHref: '/app/billing',
    popular: true,
  },
  {
    name: 'Enterprise',
    description: 'For teams and organizations',
    price: 'Custom',
    period: 'contact us',
    credits: 'Unlimited',
    features: ['Everything included', 'Custom integrations', 'Dedicated support', 'Team management', 'Advanced analytics'],
    limitations: [],
    cta: 'Contact Sales',
    ctaHref: '/contact',
  },
];

const plansZA: Plan[] = [
  {
    name: 'Free',
    description: 'Tailor resumes at no upfront cost',
    price: 'Free',
    period: 'forever',
    credits: 'Unlimited tailoring',
    features: ['Unlimited resume tailoring', 'ATS basic check', 'Community support', 'PDF download (R25 each)'],
    limitations: ['No cover letter generation', 'No advanced ATS insights'],
    cta: 'Get Started',
    ctaHref: '/auth/signup',
  },
  {
    name: 'Pay-per-download',
    description: 'Download when you\'re ready',
    price: 'R25',
    period: 'per download',
    credits: 'No subscription',
    features: [
      'Unlimited resume tailoring',
      'PDF & DOCX export',
      'Advanced ATS insights',
      'Cover letter generation',
      'Priority support',
    ],
    limitations: [],
    cta: 'Start Tailoring',
    ctaHref: '/auth/signup',
    popular: true,
  },
  {
    name: 'Enterprise',
    description: 'For teams and organizations',
    price: 'Custom',
    period: 'contact us',
    credits: 'Unlimited',
    features: ['Everything included', 'Custom integrations', 'Dedicated support', 'Team management'],
    limitations: [],
    cta: 'Contact Sales',
    ctaHref: '/contact',
  },
];

const faqs = [
  {
    question: 'How do credits work?',
    answer: '1 credit = 1 AI action (tailored resume, cover letter, or advanced analysis). Basic edits and template browsing are always free.',
  },
  {
    question: 'Do my credits expire?',
    answer: 'No. Credits you purchase never expire. Use them at your own pace.',
  },
  {
    question: 'What file formats do you support?',
    answer: 'Uploads: PDF, DOCX, plain text. Exports: PDF, DOCX. All templates are ATS-compatible by design.',
  },
  {
    question: 'Is my resume data secure?',
    answer: 'Yes. We use bank-level encryption and never share your personal information. Your resumes belong to you.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'If you\'re unhappy with a purchase, contact support within 30 days and we\'ll make it right.',
  },
  {
    question: 'Can I use my own templates?',
    answer: 'Right now we offer curated, ATS-tested templates. Custom template upload is on our public roadmap.',
  },
];

function pricePerCreditUSD(count: number) {
  if (count >= 50) return 0.30;
  if (count >= 25) return 0.40;
  return 0.50;
}
function pricePerCreditZAR(count: number) {
  if (count >= 50) return 6;
  if (count >= 25) return 7;
  return 9;
}

const ease = [0.16, 1, 0.3, 1] as const;

export default function PricingPage() {
  const { isSouthAfrica } = useMarket();
  const plans = isSouthAfrica ? plansZA : plansZW;

  const [customCredits, setCustomCredits] = useState<number>(10);
  const customCalc = useMemo(() => {
    const credits = Math.max(10, Math.floor(customCredits || 10));
    if (isSouthAfrica) {
      const ppc = pricePerCreditZAR(credits);
      return { credits, ppc, subtotal: credits * ppc, symbol: 'R' };
    }
    const ppc = pricePerCreditUSD(credits);
    return { credits, ppc, subtotal: +(credits * ppc).toFixed(2), symbol: '$' };
  }, [customCredits, isSouthAfrica]);

  const onCustomSubscribe = () => {
    toast.info(`${customCalc.credits} credits/month for ${customCalc.symbol}${customCalc.subtotal.toFixed(2)} — coming soon`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isPublic />

      {/* ── Header ── */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background pointer-events-none" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/8 blur-[120px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="container relative px-4 mx-auto max-w-4xl text-center"
        >
          <Badge
            variant="outline"
            className="mb-6 gap-2 border-primary/30 bg-primary/8 text-primary px-4 py-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Free for early users</span>
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-5">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            No subscription lock-in. No hidden fees.
            Start free and pay only for what you use.
          </p>
        </motion.div>
      </section>

      <div className="container px-4 mx-auto max-w-6xl pb-20">

        {/* ── Plans ── */}
        <div className="grid lg:grid-cols-3 gap-6 mb-16">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.12, ease }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1 text-xs font-semibold">
                    Most Popular
                  </Badge>
                </div>
              )}

              <Card
                className={cn(
                  'h-full relative overflow-hidden transition-all duration-300',
                  plan.popular
                    ? 'ring-2 ring-primary shadow-xl shadow-primary/10 scale-[1.02]'
                    : 'hover:border-border/70',
                )}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
                )}

                <CardHeader className="pb-6">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                  <div className="pt-4">
                    <span className="text-4xl font-bold font-display">{plan.price}</span>
                    <span className="text-muted-foreground text-sm ml-1">/{plan.period}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{plan.credits}</p>
                </CardHeader>

                <CardContent className="space-y-5">
                  <ul className="space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.limitations.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Not included:</p>
                      <ul className="space-y-1">
                        {plan.limitations.map((l) => (
                          <li key={l} className="text-xs text-muted-foreground/70">· {l}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {plan.ctaHref ? (
                    <Button
                      className="w-full"
                      size="lg"
                      variant={plan.popular ? 'default' : 'outline'}
                      asChild
                    >
                      <Link href={plan.ctaHref}>{plan.cta}</Link>
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      size="lg"
                      variant="outline"
                      onClick={() => toast.info('Contact us at hello@jobmatchly.com')}
                    >
                      {plan.cta}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* ── Custom calculator card ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease }}
          className="mb-20"
        >
          <Card className="overflow-hidden border-border/60">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="p-8 border-b md:border-b-0 md:border-r border-border/60">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Custom Credit Pack</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Pick your volume and get bulk pricing. Credits roll over.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Credits / month (min 10)</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min={10}
                        value={customCredits}
                        onChange={(e) => setCustomCredits(parseInt(e.target.value || '10', 10))}
                        className="font-mono"
                      />
                      {[10, 25, 50].map((n) => (
                        <Button
                          key={n}
                          variant="outline"
                          size="sm"
                          onClick={() => setCustomCredits(n)}
                          className={cn(customCredits === n && 'border-primary text-primary bg-primary/5')}
                        >
                          {n}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 flex flex-col justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">Monthly total</p>
                  <p className="text-4xl font-bold font-display text-primary mb-1">
                    {customCalc.symbol}{customCalc.subtotal.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {customCalc.symbol}{customCalc.ppc.toFixed(2)} per credit ·{' '}
                    {customCalc.credits >= 50 ? '40% off' : customCalc.credits >= 25 ? '20% off' : 'standard rate'}
                  </p>

                  <ul className="mt-6 space-y-2">
                    {[
                      'All Pay-as-you-go features',
                      'Credits roll over 1 month',
                      'Upgrade or cancel anytime',
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6">
                  <Button className="w-full" size="lg" onClick={onCustomSubscribe}>
                    Build Custom Plan
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    {isSouthAfrica ? 'Paystack · ZAR · coming soon' : 'PesePay · USD · coming soon'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ── Feature highlights ── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
          className="mb-20"
        >
          <h2 className="text-2xl font-bold text-center mb-10">What&apos;s included in every plan</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { title: 'Resume Builder', description: 'Live side-by-side editor with instant preview' },
              { title: 'JD Tailoring', description: 'AI keyword alignment and gap analysis' },
              { title: 'ATS Optimization', description: 'Formatted to pass applicant tracking systems' },
              { title: 'Template Library', description: 'Curated, ATS-tested resume templates' },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08, ease }}
              >
                <Card className="h-full group hover:border-primary/25 transition-colors duration-300">
                  <CardContent className="p-5">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                      <CheckCircle className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── FAQ ── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
          className="max-w-3xl mx-auto mb-20"
        >
          <h2 className="text-2xl font-bold text-center mb-10">Frequently asked questions</h2>
          <Accordion type="single" collapsible className="w-full space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border border-border/60 rounded-xl px-5 data-[state=open]:border-primary/30"
              >
                <AccordionTrigger className="text-left text-sm font-medium hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground pb-4 leading-relaxed">{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* ── CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease }}
          className="relative text-center rounded-2xl border border-primary/20 bg-primary/5 overflow-hidden p-14"
        >
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-primary/15 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative">
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Join early users transforming their applications with JobMatchly.
              No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-6 text-base font-semibold" asChild>
                <Link href="/auth/signup">
                  Start Free Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-6 text-base" asChild>
                <Link href="/templates">View Templates</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
