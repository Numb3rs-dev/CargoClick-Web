'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fieldStyle, labelStyle, sectionTitle, errorStyle, FormErrorBanner, FormActions } from '@/components/operacional/shared/FormStyles';
import { colors } from '@/lib/theme/colors';

/* -------------------------------------------------------------------------- */
/*  Componente                                                                  */
/* -------------------------------------------------------------------------- */

interface NegocioDirectoFormProps {
  onBack: () => void;
  onSuccess?: () => void;
}

/**
 * Ruta B — Formulario de negocio directo sin cotización previa.
 * Hace POST /api/negocios con clienteNombre y datos opcionales.
 */
export function NegocioDirectoForm({ onBack, onSuccess }: NegocioDirectoFormProps) {
  const router = useRouter();
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [clienteNombre,         setClienteNombre]         = useState('');
  const [clienteNit,            setClienteNit]            = useState('');
  const [fechaDespachoEstimada, setFechaDespachoEstimada] = useState('');
  const [notas,                 setNotas]                 = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setFieldErrors({});

    if (!clienteNombre || clienteNombre.length < 2) {
      setFieldErrors({ clienteNombre: 'Mínimo 2 caracteres' }); return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = { clienteNombre };
      if (clienteNit) payload.clienteNit = clienteNit;
      if (fechaDespachoEstimada) payload.fechaDespachoEstimada = fechaDespachoEstimada;
      if (notas) payload.notas = notas;

      const res  = await fetch('/api/negocios', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? json.error ?? 'Error al crear negocio');

      if (onSuccess) { onSuccess(); }
      else { router.push(`/operacional/negocios/${json.data.id}`); }
    } catch (err) { setError((err as Error).message); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" onClick={onBack}
          style={{ padding: '6px 12px', fontSize: 13, fontWeight: 500, border: `1px solid ${colors.border}`, borderRadius: 8, background: colors.bgWhite, color: colors.textDefault, cursor: 'pointer' }}>
          ← Atrás
        </button>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>Negocio directo</h2>
          <p style={{ fontSize: 13, color: colors.textMuted, margin: '2px 0 0' }}>Ruta B — sin cotización previa</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Sección: Cliente */}
        <div>
          <p style={sectionTitle}>Cliente</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={labelStyle}>Nombre / Razón social <span style={{ color: colors.error }}>*</span></label>
              <input value={clienteNombre} onChange={e => { setClienteNombre(e.target.value); setFieldErrors({}); }}
                placeholder="Alpina S.A." style={fieldErrors.clienteNombre ? { ...fieldStyle, borderColor: colors.error } : fieldStyle}
                required minLength={2} maxLength={100} />
              {fieldErrors.clienteNombre && <p style={errorStyle}>{fieldErrors.clienteNombre}</p>}
            </div>
            <div>
              <label style={labelStyle}>NIT / Cédula</label>
              <input value={clienteNit} onChange={e => setClienteNit(e.target.value)} placeholder="900123456-1" style={fieldStyle} maxLength={20} />
            </div>
          </div>
        </div>

        {/* Sección: Operación */}
        <div>
          <p style={sectionTitle}>Operación</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={labelStyle}>Fecha estimada de despacho</label>
              <input type="date" value={fechaDespachoEstimada} onChange={e => setFechaDespachoEstimada(e.target.value)} style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>Notas internas</label>
              <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={3}
                placeholder="Instrucciones especiales, contacto en destino…" maxLength={1000}
                style={{ ...fieldStyle, resize: 'vertical' }} />
            </div>
          </div>
        </div>

        <FormErrorBanner message={error} />

        <FormActions
          saving={saving}
          onCancel={onBack}
          submitLabel="Crear negocio →"
        />
      </form>
    </div>
  );
}
