'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Chrome, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { cn } from '@/lib/utils';
import { useMarket } from '@/hooks/use-market';

export default function SignUpPage() {
  const router = useRouter();
  const { market, isSouthAfrica } = useMarket();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const passwordRequirements = [
    { text: 'At least 8 characters', met: formData.password.length >= 8 },
    { text: 'One uppercase letter', met: /[A-Z]/.test(formData.password) },
    { text: 'One number', met: /\d/.test(formData.password) },
  ];
  const passwordStrength = passwordRequirements.filter(req => req.met).length;

  const consentVersion = `${market}-2026-v1`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (passwordStrength < 3) {
      toast.error('Please meet all password requirements');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      toast.error('Please enter a valid email');
      return;
    }
    if (!consentGiven) {
      toast.error('Please agree to the Data Protection & Consent Agreement to continue');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          consentGiven: true,
          consentVersion,
        }),
      });

      let data: any = null;
      try { data = await res.json(); } catch {}

      if (!res.ok || !data?.ok) {
        const msg =
          data?.error ||
          (res.status === 400 ? 'Email already in use or invalid data' :
           res.status === 500 ? 'Server error. Please try again' :
           'Sign up failed');
        toast.error(msg);
        return;
      }

      const email = formData.email.trim().toLowerCase();
      try { localStorage.setItem('pendingVerifyEmail', email); } catch {}
      toast.success('Verification code sent. Check your email 📩');
      router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      console.error(err);
      toast.error('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
            <CardDescription>Start building your perfect resume today</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>

                {formData.password && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2 pt-2">
                    <div className="flex items-center gap-2">
                      <Progress value={(passwordStrength / 3) * 100} className="flex-1 h-2" />
                      <span className="text-xs text-muted-foreground">{passwordStrength}/3</span>
                    </div>
                    <ul className="space-y-1">
                      {passwordRequirements.map((req, i) => (
                        <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center gap-2 text-xs">
                          {req.met ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-muted-foreground" />}
                          <span className={req.met ? 'text-green-600' : 'text-muted-foreground'}>{req.text}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </div>

              {/* Consent checkbox */}
              <div className={cn(
                'rounded-lg border p-4 space-y-3 transition-colors',
                consentGiven ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/20'
              )}>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="consent"
                    checked={consentGiven}
                    onCheckedChange={(checked) => setConsentGiven(checked === true)}
                    disabled={isSubmitting}
                    className="mt-0.5 shrink-0"
                  />
                  <Label
                    htmlFor="consent"
                    className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
                  >
                    I agree to Jobmatchly&apos;s{' '}
                    <Link href="/terms" target="_blank" className="text-primary hover:underline font-medium">
                      Data Protection, Privacy &amp; Candidate Consent Agreement
                    </Link>
                    , and I authorise Jobmatchly to process and share my employment-related information
                    with verified recruiters, employers, and hiring partners for job matching and
                    recruitment purposes.
                  </Label>
                </div>
                {isSouthAfrica && (
                  <p className="text-xs text-muted-foreground pl-7">
                    This consent is collected in compliance with{' '}
                    <span className="font-medium text-foreground/70">POPIA</span>{' '}
                    (Protection of Personal Information Act, South Africa).
                  </p>
                )}
                {!isSouthAfrica && (
                  <p className="text-xs text-muted-foreground pl-7">
                    This consent is collected in accordance with applicable Zimbabwean and international
                    data protection regulations.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting || passwordStrength < 3 || !consentGiven}
              >
                {isSubmitting ? 'Creating account…' : 'Create Account'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button variant="outline" className="w-full" size="lg" onClick={() => { window.location.href = '/api/auth/google'; }} disabled={isSubmitting}>
              <Chrome className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="hover:underline">Data Protection &amp; Consent Agreement</Link>
        </p>
      </motion.div>
    </div>
  );
}
