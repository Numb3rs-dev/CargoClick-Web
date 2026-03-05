'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ClienteConSucursales } from './ClienteList';
import {
  fieldStyle, labelStyle, sectionTitle,
  FormErrorBanner, FieldError, FormActions,
  bluePillBtnStyle, lockedFieldStyle, lockedSection,
  Grid2,
} from '@/components/operacional/shared/FormStyles';
import { colors } from '@/lib/theme/colors';
import { TIPOS_IDENTIFICACION } from '@/lib/constants';
import { MunicipioAutocomplete } from '@/components/operacional/shared/MunicipioAutocomplete';

/* Leaflet necesita window/document — desactivamos SSR */
const SedeMap = dynamic(
  () => import('./SedeMap').then(m => m.SedeMap),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: 220, background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#0369A1' }}>
        Cargando mapa…
      </div>
    ),
  },
);

/* ─────────────────────────────────────────────────────────────────────────────
   Tipos
───────────────────────────────────────────────────────────────────────────── */

interface SucursalRow {
  id?:           string;
  codSede:       string;
  nombre:        string;
  municipio:     string;
  daneMunicipio: string;
  direccion:     string;
  telefono:      string;
  email:         string;
  /** Coordenada GPS — obtenida vía Nominatim */
  latitud?:      number;
  longitud?:     number;
  /** true mientras se está geocodificando esta sede */
  geocoding?:    boolean;
  /** advertencia cuando Nominatim usó fallback (sin municipio) */
  geocodingWarning?: string;
}

export type ClienteFormMode = 'crear' | 'editar' | 'ver';

export interface ClienteFormProps {
  mode:               ClienteFormMode;
  /** Datos iniciales — requerido en modos editar y ver */
  defaultValues?:     ClienteConSucursales;
  /** Ruta a la que redirigir tras guardar exitosamente */
  onSuccessRedirect?: string;
  /** Callback legacy (slide-over); si se pasa, tiene prioridad sobre onSuccessRedirect */
  onSuccess?:         () => void;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────── */

const TIPO_LABEL: Record<string, string> = {
  N: 'NIT',
  C: 'Cédula',
  P: 'Pasaporte',
  E: 'Cédula Extranjería',
};

function emptyRow(codSedeHint = ''): SucursalRow {
  return {
    codSede: codSedeHint, nombre: '', municipio: '',
    daneMunicipio: '', direccion: '', telefono: '', email: '',
    latitud: undefined, longitud: undefined,
  };
}

function sedesFromValues(dv: ClienteConSucursales): SucursalRow[] {
  return dv.sucursales.map(s => ({
    id:            s.id,
    codSede:       s.codSede,
    nombre:        s.nombre,
    municipio:     s.municipio      ?? '',
    daneMunicipio: s.daneMunicipio  ?? '',
    direccion:     s.direccion      ?? '',
    telefono:      s.telefono       ?? '',
    email:         s.email          ?? '',
    // Prisma Decimal → number (el servidor ya serializa a string o number)
    latitud:       s.latitud  != null ? Number(s.latitud)  : undefined,
    longitud:      s.longitud != null ? Number(s.longitud) : undefined,
  }));
}

/* ─────────────────────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────────────────────── */

export function ClienteForm({ mode, defaultValues, onSuccessRedirect, onSuccess }: ClienteFormProps) {
  const router    = useRouter();
  const isVer     = mode === 'ver';
  const isEditar  = mode === 'editar';

  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  /** Errores de validación por sede: { [idx]: { municipio?, gps? } } */
  const [sedeErrors, setSedeErrors] = useState<Record<number, { municipio?: string; gps?: string }>>({});

  // ── Estado del formulario
  const [tipoId,          setTipoId]          = useState(defaultValues?.tipoId          ?? 'N');
  const [numeroId,         setNumeroId]         = useState(defaultValues?.numeroId         ?? '');
  const [razonSocial,      setRazonSocial]      = useState(defaultValues?.razonSocial      ?? '');
  // Campos persona natural
  const [nombres,          setNombres]          = useState(defaultValues?.nombres          ?? '');
  const [primerApellido,   setPrimerApellido]   = useState(defaultValues?.primerApellido   ?? '');
  const [segundoApellido,  setSegundoApellido]  = useState(defaultValues?.segundoApellido  ?? '');
  const [email,            setEmail]            = useState(defaultValues?.email            ?? '');
  const [telefono,         setTelefono]         = useState(defaultValues?.telefono         ?? '');
  const [notas,            setNotas]            = useState(defaultValues?.notas            ?? '');

  /** true para Cédula, Pasaporte, Cédula Extranjería */
  const isPersonaNatural = tipoId !== 'N';

  const [sedes, setSedes] = useState<SucursalRow[]>(() =>
    defaultValues?.sucursales?.length ? sedesFromValues(defaultValues) : [emptyRow('1')]
  );

  // ── Helpers de sedes
  function updateSede(idx: number, field: keyof SucursalRow, val: string) {
    setSedes(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));
  }

  /** Actualiza varios campos de una sede en una sola mutación (evita batching issues) */
  function updateSedeFields(idx: number, patch: Partial<SucursalRow>) {
    setSedes(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));
  }

  /** Geocodifica la dirección de una sede usando Nominatim vía API propia */
  async function geocodificarSede(idx: number) {
    const s = sedes[idx];
    const direccion = s.direccion.trim();
    if (!direccion) return;

    updateSedeFields(idx, { geocoding: true, latitud: undefined, longitud: undefined });
    try {
      const res = await fetch('/api/geocodificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direccion, municipio: s.municipio || undefined }),
      });
      const json = await res.json();
      if (res.ok) {
        updateSedeFields(idx, {
          latitud: json.lat,
          longitud: json.lon,
          geocoding: false,
          geocodingWarning: json.usedFallback
            ? 'Resultado aproximado — municipio no reconocido por OSM, se buscó solo por dirección'
            : undefined,
        });
        // Limpiar error GPS si existía
        setSedeErrors(prev => {
          const next = { ...prev };
          if (next[idx]) { delete next[idx].gps; if (!next[idx].municipio) delete next[idx]; }
          return next;
        });
      } else {
        updateSedeFields(idx, { geocoding: false });
        alert(json.error ?? 'No se encontraron coordenadas para esa dirección');
      }
    } catch {
      updateSedeFields(idx, { geocoding: false });
    }
  }

  function addSede() {
    setSedes(prev => [...prev, emptyRow(String(prev.length + 1))]);
  }

  function removeSede(idx: number) {
    if (sedes.length <= 1) return;
    setSedes(prev => prev.filter((_, i) => i !== idx));
  }

  // ── Navegación de salida
  function handleCancel() {
    if (onSuccessRedirect) router.push(onSuccessRedirect);
    else router.back();
  }

  // ── Submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSedeErrors({});
    setSaving(true);

    // ── Validación RNDC: municipio + GPS obligatorio en todas las sedes ──────
    const newSedeErrors: Record<number, { municipio?: string; gps?: string }> = {};
    sedes.forEach((s, idx) => {
      const err: { municipio?: string; gps?: string } = {};
      if (!s.daneMunicipio) {
        err.municipio = 'El municipio es obligatorio para el RNDC';
      }
      if (s.latitud == null || s.longitud == null) {
        err.gps = 'Las coordenadas GPS son obligatorias para el RNDC — usa el botón 📍 GPS';
      }
      if (err.municipio || err.gps) newSedeErrors[idx] = err;
    });
    if (Object.keys(newSedeErrors).length > 0) {
      setSedeErrors(newSedeErrors);
      setSaving(false);
      return;
    }

    try {
      let res: Response;

      // Para persona natural la razón social se compone de los campos de nombre
      const razonSocialFinal = isPersonaNatural
        ? [nombres.trim(), primerApellido.trim(), segundoApellido.trim()].filter(Boolean).join(' ')
        : razonSocial;

      if (mode === 'crear') {
        const payload = {
          tipoId, numeroId,
          razonSocial: razonSocialFinal,
          ...(isPersonaNatural && {
            ...(nombres.trim()         && { nombres:         nombres.trim() }),
            ...(primerApellido.trim()  && { primerApellido:  primerApellido.trim() }),
            ...(segundoApellido.trim() && { segundoApellido: segundoApellido.trim() }),
          }),
          ...(email    && { email }),
          ...(telefono && { telefono }),
          ...(notas    && { notas }),
          sucursales: sedes.map(s => ({
            codSede:       s.codSede       || '1',
            nombre:        s.nombre        || 'Casa Matriz',
            ...(s.municipio     && { municipio:     s.municipio }),
            ...(s.daneMunicipio && { daneMunicipio: s.daneMunicipio }),
            ...(s.direccion     && { direccion:     s.direccion }),
            ...(s.telefono      && { telefono:      s.telefono }),
            ...(s.email         && { email:         s.email }),
            ...(s.latitud  != null && { latitud:  s.latitud }),
            ...(s.longitud != null && { longitud: s.longitud }),
          })),
        };
        res = await fetch('/api/clientes', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // editar: PATCH datos base + upsert sucursales en paralelo
        res = await fetch(`/api/clientes/${defaultValues!.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipoId, numeroId,
            razonSocial: razonSocialFinal,
            ...(isPersonaNatural && {
              nombres:         nombres.trim()         || undefined,
              primerApellido:  primerApellido.trim()  || undefined,
              segundoApellido: segundoApellido.trim() || undefined,
            }),
            email, telefono, notas,
          }),
        });
        if (res.ok) {
          await Promise.all(sedes.map(s =>
            fetch(`/api/clientes/${defaultValues!.id}/sucursales`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                codSede:       s.codSede || '1',
                nombre:        s.nombre  || 'Casa Matriz',
                municipio:     s.municipio     || undefined,
                daneMunicipio: s.daneMunicipio || undefined,
                direccion:     s.direccion     || undefined,
                telefono:      s.telefono      || undefined,
                email:         s.email         || undefined,
                latitud:       s.latitud  ?? undefined,
                longitud:      s.longitud ?? undefined,
              }),
            })
          ));
        }
      }

      const json = await res.json();

      if (!res.ok) {
        if (json.fields) setFieldErrors(json.fields);
        if (json.code === 'DUPLICATE') {
          setFieldErrors(prev => ({
            ...prev,
            numeroId: `Ya existe un cliente con ese ${tipoId === 'N' ? 'NIT' : 'documento'}`,
          }));
        } else {
          setError(json.error ?? 'Error al guardar');
        }
        return;
      }

      // Éxito: delegar al callback o navegar a la ruta de éxito
      if (onSuccess) {
        onSuccess();
      } else {
        const target = mode === 'crear'
          ? `/operacional/clientes/${json.id}`
          : (onSuccessRedirect ?? `/operacional/clientes/${defaultValues!.id}`);
        router.push(target);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // ── Estilos condicionales según modo
  const inputProps = (extra?: React.CSSProperties) => ({
    style: isVer ? { ...lockedFieldStyle, ...extra } : { ...fieldStyle, ...extra },
    readOnly: isVer,
    disabled: isVer,
  });

  const selectProps = {
    style: isVer ? lockedFieldStyle : fieldStyle,
    disabled: isVer,
  };

  /* ─── Render ─── */
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── 1. Identificación ── */}
      <div>
        <p style={sectionTitle}>Identificación</p>
        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Tipo *</label>
            <select
              value={tipoId}
              onChange={e => setTipoId(e.target.value)}
              required
              {...selectProps}
            >
              {TIPOS_IDENTIFICACION.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>
              {TIPO_LABEL[tipoId] ?? tipoId} *
            </label>
            <input
              value={numeroId}
              onChange={e => setNumeroId(e.target.value)}
              required minLength={3} maxLength={20}
              placeholder={tipoId === 'N' ? '900123456' : '1023456789'}
              {...inputProps(fieldErrors.numeroId
                ? { borderColor: colors.error, boxShadow: '0 0 0 3px rgba(239,68,68,0.10)' }
                : undefined)}
            />
            <FieldError error={fieldErrors.numeroId} />
          </div>
        </div>
      </div>

      {/* ── 2. Datos generales ── */}
      <div>
        <p style={sectionTitle}>Datos generales</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            {tipoId === 'N' ? (
              /* Persona jurídica: razón social única */
              <div>
                <label style={labelStyle}>Razón Social *</label>
                <input
                  value={razonSocial}
                  onChange={e => setRazonSocial(e.target.value)}
                  required minLength={2} maxLength={200}
                  placeholder="Empresa S.A.S."
                  {...inputProps()}
                />
              </div>
            ) : (
              /* Persona natural: nombres + apellidos */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Grid2>
                  <div>
                    <label style={labelStyle}>Nombre(s) *</label>
                    <input
                      value={nombres}
                      onChange={e => setNombres(e.target.value)}
                      required minLength={2} maxLength={200}
                      placeholder="Juan Carlos"
                      {...inputProps()}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Primer Apellido *</label>
                    <input
                      value={primerApellido}
                      onChange={e => setPrimerApellido(e.target.value)}
                      required minLength={2} maxLength={100}
                      placeholder="Rodríguez"
                      {...inputProps()}
                    />
                  </div>
                </Grid2>
                <div>
                  <label style={labelStyle}>Segundo Apellido</label>
                  <input
                    value={segundoApellido}
                    onChange={e => setSegundoApellido(e.target.value)}
                    maxLength={100}
                    placeholder="Pérez"
                    {...inputProps()}
                  />
                </div>
              </div>
            )}
          </div>
          <Grid2>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="contacto@empresa.com"
                {...inputProps()}
              />
            </div>
            <div>
              <label style={labelStyle}>Teléfono</label>
              <input
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                placeholder="+57 300 123 4567"
                {...inputProps()}
              />
            </div>
          </Grid2>
          <div>
            <label style={labelStyle}>Notas internas</label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={2}
              placeholder="Cliente frecuente, entregas sábados…"
              {...inputProps({ resize: 'vertical' } as React.CSSProperties)}
            />
          </div>
        </div>
      </div>

      {/* ── 3. Sedes / Sucursales ── */}
      <div>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: 12,
        }}>
          <p style={{ ...sectionTitle, marginBottom: 0 }}>
            Sedes / Sucursales (RNDC)
          </p>
          {!isVer && (
            <button type="button" onClick={addSede} style={bluePillBtnStyle}>
              + Sede
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sedes.map((s, idx) => (
            <div
              key={idx}
              style={{
                background: colors.bgLight, borderRadius: 10,
                border: `1px solid ${colors.borderLight}`, padding: 16,
                ...lockedSection(isVer),
              }}
            >
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 12,
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: colors.textDefault }}>
                  Sede #{idx + 1}
                  {s.nombre ? ` — ${s.nombre}` : ''}
                </span>
                {!isVer && sedes.length > 1 && (
                  <button
                    type="button" onClick={() => removeSede(idx)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.error, fontSize: 12 }}
                  >
                    ✕ Eliminar
                  </button>
                )}
              </div>

              {/* Cod. Sede + Nombre */}
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={labelStyle}>Cod. Sede *</label>
                  <input
                    value={s.codSede}
                    onChange={e => updateSede(idx, 'codSede', e.target.value)}
                    maxLength={5} required placeholder="1"
                    {...inputProps()}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Nombre *</label>
                  <input
                    value={s.nombre}
                    onChange={e => updateSede(idx, 'nombre', e.target.value)}
                    required placeholder="Casa Matriz"
                    {...inputProps()}
                  />
                </div>
              </div>

              {/* Municipio * */}
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Municipio *</label>
                <div style={sedeErrors[idx]?.municipio ? {
                  borderRadius: 8, boxShadow: '0 0 0 2px rgba(239,68,68,0.25)',
                } : undefined}>
                  <MunicipioAutocomplete
                    value={s.daneMunicipio}
                    daneFormat="dane5"
                    placeholder="Buscar municipio…"
                    disabled={isVer}
                    onSelect={(dane) => {
                      updateSede(idx, 'daneMunicipio', dane);
                      if (sedeErrors[idx]?.municipio) {
                        setSedeErrors(prev => {
                          const next = { ...prev };
                          if (next[idx]) { delete next[idx].municipio; if (!next[idx].gps) delete next[idx]; }
                          return next;
                        });
                      }
                    }}
                    onSelectItem={(item) => {
                      updateSedeFields(idx, {
                        municipio:     item?.nombre  ?? '',
                        daneMunicipio: item?.codigo5 ?? '',
                      });
                      if (sedeErrors[idx]?.municipio) {
                        setSedeErrors(prev => {
                          const next = { ...prev };
                          if (next[idx]) { delete next[idx].municipio; if (!next[idx].gps) delete next[idx]; }
                          return next;
                        });
                      }
                    }}
                  />
                </div>
                <FieldError error={sedeErrors[idx]?.municipio} />
              </div>

              {/* Dirección + Botón geocodificar */}
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Dirección *</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    value={s.direccion}
                    onChange={e => updateSede(idx, 'direccion', e.target.value)}
                    placeholder="Cra 7 # 26-20, Piso 3"
                    style={{ flex: 1, ...(isVer ? lockedFieldStyle : fieldStyle) }}
                    readOnly={isVer}
                    disabled={isVer}
                  />
                  {!isVer && (
                    <button
                      type="button"
                      disabled={!s.direccion.trim() || !!s.geocoding}
                      onClick={() => geocodificarSede(idx)}
                      title="Obtener coordenadas GPS de esta dirección"
                      style={{
                        flexShrink: 0, height: 38, padding: '0 14px',
                        fontSize: 13, fontWeight: 600, borderRadius: 8,
                        border: sedeErrors[idx]?.gps
                          ? '1.5px solid #EF4444'
                          : '1.5px solid #0EA5E9',
                        cursor: s.geocoding ? 'wait' : 'pointer',
                        background: s.latitud ? '#0EA5E9' : sedeErrors[idx]?.gps ? '#FFF1F2' : '#F0F9FF',
                        color: s.latitud ? '#FFFFFF' : sedeErrors[idx]?.gps ? '#DC2626' : '#0369A1',
                        whiteSpace: 'nowrap', transition: 'all 0.15s',
                        opacity: !s.direccion.trim() ? 0.4 : 1,
                      }}
                    >
                      {s.geocoding ? '⏳ Buscando…' : s.latitud ? '📍 GPS ✓' : '📍 GPS'}
                    </button>
                  )}
                </div>
                <FieldError error={sedeErrors[idx]?.gps} />
              </div>

              {/* Mapa OSM — se muestra cuando hay coordenadas */}
              {s.latitud != null && s.longitud != null && (
                <div style={{
                  marginBottom: 10, borderRadius: 10, overflow: 'hidden',
                  border: '1.5px solid #7DD3FC', boxShadow: '0 2px 8px rgba(14,165,233,0.12)',
                }}>
                  {/* Barra de info de coordenadas */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '7px 12px',
                    background: 'linear-gradient(90deg, #0EA5E9 0%, #0284C7 100%)',
                    color: '#FFFFFF', fontSize: 12,
                  }}>
                    <span style={{ fontWeight: 600 }}>
                      📍 {s.latitud.toFixed(6)}, {s.longitud.toFixed(6)}
                    </span>
                    {!isVer && (
                      <button
                        type="button"
                        onClick={() => updateSedeFields(idx, { latitud: undefined, longitud: undefined, geocodingWarning: undefined })}
                        style={{
                          background: 'rgba(255,255,255,0.2)', border: 'none',
                          borderRadius: 5, color: '#fff', fontSize: 11,
                          cursor: 'pointer', padding: '2px 8px',
                        }}
                      >
                        ✕ Limpiar
                      </button>
                    )}
                  </div>
                  {/* Aviso de precisión reducida */}
                  {s.geocodingWarning && (
                    <div style={{
                      padding: '4px 12px',
                      background: '#FFF7ED',
                      color: '#92400E',
                      fontSize: 11,
                      borderTop: '1px solid #FED7AA',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      <span>⚠️</span>
                      <span>Resultado aproximado: el municipio no fue reconocido por OSM, se buscó solo por la dirección.</span>
                    </div>
                  )}
                  {/* Mapa Leaflet + tiles OSM (sin iframe, sin API key) */}
                  <SedeMap
                    lat={s.latitud!}
                    lon={s.longitud!}
                    nombre={s.nombre}
                    direccion={s.direccion}
                  />
                </div>
              )}

              {/* Tel + Email sede */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Teléfono sede</label>
                  <input
                    value={s.telefono}
                    onChange={e => updateSede(idx, 'telefono', e.target.value)}
                    placeholder="+57 1 234 5678"
                    {...inputProps()}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email sede</label>
                  <input
                    type="email" value={s.email}
                    onChange={e => updateSede(idx, 'email', e.target.value)}
                    placeholder="sede@empresa.com"
                    {...inputProps()}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Errores + Acciones ── */}
      <FormErrorBanner message={error} />

      {isVer ? (
        /* Modo lectura: solo botón Editar */
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8 }}>
          <button
            type="button" onClick={handleCancel}
            style={{
              padding: '10px 20px', fontSize: 14, fontWeight: 500,
              border: '1.5px solid #E2E8F0', borderRadius: 9,
              background: '#F8FAFC', color: '#374151', cursor: 'pointer',
            }}
          >
            ← Volver
          </button>
          {defaultValues && (
            <Link
              href={`/operacional/clientes/${defaultValues.id}/editar`}
              style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '10px 26px', fontSize: 14, fontWeight: 600,
                borderRadius: 9, border: 'none', textDecoration: 'none',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#FFFFFF', boxShadow: '0 2px 6px rgba(5,150,105,0.25)',
              }}
            >
              ✏️ Editar cliente
            </Link>
          )}
        </div>
      ) : (
        /* Modo crear/editar */
        <FormActions
          saving={saving}
          onCancel={handleCancel}
          submitLabel={isEditar ? 'Guardar cambios →' : 'Crear cliente →'}
        />
      )}
    </form>
  );
}
