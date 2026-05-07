'use client';

import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="container px-4 py-14 mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand col */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4 w-fit">
              <Image src="/jobmatchly-logo.svg" alt="JobMatchly" width={38} height={38} className="rounded-lg" />
              <span className="text-base font-bold font-display">JobMatchly</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              AI-powered CV tailoring that passes ATS checks.
              Built for African professionals who deserve to be seen.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-4">
              Product
            </p>
            <ul className="space-y-3">
              {[
                { href: '/templates', label: 'Templates' },
                { href: '/pricing', label: 'Pricing' },
                { href: '/app/coming-soon', label: 'Roadmap' },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-4">
              Company
            </p>
            <ul className="space-y-3">
              {[
                { href: '/privacy', label: 'Privacy' },
                { href: '/terms', label: 'Terms' },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-4">
              Account
            </p>
            <ul className="space-y-3">
              {[
                { href: '/auth/signin', label: 'Sign In' },
                { href: '/auth/signup', label: 'Sign Up' },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-border/60 gap-3">
          <p className="text-xs text-muted-foreground">
            © 2025 JobMatchly. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built by Gen Z Tech Labs
          </p>
        </div>
      </div>
    </footer>
  );
}
