// app/app/checkout/[purchaseId]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';

export default function CheckoutResultPage() {
  const { purchaseId } = useParams<{ purchaseId: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<'PENDING'|'PAID'|'FAILED'|'CANCELED'|'UNKNOWN'>('PENDING');

  useEffect(() => {
    let stop = false;
    async function poll() {
      try {
        const res = await fetch(`/api/billing/pesepay/status?purchaseId=${purchaseId}`, { method: 'GET' });
        const data = await res.json();
        if (!res.ok || !data?.ok) throw new Error('Status error');
        const s = String(data.status || 'UNKNOWN').toUpperCase();
        setStatus((s as any) || 'UNKNOWN');
        if (s === 'PENDING') setTimeout(() => !stop && poll(), 2000);
        if (s === 'PAID') toast.success('Payment successful — credits applied');
        if (s === 'FAILED') toast.error('Payment failed');
        if (s === 'CANCELED') toast.info('Payment canceled');
      } catch {
        setTimeout(() => !stop && poll(), 2500);
      }
    }
    poll();
    return () => { stop = true; };
  }, [purchaseId]);

  const goBilling = () => router.push('/app/billing');

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Payment Result</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'PENDING' && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Confirming your payment…</p>
            </div>
          )}
          {status === 'PAID' && (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
              <p>Success! Credits have been added to your account.</p>
              <Button onClick={goBilling}>Go to Billing</Button>
            </div>
          )}
          {(status === 'FAILED' || status === 'CANCELED') && (
            <div className="flex flex-col items-center gap-2">
              <XCircle className="h-10 w-10 text-red-600" />
              <p>{status === 'FAILED' ? 'Payment failed.' : 'Payment was canceled.'}</p>
              <Button variant="outline" onClick={goBilling}>Back to Billing</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
