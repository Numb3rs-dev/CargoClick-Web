'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fieldStyle, labelStyle, sectionTitle, errorStyle, errBorder, FormErrorBanner, FormActions } from '@/components/operacional/shared/FormStyles';
import { CATEGORIAS_LICENCIA } from '@/lib/constants';

interface FormValues {
  cedula: string; nombres: string; apellidos: string;
  categoriaLicencia: string; licenciaVigencia: string;
  telefono: string; email: string; notas: string;
}

// ── Props ──────────────────────────────────────────────────────────
export interface ConductorFormProps {
  defaultValues?: Partial<FormValues>;
  mode: 'crear' | 'editar';
  cedula?: string;
  onSuccess?: () => void;
}

// ── Component ──────────────────────────────────────────────────────
export function ConductorForm({ defaultValues, mode, cedula, onSuccess }: ConductorFormProps) {
  const router = useRouter();
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<FormValues>({
    cedula:            defaultValues?.cedula            ?? '',
    nombres:           defaultValues?.nombres           ?? '',
    apellidos:         defaultValues?.apellidos         ?? '',
    categoriaLicencia: defaultValues?.categoriaLicencia ?? 'B3',
    licenciaVigencia:  defaultValues?.licenciaVigencia  ?? '',
    telefono:          defaultValues?.telefono          ?? '',
    email:             defaultValues?.email             ?? '',
    notas:             defaultValues?.notas             ?? '',
  });

  useEffect(() => {
    if (mode === 'crear') {
      setForm({ cedula: '', nombres: '', apellidos: '', categoriaLicencia: 'B3', licenciaVigencia: '', telefono: '', email: '', notas: '' });
      setError(null); setFieldErrors({});
    }
  }, [mode]);

  function upd(field: keyof FormValues, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setFieldErrors({});

    if (!form.cedula || form.cedula.length < 5) { setFieldErrors({ cedula: 'Mínimo 5 caracteres' }); return; }
    if (!form.nombres || form.nombres.length < 2) { setFieldErrors({ nombres: 'Mínimo 2 caracteres' }); return; }
    if (!form.apellidos || form.apellidos.length < 2) { setFieldErrors({ apellidos: 'Mínimo 2 caracteres' }); return; }

    setSaving(true);
    try {
      const url    = mode === 'crear' ? '/api/conductores' : `/api/conductores/${cedula}`;
      const method = mode === 'crear' ? 'POST' : 'PATCH';

      const payload: Record<string, unknown> = {
        cedula: form.cedula, nombres: form.nombres, apellidos: form.apellidos,
        categoriaLicencia: form.categoriaLicencia,
      };
      if (form.licenciaVigencia) payload.licenciaVigencia = form.licenciaVigencia;
      if (form.telefono) payload.telefono = form.telefono;
      if (form.email) payload.email = form.email;
      if (form.notas) payload.notas = form.notas;

      const res = await fetch(url, { method, body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
      const json = await res.json();

      if (!res.ok) {
        if (json.fields) {
          const flat: Record<string, string> = {};
          for (const [k, v] of Object.entries(json.fields)) flat[k] = Array.isArray(v) ? v[0] : String(v);
          setFieldErrors(flat); return;
        }
        throw new Error(json.message ?? json.error ?? 'Error al guardar');
      }

      if (onSuccess) { onSuccess(); }
      else { router.push(`/operacional/conductores/${json.data.cedula}`); router.refresh(); }
    } catch (err) { setError((err as Error).message); }
    finally { setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Información básica ── */}
      <div>
        <p style={sectionTitle}>Información básica</p>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Cédula *</label>
          <input value={form.cedula} onChange={e => upd('cedula', e.target.value)} placeholder="80123456"
            style={errBorder('cedula', fieldErrors)} disabled={mode === 'editar'} required minLength={5} maxLength={20} />
          {fieldErrors.cedula && <p style={errorStyle}>{fieldErrors.cedula}</p>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Nombres *</label>
            <input value={form.nombres} onChange={e => upd('nombres', e.target.value)} style={errBorder('nombres', fieldErrors)} required minLength={2} maxLength={80} />
            {fieldErrors.nombres && <p style={errorStyle}>{fieldErrors.nombres}</p>}
          </div>
          <div>
            <label style={labelStyle}>Apellidos *</label>
            <input value={form.apellidos} onChange={e => upd('apellidos', e.target.value)} style={errBorder('apellidos', fieldErrors)} required minLength={2} maxLength={80} />
            {fieldErrors.apellidos && <p style={errorStyle}>{fieldErrors.apellidos}</p>}
          </div>
        </div>
      </div>

      {/* ── Licencia ── */}
      <div>
        <p style={sectionTitle}>Licencia de conducción</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Categoría *</label>
            <select value={form.categoriaLicencia} onChange={e => upd('categoriaLicencia', e.target.value)} style={fieldStyle}>
              {CATEGORIAS_LICENCIA.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Vigencia</label>
            <input type="date" value={form.licenciaVigencia} onChange={e => upd('licenciaVigencia', e.target.value)} style={fieldStyle} />
          </div>
        </div>
      </div>

      {/* ── Contacto ── */}
      <div>
        <p style={sectionTitle}>Contacto (opcional)</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Teléfono</label>
            <input value={form.telefono} onChange={e => upd('telefono', e.target.value)} placeholder="310-555-0100" style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" value={form.email} onChange={e => upd('email', e.target.value)} style={errBorder('email', fieldErrors)} />
            {fieldErrors.email && <p style={errorStyle}>{fieldErrors.email}</p>}
          </div>
        </div>
      </div>

      {/* ── Notas ── */}
      <div>
        <label style={labelStyle}>Notas</label>
        <textarea value={form.notas} onChange={e => upd('notas', e.target.value)} rows={3} maxLength={500} style={{ ...fieldStyle, resize: 'vertical' }} />
      </div>

      <FormErrorBanner message={error} />

      <FormActions
        saving={saving}
        onCancel={() => onSuccess ? onSuccess() : router.back()}
        submitLabel={mode === 'crear' ? 'Crear conductor' : 'Guardar cambios'}
      />
    </form>
  );
}
