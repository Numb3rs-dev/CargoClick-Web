'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { ChevronDown } from 'lucide-react';

// ── Types ──────────────────────────────────────────────
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  onValueChange?: (value: string) => void;
}

// ── Root Select (wraps native <select>) ───────────────
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, onValueChange, onChange, children, ...props }, ref) => {
    function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
      onValueChange?.(e.target.value);
      onChange?.(e);
    }
    return (
      <div className={cn('relative', className)}>
        <select
          ref={ref}
          className={cn(
            'flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          )}
          onChange={handleChange}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    );
  }
);
Select.displayName = 'Select';

// ── Shadcn-compatible aliases ─────────────────────────
// These allow the same import pattern as shadcn/ui:
//   <SelectTrigger>, <SelectContent>, <SelectItem>, <SelectValue>

/**
 * SelectTrigger — no-op when used with this native-select implementation.
 * Rendered as a fragment to avoid div-inside-select hydration errors.
 */
export const SelectTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
// eslint-disable-next-line @typescript-eslint/no-unused-vars
>(({ className, children, ...props }, _ref) => null);
SelectTrigger.displayName = 'SelectTrigger';

/**
 * SelectContent — passthrough fragment. Native <select> doesn't need a portal.
 * Renders children directly so <SelectItem> (<option>) is a valid child of <select>.
 */
export const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children }, _ref) => <>{children}</>);
SelectContent.displayName = 'SelectContent';

/** Maps to <option> element. */
export interface SelectItemProps
  extends React.OptionHTMLAttributes<HTMLOptionElement> {
  value: string;
}
export const SelectItem = React.forwardRef<HTMLOptionElement, SelectItemProps>(
  ({ children, ...props }, ref) => (
    <option ref={ref} {...props}>
      {children}
    </option>
  )
);
SelectItem.displayName = 'SelectItem';

/** Placeholder text shown when no value selected. */
export interface SelectValueProps {
  placeholder?: string;
}
export function SelectValue({ placeholder }: SelectValueProps) {
  return <option value="" disabled>{placeholder}</option>;
}
