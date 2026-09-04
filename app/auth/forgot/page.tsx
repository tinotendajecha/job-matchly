'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/auth/password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // The endpoint answers identically whether or not the account exists, and
      // so does this screen — otherwise the UI would leak what the API hides.
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex items-center justify-center px-4 py-12 sm:py-20">
        <Card className="w-full max-w-md">
          {sent ? (
            <>
              <CardHeader>
                <CheckCircle2 className="h-8 w-8 text-primary" />
                <CardTitle>Check your email</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  If <span className="text-foreground font-medium">{email}</span> has a JobMatchly
                  account, we&apos;ve sent a link to reset your password. It works for one hour.
                </p>
                <p className="text-sm text-muted-foreground">
                  Nothing arrived? Check your spam folder, or{' '}
                  <button
                    onClick={() => setSent(false)}
                    className="text-foreground underline underline-offset-2"
                  >
                    try a different address
                  </button>
                  .
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/auth/signin">Back to sign in</Link>
                </Button>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <Mail className="h-8 w-8 text-primary" />
                <CardTitle>Reset your password</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={submit} className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Enter the email you signed up with and we&apos;ll send you a link to choose a new
                    password.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting || !email}>
                    {submitting ? 'Sending…' : 'Send reset link'}
                  </Button>
                  <Button asChild variant="ghost" className="w-full">
                    <Link href="/auth/signin">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to sign in
                    </Link>
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
