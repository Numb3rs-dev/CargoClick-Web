'use client';

import { useState, useEffect } from 'react';
import type { ClienteConSucursales } from './ClienteList';
import { fieldStyle, labelStyle, sectionTitle, FormErrorBanner, errBorder, FieldError, FormActions, bluePillBtnStyle } from '@/components/operacional/shared/FormStyles';
import { colors } from '@/lib/theme/colors';
import { TIPOS_IDENTIFICACION } from '@/lib/constants';

interface SucursalRow {
  id?:           string;   // set if editing existing
  codSede:       string;
  nombre:        string;
  municipio:     string;
  daneMunicipio: string;
  direccion:     string;
  telefono:      string;
  email:         string;
}

export interface ClienteFormProps {
  mode:          'crear' | 'editar';
  defaultValues?: ClienteConSucursales;
  onSuccess?:    () => void;
}

function emptyRow(codSedeHint = ''): SucursalRow {
  return { codSede: codSedeHint, nombre: '', municipio: '', daneMunicipio: '', direccion: '', telefono: '', email: '' };
}

export function ClienteForm({ mode, defaultValues, onSuccess }: ClienteFormProps) {
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // ── Campos principales
  const [tipoId,      setTipoId]      = useState(defaultValues?.tipoId      ?? 'N');
  const [numeroId,    setNumeroId]    = useState(defaultValues?.numeroId    ?? '');
  const [razonSocial, setRazonSocial] = useState(defaultValues?.razonSocial ?? '');
  const [email,       setEmail]       = useState(defaultValues?.email       ?? '');
  const [telefono,    setTelefono]    = useState(defaultValues?.telefono    ?? '');
  const [notas,       setNotas]       = useState(defaultValues?.notas       ?? '');

  // ── Sucursales
  const [sedes, setSedes] = useState<SucursalRow[]>(() => {
    if (defaultValues?.sucursales?.length) {
      return defaultValues.sucursales.map(s => ({
        id:            s.id,
        codSede:       s.codSede,
        nombre:        s.nombre,
        municipio:     s.municipio      ?? '',
        daneMunicipio: s.daneMunicipio  ?? '',
        direccion:     s.direccion      ?? '',
        telefono:      s.telefono       ?? '',
        email:         s.email          ?? '',
      }));
    }
    return [emptyRow('1')];
  });

  // Reset when switching from editar to crear
  useEffect(() => {
    if (mode === 'crear') {
      setTipoId('N'); setNumeroId(''); setRazonSocial('');
      setEmail(''); setTelefono(''); setNotas('');
      setSedes([emptyRow('1')]);
      setError(null); setFieldErrors({});
    }
  }, [mode]);

  function updateSede(idx: number, field: keyof SucursalRow, val: string) {
    setSedes(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  }

  function addSede() {
    const nextCode = String(sedes.length + 1);
    setSedes(prev => [...prev, emptyRow(nextCode)]);
  }

  function removeSede(idx: number) {
    if (sedes.length <= 1) return;
    setSedes(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSaving(true);

    try {
      const payload = {
        tipoId, numeroId, razonSocial,
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
        })),
      };

      let res: Response;
      if (mode === 'crear') {
        res = await fetch('/api/clientes', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Para editar: PATCH al cliente + upsert de cada sede
        res = await fetch(`/api/clientes/${defaultValues!.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tipoId, numeroId, razonSocial, email, telefono, notas }),
        });
        if (res.ok) {
          // Upsert sucursales en paralelo
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
              }),
            })
          ));
        }
      }

      const json = await res.json();

      if (!res.ok) {
        if (json.fields)  setFieldErrors(json.fields);
        if (json.code === 'DUPLICATE') {
          setFieldErrors(prev => ({ ...prev, numeroId: [`Ya existe un cliente con ese ${tipoId === 'N' ? 'NIT' : 'documento'}`] }));
        } else {
          setError(json.error ?? 'Error al guardar');
        }
        return;
      }

      onSuccess?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Identificación */}
      <div>
        <p style={sectionTitle}>Identificación</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Tipo *</label>
            <select
              value={tipoId}
              onChange={e => setTipoId(e.target.value)}
              style={fieldStyle}
              required
            >
              {TIPOS_IDENTIFICACION.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>{tipoId === 'N' ? 'NIT' : tipoId === 'C' ? 'Cédula' : 'Pasaporte'} *</label>
            <input
              value={numeroId}
              onChange={e => setNumeroId(e.target.value)}
              style={{ ...fieldStyle, borderColor: fieldErrors.numeroId ? colors.error : colors.border }}
              required minLength={3} maxLength={20}
              placeholder={tipoId === 'N' ? '900123456' : '1023456789'}
            />
            {fieldErrors.numeroId && (
              <FieldError error={fieldErrors.numeroId[0]} />
            )}
          </div>
        </div>
      </div>

      {/* Datos generales */}
      <div>
        <p style={sectionTitle}>Datos generales</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={labelStyle}>Razón Social *</label>
            <input
              value={razonSocial}
              onChange={e => setRazonSocial(e.target.value)}
              style={fieldStyle}
              required minLength={2} maxLength={200}
              placeholder="Empresa S.A.S."
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                style={fieldStyle}
                placeholder="contacto@empresa.com"
              />
            </div>
            <div>
              <label style={labelStyle}>Teléfono</label>
              <input
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                style={fieldStyle}
                placeholder="+57 300 123 4567"
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Notas internas</label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={2}
              style={{ ...fieldStyle, resize: 'vertical' }}
              placeholder="Cliente frecuente, entregas sábados…"
            />
          </div>
        </div>
      </div>

      {/* Sedes */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ ...sectionTitle, marginBottom: 0 }}>Sedes / Sucursales (RNDC)</p>
          <button
            type="button"
            onClick={addSede}
            style={bluePillBtnStyle}
          >
            + Sede
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sedes.map((s, idx) => (
            <div key={idx} style={{
              background: colors.bgLight, borderRadius: 10,
              border: `1px solid ${colors.borderLight}`, padding: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: colors.textDefault }}>
                  Sede #{idx + 1}
                </span>
                {sedes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSede(idx)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: colors.error, fontSize: 12,
                    }}
                  >
                    ✕ Eliminar
                  </button>
                )}
              </div>

              {/* Fila 1: codSede + nombre */}
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={labelStyle}>Cod. Sede *</label>
                  <input
                    value={s.codSede}
                    onChange={e => updateSede(idx, 'codSede', e.target.value)}
                    style={fieldStyle}
                    maxLength={5} required
                    placeholder="1"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Nombre *</label>
                  <input
                    value={s.nombre}
                    onChange={e => updateSede(idx, 'nombre', e.target.value)}
                    style={fieldStyle}
                    required placeholder="Casa Matriz"
                  />
                </div>
              </div>

              {/* Fila 2: municipio + DANE */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={labelStyle}>Municipio</label>
                  <input
                    value={s.municipio}
                    onChange={e => updateSede(idx, 'municipio', e.target.value)}
                    style={fieldStyle}
                    placeholder="Bogotá, D.C."
                  />
                </div>
                <div>
                  <label style={labelStyle}>Cód. DANE</label>
                  <input
                    value={s.daneMunicipio}
                    onChange={e => updateSede(idx, 'daneMunicipio', e.target.value)}
                    style={fieldStyle}
                    maxLength={5} placeholder="11001"
                  />
                </div>
              </div>

              {/* Fila 3: dirección */}
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Dirección</label>
                <input
                  value={s.direccion}
                  onChange={e => updateSede(idx, 'direccion', e.target.value)}
                  style={fieldStyle}
                  placeholder="Cra 7 # 26-20, Piso 3"
                />
              </div>

              {/* Fila 4: tel + email de sede */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Teléfono sede</label>
                  <input
                    value={s.telefono}
                    onChange={e => updateSede(idx, 'telefono', e.target.value)}
                    style={fieldStyle}
                    placeholder="+57 1 234 5678"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email sede</label>
                  <input
                    type="email"
                    value={s.email}
                    onChange={e => updateSede(idx, 'email', e.target.value)}
                    style={fieldStyle}
                    placeholder="sede@empresa.com"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <FormErrorBanner message={error} />

      {/* Acciones */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 8 }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            background: saving ? colors.disabledBtn : colors.primary,
            color: colors.bgWhite, border: 'none', borderRadius: 8,
            padding: '10px 24px', fontSize: 14, fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {saving ? 'Guardando…' : mode === 'crear' ? 'Crear cliente →' : 'Guardar cambios →'}
        </button>
      </div>
    </form>
  );
}
