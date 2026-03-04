'use client';

import { useState } from 'react';
import { colors } from '@/lib/theme/colors';

interface Props {
  icon: string;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function CardColapsable({ icon, title, defaultOpen = true, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{
      background: colors.bgWhite,
      borderRadius: 12,
      border: `1px solid ${colors.borderLight}`,
      overflow: 'hidden',
    }}>
      {/* Cabecera — siempre visible, clicable */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          cursor: 'pointer',
          border: 'none',
          outline: 'none',
          background: colors.bgLight,
          borderBottom: open ? `1px solid ${colors.borderLighter}` : 'none',
          textAlign: 'left',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: colors.textPrimary }}>{title}</h2>
        </div>
        <span style={{
          fontSize: 13,
          color: colors.textPlaceholder,
          display: 'inline-block',
          transition: 'transform 0.2s',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>▾</span>
      </button>

      {/* Cuerpo colapsable */}
      {open && children}
    </div>
  );
}
