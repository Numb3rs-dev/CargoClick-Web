'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { HitoSeguimiento } from '@prisma/client';
import { fieldStyle, labelStyle, FormErrorBanner, FormActions } from '@/components/operacional/shared/FormStyles';
import { colors } from '@/lib/theme/colors';
import { HITOS_SEGUIMIENTO } from '@/lib/constants';

interface Props {
  negocioId: string;
  onClose: () => void;
}

/**
 * Formulario inline para registrar un hito de seguimiento del cliente.
 */
export function SeguimientoHitoForm({ negocioId, onClose }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const [hito,              setHito]              = useState('');
  const [descripcion,       setDescripcion]       = useState('');
  const [ubicacionActual,   setUbicacionActual]   = useState('');
  const [notificarCliente,  setNotificarCliente]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hito) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/negocios/${negocioId}/seguimiento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hito,
          descripcion:       descripcion || undefined,
          ubicacionActual:   ubicacionActual || undefined,
          canalNotificacion: notificarCliente ? 'WHATSAPP' : 'PORTAL',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Error al registrar hito');
      onClose();
      router.refresh();
    } catch (err) { setError((err as Error).message); }
    finally { setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Hito */}
      <div>
        <label style={labelStyle}>Hito *</label>
        <select value={hito} onChange={e => setHito(e.target.value)} style={fieldStyle} required>
          <option value="" disabled>Seleccionar hito...</option>
          {HITOS_SEGUIMIENTO.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
        </select>
      </div>

      {/* Descripción */}
      <div>
        <label style={labelStyle}>Descripción</label>
        <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2}
          placeholder="Detalles adicionales del hito..." maxLength={300}
          style={{ ...fieldStyle, resize: 'vertical' }} />
      </div>

      {/* Ubicación */}
      <div>
        <label style={labelStyle}>Ubicación (opcional)</label>
        <input value={ubicacionActual} onChange={e => setUbicacionActual(e.target.value)}
          placeholder="Ej: Km 105 vía Bogotá-Medellín" maxLength={100} style={fieldStyle} />
      </div>

      {/* Notificar al cliente */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: colors.textDefault }}>
        <input type="checkbox" checked={notificarCliente} onChange={e => setNotificarCliente(e.target.checked)}
          style={{ width: 16, height: 16, accentColor: colors.primary }} />
        Notificar al cliente por WhatsApp / Email
      </label>

      <FormErrorBanner message={error} />

      <FormActions
        saving={saving}
        onCancel={onClose}
        submitLabel="Guardar hito"
      />
    </form>
  );
}
