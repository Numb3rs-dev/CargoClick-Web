'use client';

import { useState } from 'react';
import { NegocioDesdeComercial } from './NegocioDesdeComercial';
import { NegocioDirectoForm } from './NegocioDirectoForm';
import { colors } from '@/lib/theme/colors';

type Ruta = 'A' | 'B' | null;

interface NuevoNegocioSelectorProps {
  onSuccess?: () => void;
}

const cardStyle: React.CSSProperties = {
  border: `1px solid ${colors.borderLight}`, borderRadius: 10, padding: '20px 24px',
  display: 'flex', alignItems: 'flex-start', gap: 16, cursor: 'pointer',
  background: colors.bgWhite, transition: 'border-color .15s',
};

export function NuevoNegocioSelector({ onSuccess }: NuevoNegocioSelectorProps = {}) {
  const [ruta, setRuta] = useState<Ruta>(null);
  const [hoverA, setHoverA] = useState(false);
  const [hoverB, setHoverB] = useState(false);

  if (ruta === 'A') return <NegocioDesdeComercial onBack={() => setRuta(null)} onSuccess={onSuccess} />;
  if (ruta === 'B') return <NegocioDirectoForm onBack={() => setRuta(null)} onSuccess={onSuccess} />;

  return (
    <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: colors.textPrimary }}>Nuevo Negocio</h1>
        <p style={{ fontSize: 14, color: colors.textMuted, marginTop: 4 }}>¿Cómo ingresó esta carga?</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Ruta A */}
        <div
          onClick={() => setRuta('A')}
          onMouseEnter={() => setHoverA(true)}
          onMouseLeave={() => setHoverA(false)}
          style={{ ...cardStyle, borderColor: hoverA ? colors.primary : colors.borderLight }}
        >
          <span style={{ fontSize: 28, userSelect: 'none' }}>📋</span>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: colors.textPrimary }}>Desde solicitud aprobada</h3>
            <p style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
              La carga viene del ciclo comercial. Selecciona la cotización o ajuste aprobado.
            </p>
          </div>
          <span style={{
            padding: '6px 14px', fontSize: 13, fontWeight: 500, border: `1px solid ${colors.border}`,
            borderRadius: 8, background: colors.bgWhite, color: colors.textDefault, whiteSpace: 'nowrap',
          }}>
            Seleccionar →
          </span>
        </div>

        {/* Ruta B */}
        <div
          onClick={() => setRuta('B')}
          onMouseEnter={() => setHoverB(true)}
          onMouseLeave={() => setHoverB(false)}
          style={{ ...cardStyle, borderColor: hoverB ? colors.primary : colors.borderLight }}
        >
          <span style={{ fontSize: 28, userSelect: 'none' }}>✏️</span>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: colors.textPrimary }}>Negocio directo</h3>
            <p style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
              Cliente llegó directamente por teléfono, referido o canal propio. Sin cotización previa.
            </p>
          </div>
          <span style={{
            padding: '6px 14px', fontSize: 13, fontWeight: 500, border: `1px solid ${colors.border}`,
            borderRadius: 8, background: colors.bgWhite, color: colors.textDefault, whiteSpace: 'nowrap',
          }}>
            Ingresar datos →
          </span>
        </div>
      </div>
    </div>
  );
}
