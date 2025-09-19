'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  CreditCard,
  Coins,
  TrendingUp,
  Download,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

type Pack = { credits: number; priceUsd: number; bonus?: number; popular?: boolean };

const creditPacks: Pack[] = [
  { credits: 3,   priceUsd: 2,   popular: true },             // Starter
  { credits: 10,  priceUsd: 5 },                               // Standard
  { credits: 25,  priceUsd: 10 },                              // Pro
  { credits: 50,  priceUsd: 15,  bonus: 0 },                   // Volume (effective $0.30/credit)
];

// Fake invoices (USD now)
const invoices = [
  { date: '2025-01-01', description: 'Starter Pack (3 credits)', amount: '$2.00', status: 'Paid' },
  { date: '2024-12-01', description: 'Standard Pack (10 credits)', amount: '$5.00', status: 'Paid' },
  { date: '2024-11-15', description: 'Pro Pack (25 credits)', amount: '$10.00', status: 'Paid' },
];

// pricing ladder for custom credits
function pricePerCreditFor(count: number) {
  if (count >= 50) return 0.30;
  if (count >= 25) return 0.40;
  if (count >= 10) return 0.50;
  return 0.67; // 3–9 credits ties to $2→3 baseline
}

export default function BillingPage() {
  // Custom credits
  const [customCredits, setCustomCredits] = useState<number>(3);

  const customPricing = useMemo(() => {
    const credits = Math.max(3, Math.floor(customCredits || 3));
    const ppc = pricePerCreditFor(credits);
    const subtotal = +(credits * ppc).toFixed(2);

    // placeholder processor fee (configurable later)
    const fees = +(Math.max(0.3, subtotal * 0.025)).toFixed(2);
    const total = +(subtotal + fees).toFixed(2);

    return { credits, ppc, subtotal, fees, total };
  }, [customCredits]);

  const handleBuyPack = (pack: Pack) => {
    // Hook this to Paystack/Stripe later
    toast.info(
      `Checkout coming soon: ${pack.credits} credits for $${pack.priceUsd.toFixed(2)}`
    );
  };

  const handleCustomCheckout = () => {
    toast.info(
      `Checkout coming soon: ${customPricing.credits} credits • $${customPricing.total.toFixed(2)}`
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto p-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Billing & Credits</h1>
            <p className="text-muted-foreground">
              Buy credits and track your usage. 1 credit = 1 tailored resume.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Plan / Balance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Current Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">—</div>
                      <p className="text-sm text-muted-foreground">Subscription</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">127</div>
                      <p className="text-sm text-muted-foreground">Credits remaining</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">23</div>
                      <p className="text-sm text-muted-foreground">Credits used</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => toast.info('Subscriptions coming soon!')}>
                      Explore Subscriptions
                    </Button>
                    <Button variant="outline" onClick={() => toast.info('Cancel coming soon!')}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Usage This Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Credits Used</span>
                      <span className="text-sm font-medium">23 / —</span>
                    </div>
                    <Progress value={46} className="h-2" />

                    <div className="grid grid-cols-3 gap-4 pt-4 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-lg">8</div>
                        <p className="text-muted-foreground">Resume builds</p>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg">12</div>
                        <p className="text-muted-foreground">JD tailoring</p>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg">3</div>
                        <p className="text-muted-foreground">Cover letters</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Billing history */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Billing History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {invoices.map((invoice, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08 }}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-sm">{invoice.description}</p>
                          <p className="text-xs text-muted-foreground">{invoice.date}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{invoice.amount}</span>
                          <Badge variant="outline" className="text-green-600">
                            {invoice.status}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Credit Balance */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                      <Coins className="h-5 w-5" />
                      Credit Balance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <motion.div
                      className="text-4xl font-bold text-primary mb-2"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      127
                    </motion.div>
                    <p className="text-muted-foreground text-sm mb-4">
                      Credits available
                    </p>
                    <Button className="w-full" onClick={() => toast.info('Top-up feature coming soon!')}>
                      Top Up Credits
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Packs (USD) */}
              <Card>
                <CardHeader>
                  <CardTitle>Buy Credits (USD)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {creditPacks.map((pack, index) => {
                    const unit = (pack.priceUsd / pack.credits).toFixed(2);
                    return (
                      <motion.div
                        key={pack.credits}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.08 }}
                        className="relative"
                      >
                        {pack.popular && (
                          <Badge className="absolute -top-2 -right-2 z-10 bg-primary text-primary-foreground">
                            Popular
                          </Badge>
                        )}
                        <Card className={pack.popular ? 'ring-2 ring-primary' : ''}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <span className="font-bold text-lg">{pack.credits}</span>
                                <span className="text-sm text-muted-foreground block">credits</span>
                                {pack.bonus ? (
                                  <span className="text-xs text-green-600">+{pack.bonus} bonus</span>
                                ) : null}
                              </div>
                              <div className="text-right">
                                <div className="font-bold">${pack.priceUsd.toFixed(2)}</div>
                                <div className="text-xs text-muted-foreground">
                                  ${unit}/credit
                                </div>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              className="w-full" 
                              variant={pack.popular ? "default" : "outline"}
                              onClick={() => handleBuyPack(pack)}
                            >
                              Buy Now
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Custom Credits */}
              <Card>
                <CardHeader>
                  <CardTitle>Custom Credits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Credits (min 3)</label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="number"
                        min={3}
                        value={customCredits}
                        onChange={(e) => setCustomCredits(parseInt(e.target.value || '3', 10))}
                      />
                      <Button variant="outline" onClick={() => setCustomCredits(10)}>10</Button>
                      <Button variant="outline" onClick={() => setCustomCredits(25)}>25</Button>
                      <Button variant="outline" onClick={() => setCustomCredits(50)}>50</Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span>Price/credit</span>
                      <span className="font-medium">
                        ${customPricing.ppc.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Credits</span>
                      <span className="font-medium">{customPricing.credits}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-medium">
                        ${customPricing.subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fees (est.)</span>
                      <span className="font-medium">
                        ${customPricing.fees.toFixed(2)}
                      </span>
                    </div>
                    <div className="col-span-2 h-px bg-muted/60 my-1" />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">Total</span>
                      <span className="font-semibold">
                        ${customPricing.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Button className="w-full" onClick={handleCustomCheckout}>
                    Continue to Pay <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Card payments supported. Paystack & EcoCash coming soon.
                  </p>
                </CardContent>
              </Card>

              {/* Payment Method (placeholder) */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 p-3 border rounded-lg mb-4">
                    <div className="w-8 h-6 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">VISA</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">•••• 4242</p>
                      <p className="text-xs text-muted-foreground">Expires 12/27</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => toast.info('Add card coming soon')}>
                      Add Card
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toast.info('Paystack coming soon')}>
                      Connect Paystack
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
