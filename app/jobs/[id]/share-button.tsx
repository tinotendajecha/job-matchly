'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Shares a job link.
 *
 * Uses the OS share sheet where it exists — on Android and iOS that puts
 * WhatsApp one tap away, which is where these links actually travel in
 * Zimbabwe and South Africa. Desktop falls back to the clipboard.
 */
export function ShareButton({
  jobId,
  url,
  title,
  company,
  variant = 'outline',
  size = 'sm',
  label = 'Share this job',
}: {
  jobId: string;
  url: string;
  title: string;
  company: string | null;
  variant?: 'outline' | 'ghost' | 'default';
  size?: 'sm' | 'default' | 'icon';
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  function record() {
    // Fire-and-forget: a missing metric must not delay the share sheet.
    fetch('/api/jobs/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
      keepalive: true,
    }).catch(() => {});
  }

  async function share() {
    const text = company ? `${title} at ${company}` : title;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: text, text: `${text} — on JobMatchly`, url });
        record();
        return;
      } catch (err) {
        // A cancelled share sheet is a normal outcome, not a failure to report.
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copied');
      record();
    } catch {
      toast.error('Could not copy the link — you can copy it from the address bar');
    }
  }

  return (
    <Button variant={variant} size={size} onClick={share}>
      {copied ? (
        <Check className="h-4 w-4 mr-1.5" />
      ) : (
        <Share2 className="h-4 w-4 mr-1.5" />
      )}
      {size === 'icon' ? null : copied ? 'Copied' : label}
    </Button>
  );
}
