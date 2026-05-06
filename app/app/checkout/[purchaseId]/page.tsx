'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';

type PurchaseInfo = {
  id: string;
  type: 'CREDIT_TOPUP' | 'RESUME_DOWNLOAD_UNLOCK' | 'SYSTEM_BONUS';
  provider: string;
  market: 'ZW' | 'ZA';
  description: string;
  documentId: string | null;
};

type CheckoutStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELED' | 'UNKNOWN';

const STATUS_COPY: Record<CheckoutStatus, string> = {
  PENDING: 'Confirming your payment...',
  PAID: 'Payment confirmed.',
  FAILED: 'Payment failed.',
  CANCELED: 'Payment was canceled.',
  UNKNOWN: 'We are still checking your payment status.',
};

export default function CheckoutResultPage() {
  const { purchaseId } = useParams<{ purchaseId: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<CheckoutStatus>('PENDING');
  const [purchase, setPurchase] = useState<PurchaseInfo | null>(null);
  const notifiedStatus = useRef<string | null>(null);

  useEffect(() => {
    let stop = false;

    async function poll() {
      try {
        const res = await fetch(`/api/payments/status?purchaseId=${purchaseId}`, {
          method: 'GET',
          cache: 'no-store',
        });
        const data = await res.json();
        if (!res.ok || !data?.ok) throw new Error('Status error');

        if (stop) return;

        const nextStatus = String(data.status || 'UNKNOWN').toUpperCase() as CheckoutStatus;
        setStatus(nextStatus);
        setPurchase(data.purchase ?? null);

        if (nextStatus === 'PENDING' || nextStatus === 'UNKNOWN') {
          setTimeout(() => {
            if (!stop) poll();
          }, 2500);
          return;
        }

        if (notifiedStatus.current === nextStatus) return;
        notifiedStatus.current = nextStatus;

        if (nextStatus === 'PAID') {
          if (data.purchase?.type === 'RESUME_DOWNLOAD_UNLOCK') {
            toast.success('Payment successful. Your resume is now unlocked.');
          } else {
            toast.success('Payment successful. Credits have been added to your account.');
          }
        } else if (nextStatus === 'FAILED') {
          toast.error('Payment failed');
        } else if (nextStatus === 'CANCELED') {
          toast.info('Payment canceled');
        }
      } catch {
        setTimeout(() => {
          if (!stop) poll();
        }, 3000);
      }
    }

    poll();
    return () => {
      stop = true;
    };
  }, [purchaseId]);

  const isResumeUnlock = purchase?.type === 'RESUME_DOWNLOAD_UNLOCK';
  const primaryAction = () => {
    if (isResumeUnlock && purchase?.documentId) {
      router.push(`/app/documents/${purchase.documentId}`);
      return;
    }
    router.push('/app/billing');
  };

  const primaryLabel = isResumeUnlock ? 'Open Resume' : 'Go to Billing';
  const secondaryLabel = isResumeUnlock ? 'Back to Documents' : 'Back to Billing';

  return (
    <div className="container mx-auto p-6">
      <Card className="mx-auto max-w-lg">
        <CardHeader className="space-y-3">
          <CardTitle>Payment Result</CardTitle>
          {purchase?.description ? (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{purchase.description}</span>
              {purchase.market && <Badge variant="outline">{purchase.market}</Badge>}
              {purchase.provider && <Badge variant="secondary">{purchase.provider}</Badge>}
            </div>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {status === 'PENDING' || status === 'UNKNOWN' ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>{STATUS_COPY[status]}</p>
              <p className="text-sm text-muted-foreground">
                This page refreshes automatically while we verify the payment.
              </p>
            </div>
          ) : null}

          {status === 'PAID' ? (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
              <p>
                {isResumeUnlock
                  ? 'Your tailored resume has been unlocked and is ready to download.'
                  : 'Your credits have been added to your account.'}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={primaryAction}>{primaryLabel}</Button>
                <Button variant="outline" onClick={() => router.push('/app/documents')}>
                  View Documents
                </Button>
              </div>
            </div>
          ) : null}

          {status === 'FAILED' || status === 'CANCELED' ? (
            <div className="flex flex-col items-center gap-3">
              <XCircle className="h-10 w-10 text-red-600" />
              <p>{STATUS_COPY[status]}</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" onClick={primaryAction}>
                  {secondaryLabel}
                </Button>
                {isResumeUnlock && purchase?.documentId ? (
                  <Button onClick={() => router.push(`/app/documents/${purchase.documentId}`)}>
                    Retry from Resume
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
