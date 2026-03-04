/**
 * components/ui/Button.tsx
 *
 * Exporta DOS variantes de botón:
 * - DEFAULT export (MarketingButton): botón de diseño CargoClick para páginas públicas.
 *   Usa CSS custom properties cg-btn-* y estilos inline. Server Component seguro.
 * - NAMED export { Button }: botón shadcn/ui compatible para el módulo operacional.
 *   Usa Tailwind + class-variance-authority + @radix-ui/react-slot.
 */

// ─────────────────────────────────────────────────────
// SHADCN-COMPATIBLE Button (para módulo operacional)
// ─────────────────────────────────────────────────────
'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-muted hover:text-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-muted hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

/** Botón shadcn/ui-compatible — para módulo operacional. Requiere 'use client' en el importador. */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { buttonVariants };

// ─────────────────────────────────────────────────────
// MARKETING Button (para páginas públicas — default export)
// ─────────────────────────────────────────────────────
import Link from 'next/link';
import { CSSProperties } from 'react';
import { colors } from '@/lib/theme/colors';

/**
 * Botón de marketing CargoClick — diseño propio con tokens cg-btn-*.
 *
 * Server Component – sin 'use client'.
 * Hover/active manejados por CSS puro (cg-btn-primary / cg-btn-ghost).
 *
 * @param variant  - 'primary' (verde CTA) | 'ghost'
 * @param size     - 'sm' | 'md' | 'lg'
 * @param href     - Si se provee, renderiza como Link de Next.js
 */

interface MarketingButtonProps {
  variant?: 'primary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  fullWidth?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  ariaLabel?: string;
}

const SIZE_STYLES: Record<NonNullable<MarketingButtonProps['size']>, CSSProperties> = {
  sm: { padding: '8px 16px',  fontSize: '14px' },
  md: { padding: '12px 20px', fontSize: '15px' },
  lg: { padding: '14px 28px', fontSize: '16px' },
};

const BUTTON_CSS = `
.cg-btn-primary{background:${colors.brandGreen};color:#fff;font-weight:600;transition:background 200ms ease,transform 150ms ease}
.cg-btn-primary:not([disabled]):hover{background:${colors.brandGreenDark};transform:translateY(-1px)}
.cg-btn-primary:not([disabled]):active{transform:scale(0.98)}
.cg-btn-ghost{background:transparent;color:var(--cg-text-primary,${colors.brandText});font-weight:500;transition:color 200ms ease}
.cg-btn-ghost:not([disabled]):hover{color:var(--cg-accent,${colors.brandGreen})}
`;

export default function MarketingButton({
  variant = 'primary',
  size = 'md',
  children,
  href,
  onClick,
  fullWidth = false,
  className = '',
  type = 'button',
  disabled = false,
  ariaLabel,
}: MarketingButtonProps) {
  const variantClass = variant === 'primary' ? 'cg-btn-primary' : 'cg-btn-ghost';
  const focusClass = `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[${colors.brandGreen}]`;

  const baseStyle: CSSProperties = {
    ...SIZE_STYLES[size],
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: '6px',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    textDecoration: 'none',
    lineHeight: 1,
    width: fullWidth ? '100%' : undefined,
    opacity: disabled ? 0.55 : 1,
    outline: 'none',
  };

  const combinedClass = [variantClass, focusClass, className].filter(Boolean).join(' ');

  if (href) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: BUTTON_CSS }} />
        <Link
          href={href}
          style={baseStyle}
          className={combinedClass}
          aria-label={ariaLabel}
          aria-disabled={disabled}
          {...(disabled ? { onClick: (e) => e.preventDefault() } : {})}
        >
          {children}
        </Link>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: BUTTON_CSS }} />
      <button
        type={type}
        style={baseStyle}
        className={combinedClass}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        aria-label={ariaLabel}
      >
        {children}
      </button>
    </>
  );
}
