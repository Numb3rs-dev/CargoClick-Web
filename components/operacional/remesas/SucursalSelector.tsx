'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { TIPOS_IDENTIFICACION } from '@/lib/constants';
import { fieldStyle, labelStyle, errorStyle, InfoBadge } from '@/components/operacional/shared/FormStyles';
import { colors } from '@/lib/theme/colors';

/* ─── Tipos públicos ─────────────────────────────────────────────────────── */

export interface SucursalValue {
  clienteId:   string;
  sucursalId:  string;
  tipoId:      string;
  nit:         string;
  codSede:     string;
  empresa:     string;
}

/* ─── Tipos internos ─────────────────────────────────────────────────────── */

interface SucursalOption {
  clienteId:   string;
  sucursalId:  string;
  tipoId:      string;
  nit:         string;
  codSede:     string;
  razonSocial: string;
  sede:        string;
}

/** Un cliente agrupado con sus sedes, para mostrar en el dropdown */
interface ClienteGroup {
  clienteId:   string;
  tipoId:      string;
  nit:         string;
  razonSocial: string;
  sucursales:  SucursalOption[];
}

type ViewMode = 'search' | 'create-new' | 'add-sede';

/* ─── Estilos ────────────────────────────────────────────────────────────── */

const fieldS = fieldStyle;
const labelS: React.CSSProperties = { ...labelStyle, fontSize: 12, marginBottom: 3 };
const smallBtnS: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, border: 'none', borderRadius: 6,
  padding: '6px 14px', cursor: 'pointer',
};

/* ─── Props ──────────────────────────────────────────────────────────────── */

interface Props {
  label:       string;
  value:       SucursalValue | null;
  onChange:    (v: SucursalValue | null) => void;
  error?:      string;
  required?:   boolean;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SucursalSelector                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function SucursalSelector({ label, value, onChange, error, required }: Props) {
  const [query, setQuery]       = useState('');
  const [options, setOptions]   = useState<SucursalOption[]>([]);
  const [groups, setGroups]     = useState<ClienteGroup[]>([]);
  const [loading, setLoading]   = useState(false);
  const [open, setOpen]         = useState(false);
  const [view, setView]         = useState<ViewMode>('search');
  const debouncedQ              = useDebounce(query, 280);
  const wrapRef                 = useRef<HTMLDivElement>(null);

  // ── Estado para crear nuevo cliente ──
  const [newTipoId, setNewTipoId]           = useState('N');
  const [newNumeroId, setNewNumeroId]       = useState('');
  const [newRazonSocial, setNewRazonSocial] = useState('');
  const [newSedeCod, setNewSedeCod]         = useState('1');
  const [newSedeNombre, setNewSedeNombre]   = useState('Casa Matriz');
  const [createError, setCreateError]       = useState('');
  const [creating, setCreating]             = useState(false);

  // ── Estado para agregar sede a cliente existente ──
  const [addSedeCliente, setAddSedeCliente] = useState<ClienteGroup | null>(null);
  const [addSedeCod, setAddSedeCod]         = useState('');
  const [addSedeNombre, setAddSedeNombre]   = useState('');
  const [addSedeError, setAddSedeError]     = useState('');
  const [addingSede, setAddingSede]         = useState(false);

  // Cerrar dropdown al clic fuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        if (view !== 'search') setView('search');
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [view]);

  // Buscar clientes
  const fetchOptions = useCallback(async (q: string) => {
    if (q.length < 2) { setOptions([]); setGroups([]); return; }
    setLoading(true);
    try {
      const res  = await fetch(`/api/clientes?mode=search&q=${encodeURIComponent(q)}`);
      const json = await res.json();
      const flat: SucursalOption[] = [];
      const grps: ClienteGroup[] = [];
      for (const c of (json.data ?? [])) {
        const sedes: SucursalOption[] = [];
        for (const s of (c.sucursales ?? [])) {
          if (!s.activo) continue;
          const opt: SucursalOption = {
            clienteId: c.id, sucursalId: s.id,
            tipoId: c.tipoId, nit: c.numeroId,
            codSede: s.codSede, razonSocial: c.razonSocial, sede: s.nombre,
          };
          flat.push(opt);
          sedes.push(opt);
        }
        grps.push({
          clienteId: c.id, tipoId: c.tipoId, nit: c.numeroId,
          razonSocial: c.razonSocial, sucursales: sedes,
        });
      }
      setOptions(flat);
      setGroups(grps);
    } catch {
      setOptions([]); setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === 'search') fetchOptions(debouncedQ);
  }, [debouncedQ, fetchOptions, view]);

  function select(opt: SucursalOption) {
    onChange({
      clienteId: opt.clienteId, sucursalId: opt.sucursalId,
      tipoId: opt.tipoId, nit: opt.nit,
      codSede: opt.codSede, empresa: opt.razonSocial,
    });
    setQuery('');
    setOpen(false);
    setView('search');
  }

  function clear() {
    onChange(null);
    setQuery('');
    setOptions([]); setGroups([]);
    setView('search');
  }

  // ── Crear nuevo cliente ──
  function startCreate() {
    // Pre-llenar con lo que el usuario buscó
    const q = query.trim();
    const isNumeric = /^\d+$/.test(q);
    setNewTipoId('N');
    setNewNumeroId(isNumeric ? q : '');
    setNewRazonSocial(isNumeric ? '' : q);
    setNewSedeCod('1');
    setNewSedeNombre('Casa Matriz');
    setCreateError('');
    setView('create-new');
  }

  async function submitCreate() {
    if (!newNumeroId.trim() || newNumeroId.trim().length < 3) {
      setCreateError('El número de identificación debe tener al menos 3 caracteres'); return;
    }
    if (!newRazonSocial.trim() || newRazonSocial.trim().length < 2) {
      setCreateError('La razón social / nombre debe tener al menos 2 caracteres'); return;
    }
    setCreating(true); setCreateError('');
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoId: newTipoId,
          numeroId: newNumeroId.trim(),
          razonSocial: newRazonSocial.trim(),
          sucursales: [{
            codSede: newSedeCod.trim() || '1',
            nombre: newSedeNombre.trim() || 'Casa Matriz',
          }],
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setCreateError(json.error ?? 'Error al crear cliente'); return;
      }
      // Auto-seleccionar la primera sucursal del cliente recién creado
      const cliente = json.data;
      const suc = cliente.sucursales?.[0];
      if (suc) {
        select({
          clienteId: cliente.id, sucursalId: suc.id,
          tipoId: cliente.tipoId, nit: cliente.numeroId,
          codSede: suc.codSede, razonSocial: cliente.razonSocial, sede: suc.nombre,
        });
      }
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  // ── Agregar sede a cliente existente ──
  function startAddSede(grp: ClienteGroup) {
    // Sugerir siguiente codSede
    const existingCodes = grp.sucursales.map(s => parseInt(s.codSede)).filter(n => !isNaN(n));
    const next = existingCodes.length ? Math.max(...existingCodes) + 1 : 2;
    setAddSedeCliente(grp);
    setAddSedeCod(String(next));
    setAddSedeNombre('');
    setAddSedeError('');
    setView('add-sede');
  }

  async function submitAddSede() {
    if (!addSedeCliente) return;
    if (!addSedeCod.trim()) { setAddSedeError('Código de sede requerido'); return; }
    if (!addSedeNombre.trim()) { setAddSedeError('Nombre de sede requerido'); return; }
    // Verificar que no exista ese código ya
    const exists = addSedeCliente.sucursales.some(s => s.codSede === addSedeCod.trim());
    if (exists) { setAddSedeError(`Ya existe la sede "${addSedeCod.trim()}" para este cliente`); return; }
    setAddingSede(true); setAddSedeError('');
    try {
      const res = await fetch(`/api/clientes/${addSedeCliente.clienteId}/sucursales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codSede: addSedeCod.trim(),
          nombre: addSedeNombre.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAddSedeError(json.error ?? 'Error al crear sede'); return;
      }
      const suc = json.data;
      select({
        clienteId: addSedeCliente.clienteId, sucursalId: suc.id,
        tipoId: addSedeCliente.tipoId, nit: addSedeCliente.nit,
        codSede: suc.codSede, razonSocial: addSedeCliente.razonSocial, sede: suc.nombre,
      });
    } catch (err) {
      setAddSedeError((err as Error).message);
    } finally {
      setAddingSede(false);
    }
  }

  const displayText = value
    ? `${value.empresa}${value.codSede !== '1' ? ` · Sede ${value.codSede}` : ''}`
    : '';

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <label style={{
        display: 'block', fontSize: 14, fontWeight: 500,
        color: colors.textDefault, marginBottom: 6,
      }}>
        {label}{required && <span style={{ color: colors.error }}> *</span>}
      </label>

      {/* ── Campo de búsqueda / valor seleccionado ── */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={value ? displayText : query}
          readOnly={!!value}
          onChange={e => {
            if (!value) {
              setQuery(e.target.value);
              setOpen(true);
              if (view !== 'search') setView('search');
            }
          }}
          onFocus={() => { if (!value) setOpen(true); }}
          placeholder="Buscar por NIT, cédula o nombre…"
          style={{
            width: '100%',
            border: `1px solid ${error ? colors.error : colors.border}`,
            borderRadius: 8,
            padding: '9px 38px 9px 12px',
            fontSize: 14,
            background: value ? colors.bgLight : colors.bgWhite,
            cursor: value ? 'default' : 'text',
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
        {value ? (
          <button
            type="button" onClick={clear} title="Limpiar selección"
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: colors.textPlaceholder, fontSize: 16, lineHeight: 1,
            }}
          >✕</button>
        ) : loading ? (
          <span style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            fontSize: 12, color: colors.textPlaceholder,
          }}>⟳</span>
        ) : null}
      </div>

      {/* ── Info badge cuando hay selección ── */}
      {value && (
        <div style={{
          marginTop: 6, fontSize: 12, color: colors.textMuted,
          display: 'flex', gap: 8, flexWrap: 'wrap',
        }}>
          <InfoBadge>
            {value.tipoId === 'N' ? 'NIT' : value.tipoId === 'C' ? 'CC' : value.tipoId} {value.nit}
          </InfoBadge>
          <span style={{ background: colors.borderLighter, color: colors.textDefault, borderRadius: 99, padding: '2px 8px' }}>
            Sede {value.codSede}
          </span>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <p style={errorStyle}>{error}</p>
      )}

      {/* ── Dropdown ── */}
      {open && !value && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: colors.bgWhite, border: `1px solid ${colors.borderLight}`, borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100,
          maxHeight: 360, overflowY: 'auto',
        }}>

          {/* ─── Vista: Búsqueda ─── */}
          {view === 'search' && (
            <>
              {query.length < 2 ? (
                <p style={{ padding: '12px 16px', fontSize: 13, color: colors.textPlaceholder }}>
                  Escribe al menos 2 caracteres para buscar
                </p>
              ) : loading ? (
                <p style={{ padding: '12px 16px', fontSize: 13, color: colors.textPlaceholder }}>
                  Buscando…
                </p>
              ) : groups.length === 0 ? (
                /* Sin resultados → ofrecer crear */
                <div style={{ padding: '12px 16px' }}>
                  <p style={{ fontSize: 13, color: colors.textMuted, marginBottom: 10 }}>
                    No se encontró ningún cliente con "<strong>{query}</strong>"
                  </p>
                  <button
                    type="button" onClick={startCreate}
                    style={{
                      ...smallBtnS,
                      background: colors.primary, color: colors.bgWhite,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Crear nuevo cliente
                  </button>
                </div>
              ) : (
                /* Resultados agrupados por cliente */
                <>
                  {groups.map(grp => (
                    <div key={grp.clienteId} style={{ borderBottom: `1px solid ${colors.borderLighter}` }}>
                      {/* Encabezado del cliente */}
                      <div style={{
                        padding: '8px 16px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: 14, color: colors.textPrimary }}>{grp.razonSocial}</span>
                          <span style={{ fontSize: 12, color: colors.textPlaceholder, marginLeft: 8 }}>
                            {grp.tipoId === 'N' ? 'NIT' : grp.tipoId === 'C' ? 'CC' : grp.tipoId} {grp.nit}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); startAddSede(grp); }}
                          title="Agregar nueva sede"
                          style={{
                            ...smallBtnS,
                            background: colors.hoverBlue, color: colors.blue,
                            padding: '3px 8px', fontSize: 11,
                          }}
                        >+ Sede</button>
                      </div>
                      {/* Sucursales del cliente */}
                      {grp.sucursales.map(opt => (
                        <button
                          key={opt.sucursalId}
                          type="button" onClick={() => select(opt)}
                          style={{
                            display: 'block', width: '100%', textAlign: 'left',
                            padding: '7px 16px 7px 28px', background: 'none', border: 'none',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = colors.bgLight; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                        >
                          <div style={{ fontSize: 13, color: colors.textDefault, display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{
                              background: colors.borderLighter, borderRadius: 4, padding: '1px 6px',
                              fontSize: 11, fontWeight: 600, color: colors.textMuted, fontFamily: 'monospace',
                            }}>
                              {opt.codSede}
                            </span>
                            <span>{opt.sede}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ))}

                  {/* Botón de crear al final si hay resultados pero no el que busca */}
                  <div style={{ padding: '8px 16px', borderTop: `1px solid ${colors.borderLight}` }}>
                    <button
                      type="button" onClick={startCreate}
                      style={{
                        ...smallBtnS, background: 'none', color: colors.primary,
                        padding: '4px 0', fontSize: 13,
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> Crear otro cliente nuevo
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* ─── Vista: Crear nuevo cliente ─── */}
          {view === 'create-new' && (
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
                  Nuevo cliente
                </p>
                <button type="button" onClick={() => setView('search')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: colors.textMuted }}>
                  ← Volver
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8 }}>
                  <div>
                    <label style={labelS}>Tipo ID *</label>
                    <select value={newTipoId} onChange={e => setNewTipoId(e.target.value)} style={fieldS}>
                      {TIPOS_IDENTIFICACION.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelS}>Número ID *</label>
                    <input value={newNumeroId} onChange={e => setNewNumeroId(e.target.value)}
                      placeholder="900123456" style={fieldS} />
                  </div>
                </div>

                <div>
                  <label style={labelS}>Razón social / Nombre *</label>
                  <input value={newRazonSocial} onChange={e => setNewRazonSocial(e.target.value)}
                    placeholder="Nombre del cliente" style={fieldS} />
                </div>

                <div style={{
                  background: colors.bgLight, borderRadius: 6, padding: '8px 10px',
                  border: `1px solid ${colors.borderLighter}`,
                }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: colors.textPlaceholder, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Sede inicial
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8 }}>
                    <div>
                      <label style={labelS}>Código</label>
                      <input value={newSedeCod} onChange={e => setNewSedeCod(e.target.value)}
                        placeholder="1" style={fieldS} />
                    </div>
                    <div>
                      <label style={labelS}>Nombre</label>
                      <input value={newSedeNombre} onChange={e => setNewSedeNombre(e.target.value)}
                        placeholder="Casa Matriz" style={fieldS} />
                    </div>
                  </div>
                </div>

                {createError && (
                  <p style={{ ...errorStyle, margin: 0 }}>{createError}</p>
                )}

                <button type="button" onClick={submitCreate} disabled={creating}
                  style={{
                    ...smallBtnS, width: '100%', padding: '8px 0',
                    background: creating ? colors.disabledBtn : colors.primary, color: colors.bgWhite,
                    cursor: creating ? 'not-allowed' : 'pointer',
                  }}
                >
                  {creating ? 'Creando…' : 'Crear y seleccionar'}
                </button>
              </div>
            </div>
          )}

          {/* ─── Vista: Agregar sede a cliente existente ─── */}
          {view === 'add-sede' && addSedeCliente && (
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
                  Nueva sede para {addSedeCliente.razonSocial}
                </p>
                <button type="button" onClick={() => setView('search')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: colors.textMuted }}>
                  ← Volver
                </button>
              </div>

              <div style={{
                fontSize: 12, color: colors.textMuted, marginBottom: 10,
                display: 'flex', gap: 6, flexWrap: 'wrap',
              }}>
                <span>Sedes existentes:</span>
                {addSedeCliente.sucursales.map(s => (
                  <span key={s.codSede} style={{
                    background: colors.borderLighter, borderRadius: 4, padding: '1px 6px',
                    fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
                  }}>
                    {s.codSede}
                  </span>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8 }}>
                  <div>
                    <label style={labelS}>Código *</label>
                    <input value={addSedeCod} onChange={e => setAddSedeCod(e.target.value)}
                      placeholder="2" style={fieldS} />
                  </div>
                  <div>
                    <label style={labelS}>Nombre *</label>
                    <input value={addSedeNombre} onChange={e => setAddSedeNombre(e.target.value)}
                      placeholder="Bodega Norte" style={fieldS} />
                  </div>
                </div>

                {addSedeError && (
                  <p style={{ ...errorStyle, margin: 0 }}>{addSedeError}</p>
                )}

                <button type="button" onClick={submitAddSede} disabled={addingSede}
                  style={{
                    ...smallBtnS, width: '100%', padding: '8px 0',
                    background: addingSede ? colors.disabledBtn : colors.blue, color: colors.bgWhite,
                    cursor: addingSede ? 'not-allowed' : 'pointer',
                  }}
                >
                  {addingSede ? 'Creando…' : 'Crear sede y seleccionar'}
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
