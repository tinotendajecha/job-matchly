'use client';

import { useEffect } from 'react';

/**
 * Remembers which job brought a signed-out visitor to the site.
 *
 * Someone who follows a shared Sales & Marketing link is probably in sales —
 * a useful prior, but only a prior. A friend forwards a job to a group of
 * forty; a nurse opens it out of curiosity. So this is never used to tag
 * anyone silently. It only pre-selects the answer in the field question, where
 * one tap confirms it and one tap changes it.
 *
 * A cookie rather than a query string because the signal has to survive
 * signup -> emailed verification code -> sign in, and a link in an email
 * carries none of the original URL.
 */
export function ArrivalTracker({
  jobId,
  bracket,
  jobTitle,
}: {
  jobId: string;
  bracket: string | null;
  jobTitle: string;
}) {
  useEffect(() => {
    try {
      // jobId is always set, bracket may not be — the cookie is also what
      // attributes a later signup back to the job that brought them.
      const payload = encodeURIComponent(JSON.stringify({ jobId, bracket, jobTitle }));
      // 7 days: long enough for a verification detour, short enough that a
      // stale prior can't quietly steer someone months later.
      document.cookie = `jm_arrival=${payload}; path=/; max-age=604800; samesite=lax`;
    } catch {
      /* the field question still works without a pre-selection */
    }
  }, [jobId, bracket, jobTitle]);

  return null;
}
