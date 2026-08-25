'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * Fires one page-view beacon per route change.
 *
 * Mounted in the root layout, which stays mounted across App Router
 * navigations, so this is a single long-lived instance.
 *
 * Deliberately uses `usePathname` ONLY. Calling `useSearchParams` in a
 * root-layout client component opts every route out of static rendering and
 * breaks `next build` for the prerendered marketing pages. Capturing UTM
 * params would need a <Suspense>-wrapped inner component.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    // Don't let our own dashboard use pollute the traffic figures.
    if (pathname.startsWith('/app/admin')) return;
    // Guards React StrictMode's double-invoked effects and incidental re-renders.
    if (lastPath.current === pathname) return;

    const isFirstView = lastPath.current === null;
    lastPath.current = pathname;

    fetch('/api/track/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // document.referrer persists across client-side navigations, so sending it
      // every time would credit the same referrer for the whole visit.
      body: JSON.stringify({
        path: pathname,
        referrer: isFirstView ? document.referrer || null : null,
      }),
      keepalive: true,
      cache: 'no-store',
    }).catch(() => {
      // Telemetry must never surface an error to the user.
    });
  }, [pathname]);

  return null;
}
