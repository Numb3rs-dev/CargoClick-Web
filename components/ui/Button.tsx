import Link from 'next/link';
import { CSSProperties } from 'react';

/**
 * Botón reutilizable CargoClick.
 *
 * Server Component – sin 'use client'.
 * Hover/active manejados por CSS puro (cg-btn-primary / cg-btn-ghost).
 *
 * @param variant  - 'primary' (verde CTA) | 'ghost'
 * @param size     - 'sm' | 'md' | 'lg'
 * @param href     - Si se provee, renderiza como Link de Next.js
 */

interface ButtonProps {
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

const SIZE_STYLES: Record<NonNullable<ButtonProps['size']>, CSSProperties> = {
  sm: { padding: '8px 16px',  fontSize: '14px' },
  md: { padding: '12px 20px', fontSize: '15px' },
  lg: { padding: '14px 28px', fontSize: '16px' },
};

const BUTTON_CSS = `
.cg-btn-primary{background:#1F7A5C;color:#fff;font-weight:600;transition:background 200ms ease,transform 150ms ease}
.cg-btn-primary:not([disabled]):hover{background:#155D47;transform:translateY(-1px)}
.cg-btn-primary:not([disabled]):active{transform:scale(0.98)}
.cg-btn-ghost{background:transparent;color:var(--cg-text-primary,#1A202C);font-weight:500;transition:color 200ms ease}
.cg-btn-ghost:not([disabled]):hover{color:var(--cg-accent,#1F7A5C)}
`;

export default function Button({
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
}: ButtonProps) {
  const variantClass = variant === 'primary' ? 'cg-btn-primary' : 'cg-btn-ghost';
  const focusClass = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F7A5C]';

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
