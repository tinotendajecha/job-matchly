'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle,
  Sparkles,
  Calculator
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'react-toastify';

type Plan = {
  name: string;
  description: string;
  price: string;
  period: 'month' | 'forever' | 'per credit' | 'contact us';
  credits: string;
  features: string[];
  limitations: string[];
  cta: string;
  popular?: boolean;
  color?: string;
};

const plans: Plan[] = [
  {
    name: 'Free',
    description: 'Perfect for trying out JobMatchly',
    price: '$0',
    period: 'forever',
    credits: '3 credits',
    features: [
      '1 resume build',
      'Basic templates access',
      'PDF download',
      'ATS basic check',
      'Community support'
    ],
    limitations: [
      'No cover letter generation',
      'No advanced ATS insights',
      'Basic keyword matching'
    ],
    cta: 'Start Free',
    popular: false,
    color: 'gray'
  },
  {
    name: 'Pay-as-you-go',
    description: 'Buy credits as you need them',
    price: 'From $0.34',
    period: 'per credit',
    credits: 'Buy as needed',
    features: [
      'Everything in Free',
      'Cover letter generation',
      'Advanced ATS insights',
      'Priority support',
      'Flexible usage',
      'No monthly commitment'
    ],
    limitations: [],
    cta: 'Buy Credits',
    popular: true,
    color: 'primary'
  },
  {
    name: 'Enterprise',
    description: 'For teams and organizations',
    price: 'Custom',
    period: 'contact us',
    credits: 'Unlimited',
    features: [
      'Everything included',
      'Custom integrations',
      'Dedicated support',
      'Team management',
      'Advanced analytics',
      'White-label options'
    ],
    limitations: [],
    cta: 'Contact Sales',
    popular: false,
    color: 'purple'
  }
];

const faqs = [
  {
    question: 'How do credits work?',
    answer: '1 credit = 1 tailored resume. Credits are consumed by AI actions like resume builds, JD tailoring, or cover letters. Basic edits and downloads don\'t use credits.'
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes. Cancel anytime; you keep access until the billing period ends.'
  },
  {
    question: 'What file formats do you support?',
    answer: 'Uploads: PDF, DOCX, text; Exports: PDF, DOCX, TXT. Templates are ATS-compatible.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes. We use bank-level encryption and never share personal info. Your resumes belong to you.'
  },
  {
    question: 'Do you offer refunds?',
    answer: '30-day money-back guarantee for paid plans. Contact support if unhappy.'
  },
  {
    question: 'Can I use my own templates?',
    answer: 'Curated, ATS-tested templates for now. Custom template upload is on the Pro roadmap.'
  }
];

// price ladder for Custom plan (per credit, monthly)
function pricePerCreditMonthly(count: number) {
  if (count >= 50) return 0.30;
  if (count >= 25) return 0.40;
  return 0.50; // 10–24 credits
}

export default function PricingPage() {
  // Custom plan state
  const [customCredits, setCustomCredits] = useState<number>(10);
  const customCalc = useMemo(() => {
    const credits = Math.max(10, Math.floor(customCredits || 10));
    const ppc = pricePerCreditMonthly(credits);
    const subtotal = +(credits * ppc).toFixed(2);
    // optional processor fees placeholder (shown but not charged here)
    const estFees = +(Math.max(0.3, subtotal * 0.025)).toFixed(2);
    const total = +(subtotal + estFees).toFixed(2);
    return { credits, ppc, subtotal, estFees, total };
  }, [customCredits]);

  const onSubscribe = (planName: string) => {
    toast.info(`${planName} subscription checkout coming soon`);
  };

  const onCustomSubscribe = () => {
    toast.info(
      `Custom plan: ${customCalc.credits} credits/month for $${customCalc.subtotal.toFixed(2)} (est. total $${customCalc.total.toFixed(2)})`
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isPublic={true} />
      
      <div className="container mx-auto p-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 px-4 py-2">
              <Sparkles className="h-4 w-4 mr-1" />
              Free for early users
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Simple, transparent pricing
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your job search needs. Start free, upgrade when you&apos;re ready.
            </p>
          </div>

          {/* Pricing Cards (3 preset + 1 custom) */}
          <div className="grid lg:grid-cols-4 gap-8 mb-20">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative"
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1">
                    Most Popular
                  </Badge>
                )}
                
                <Card className={cn(
                  "h-full relative overflow-hidden",
                  plan.popular && "ring-2 ring-primary shadow-xl scale-105"
                )}>
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/80" />
                  )}
                  
                  <CardHeader className="text-center pb-8">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <p className="text-muted-foreground">{plan.description}</p>
                    <div className="pt-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.credits}</p>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {plan.limitations.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Not included:</p>
                        <ul className="space-y-1">
                          {plan.limitations.map((limitation) => (
                            <li key={limitation} className="text-xs text-muted-foreground">
                              • {limitation}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <Button 
                      className="w-full" 
                      size="lg"
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => onSubscribe(plan.name)}
                    >
                      {plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Custom Plan Card */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: plans.length * 0.15 }}
              className="relative"
            >
              <Card className="h-full relative overflow-hidden ring-1 ring-muted">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 to-primary/30" />
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl flex items-center justify-center gap-2">
                    <Calculator className="h-5 w-5" /> Custom
                  </CardTitle>
                  <p className="text-muted-foreground">Pick your credits/month</p>
                  <div className="pt-3">
                    <span className="text-3xl font-bold">
                      ${customCalc.subtotal.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Est. fees ${customCalc.estFees.toFixed(2)} • ${customCalc.ppc.toFixed(2)}/credit
                  </p>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div>
                    <label className="text-sm text-muted-foreground">Credits / month (min 10)</label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        type="number"
                        min={10}
                        value={customCredits}
                        onChange={(e) => setCustomCredits(parseInt(e.target.value || '10', 10))}
                      />
                      <Button variant="outline" onClick={() => setCustomCredits(10)}>10</Button>
                      <Button variant="outline" onClick={() => setCustomCredits(25)}>25</Button>
                      <Button variant="outline" onClick={() => setCustomCredits(50)}>50</Button>
                    </div>
                  </div>

                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      All Starter features
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      Flexible credits that roll over 1 month
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      Upgrade/downgrade anytime
                    </li>
                  </ul>

                  <Button className="w-full" size="lg" onClick={onCustomSubscribe}>
                    Build Custom Plan
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Card payments now. Paystack & EcoCash coming soon.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Features Comparison */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-20"
          >
            <h2 className="text-3xl font-bold text-center mb-12">What&apos;s included</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Resume Builder', description: 'Drag-and-drop editor with live preview' },
                { title: 'JD Tailoring', description: 'AI keyword alignment & optimization' },
                { title: 'Cover Letters', description: 'Auto-generated, personalized letters' },
                { title: 'ATS Optimization', description: 'Formatted to pass applicant tracking' },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full text-center group hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                        <CheckCircle className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>
            
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          {/* Final CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center mt-20 p-12 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 rounded-2xl"
          >
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join early users transforming their applications with JobMatchly
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-6" asChild>
                <Link href="/auth/signup">Start Free Today</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
                <Link href="/templates">View Templates</Link>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
}
