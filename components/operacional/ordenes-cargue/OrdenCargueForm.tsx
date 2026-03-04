'use client';

import { useState, useCallback } from 'react';
import { MiniSearch } from '@/components/operacional/shared/MiniSearch';
import { fieldStyle, labelStyle, sectionTitle, FormErrorBanner } from '@/components/operacional/shared/FormStyles';
import { colors } from '@/lib/theme/colors';

// ── Tipos ──────────────────────────────────────────────────────────────────────

export interface OrdenCargueFormProps {
  mode:          'crear' | 'editar';
  defaultValues?: {
    id:                    string;
    nuevoNegocioId:        string;
    nuevoNegocio:          { codigoNegocio: string; clienteNombre: string | null };
    vehiculoPlaca:         string | null;
    conductorCedula:       string | null;
    conductor:             { nombres: string; apellidos: string } | null;
    fechaHoraCargue:       Date | null;
    puntoCargueDireccion:  string | null;
    puntoCargueMunicipio:  string | null;
    puntoCargueDane:       string | null;
    notas:                 string | null;
  };
  onSuccess?: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────
export function OrdenCargueForm({ mode, defaultValues, onSuccess }: OrdenCargueFormProps) {
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  // Negocio
  const [negocioId,      setNegocioId]      = useState(defaultValues?.nuevoNegocioId ?? '');
  const [negocioDisplay, setNegocioDisplay] = useState(
    defaultValues ? `${defaultValues.nuevoNegocio.codigoNegocio}${defaultValues.nuevoNegocio.clienteNombre ? ` — ${defaultValues.nuevoNegocio.clienteNombre}` : ''}` : ''
  );

  // Vehículo
  const [placa, setPlaca] = useState(defaultValues?.vehiculoPlaca ?? '');

  // Conductor
  const [conductorCedula,  setConductorCedula]  = useState(defaultValues?.conductorCedula ?? '');
  const [conductorDisplay, setConductorDisplay] = useState(
    defaultValues?.conductor ? `${defaultValues.conductor.nombres} ${defaultValues.conductor.apellidos} (${defaultValues.conductorCedula})` : ''
  );

  // Punto de cargue
  const [fechaHora,   setFechaHora]   = useState(
    defaultValues?.fechaHoraCargue
      ? new Date(defaultValues.fechaHoraCargue).toISOString().slice(0, 16)
      : ''
  );
  const [direccion,   setDireccion]   = useState(defaultValues?.puntoCargueDireccion  ?? '');
  const [municipio,   setMunicipio]   = useState(defaultValues?.puntoCargueMunicipio  ?? '');
  const [dane,        setDane]        = useState(defaultValues?.puntoCargueDane       ?? '');
  const [notas,       setNotas]       = useState(defaultValues?.notas                 ?? '');

  // ── Fetch helpers ────────────────────────────────────────────────────────────

  const fetchNegocios = useCallback(async (q: string) => {
    const r = await fetch(`/api/negocios?q=${encodeURIComponent(q)}&pageSize=10`);
    const j = await r.json();
    return (j.data ?? []).map((n: { id: string; codigoNegocio: string; clienteNombre: string | null }) => ({
      value: n.id,
      label: n.codigoNegocio,
      sub:   n.clienteNombre ?? undefined,
    }));
  }, []);

  const fetchVehiculos = useCallback(async (q: string) => {
    const r = await fetch(`/api/vehiculos?q=${encodeURIComponent(q)}&pageSize=10`);
    const j = await r.json();
    return (j.data ?? []).map((v: { placa: string; configVehiculo: string | null }) => ({
      value: v.placa,
      label: v.placa,
      sub:   v.configVehiculo ?? undefined,
    }));
  }, []);

  const fetchConductores = useCallback(async (q: string) => {
    const r = await fetch(`/api/conductores?q=${encodeURIComponent(q)}&pageSize=10`);
    const j = await r.json();
    return (j.data ?? []).map((c: { cedula: string; nombres: string; apellidos: string }) => ({
      value: c.cedula,
      label: `${c.nombres} ${c.apellidos}`,
      sub:   `Cédula ${c.cedula}`,
    }));
  }, []);

  // ── Submit ───────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!negocioId) { setError('Debes seleccionar un negocio'); return; }
    setError(null);
    setSaving(true);

    const payload = {
      nuevoNegocioId:        negocioId,
      vehiculoPlaca:         placa         || null,
      conductorCedula:       conductorCedula || null,
      fechaHoraCargue:       fechaHora      || null,
      puntoCargueDireccion:  direccion      || null,
      puntoCargueMunicipio:  municipio      || null,
      puntoCargueDane:       dane           || null,
      notas:                 notas          || null,
    };

    try {
      const url    = mode === 'crear' ? '/api/ordenes-cargue' : `/api/ordenes-cargue/${defaultValues!.id}`;
      const method = mode === 'crear' ? 'POST' : 'PATCH';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json   = await res.json();
      if (!res.ok) { setError(json.error ?? 'Error al guardar'); return; }
      onSuccess?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Negocio */}
      <div>
        <p style={sectionTitle}>Negocio de origen</p>
        <MiniSearch
          label="Negocio *"
          placeholder="Buscar por código o cliente…"
          value={negocioDisplay}
          onSelect={o => { setNegocioId(o.value); setNegocioDisplay(`${o.label}${o.sub ? ` — ${o.sub}` : ''}`); }}
          onClear={() => { setNegocioId(''); setNegocioDisplay(''); }}
          fetchOptions={fetchNegocios}
          required
        />
      </div>

      {/* Vehículo + Conductor */}
      <div>
        <p style={sectionTitle}>Asignación</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <MiniSearch
            label="Vehículo (placa)"
            placeholder="Buscar placa…"
            value={placa}
            onSelect={o => setPlaca(o.value)}
            onClear={() => setPlaca('')}
            fetchOptions={fetchVehiculos}
          />
          <MiniSearch
            label="Conductor"
            placeholder="Buscar por nombre o cédula…"
            value={conductorDisplay}
            onSelect={o => { setConductorCedula(o.value); setConductorDisplay(`${o.label} (${o.value})`); }}
            onClear={() => { setConductorCedula(''); setConductorDisplay(''); }}
            fetchOptions={fetchConductores}
          />
        </div>
      </div>

      {/* Punto de cargue */}
      <div>
        <p style={sectionTitle}>Punto de cargue</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={labelStyle}>Fecha y hora de cargue</label>
            <input
              type="datetime-local"
              value={fechaHora}
              onChange={e => setFechaHora(e.target.value)}
              style={fieldStyle}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: 12 }}>
            <div>
              <label style={labelStyle}>Municipio</label>
              <input value={municipio} onChange={e => setMunicipio(e.target.value)} style={fieldStyle} placeholder="Bogotá, D.C." />
            </div>
            <div>
              <label style={labelStyle}>DANE</label>
              <input value={dane} onChange={e => setDane(e.target.value)} style={fieldStyle} maxLength={5} placeholder="11001" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Dirección</label>
            <input value={direccion} onChange={e => setDireccion(e.target.value)} style={fieldStyle} placeholder="Cra 30 # 15-40, Bodega 3" />
          </div>
        </div>
      </div>

      {/* Notas */}
      <div>
        <label style={labelStyle}>Notas internas</label>
        <textarea
          value={notas}
          onChange={e => setNotas(e.target.value)}
          rows={2}
          style={{ ...fieldStyle, resize: 'vertical' }}
          placeholder="Instrucciones para el conductor…"
        />
      </div>

      <FormErrorBanner message={error} />

      {/* Acciones */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            background: saving ? colors.disabledBtn : colors.primary, color: colors.bgWhite,
            border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14,
            fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {saving ? 'Guardando…' : mode === 'crear' ? 'Crear orden →' : 'Guardar cambios →'}
        </button>
      </div>
    </form>
  );
}
