'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { CheckCircle2, Loader2, Mail } from 'lucide-react';

function isValidEmail(e: string) {
  return /^\S+@\S+\.\S+$/.test(e);
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const [resending, setResending] = useState(false);

  // 6 separate inputs for OTP
  const [codes, setCodes] = useState<string[]>(['', '', '', '', '', '']);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // Prefill email from query or localStorage
  useEffect(() => {
    const q = params.get('email');
    if (q) {
      setEmail(q);
      try { localStorage.setItem('pendingVerifyEmail', q); } catch { }
    } else {
      try {
        const saved = localStorage.getItem('pendingVerifyEmail') || '';
        if (saved) setEmail(saved);
      } catch { }
    }
  }, [params]);

  const code = useMemo(() => codes.join(''), [codes]);
  const canSubmit = isValidEmail(email) && code.length === 6 && codes.every(c => c !== '');

  const onChangeDigit = (idx: number, val: string) => {
    // accept only digits
    const v = val.replace(/\D/g, '').slice(0, 1);
    const next = [...codes];
    next[idx] = v;
    setCodes(next);
    if (v && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const onKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codes[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && idx > 0) inputsRef.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const txt = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (txt.length) {
      e.preventDefault();
      const arr = txt.padEnd(6).split('').slice(0, 6);
      setCodes(arr);
      inputsRef.current[Math.min(txt.length, 5)]?.focus();
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isVerifying) return;
    setIsVerifying(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code }),
      });

      let data: any = null;
      try { data = await res.json(); } catch { }

      if (!res.ok || !data?.ok) {
        const msg =
          data?.error ||
          (res.status === 400 ? 'Invalid or expired code' :
            res.status === 404 ? 'User not found' :
              'Verification failed');
        toast.error(msg);
        return;
      }

      toast.success('Email verified! You can sign in now.');
      try { localStorage.removeItem('pendingVerifyEmail'); } catch { }
      router.push('/auth/signin');
    } catch (err) {
      console.error(err);
      toast.error('Network error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
            <CardDescription>
              Enter the 6-digit code we sent to your email
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isVerifying}
                  />
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                {!isValidEmail(email) && email && (
                  <p className="text-xs text-red-500">Enter a valid email address</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Verification Code</Label>
                <div className="grid grid-cols-6 gap-2">
                  {codes.map((val, i) => (
                    <Input
                      key={i}
                      ref={(el) => (inputsRef.current[i] = el)}
                      value={val}
                      onChange={(e) => onChangeDigit(i, e.target.value)}
                      onKeyDown={(e) => onKeyDown(i, e)}
                      onPaste={i === 0 ? onPaste : undefined}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      className="text-center text-xl tracking-widest"
                      disabled={isVerifying}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Tip: paste the whole code into the first box.</p>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={!canSubmit || isVerifying}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Verify Email
                  </>
                )}
              </Button>
            </form>

            <div className="flex items-center justify-between text-sm">
              <Link href="/auth/signup" className="text-primary hover:underline">
                Change email
              </Link>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                onClick={async () => {
                  if (!isValidEmail(email) || resending) return;
                  try {
                    setResending(true);
                    const res = await fetch('/api/auth/verify/request', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: email.trim().toLowerCase() }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok || !data?.ok) {
                      toast.error(data?.error || 'Could not resend code');
                      return;
                    }
                    toast.success('Verification code sent! Check your inbox.');
                  } catch (e) {
                    toast.error('Network error. Try again.');
                  } finally {
                    setResending(false);
                  }
                }}
                disabled={isVerifying || !isValidEmail(email) || resending}
              >
                {resending ? 'Sending…' : 'Resend code'}
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Didn’t receive the email? Check your <span className='text-primary'>spam</span> folder or try again later.
        </p>
      </motion.div>
    </div>
  );
}
