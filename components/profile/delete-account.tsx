'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Deleting an account, with the friction the action deserves.
 *
 * There is no undo, so the confirmation is typing the account's own email
 * address rather than a modal that can be clicked through. The copy states
 * plainly what goes and what is kept — a deletion that quietly retains records
 * is worse than one that says which and why.
 */
export function DeleteAccountCard({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const matches = confirm.trim().toLowerCase() === email.trim().toLowerCase() && email.length > 0;

  async function remove() {
    setDeleting(true);
    try {
      const res = await fetch('/api/profile/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmEmail: confirm }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Could not delete your account');

      // Full reload rather than a router push: every session is gone, so the
      // client's cached user state is stale in a way that navigation wouldn't
      // clear.
      window.location.href = '/?deleted=1';
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not delete your account');
      setDeleting(false);
    }
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 text-destructive">
          <Trash2 className="h-4 w-4" />
          Delete your account
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!open ? (
          <>
            <p className="text-sm text-muted-foreground">
              Permanently removes your profile, CVs, cover letters, job matches and preferences.
              This cannot be undone.
            </p>
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
              Delete my account
            </Button>
          </>
        ) : (
          <>
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                This cannot be undone
              </p>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  <span className="text-foreground font-medium">Deleted:</span> your profile, every
                  CV and cover letter you&apos;ve made, your job matches, your email preferences and
                  your consent history. You&apos;ll be signed out everywhere.
                </p>
                <p>
                  <span className="text-foreground font-medium">Kept:</span> records of any payments
                  you&apos;ve made, with your name and email removed. We&apos;re required to keep
                  transaction records, so they stay attached to an anonymous entry rather than to
                  you.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-delete">
                Type <span className="font-mono text-foreground">{email}</span> to confirm
              </Label>
              <Input
                id="confirm-delete"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={email}
                autoComplete="off"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="destructive"
                size="sm"
                disabled={!matches || deleting}
                onClick={remove}
              >
                {deleting ? 'Deleting…' : 'Permanently delete my account'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={deleting}
                onClick={() => {
                  setOpen(false);
                  setConfirm('');
                }}
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
