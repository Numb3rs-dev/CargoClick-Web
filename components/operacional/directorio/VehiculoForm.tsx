'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fieldStyle, labelStyle, sectionTitle, errorStyle, errBorder, FormErrorBanner, FormActions } from '@/components/operacional/shared/FormStyles';
import { CONFIGS_VEHICULO, TIPOS_VEHICULO } from '@/lib/constants';

// ── Types ──────────────────────────────────────────────────────────
interface FormValues {
  placa:             string;
  propietarioNombre: string;
  propietarioId:     string;
  configVehiculo:    string;
  capacidadTon:      string;
  tipoVehiculo:      string;
  anioVehiculo:      string;
  soatVigencia:      string;
  rtmVigencia:       string;
  notas:             string;
}

// ── Props ──────────────────────────────────────────────────────────
export interface VehiculoFormProps {
  defaultValues?: Partial<FormValues>;
  mode: 'crear' | 'editar';
  placa?: string;
  onSuccess?: () => void;
}

// ── Component ──────────────────────────────────────────────────────
export function VehiculoForm({ defaultValues, mode, placa, onSuccess }: VehiculoFormProps) {
  const router = useRouter();
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<FormValues>({
    placa:             defaultValues?.placa             ?? '',
    propietarioNombre: defaultValues?.propietarioNombre ?? '',
    propietarioId:     defaultValues?.propietarioId     ?? '',
    configVehiculo:    defaultValues?.configVehiculo    ?? '',
    capacidadTon:      defaultValues?.capacidadTon      ?? '',
    tipoVehiculo:      defaultValues?.tipoVehiculo      ?? '',
    anioVehiculo:      defaultValues?.anioVehiculo      ?? '',
    soatVigencia:      defaultValues?.soatVigencia      ?? '',
    rtmVigencia:       defaultValues?.rtmVigencia       ?? '',
    notas:             defaultValues?.notas             ?? '',
  });

  // Reset on mode change (crear)
  useEffect(() => {
    if (mode === 'crear') {
      setForm({
        placa: '', propietarioNombre: '', propietarioId: '',
        configVehiculo: '', capacidadTon: '', tipoVehiculo: '',
        anioVehiculo: '', soatVigencia: '', rtmVigencia: '', notas: '',
      });
      setError(null);
      setFieldErrors({});
    }
  }, [mode]);

  function upd(field: keyof FormValues, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Basic client validation
    if (!form.placa || form.placa.length < 5) {
      setFieldErrors({ placa: 'Mínimo 5 caracteres' });
      return;
    }

    setSaving(true);
    try {
      const url    = mode === 'crear' ? '/api/vehiculos' : `/api/vehiculos/${placa}`;
      const method = mode === 'crear' ? 'POST' : 'PATCH';

      const payload: Record<string, unknown> = {
        placa: form.placa.toUpperCase(),
      };
      if (form.propietarioNombre) payload.propietarioNombre = form.propietarioNombre;
      if (form.propietarioId)     payload.propietarioId     = form.propietarioId;
      if (form.configVehiculo)    payload.configVehiculo    = form.configVehiculo;
      if (form.tipoVehiculo)      payload.tipoVehiculo      = form.tipoVehiculo;
      if (form.capacidadTon)      payload.capacidadTon      = parseFloat(form.capacidadTon);
      if (form.anioVehiculo)      payload.anioVehiculo      = parseInt(form.anioVehiculo, 10);
      if (form.soatVigencia)      payload.soatVigencia      = form.soatVigencia;
      if (form.rtmVigencia)       payload.rtmVigencia       = form.rtmVigencia;
      if (form.notas)             payload.notas             = form.notas;

      const res = await fetch(url, {
        method,
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.fields) {
          const flattened: Record<string, string> = {};
          for (const [k, v] of Object.entries(json.fields)) {
            flattened[k] = Array.isArray(v) ? v[0] : String(v);
          }
          setFieldErrors(flattened);
          return;
        }
        throw new Error(json.message ?? json.error ?? 'Error al guardar');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/operacional/vehiculos/${json.data.placa}`);
        router.refresh();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Identificación ── */}
      <div>
        <p style={sectionTitle}>Identificación</p>
        <div>
          <label style={labelStyle}>Placa *</label>
          <input
            value={form.placa}
            onChange={e => upd('placa', e.target.value.toUpperCase())}
            placeholder="ABC123"
            style={{ ...errBorder('placa', fieldErrors), textTransform: 'uppercase' }}
            disabled={mode === 'editar'}
            required
            minLength={5}
            maxLength={8}
          />
          {fieldErrors.placa && <p style={errorStyle}>{fieldErrors.placa}</p>}
        </div>
      </div>

      {/* ── Propietario ── */}
      <div>
        <p style={sectionTitle}>Propietario (opcional)</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Nombre propietario</label>
            <input
              value={form.propietarioNombre}
              onChange={e => upd('propietarioNombre', e.target.value)}
              style={fieldStyle}
              maxLength={120}
            />
          </div>
          <div>
            <label style={labelStyle}>Cédula propietario</label>
            <input
              value={form.propietarioId}
              onChange={e => upd('propietarioId', e.target.value)}
              style={fieldStyle}
              maxLength={20}
            />
          </div>
        </div>
      </div>

      {/* ── Características ── */}
      <div>
        <p style={sectionTitle}>Características del vehículo</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Configuración SISETAC</label>
            <select
              value={form.configVehiculo}
              onChange={e => upd('configVehiculo', e.target.value)}
              style={fieldStyle}
            >
              <option value="">— Sin configuración —</option>
              {CONFIGS_VEHICULO.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Tipo vehículo</label>
            <select
              value={form.tipoVehiculo}
              onChange={e => upd('tipoVehiculo', e.target.value)}
              style={fieldStyle}
            >
              <option value="">— Seleccionar —</option>
              {TIPOS_VEHICULO.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Capacidad (ton)</label>
            <input
              type="number"
              step="0.01"
              value={form.capacidadTon}
              onChange={e => upd('capacidadTon', e.target.value)}
              style={fieldStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Año</label>
            <input
              type="number"
              placeholder={String(new Date().getFullYear())}
              value={form.anioVehiculo}
              onChange={e => upd('anioVehiculo', e.target.value)}
              style={fieldStyle}
            />
          </div>
        </div>
      </div>

      {/* ── Documentación ── */}
      <div>
        <p style={sectionTitle}>Documentación (vigencias)</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>SOAT vigencia</label>
            <input
              type="date"
              value={form.soatVigencia}
              onChange={e => upd('soatVigencia', e.target.value)}
              style={fieldStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>RTM vigencia</label>
            <input
              type="date"
              value={form.rtmVigencia}
              onChange={e => upd('rtmVigencia', e.target.value)}
              style={fieldStyle}
            />
          </div>
        </div>
      </div>

      {/* ── Notas ── */}
      <div>
        <label style={labelStyle}>Notas</label>
        <textarea
          value={form.notas}
          onChange={e => upd('notas', e.target.value)}
          rows={3}
          maxLength={500}
          style={{ ...fieldStyle, resize: 'vertical' }}
        />
      </div>

      <FormErrorBanner message={error} />

      <FormActions
        saving={saving}
        onCancel={() => onSuccess ? onSuccess() : router.back()}
        submitLabel={mode === 'crear' ? 'Crear vehículo' : 'Guardar cambios'}
      />
    </form>
  );
}
