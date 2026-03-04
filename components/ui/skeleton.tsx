import * as React from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Skeleton — placeholder while real content loads.
 * Usage: <Skeleton className="h-4 w-24" />
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}
