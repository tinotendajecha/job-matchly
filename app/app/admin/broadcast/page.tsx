'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Send, Users, Loader2, AlertCircle, CheckCircle2, MailWarning, Link as LinkIcon } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { formatRelativeTime } from '../lib/utils';

interface AudienceData {
  count: number;
  sample: Array<{ id: string; name: string | null; email: string | null }>;
  optedOut: number;
  description: string;
}

interface BroadcastRow {
  id: string;
  subject: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  status: 'SENDING' | 'COMPLETED' | 'FAILED';
  sentByEmail: string;
  createdAt: string;
}

interface DeliveryRow {
  id: string;
  email: string;
  accepted: boolean;
  lastEvent: string | null;
  error: string | null;
}

/** Maps Resend's event names to something an admin can act on. */
function deliveryLabel(d: DeliveryRow): { text: string; variant: 'default' | 'destructive' | 'secondary'; hint?: string } {
  if (!d.accepted) return { text: 'Not sent', variant: 'destructive', hint: d.error || undefined };
  switch (d.lastEvent) {
    case 'delivered':
      return { text: 'Delivered', variant: 'default', hint: 'Accepted by their mail server — may be in Spam/Promotions.' };
    case 'opened':
      return { text: 'Opened', variant: 'default' };
    case 'clicked':
      return { text: 'Clicked', variant: 'default' };
    case 'bounced':
      return { text: 'Bounced', variant: 'destructive', hint: 'Address rejected the message.' };
    case 'complained':
      return { text: 'Marked spam', variant: 'destructive' };
    case 'delivery_delayed':
      return { text: 'Delayed', variant: 'secondary' };
    case 'sent':
    case null:
    case undefined:
      return { text: 'Sent', variant: 'secondary', hint: 'Handed to the mail provider; delivery not confirmed yet.' };
    default:
      return { text: d.lastEvent, variant: 'secondary' };
  }
}

const STATUS_VARIANT: Record<BroadcastRow['status'], 'default' | 'destructive' | 'secondary'> = {
  COMPLETED: 'default',
  FAILED: 'destructive',
  SENDING: 'secondary',
};

export default function BroadcastPage() {
  const [status, setStatus] = useState('all');
  const [accountType, setAccountType] = useState('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const [audience, setAudience] = useState<AudienceData | null>(null);
  const [audienceLoading, setAudienceLoading] = useState(true);

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [style, setStyle] = useState<'PERSONAL' | 'BRANDED'>('PERSONAL');

  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string; hint?: string } | null>(null);
  const [history, setHistory] = useState<BroadcastRow[]>([]);

  const [deliveryFor, setDeliveryFor] = useState<BroadcastRow | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryRow[] | null>(null);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // Prefill the test field with the logged-in admin's own address.
  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok && j.user?.email) setTestEmail(j.user.email);
      })
      .catch(() => {});
  }, []);

  async function loadHistory() {
    try {
      const res = await fetch('/api/admin/broadcast/history', { cache: 'no-store' });
      const json = await res.json();
      if (json.ok) setHistory(json.data.broadcasts);
    } catch {
      /* history is non-critical */
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadAudience() {
      setAudienceLoading(true);
      try {
        const params = new URLSearchParams({
          ...(debouncedSearch && { search: debouncedSearch }),
          ...(status !== 'all' && { status }),
          ...(accountType !== 'all' && { accountType }),
        });
        const res = await fetch(`/api/admin/broadcast/audience?${params}`, { cache: 'no-store' });
        const json = await res.json();
        if (!cancelled && json.ok) setAudience(json.data);
      } catch {
        if (!cancelled) setAudience(null);
      } finally {
        if (!cancelled) setAudienceLoading(false);
      }
    }
    loadAudience();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, status, accountType]);

  // Links to the dashboard; middleware sends unauthenticated users to sign-in
  // and then on to this page, and geo-redirects ZA visitors to the .co.za domain.
  function insertAppLink() {
    const link = '[Return to JobMatchly](https://www.jobmatchly.site/app/dashboard)';
    setBody((b) => (b.trim() ? `${b.replace(/\s*$/, '')}\n\n${link}\n` : `${link}\n`));
  }

  async function retryFailed(row: BroadcastRow) {
    setRetrying(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/broadcast/${row.id}/retry`, { method: 'POST' });
      const json = await res.json();
      if (json.ok) {
        setFeedback({
          kind: json.sent > 0 ? 'success' : 'error',
          message:
            json.retried === 0
              ? json.message
              : `Retried ${json.retried} — ${json.sent} accepted${json.stillFailed ? `, ${json.stillFailed} still failing` : ''}.`,
          hint: json.unsendable ? `${json.unsendable} address(es) skipped as invalid.` : undefined,
        });
        loadHistory();
        openDeliveries(row, false);
      } else {
        setFeedback({ kind: 'error', message: json.error || 'Retry failed.' });
      }
    } catch {
      setFeedback({ kind: 'error', message: 'Retry failed.' });
    } finally {
      setRetrying(false);
    }
  }

  async function openDeliveries(row: BroadcastRow, refresh = true) {
    setDeliveryFor(row);
    setDeliveriesLoading(true);
    if (!refresh) setDeliveries(null);
    try {
      const res = await fetch(`/api/admin/broadcast/${row.id}/deliveries${refresh ? '?refresh=1' : ''}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      setDeliveries(json.ok ? json.data.deliveries : []);
    } catch {
      setDeliveries([]);
    } finally {
      setDeliveriesLoading(false);
    }
  }

  const filter = {
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(status !== 'all' && { status }),
    ...(accountType !== 'all' && { accountType }),
  };

  const composeReady = subject.trim().length > 0 && body.trim().length > 0;
  const canSend = composeReady && !!audience && audience.count > 0;

  async function handleTestSend() {
    if (!composeReady || !testEmail) return;
    setTesting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/broadcast/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body, testEmail, style }),
      });
      const json = await res.json();
      setFeedback(
        json.ok
          ? {
              kind: 'success',
              message: `Test email accepted by the mail provider for ${json.sentTo}.`,
              hint: "If it isn't in the inbox within a minute, check Spam and the Promotions tab — bulk mail from a domain that usually only sends verification codes often lands there.",
            }
          : { kind: 'error', message: json.error || 'Test email failed.' }
      );
    } catch {
      setFeedback({ kind: 'error', message: 'Test email failed.' });
    } finally {
      setTesting(false);
    }
  }

  async function handleRealSend() {
    setSending(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/broadcast/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body, filter, style }),
      });
      const json = await res.json();
      if (json.ok && json.sent > 0) {
        setFeedback({
          kind: 'success',
          message: `Accepted for ${json.sent} of ${json.recipientCount} recipients${
            json.failed ? ` — ${json.failed} failed` : ''
          }.`,
          hint: 'Open "Delivery status" in the table below to see, per person, whether it was actually delivered or bounced.',
        });
        setSubject('');
        setBody('');
        loadHistory();
      } else if (json.ok) {
        setFeedback({
          kind: 'error',
          message: `Nothing was sent — all ${json.recipientCount} recipients failed.`,
          hint: json.error,
        });
        loadHistory();
      } else {
        setFeedback({ kind: 'error', message: json.error || 'Send failed.' });
      }
    } catch {
      setFeedback({ kind: 'error', message: 'Send failed.' });
    } finally {
      setSending(false);
      setConfirmOpen(false);
    }
  }

  return (
    <div className="space-y-8 w-full min-w-0">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Broadcast</h1>
        <p className="text-muted-foreground mt-1">Compose an announcement and send it to a group of users</p>
      </div>

      {feedback && (
        <Alert variant={feedback.kind === 'error' ? 'destructive' : 'default'}>
          {feedback.kind === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <AlertTitle>{feedback.kind === 'error' ? 'Failed' : 'Done'}</AlertTitle>
          <AlertDescription>
            {feedback.message}
            {feedback.hint && <span className="block mt-1 opacity-80">{feedback.hint}</span>}
          </AlertDescription>
        </Alert>
      )}

      {/* Audience */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">1. Choose who receives it</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Activity</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  <SelectItem value="active">Active (last 30 days)</SelectItem>
                  <SelectItem value="inactive">Inactive (30+ days)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Account type</Label>
              <Select value={accountType} onValueChange={setAccountType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All accounts</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Search (optional)</Label>
              <Input placeholder="name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 p-4">
            <Users className="h-5 w-5 text-primary flex-shrink-0" />
            {audienceLoading ? (
              <span className="text-sm text-muted-foreground">Counting recipients…</span>
            ) : audience ? (
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {audience.count} {audience.count === 1 ? 'recipient' : 'recipients'}
                  <span className="font-normal text-muted-foreground"> · {audience.description}</span>
                </p>
                {audience.sample.length > 0 && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    e.g. {audience.sample.map((u) => u.email).filter(Boolean).join(', ')}
                    {audience.count > audience.sample.length ? ' …' : ''}
                  </p>
                )}
              </div>
            ) : (
              <span className="text-sm text-destructive">Couldn't load audience.</span>
            )}
          </div>

          {!!audience?.optedOut && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <MailWarning className="h-3.5 w-3.5" />
              {audience.optedOut} user{audience.optedOut === 1 ? '' : 's'} opted out of these emails and{' '}
              {audience.optedOut === 1 ? 'is' : 'are'} always excluded.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Compose */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">2. Write the message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="We've added something new to JobMatchly"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              placeholder={"Hi {{name}},\n\nIt's been a while since you last tailored a CV...\n\nLeave a blank line between paragraphs."}
            />
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={insertAppLink}>
                <LinkIcon className="h-3.5 w-3.5 mr-1.5" />
                Insert link to app
              </Button>
              <span className="text-xs text-muted-foreground">
                or type <code className="text-foreground">[Return to JobMatchly](https://…)</code>
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Use <code className="text-foreground">{'{{name}}'}</code> to insert each recipient's first name. Blank
              lines become paragraphs. Links and bare URLs become clickable. An unsubscribe link is added
              automatically.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Appearance</Label>
            <Select value={style} onValueChange={(v) => setStyle(v as 'PERSONAL' | 'BRANDED')}>
              <SelectTrigger className="sm:max-w-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PERSONAL">Personal — plain text, no branding</SelectItem>
                <SelectItem value="BRANDED">Branded — logo and green header</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {style === 'PERSONAL'
                ? "Looks like a normal email from a person. Best chance of landing in Gmail's Primary tab rather than Promotions."
                : 'Styled like the verification emails. Looks polished, but marketing-style layouts are more likely to be filed under Promotions.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Send */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">3. Test, then send</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="testEmail">Send a test to one address first</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="you@example.com"
                className="sm:max-w-sm"
              />
              <Button variant="outline" onClick={handleTestSend} disabled={!composeReady || !testEmail || testing}>
                {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Send test
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Goes only to this address — no one else receives anything. It's an exact preview, so its unsubscribe
              link is live and will opt <em>your</em> account out if you click it.
            </p>
          </div>

          <div className="border-t border-border pt-4">
            <Button onClick={() => setConfirmOpen(true)} disabled={!canSend || sending}>
              <Send className="h-4 w-4 mr-2" />
              Send to {audience?.count ?? 0} {audience?.count === 1 ? 'user' : 'users'}
            </Button>
            {!composeReady && (
              <p className="text-xs text-muted-foreground mt-2">Add a subject and message first.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">Sent broadcasts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Failed</TableHead>
                  <TableHead>Sent by</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead className="text-right">Delivery</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                      No broadcasts sent yet.
                    </TableCell>
                  </TableRow>
                )}
                {history.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="max-w-xs truncate">{b.subject}</TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[b.status]}>{b.status}</Badge></TableCell>
                    <TableCell>{b.sentCount}/{b.recipientCount}</TableCell>
                    <TableCell>{b.failedCount}</TableCell>
                    <TableCell className="text-muted-foreground">{b.sentByEmail}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(new Date(b.createdAt))}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openDeliveries(b)}>
                        Delivery status
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Per-recipient delivery status, straight from the mail provider */}
      <Dialog open={!!deliveryFor} onOpenChange={(o) => !o && setDeliveryFor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Delivery status</DialogTitle>
            <DialogDescription>{deliveryFor?.subject}</DialogDescription>
          </DialogHeader>

          <div className="max-h-80 overflow-y-auto -mx-1 px-1">
            {deliveriesLoading && !deliveries ? (
              <p className="text-sm text-muted-foreground py-4">Checking with the mail provider…</p>
            ) : deliveries && deliveries.length > 0 ? (
              <div className="space-y-2">
                {deliveries.map((d) => {
                  const label = deliveryLabel(d);
                  return (
                    <div key={d.id} className="flex items-start justify-between gap-3 border-b border-border pb-2">
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate">{d.email}</p>
                        {label.hint && <p className="text-xs text-muted-foreground mt-0.5">{label.hint}</p>}
                      </div>
                      <Badge variant={label.variant} className="flex-shrink-0">{label.text}</Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">
                No per-recipient records for this broadcast (it predates delivery tracking).
              </p>
            )}
          </div>

          <DialogFooter className="sm:justify-between">
            {deliveryFor && deliveryFor.failedCount > 0 ? (
              <Button variant="secondary" onClick={() => retryFailed(deliveryFor)} disabled={retrying}>
                {retrying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Retry {deliveryFor.failedCount} failed
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => deliveryFor && openDeliveries(deliveryFor)}
                disabled={deliveriesLoading}
              >
                {deliveriesLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Refresh
              </Button>
              <Button onClick={() => setDeliveryFor(null)}>Close</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send this email for real?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 pt-2">
                <p>
                  This sends <strong className="text-foreground">"{subject}"</strong> to{' '}
                  <strong className="text-foreground">{audience?.count ?? 0} real users</strong> ({audience?.description}).
                </p>
                <p>Emails can't be recalled once sent.</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={handleRealSend} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Yes, send to {audience?.count ?? 0}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
