'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type ProgressProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: number;
  max?: number;
};

export function Progress({ className, value = 0, max = 100, ...rest }: ProgressProps) {
  const pct =
    Number.isFinite(value) && Number.isFinite(max) && max > 0
      ? Math.max(0, Math.min(100, (value / max) * 100))
      : 0;

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-primary/20', className)}
      {...rest}
    >
      <div
        className="h-full w-full bg-primary transition-transform"
        style={{ transform: `translateX(-${100 - pct}%)` }}
      />
    </div>
  );
}
