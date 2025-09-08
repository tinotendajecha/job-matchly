'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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

const creditPacks = [
  { credits: 50, price: 'R49', bonus: 0, popular: false },
  { credits: 100, price: 'R89', bonus: 10, popular: true },
  { credits: 250, price: 'R199', bonus: 50, popular: false },
  { credits: 500, price: 'R349', bonus: 150, popular: false },
];

const invoices = [
  { date: '2025-01-01', description: 'Starter Plan - January', amount: 'R149', status: 'Paid' },
  { date: '2024-12-01', description: 'Starter Plan - December', amount: 'R149', status: 'Paid' },
  { date: '2024-11-15', description: '100 Credit Pack', amount: 'R89', status: 'Paid' },
];

export default function BillingPage() {
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
              Manage your subscription and credit usage
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Plan */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Current Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold">Starter Plan</h3>
                      <p className="text-muted-foreground">R149/month • Next billing: Feb 1, 2025</p>
                    </div>
                    <Badge className="bg-primary text-primary-foreground">Active</Badge>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">50</div>
                      <p className="text-sm text-muted-foreground">Credits/month</p>
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
                    <Button variant="outline" className="flex-1">
                      Change Plan
                    </Button>
                    <Button variant="outline" onClick={() => toast.info('Cancel feature coming soon!')}>
                      Cancel Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Usage Chart */}
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
                      <span className="text-sm font-medium">23 / 50</span>
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

              {/* Invoices */}
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
                        transition={{ delay: index * 0.1 }}
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
              {/* Credits Balance */}
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
                      Credits remaining this month
                    </p>
                    <Button className="w-full" onClick={() => toast.info('Top-up feature coming soon!')}>
                      Top Up Credits
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Credit Packs */}
              <Card>
                <CardHeader>
                  <CardTitle>Buy Credits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {creditPacks.map((pack, index) => (
                    <motion.div
                      key={pack.credits}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
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
                              {pack.bonus > 0 && (
                                <span className="text-sm text-green-600 ml-1">
                                  +{pack.bonus} bonus
                                </span>
                              )}
                              <span className="text-sm text-muted-foreground block">credits</span>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{pack.price}</div>
                              <div className="text-xs text-muted-foreground">
                                {pack.bonus > 0 ? 
                                  `R${(parseInt(pack.price.slice(1)) / (pack.credits + pack.bonus)).toFixed(2)}/credit` :
                                  `R${(parseInt(pack.price.slice(1)) / pack.credits).toFixed(2)}/credit`
                                }
                              </div>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            className="w-full" 
                            variant={pack.popular ? "default" : "outline"}
                            onClick={() => toast.info('Purchase feature coming soon!')}
                          >
                            Buy Now
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              {/* Payment Method */}
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
                  <Button variant="outline" size="sm" className="w-full">
                    Update Payment Method
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}