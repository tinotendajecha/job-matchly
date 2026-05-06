'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight, CheckCircle, Star, FileText, Target, Zap,
  BarChart3, TrendingUp, Smartphone, Coins, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { cn } from '@/lib/utils';
import { useMarket } from '@/hooks/use-market';
import {
  pricePerCreditUSD, computeSubtotalUSD,
  pricePerCreditZAR, computeSubtotalZAR,
} from '@/lib/pricing';

/* ─── Animation helpers ─── */
const ease = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.55, ease },
};

function stagger(delay = 0) {
  return {
    ...fadeUp,
    transition: { duration: 0.55, ease, delay },
  };
}

/* ─── Static data ─── */
const testimonialsZA = [
  {
    name: 'Sipho Dlamini',
    role: 'Software Developer · Capitec Bank',
    photo: 'https://randomuser.me/api/portraits/men/75.jpg',
    quote: 'Landed a senior dev role at Capitec after using JobMatchly. JD tailoring saved me hours of rewriting for every application.',
    rating: 5,
  },
  {
    name: 'Nomvula Khumalo',
    role: 'HR Business Partner · Standard Bank',
    photo: 'https://randomuser.me/api/portraits/women/72.jpg',
    quote: "I recommend JobMatchly to every candidate I coach. The ATS optimisation alone doubles your chances of getting past the first screen.",
    rating: 5,
  },
  {
    name: 'Kagiso Sithole',
    role: 'Data Analyst · Discovery',
    photo: 'https://randomuser.me/api/portraits/men/34.jpg',
    quote: 'Three weeks, four interviews, one offer. The keyword matching feature is a game-changer for the SA job market.',
    rating: 5,
  },
];

const testimonialsZW = [
  {
    name: 'Takudzwa Moyo',
    role: 'Systems Engineer · Econet Wireless',
    photo: 'https://randomuser.me/api/portraits/men/52.jpg',
    quote: 'Got my interview call within 10 days. The tailored CV stood out immediately — my recruiter mentioned it looked perfectly matched.',
    rating: 5,
  },
  {
    name: 'Ruvimbo Chikwanda',
    role: 'UX Designer · ZB Financial Holdings',
    photo: 'https://randomuser.me/api/portraits/women/58.jpg',
    quote: 'The cover letter generator saved me so much time. Each one felt personal and matched the job perfectly. Highly recommend.',
    rating: 5,
  },
  {
    name: 'Farai Mutasa',
    role: 'Marketing Lead · OK Zimbabwe',
    photo: 'https://randomuser.me/api/portraits/men/45.jpg',
    quote: "I'd been job hunting for months. JobMatchly showed me exactly what ATS was rejecting and helped me fix it. Hired in 3 weeks.",
    rating: 5,
  },
];

const features = [
  { icon: FileText, title: 'Live Side-by-Side Builder', description: 'See your resume update in real-time as you type. No surprises on download.' },
  { icon: Target, title: 'JD Keyword Tailoring', description: 'Paste any job description. Keywords light up across your CV automatically.' },
  { icon: BarChart3, title: 'ATS Compatibility Score', description: 'Instant score with targeted fixes. Know exactly why you were rejected — before it happens.' },
  { icon: Zap, title: 'AI Cover Letters', description: 'One click. A cover letter tailored to your resume and the exact role.' },
  { icon: TrendingUp, title: 'Impact-Driven Bullets', description: 'Smart rewrites that quantify achievements and inject power verbs.' },
  { icon: Smartphone, title: 'Mobile-First Design', description: 'Edit, preview, and apply from anywhere. Fully optimized for phones.' },
];

const stats = [
  { value: '12K+', label: 'Active Users' },
  { value: '94%', label: 'ATS Pass Rate' },
  { value: '4.9★', label: 'User Rating' },
];

const problems = [
  { stat: '75%', title: 'of resumes never reach a human', desc: 'ATS systems auto-reject most applications before a recruiter sees them.' },
  { stat: '6s', title: 'average recruiter reading time', desc: 'Six seconds to make an impact. Every word on your CV must earn its place.' },
  { stat: '40+', title: 'minutes wasted per application', desc: 'Manually tailoring each CV is slow, repetitive, and error-prone.' },
  { stat: '60%', title: 'of candidates undersell themselves', desc: 'Vague bullets and missing keywords lose you interviews you deserved.' },
];

/* ─── Pricing Calculator ─── */
function PricingCalculator() {
  const [credits, setCredits] = useState(10);
  const { isSouthAfrica } = useMarket();

  const pricePerCredit = isSouthAfrica ? pricePerCreditZAR(credits) : pricePerCreditUSD(credits);
  const totalPrice = isSouthAfrica ? computeSubtotalZAR(credits) : computeSubtotalUSD(credits);
  const priceDisplay = isSouthAfrica
    ? `R${pricePerCredit.toFixed(0)} per credit`
    : `$${pricePerCredit.toFixed(2)} per credit`;
  const totalDisplay = isSouthAfrica ? `R${totalPrice.toFixed(0)}` : `$${totalPrice.toFixed(2)}`;

  return (
    <div className="rounded-2xl border border-border bg-card p-7">
      <h3 className="text-lg font-semibold mb-1">Credit Calculator</h3>
      <p className="text-sm text-muted-foreground mb-6">
        {isSouthAfrica ? 'Optional credits for cover letters & extras' : 'Buy credits as you need them'}
      </p>

      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium mb-2 block">Number of Credits</label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min="3"
              value={credits}
              onChange={(e) => setCredits(Math.max(3, parseInt(e.target.value) || 3))}
              className="text-center font-mono text-base"
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap shrink-0">{priceDisplay}</span>
          </div>
        </div>

        <div className="rounded-xl border border-primary/25 bg-primary/8 p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total</span>
            <span className="text-2xl font-bold text-primary font-display">{totalDisplay}</span>
          </div>
          {credits >= 10 && (
            <p className="text-xs text-primary mt-1.5 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Bulk discount applied
            </p>
          )}
        </div>

        <Button asChild className="w-full" size="lg">
          <Link href="/app/billing">
            <Coins className="h-4 w-4 mr-2" />
            Buy Credits
          </Link>
        </Button>
      </div>
    </div>
  );
}

/* ─── Hero Demo Card ─── */
function HeroDemoCard() {
  const keywords = ['React', 'TypeScript', 'Node.js', 'Agile', 'REST APIs'];

  return (
    <div className="relative">
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xl shadow-black/40">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/50">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          <span className="ml-2 text-xs text-muted-foreground font-mono">jobmatchly.com — analysis</span>
        </div>

        <div className="p-5 space-y-4">
          {/* ATS Score */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ATS Match Score</span>
            <motion.span
              className="text-2xl font-bold font-display text-primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.4 }}
            >
              92%
            </motion.span>
          </div>

          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '92%' }}
              transition={{ delay: 0.5, duration: 1.3, ease }}
            />
          </div>

          {/* Keywords */}
          <div className="border-t border-border pt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-3">
              Keywords Matched
            </span>
            <div className="flex flex-wrap gap-2">
              {keywords.map((kw, i) => (
                <motion.span
                  key={kw}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.12, duration: 0.3 }}
                  className="text-xs px-2.5 py-1 rounded-md bg-primary/15 text-primary font-medium border border-primary/20"
                >
                  {kw}
                </motion.span>
              ))}
            </div>
          </div>

          {/* Checklist */}
          <div className="border-t border-border pt-4 space-y-2">
            {['14 keywords aligned', 'Cover letter generated', 'PDF ready to download'].map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 + i * 0.15, duration: 0.3 }}
                className="flex items-center gap-2 text-sm"
              >
                <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                <span>{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <motion.div
        className="absolute -top-3 -right-3 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-lg shadow-primary/30"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        ATS Optimized ✓
      </motion.div>
    </div>
  );
}

/* ─── Page ─── */
export default function LandingPage() {
  const { isSouthAfrica } = useMarket();
  const testimonials = isSouthAfrica ? testimonialsZA : testimonialsZW;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header isPublic />

      {/* ══ HERO ══ */}
      <section className="relative overflow-hidden py-20 md:py-28 lg:py-36">
        {/* Background layers */}
        <div className="absolute inset-0 bg-grid pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[450px] rounded-full bg-primary/8 blur-[140px] pointer-events-none" />

        <div className="container relative px-4 mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Text */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease }}
              >
                <Badge
                  variant="outline"
                  className="mb-6 gap-2 border-primary/30 bg-primary/8 text-primary px-4 py-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">AI-Powered · Built for Africa</span>
                </Badge>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.1, ease }}
                className="text-5xl md:text-6xl lg:text-[4.5rem] font-bold tracking-tight leading-[1.06] mb-6"
              >
                Your resume,{' '}
                <span className="text-primary">matched</span>
                <br className="hidden md:block" />
                {' '}to every job<br className="hidden md:block" />
                {' '}you apply for.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.2, ease }}
                className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed"
              >
                Paste any job post. Get a tailored CV in under 2 minutes —
                ATS-optimized and ready to download.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.3, ease }}
                className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-12"
              >
                <Button asChild size="lg" className="text-base px-8 py-6 font-semibold shadow-lg shadow-primary/20">
                  <Link href="/auth/signup">
                    Start Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-base px-8 py-6">
                  <Link href="/templates">View Templates</Link>
                </Button>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.55 }}
                className="flex flex-wrap gap-8 justify-center lg:justify-start"
              >
                {stats.map((s) => (
                  <div key={s.label}>
                    <div className="text-2xl font-bold text-primary font-display">{s.value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Demo card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.4, ease }}
              className="lg:col-span-5"
            >
              <HeroDemoCard />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ TRUST STRIP ══ */}
      <section className="py-10 border-y border-border/50">
        <div className="container px-4 mx-auto max-w-7xl">
          <div className="flex flex-col items-center gap-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Trusted by professionals at
            </p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-14">
              {['Google', 'Microsoft', 'Capitec', 'Standard Bank', 'Discovery', 'Econet'].map((co) => (
                <span
                  key={co}
                  className="text-sm font-semibold text-muted-foreground/50 hover:text-muted-foreground transition-colors duration-200"
                >
                  {co}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ PROBLEM ══ */}
      <section className="py-24">
        <div className="container px-4 mx-auto max-w-7xl">
          <motion.div {...fadeUp} className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">The problem</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Job applications feel like a void
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The system is stacked against you. Here&apos;s why most resumes fail.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-5">
            {problems.map((item, i) => (
              <motion.div key={item.stat} {...stagger(i * 0.1)}>
                <Card className="h-full group hover:border-primary/30 transition-colors duration-300">
                  <CardContent className="p-6 flex items-start gap-5">
                    <div className="text-4xl font-bold font-display text-primary/75 leading-none w-20 shrink-0">
                      {item.stat}
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="py-24 bg-card/40">
        <div className="container px-4 mx-auto max-w-7xl">
          <motion.div {...fadeUp} className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">From blank page to hired</h2>
            <p className="text-lg text-muted-foreground">Four steps. Under five minutes.</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              {[
                { step: '01', title: 'Build', desc: 'Start from ATS-friendly templates or upload your existing CV — PDF, DOCX, or plain text.' },
                { step: '02', title: 'Paste the JD', desc: 'Drop in any job description. Keywords highlight instantly across your entire resume.' },
                { step: '03', title: 'Score it', desc: 'Get an ATS compatibility score with specific, targeted fixes — not vague advice.' },
                { step: '04', title: 'Apply', desc: 'Download your optimized PDF or DOCX. Generate a cover letter in one click.' },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease }}
                  className="flex gap-5 group"
                >
                  <div className="shrink-0 w-10 h-10 rounded-full border-2 border-primary/30 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/10 transition-all duration-300">
                    <span className="text-xs font-bold font-mono text-primary">{item.step}</span>
                  </div>
                  <div className="pt-1.5">
                    <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease }}
            >
              <Card className="overflow-hidden border-primary/20">
                <CardContent className="p-0">
                  <div className="bg-secondary/50 p-5 border-b border-border">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold">John Doe — Frontend Developer</span>
                      <motion.span
                        className="text-sm font-bold text-primary font-display"
                        animate={{ scale: [1, 1.06, 1] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                      >
                        ATS: 92%
                      </motion.span>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '92%' }} />
                    </div>
                  </div>
                  <div className="p-5 space-y-3 text-sm text-muted-foreground">
                    <p>
                      {'• Built responsive apps using '}
                      <Pill>React</Pill>
                      {' and '}
                      <Pill>TypeScript</Pill>
                    </p>
                    <p>
                      {'• Improved page load speed by '}
                      <Pill>40%</Pill>
                    </p>
                    <p>
                      {'• Led team of '}
                      <Pill>3 developers</Pill>
                      {' in '}
                      <Pill>agile</Pill>
                      {' workflow'}
                    </p>
                    <p>
                      {'• Integrated '}
                      <Pill>REST APIs</Pill>
                      {' with Node.js backend'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section className="py-24">
        <div className="container px-4 mx-auto max-w-7xl">
          <motion.div {...fadeUp} className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to get hired</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built for the modern job search. Optimized for results.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                {...stagger(i * 0.08)}
                whileHover={{ y: -4 }}
              >
                <Card className="h-full group hover:border-primary/30 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section className="py-24 bg-card/40">
        <div className="container px-4 mx-auto max-w-7xl">
          <motion.div {...fadeUp} className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Success stories</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Real people, real results</h2>
            <p className="text-lg text-muted-foreground">
              Join thousands who&apos;ve landed their dream roles
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} {...stagger(i * 0.1)}>
                <Card className="h-full hover:border-primary/20 transition-colors duration-300">
                  <CardContent className="p-6">
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <img src={t.photo} alt={t.name} className="w-9 h-9 rounded-full object-cover" />
                      <div>
                        <p className="text-sm font-semibold">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section className="py-24">
        <div className="container px-4 mx-auto max-w-7xl">
          <motion.div {...fadeUp} className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, honest pricing</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              No subscription lock-in. Pay only for what you actually use.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-10 max-w-5xl mx-auto">
            <motion.div {...stagger(0)}>
              <PricingCalculator />
            </motion.div>

            <motion.div {...stagger(0.15)} className="space-y-4">
              {[
                {
                  name: 'Free',
                  price: isSouthAfrica ? 'Free' : 'Free',
                  desc: isSouthAfrica ? 'Unlimited tailoring, pay to download' : '3 starter credits',
                  features: isSouthAfrica
                    ? ['Unlimited resume tailoring', 'ATS basic check', 'PDF download (R25 each)']
                    : ['1 resume build', 'PDF download', 'ATS basic check'],
                  cta: 'Get Started',
                  href: '/auth/signup',
                },
                {
                  name: 'Pay-as-you-go',
                  price: isSouthAfrica ? 'From R7' : 'From $0.34',
                  desc: 'Per credit · no commitment',
                  features: ['Cover letter generation', 'Advanced ATS insights', 'Priority support', 'Bulk discounts'],
                  cta: 'Buy Credits',
                  href: '/app/billing',
                  popular: true,
                },
                {
                  name: 'Enterprise',
                  price: 'Custom',
                  desc: 'For teams & organizations',
                  features: ['Custom integrations', 'Dedicated support', 'Team management'],
                  cta: 'Contact Sales',
                  href: '/contact',
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={cn(
                    'relative rounded-xl border p-5 transition-all duration-200',
                    plan.popular
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border hover:border-border/70',
                  )}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-2.5 right-4 bg-primary text-primary-foreground text-xs">
                      Most Popular
                    </Badge>
                  )}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{plan.desc}</p>
                    </div>
                    <span className="text-xl font-bold font-display">{plan.price}</span>
                  </div>
                  <ul className="space-y-1.5 mb-4">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    size="sm"
                    variant={plan.popular ? 'default' : 'outline'}
                    className="w-full"
                  >
                    <Link href={plan.href}>{plan.cta}</Link>
                  </Button>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ══ */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="container relative px-4 mx-auto max-w-4xl text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Ready to land<br />your next role?
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join thousands of job seekers who&apos;ve transformed their applications.
              Start free — no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-base px-10 py-6 font-semibold shadow-lg shadow-primary/20">
                <Link href="/auth/signup">
                  Start Building Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base px-10 py-6">
                <Link href="/pricing">See Pricing</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

/* ─── Small helper ─── */
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-primary/15 text-primary px-1.5 py-0.5 rounded text-xs font-medium">
      {children}
    </span>
  );
}
