'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { colors } from '@/lib/theme/colors';

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** 'md' ≈ 540px (forms simples) | 'lg' ≈ 820px (RemesaForm, ManifiestoWizard) */
  size?: 'md' | 'lg';
}

const WIDTHS = {
  md: 540,
  lg: 820,
};

export function SlideOver({ open, onClose, title, children, size = 'md' }: SlideOverProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Don't render the portal when closed — avoids SSR/client mismatch
  if (!open) return null;

  const width = WIDTHS[size];

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position:         'fixed',
          inset:            0,
          zIndex:           40,
          background:       'rgba(0,0,0,0.35)',
          backdropFilter:   'blur(1px)',
          opacity:          1,
          transition:       'opacity 220ms ease',
        }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position:    'fixed',
          top:         0,
          right:       0,
          bottom:      0,
          zIndex:      50,
          width:       `min(${width}px, 100vw)`,
          background:  colors.bgWhite,
          boxShadow:   '-4px 0 24px rgba(0,0,0,0.12)',
          display:     'flex',
          flexDirection: 'column',
          transform:   'translateX(0)',
          transition:  'transform 260ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'space-between',
            padding:      '20px 24px',
            borderBottom: `1px solid ${colors.border}`,
            flexShrink:   0,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar panel"
            style={{
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              width:        32,
              height:       32,
              borderRadius: 8,
              border:       `1px solid ${colors.border}`,
              background:   'transparent',
              cursor:       'pointer',
              color:        colors.textMuted,
              fontSize:     18,
              lineHeight:   1,
              transition:   'background 150ms, color 150ms',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = colors.borderLighter;
              (e.currentTarget as HTMLButtonElement).style.color = colors.textPrimary;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = colors.textMuted;
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div
          style={{
            flex:       1,
            overflowY:  'auto',
            padding:    '28px 24px',
          }}
        >
          {children}
        </div>
      </div>
    </>,
    document.body,
  );
}
