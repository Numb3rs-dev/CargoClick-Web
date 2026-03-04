'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SucursalSelector, type SucursalValue } from './SucursalSelector';
import { MunicipioAutocomplete, findMunicipio } from '@/components/operacional/shared/MunicipioAutocomplete';
import { RemesaEstadoBadge } from './RemesaEstadoBadge';
import { RemesaEnviarRndcBtn } from './RemesaEnviarRndcBtn';
import {
  fieldStyle, labelStyle, helpText,
  errBorder, FormErrorBanner, FormActions, FieldError,
  lockedFieldStyle, lockedSection,
  Grid2, Grid3, Grid4,
  subsectionTitle,
  CollapsibleCard, AlertBanner, HighlightSection,
  RadioPillGroup, InfoBadge,
  type RadioPillOption,
} from '@/components/operacional/shared/FormStyles';
import { colors } from '@/lib/theme/colors';
import { toDatetimeLocal, toDateOnly } from '@/lib/utils/dateHelpers';
import {
  COD_OPERACION, COD_NATURALEZA, TIPO_CONSOLIDADA,
  empaquesPorOperacion, findEmpaque, naturalezaToRndc,
  UNIDAD_MEDIDA_PRODUCTO, ESTADO_MERCANCIA, GRUPO_EMBALAJE,
} from '@/lib/constants';

type PropietarioMode = 'remitente' | 'destinatario' | 'otro';

/* ═══════════════════════════════════════════════════════════════════════════════
   MODE — ver | crear | editar
   ═══════════════════════════════════════════════════════════════════════════════ */
export type RemesaFormMode = 'ver' | 'crear' | 'editar';

/* ═══════════════════════════════════════════════════════════════════════════════
   FORM TYPE — todos los campos del procesoid 3
   ═══════════════════════════════════════════════════════════════════════════════ */
interface FormValues {
  descripcionCarga: string;
  pesoKg: string;
  codigoEmpaque: string;
  codNaturalezaCarga: string;
  codOperacionTransporte: string;
  codigoAranceladoCarga: string;
  tipoConsolidada: string;
  codigoUn: string;
  estadoMercancia: string;
  grupoEmbalajeEnvase: string;
  unidadMedidaProducto: string;
  cantidadProducto: string;
  pesoContenedorVacio: string;
  origenDane: string;
  /** REMDIRREMITENTE — dirección física del punto de cargue */
  remDirRemitente: string;
  destinoDane: string;
  fechaHoraCitaCargue: string;
  fechaHoraCitaDescargue: string;
  horasPactoCarga: string;
  minutosPactoCarga: string;
  horasPactoDescargue: string;
  minutosPactoDescargue: string;
  valorAsegurado: string;
  ordenServicioGenerador: string;
  numPolizaTransporte: string;
  fechaVencimientoPoliza: string;
  codSedePropietario: string;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   INITIAL DATA (edit + ver modes)
   ═══════════════════════════════════════════════════════════════════════════════ */
export interface RemesaInitialData {
  id: string;
  descripcionCarga: string;
  pesoKg: number;
  codigoEmpaque: number;
  codNaturalezaCarga: string;
  codOperacionTransporte: string;
  mercanciaRemesaCod?: number | null;
  tipoConsolidada?: string | null;
  codigoAranceladoCarga?: string | null;
  codigoUn?: string | null;
  estadoMercancia?: string | null;
  grupoEmbalajeEnvase?: string | null;
  unidadMedidaProducto?: string | null;
  cantidadProducto?: number | null;
  pesoContenedorVacio?: number | null;
  tipoIdRemitente: string;
  nitRemitente: string;
  codSedeRemitente: string;
  empresaRemitente?: string | null;
  tipoIdDestinatario: string;
  nitDestinatario: string;
  codSedeDestinatario: string;
  empresaDestinataria?: string | null;
  tipoIdPropietario: string;
  nitPropietario: string;
  codSedePropietario?: string | null;
  nombrePropietario?: string | null;
  origenDane: string;
  origenMunicipio?: string | null;
  /** REMDIRREMITENTE — dirección del punto de cargue */
  remDirRemitente?: string | null;
  destinoDane: string;
  destinoMunicipio?: string | null;
  fechaHoraCitaCargue?: string | Date | null;
  fechaHoraCitaDescargue?: string | Date | null;
  horasPactoCarga: number;
  minutosPactoCarga: number;
  horasPactoDescargue: number;
  minutosPactoDescargue: number;
  valorAsegurado?: number | null;
  ordenServicioGenerador?: string | null;
  numPolizaTransporte?: string | null;
  fechaVencimientoPoliza?: string | null;
  companiaSeguriNit?: string | null;
  companiaSeguriNombre?: string | null;
  duenopoliza?: string | null;
  estadoRndc: string;
  /* Campos extra para modo ver */
  numeroRemesa?: string | null;
  estado?: string | null;
  nuevoNegocioId?: string | null;
  numeroRemesaRndc?: string | null;
  fechaIngresoRndc?: string | Date | null;
  instruccionesEspeciales?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════════════════════════════════════ */
export interface RemesaFormProps {
  mode?: RemesaFormMode;
  negocioId?: string | null;
  onSuccessRedirect?: string;
  onSuccess?: () => void;
  initialData?: RemesaInitialData;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════════════ */
function derivePropietarioMode(init: RemesaInitialData): PropietarioMode {
  if (init.nitPropietario === init.nitRemitente) return 'remitente';
  if (init.nitPropietario === init.nitDestinatario) return 'destinatario';
  return 'otro';
}

function getMunicipioName(dane: string): string {
  const m = findMunicipio(dane);
  return m ? m.label : '';
}

function formatFecha(d: string | Date | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatFechaHora(d: string | Date | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-CO', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function tipoIdLabel(tipo: string): string {
  if (tipo === 'N') return 'NIT';
  if (tipo === 'C') return 'CC';
  if (tipo === 'E') return 'C.E.';
  return tipo;
}

const OPERACION_LABELS: Record<string, string> = {
  G: 'General', P: 'Paqueteo', CC: 'Contenedor cargado', CV: 'Contenedor vacío',
};
const NATURALEZA_LABELS: Record<string, string> = {
  G: 'General', '2': 'Peligrosa', R: 'Refrigerada', S: 'Sobredimensionada',
  E: 'Extradimensionada', EP: 'Extrapesada', '5': 'Alto valor',
};

/* ═══════════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */
export function RemesaForm({
  mode: modeProp,
  negocioId,
  onSuccessRedirect,
  onSuccess,
  initialData,
}: RemesaFormProps) {
  const router = useRouter();

  /* ── Derived mode ── */
  const mode: RemesaFormMode = modeProp ?? (initialData ? 'editar' : 'crear');
  const isReadOnly = mode === 'ver';
  const isEdit     = mode === 'editar';
  const isRndcLocked =
    (isEdit || isReadOnly) && initialData
      ? initialData.estadoRndc === 'REGISTRADA' || initialData.estadoRndc === 'ENVIADA'
      : false;

  /* ── Shorthand style helpers ── */
  const roField = isReadOnly ? lockedFieldStyle : fieldStyle;

  /* ── State ── */
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({
    1: true, 2: true, 3: true, 4: true, 5: true,
    6: mode !== 'crear', 7: true,
  });
  const toggleSection = (n: number) =>
    setOpenSections(prev => ({ ...prev, [n]: !prev[n] }));

  const [remitenteVal, setRemitenteVal] = useState<SucursalValue | null>(
    initialData
      ? {
          clienteId: '', sucursalId: '',
          tipoId: initialData.tipoIdRemitente,
          nit: initialData.nitRemitente,
          codSede: initialData.codSedeRemitente,
          empresa: initialData.empresaRemitente ?? '',
        }
      : null,
  );
  const [destinatarioVal, setDestinatarioVal] = useState<SucursalValue | null>(
    initialData
      ? {
          clienteId: '', sucursalId: '',
          tipoId: initialData.tipoIdDestinatario,
          nit: initialData.nitDestinatario,
          codSede: initialData.codSedeDestinatario,
          empresa: initialData.empresaDestinataria ?? '',
        }
      : null,
  );
  const [propietarioVal, setPropietarioVal] = useState<SucursalValue | null>(null);
  const [propietarioMode, setPropMode] = useState<PropietarioMode>(
    initialData ? derivePropietarioMode(initialData) : 'remitente',
  );

  const [form, setForm] = useState<FormValues>(() => {
    if (initialData) {
      return {
        descripcionCarga: initialData.descripcionCarga,
        pesoKg: String(initialData.pesoKg),
        codigoEmpaque: String(initialData.codigoEmpaque),
        codNaturalezaCarga: initialData.codNaturalezaCarga,
        codOperacionTransporte: initialData.codOperacionTransporte,
        codigoAranceladoCarga: initialData.codigoAranceladoCarga ?? '009880',
        tipoConsolidada: initialData.tipoConsolidada ?? 'N',
        codigoUn: initialData.codigoUn ?? '',
        estadoMercancia: initialData.estadoMercancia ?? '',
        grupoEmbalajeEnvase: initialData.grupoEmbalajeEnvase ?? '',
        unidadMedidaProducto: initialData.unidadMedidaProducto ?? 'KGM',
        cantidadProducto: initialData.cantidadProducto != null ? String(initialData.cantidadProducto) : '',
        pesoContenedorVacio: initialData.pesoContenedorVacio != null ? String(initialData.pesoContenedorVacio) : '',
        origenDane: initialData.origenDane,
        remDirRemitente: initialData.remDirRemitente ?? '',
        destinoDane: initialData.destinoDane,
        fechaHoraCitaCargue: toDatetimeLocal(initialData.fechaHoraCitaCargue),
        fechaHoraCitaDescargue: toDatetimeLocal(initialData.fechaHoraCitaDescargue),
        horasPactoCarga: String(initialData.horasPactoCarga),
        minutosPactoCarga: String(initialData.minutosPactoCarga),
        horasPactoDescargue: String(initialData.horasPactoDescargue),
        minutosPactoDescargue: String(initialData.minutosPactoDescargue),
        valorAsegurado: initialData.valorAsegurado != null ? String(initialData.valorAsegurado) : '',
        ordenServicioGenerador: initialData.ordenServicioGenerador ?? '',
        numPolizaTransporte: initialData.numPolizaTransporte ?? '',
        fechaVencimientoPoliza: toDateOnly(initialData.fechaVencimientoPoliza) ?? '',
        codSedePropietario: initialData.codSedePropietario ?? '1',
      };
    }
    return {
      descripcionCarga: '', pesoKg: '', codigoEmpaque: '0',
      codNaturalezaCarga: 'G', codOperacionTransporte: 'G',
      codigoAranceladoCarga: '009880', tipoConsolidada: 'N',
      codigoUn: '', estadoMercancia: '', grupoEmbalajeEnvase: '',
      unidadMedidaProducto: 'KGM', cantidadProducto: '', pesoContenedorVacio: '',
      origenDane: '', remDirRemitente: '', destinoDane: '',
      fechaHoraCitaCargue: '', fechaHoraCitaDescargue: '',
      horasPactoCarga: '4', minutosPactoCarga: '0',
      horasPactoDescargue: '4', minutosPactoDescargue: '0',
      valorAsegurado: '', ordenServicioGenerador: '',
      numPolizaTransporte: '', fechaVencimientoPoliza: '',
      codSedePropietario: '1',
    };
  });

  function upd(field: keyof FormValues, value: string) {
    if (isReadOnly) return;
    setForm(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  }

  /* ── Derived state for conditional sections ── */
  const esPeligrosa       = form.codNaturalezaCarga === '2' || form.codNaturalezaCarga === '5';
  const esContenedor      = form.codOperacionTransporte === 'CC' || form.codOperacionTransporte === 'CV';
  const esPaqueteo        = form.codOperacionTransporte === 'P';
  const esGranelLiquido   = form.codigoEmpaque === '6';
  const selectedEmpaque   = findEmpaque(form.codigoEmpaque);

  function handleOperacionChange(val: string) {
    upd('codOperacionTransporte', val);
    const emps = empaquesPorOperacion(val);
    if (emps.length && !emps.find(e => e.value === form.codigoEmpaque)) {
      upd('codigoEmpaque', emps[0].value);
    }
  }

  const propietarioSource: SucursalValue | null =
    propietarioMode === 'remitente'    ? remitenteVal :
    propietarioMode === 'destinatario' ? destinatarioVal :
    propietarioVal;

  function handlePropietarioModeChange(m: PropietarioMode) {
    if (isReadOnly) return;
    setPropMode(m);
    setPropietarioVal(null);
  }

  /* ── Submit ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isReadOnly) return;
    setError(null); setFieldErrors({});

    const errs: Record<string, string> = {};
    if (!form.descripcionCarga || form.descripcionCarga.length < 4) errs.descripcionCarga = 'Mínimo 4 caracteres (máx 60)';
    if (!form.pesoKg || parseInt(form.pesoKg) <= 0)                errs.pesoKg = 'Debe ser positivo';
    if (!remitenteVal)                                             errs.remitente = 'Selecciona un remitente';
    if (!destinatarioVal)                                          errs.destinatario = 'Selecciona un destinatario';
    if (!propietarioSource)                                        errs.propietario = 'Selecciona un propietario';
    if (!form.origenDane  || form.origenDane.length  < 5)          errs.origenDane = 'Municipio de origen requerido';
    if (!form.destinoDane || form.destinoDane.length < 5)          errs.destinoDane = 'Municipio de destino requerido';
    if (!form.fechaHoraCitaCargue)                                 errs.fechaHoraCitaCargue = 'Requerido';
    if (!form.fechaHoraCitaDescargue)                              errs.fechaHoraCitaDescargue = 'Requerido';
    if (esPeligrosa && !form.codigoUn)                             errs.codigoUn = 'Código UN obligatorio para mercancía peligrosa';
    if (esContenedor && !form.pesoContenedorVacio)                 errs.pesoContenedorVacio = 'Peso del contenedor vacío obligatorio';
    if (esContenedor && form.pesoContenedorVacio && selectedEmpaque?.pesoVacioMin) {
      const peso = parseFloat(form.pesoContenedorVacio);
      if (peso < selectedEmpaque.pesoVacioMin || peso > (selectedEmpaque.pesoVacioMax ?? Infinity)) {
        errs.pesoContenedorVacio = `Para ${selectedEmpaque.label}: entre ${selectedEmpaque.pesoVacioMin} y ${selectedEmpaque.pesoVacioMax} kg`;
      }
    }
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        descripcionCarga:        form.descripcionCarga,
        pesoKg:                  parseInt(form.pesoKg),
        codigoEmpaque:           parseInt(form.codigoEmpaque),
        codNaturalezaCarga:      naturalezaToRndc(form.codNaturalezaCarga),
        codOperacionTransporte:  form.codOperacionTransporte,
        codigoAranceladoCarga:   form.codigoAranceladoCarga || '009880',
        tipoIdRemitente:         remitenteVal!.tipoId,
        nitRemitente:            remitenteVal!.nit,
        codSedeRemitente:        remitenteVal!.codSede,
        empresaRemitente:        remitenteVal!.empresa,
        tipoIdDestinatario:      destinatarioVal!.tipoId,
        nitDestinatario:         destinatarioVal!.nit,
        codSedeDestinatario:     destinatarioVal!.codSede,
        empresaDestinataria:     destinatarioVal!.empresa,
        tipoIdPropietario:       propietarioSource!.tipoId,
        nitPropietario:          propietarioSource!.nit,
        codSedePropietario:      form.codSedePropietario || '1',
        origenMunicipio:         getMunicipioName(form.origenDane),
        origenDane:              form.origenDane,
        destinoMunicipio:        getMunicipioName(form.destinoDane),
        destinoDane:             form.destinoDane,
        fechaHoraCitaCargue:     form.fechaHoraCitaCargue,
        fechaHoraCitaDescargue:  form.fechaHoraCitaDescargue,
        horasPactoCarga:         parseInt(form.horasPactoCarga),
        minutosPactoCarga:       parseInt(form.minutosPactoCarga),
        horasPactoDescargue:     parseInt(form.horasPactoDescargue),
        minutosPactoDescargue:   parseInt(form.minutosPactoDescargue),
      };

      if (esPeligrosa && form.codigoUn)            payload.codigoUn = form.codigoUn;
      if (esPeligrosa && form.estadoMercancia)      payload.estadoMercancia = form.estadoMercancia;
      if (esPeligrosa && form.grupoEmbalajeEnvase)  payload.grupoEmbalajeEnvase = form.grupoEmbalajeEnvase;
      if (esGranelLiquido && form.unidadMedidaProducto) payload.unidadMedidaProducto = form.unidadMedidaProducto;
      if (esGranelLiquido && form.cantidadProducto) payload.cantidadProducto = parseFloat(form.cantidadProducto);
      if (esContenedor && form.pesoContenedorVacio) payload.pesoContenedorVacio = parseFloat(form.pesoContenedorVacio);
      if (esPaqueteo && form.tipoConsolidada)       payload.tipoConsolidada = form.tipoConsolidada;

      if (form.valorAsegurado)        payload.valorAsegurado = parseFloat(form.valorAsegurado);
      if (form.ordenServicioGenerador) payload.ordenServicioGenerador = form.ordenServicioGenerador;
      if (form.numPolizaTransporte)   payload.numPolizaTransporte = form.numPolizaTransporte;
      if (form.fechaVencimientoPoliza) payload.fechaVencimientoPoliza = form.fechaVencimientoPoliza;

      if (!isEdit && negocioId) payload.nuevoNegocioId = negocioId;

      const url    = isEdit ? `/api/remesas/${initialData!.id}` : '/api/remesas';
      const method = isEdit ? 'PATCH' : 'POST';

      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();

      if (!res.ok) {
        if (json.fields) {
          const flat: Record<string, string> = {};
          for (const [k, v] of Object.entries(json.fields)) flat[k] = Array.isArray(v) ? v[0] : String(v);
          setFieldErrors(flat); return;
        }
        throw new Error(json.message ?? 'Error al guardar la remesa');
      }

      if (onSuccess) { onSuccess(); }
      else {
        const redirect = isEdit
          ? onSuccessRedirect ?? `/operacional/remesas/${initialData!.id}`
          : onSuccessRedirect ?? '/operacional/remesas';
        router.push(redirect); router.refresh();
      }
    } catch (err) { setError((err as Error).message); }
    finally { setSaving(false); }
  }

  /* ── Style helpers ── */
  const lockStyle = lockedSection(isRndcLocked);

  const PROPIETARIO_OPTIONS: RadioPillOption<PropietarioMode>[] = [
    { value: 'remitente',    label: 'Mismo que remitente' },
    { value: 'destinatario', label: 'Mismo que destinatario' },
    { value: 'otro',         label: 'Otro tercero' },
  ];

  const empaques = empaquesPorOperacion(form.codOperacionTransporte);

  /* ── View-mode sub-components ── */
  function ROField({ value, mono }: { value: string; mono?: boolean }) {
    return (
      <input
        value={value || '—'}
        disabled
        style={{ ...lockedFieldStyle, fontFamily: mono ? 'monospace' : 'inherit' }}
      />
    );
  }

  function ROActor({ label: actorLabel, tipoId, nit, codSede, empresa, badgeColor }: {
    label: string; tipoId: string; nit: string; codSede: string;
    empresa?: string | null; badgeColor: { bg: string; color: string };
  }) {
    return (
      <div>
        <p style={subsectionTitle}>{actorLabel}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <label style={labelStyle}>Identificación</label>
            <div style={{ ...lockedFieldStyle, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'monospace' }}>
              <span style={{
                display: 'inline-block', background: badgeColor.bg, color: badgeColor.color,
                borderRadius: 99, padding: '1px 8px', fontSize: 11, fontWeight: 600,
              }}>
                {tipoIdLabel(tipoId)}
              </span>
              {nit}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Sede</label>
            <ROField value={codSede} mono />
          </div>
          {empresa && (
            <div>
              <label style={labelStyle}>Empresa</label>
              <ROField value={empresa} />
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Derived view helpers ── */
  const origenLabel  = initialData?.origenMunicipio  || getMunicipioName(form.origenDane)  || form.origenDane;
  const destinoLabel = initialData?.destinoMunicipio || getMunicipioName(form.destinoDane) || form.destinoDane;
  const editable     = initialData ? initialData.estadoRndc === 'PENDIENTE' : false;

  /* ═══════════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════════ */
  const content = (
    <div className="op-form" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ─── RNDC banners (ver) ─── */}
      {isReadOnly && initialData?.estadoRndc === 'REGISTRADA' && initialData?.numeroRemesaRndc && (
        <div style={{
          background: colors.primaryBg, border: `1px solid ${colors.successBadgeBorder}`, borderRadius: 12,
          padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: colors.primaryDark, margin: 0 }}>
              Registrada en el RNDC
            </p>
            <p style={{ fontSize: 13, color: colors.primaryHover, margin: '2px 0 0', fontFamily: 'monospace' }}>
              Nro. RNDC: {initialData.numeroRemesaRndc}
            </p>
          </div>
        </div>
      )}

      {isReadOnly && initialData && (initialData.estadoRndc === 'PENDIENTE' || initialData.estadoRndc === 'ENVIADA') && (
        <div style={{
          background: colors.warningBg2, border: `1px solid ${colors.warningBorder}`, borderRadius: 12,
          padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: colors.warningDark, margin: 0 }}>
              {initialData.estadoRndc === 'PENDIENTE'
                ? 'Pendiente de envío al RNDC'
                : 'Enviada — esperando respuesta del RNDC'}
            </p>
            <p style={{ fontSize: 12, color: colors.warningText, margin: '2px 0 0' }}>
              Esta remesa debe registrarse en el RNDC antes de asignarse a un manifiesto.
            </p>
          </div>
          <RemesaEnviarRndcBtn
            remesaId={initialData.id}
            estadoRndc={initialData.estadoRndc}
            onSuccess={() => router.refresh()}
          />
        </div>
      )}

      {/* ─── RNDC Lock banner (editar) ─── */}
      {isEdit && isRndcLocked && (
        <AlertBanner variant="warning" icon="&#128274;">
          Remesa <strong>{initialData!.estadoRndc}</strong> en RNDC &mdash;
          solo puedes editar <strong>Valor asegurado</strong>, <strong>Orden de servicio</strong> y seguro.
        </AlertBanner>
      )}

      {/* ═════════════ CARD 1 — Clasificación y operación ═════════════ */}
      <CollapsibleCard
        title="Carga y clasificación"
        subtitle="Tipo de operación RNDC, naturaleza, empaque y datos del producto."
        open={openSections[1]} onToggle={() => toggleSection(1)}
        step={1}
        extraStyle={isReadOnly ? {} : lockStyle}
      >
{/* fila 1 — operación sola (descripciones largas, mejor ancho completo) */}
        <div>
          <label style={labelStyle}>Operación de transporte {!isReadOnly && '*'}</label>
          {isReadOnly ? (
            <ROField value={`${form.codOperacionTransporte} — ${OPERACION_LABELS[form.codOperacionTransporte] ?? form.codOperacionTransporte}`} />
          ) : (
            <>
              <select value={form.codOperacionTransporte}
                onChange={e => handleOperacionChange(e.target.value)}
                style={roField}>
                {COD_OPERACION.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {(() => { const sel = COD_OPERACION.find(o => o.value === form.codOperacionTransporte); return sel?.description ? <p style={helpText}>{sel.description}</p> : null; })()}
            </>
          )}
        </div>

        {/* fila 2 — naturaleza + empaque: 2 cols siempre (valores cortos, ok en móvil) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
          <div>
            <label style={labelStyle}>Naturaleza de la carga {!isReadOnly && '*'}</label>
            {isReadOnly ? (
              <ROField value={`${form.codNaturalezaCarga} — ${NATURALEZA_LABELS[form.codNaturalezaCarga] ?? form.codNaturalezaCarga}`} />
            ) : (
              <>
                <select value={form.codNaturalezaCarga}
                  onChange={e => upd('codNaturalezaCarga', e.target.value)}
                  style={roField}>
                  {COD_NATURALEZA.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                </select>
                {(() => { const sel = COD_NATURALEZA.find(n => n.value === form.codNaturalezaCarga); return sel?.description ? <p style={helpText}>{sel.description}</p> : null; })()}
              </>
            )}
          </div>
          <div>
            <label style={labelStyle}>Tipo de empaque {!isReadOnly && '*'}</label>
            {isReadOnly ? (
              <ROField value={(() => { const e = empaques.find(e => e.value === form.codigoEmpaque); return e ? e.label : form.codigoEmpaque; })()} />
            ) : (
              <>
                <select value={form.codigoEmpaque} onChange={e => upd('codigoEmpaque', e.target.value)} style={roField}>
                  {empaques.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
                {(() => { const sel = empaques.find(e => e.value === form.codigoEmpaque); return sel?.description ? <p style={helpText}>{sel.description}</p> : null; })()}
              </>
            )}
          </div>
        </div>

        {esPaqueteo && (
          <div style={{ marginTop: 16, padding: 12, background: colors.bgLight, borderRadius: 8, border: `1px solid ${colors.borderLighter}` }}>
            <label style={labelStyle}>Tipo de consolidada {!isReadOnly && '*'}</label>
            {isReadOnly ? <ROField value={form.tipoConsolidada} /> : (
              <>
                <select value={form.tipoConsolidada} onChange={e => upd('tipoConsolidada', e.target.value)} style={roField}>
                  {TIPO_CONSOLIDADA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                {(() => { const sel = TIPO_CONSOLIDADA.find(t => t.value === form.tipoConsolidada); return sel?.description ? <p style={helpText}>{sel.description}</p> : null; })()}
              </>
            )}
          </div>
        )}

        {/* fila 3 — descripción (texto largo, ancho completo) */}
        <div style={{ marginTop: 12 }}>
          <label style={labelStyle}>Descripción del producto {!isReadOnly && '*'}</label>
          <input value={form.descripcionCarga}
            onChange={e => upd('descripcionCarga', e.target.value)}
            placeholder={isReadOnly ? '' : 'Ej: Leche UHT caja x 12'} maxLength={60}
            disabled={isReadOnly || esPeligrosa}
            style={isReadOnly ? lockedFieldStyle : errBorder('descripcionCarga', fieldErrors)}
            title={esPeligrosa ? 'No se envía descripción para mercancía peligrosa' : ''} />
          {!isReadOnly && <FieldError error={fieldErrors.descripcionCarga} />}
          {!isReadOnly && (
            <p style={helpText}>
              {esPeligrosa ? 'No aplica — el RNDC usa el código UN' : `${form.descripcionCarga.length}/60 caracteres`}
            </p>
          )}
        </div>

        {/* fila 4 — código + peso: 2 cols siempre (inputs cortos, ok en móvil) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
          <div>
            <label style={labelStyle}>Mercancía RNDC</label>
            <input value={form.codigoAranceladoCarga}
              onChange={e => upd('codigoAranceladoCarga', e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={isReadOnly ? '' : '009880'} maxLength={6} disabled={isReadOnly}
              style={isReadOnly ? lockedFieldStyle : fieldStyle} />
            {!isReadOnly && <p style={helpText}>MERCANCIAREMESA — 6 dígitos (ej: 009880 = Paquetes varios)</p>}
          </div>
          <div>
            <label style={labelStyle}>Peso (kg) {!isReadOnly && '*'}</label>
            {isReadOnly ? (
              <ROField value={`${Number(form.pesoKg).toLocaleString('es-CO')} kg`} />
            ) : (
              <>
                <input type="number" min={0} value={form.pesoKg} onChange={e => upd('pesoKg', e.target.value)} style={errBorder('pesoKg', fieldErrors)} />
                <FieldError error={fieldErrors.pesoKg} />
              </>
            )}
          </div>
        </div>

        {esGranelLiquido && (
          <Grid2 style={{ marginTop: 12 }}>
            <div>
              <label style={labelStyle}>Unidad medida producto {!isReadOnly && '*'}</label>
              {isReadOnly ? <ROField value={form.unidadMedidaProducto} /> : (
                <>
                  <select value={form.unidadMedidaProducto} onChange={e => upd('unidadMedidaProducto', e.target.value)} style={roField}>
                    {UNIDAD_MEDIDA_PRODUCTO.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </select>
                  <p style={helpText}>Obligatorio para granel líquido</p>
                </>
              )}
            </div>
            <div>
              <label style={labelStyle}>Cantidad producto {!isReadOnly && '*'}</label>
              {isReadOnly ? <ROField value={form.cantidadProducto || '—'} /> : (
                <input type="number" min={0} step="0.001" value={form.cantidadProducto}
                  onChange={e => upd('cantidadProducto', e.target.value)} placeholder="Ej: 800 galones" style={roField} />
              )}
            </div>
          </Grid2>
        )}

        {esContenedor && (
          <div style={{ marginTop: 12 }}>
            <label style={labelStyle}>Peso contenedor vacío (kg) {!isReadOnly && '*'}</label>
            {isReadOnly ? <ROField value={`${form.pesoContenedorVacio} kg`} /> : (
              <>
                <input type="number" min={selectedEmpaque?.pesoVacioMin ?? 0} max={selectedEmpaque?.pesoVacioMax ?? 99999}
                  step="0.01" value={form.pesoContenedorVacio}
                  onChange={e => upd('pesoContenedorVacio', e.target.value)}
                  style={errBorder('pesoContenedorVacio', fieldErrors)} />
                <FieldError error={fieldErrors.pesoContenedorVacio} />
                {selectedEmpaque?.pesoVacioMin != null && (
                  <p style={helpText}>Rango: {selectedEmpaque.pesoVacioMin.toLocaleString()} – {selectedEmpaque.pesoVacioMax!.toLocaleString()} kg</p>
                )}
              </>
            )}
          </div>
        )}

        {esPeligrosa && (
          <HighlightSection variant="orange" title="Campos adicionales — Mercancía peligrosa">
            <Grid3>
              <div>
                <label style={labelStyle}>Código UN (ONU) {!isReadOnly && '*'}</label>
                <input value={form.codigoUn}
                  onChange={e => upd('codigoUn', e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder={isReadOnly ? '' : '1203'} maxLength={4} disabled={isReadOnly}
                  style={isReadOnly ? lockedFieldStyle : errBorder('codigoUn', fieldErrors)} />
                {!isReadOnly && <FieldError error={fieldErrors.codigoUn} />}
                {!isReadOnly && <p style={helpText}>4 dígitos — Libro Naranja ONU</p>}
              </div>
              <div>
                <label style={labelStyle}>Estado mercancía</label>
                {isReadOnly ? <ROField value={form.estadoMercancia || '—'} /> : (
                  <select value={form.estadoMercancia} onChange={e => upd('estadoMercancia', e.target.value)} style={roField}>
                    <option value="">— Seleccionar —</option>
                    {ESTADO_MERCANCIA.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label style={labelStyle}>Grupo embalaje</label>
                {isReadOnly ? <ROField value={form.grupoEmbalajeEnvase || '—'} /> : (
                  <select value={form.grupoEmbalajeEnvase} onChange={e => upd('grupoEmbalajeEnvase', e.target.value)} style={roField}>
                    <option value="">— Seleccionar —</option>
                    {GRUPO_EMBALAJE.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                )}
              </div>
            </Grid3>
          </HighlightSection>
        )}
      </CollapsibleCard>

      {/* ═════════════ CARD 2 — Actores ═════════════ */}
      <CollapsibleCard
        title="Remitente, destinatario y propietario"
        subtitle="Los terceros deben estar creados en el maestro del RNDC. El propietario es quien tiene la póliza del seguro."
        open={openSections[3]} onToggle={() => toggleSection(3)}
        step={2}
        extraStyle={isReadOnly ? {} : lockStyle}
      >
        {isReadOnly && initialData ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20 }}>
              <ROActor label="Remitente (sitio de cargue)" tipoId={initialData.tipoIdRemitente}
                nit={initialData.nitRemitente} codSede={initialData.codSedeRemitente}
                empresa={initialData.empresaRemitente}
                badgeColor={{ bg: colors.blueBg, color: colors.blue }} />
              <ROActor label="Destinatario (sitio de descargue)" tipoId={initialData.tipoIdDestinatario}
                nit={initialData.nitDestinatario} codSede={initialData.codSedeDestinatario}
                empresa={initialData.empresaDestinataria}
                badgeColor={{ bg: colors.warningBg, color: colors.warningDark }} />
            </div>
            <div style={{ padding: 16, background: colors.bgLight, borderRadius: 8, border: `1px solid ${colors.borderLighter}` }}>
              <p style={{ ...subsectionTitle, borderBottom: 'none', paddingBottom: 0, marginBottom: 10 }}>Propietario de la carga</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <label style={labelStyle}>Identificación</label>
                  <div style={{ ...lockedFieldStyle, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'monospace' }}>
                    <span style={{ display: 'inline-block', background: colors.purpleBg, color: colors.purple, borderRadius: 99, padding: '1px 8px', fontSize: 11, fontWeight: 600 }}>
                      {tipoIdLabel(initialData.tipoIdPropietario)}
                    </span>
                    {initialData.nitPropietario}
                  </div>
                </div>
                {initialData.nombrePropietario && (
                  <div><label style={labelStyle}>Nombre</label><ROField value={initialData.nombrePropietario} /></div>
                )}
                {initialData.nitPropietario === initialData.nitRemitente && (
                  <p style={{ fontSize: 12, color: colors.primary, margin: 0, fontStyle: 'italic' }}>↳ Mismo que el remitente</p>
                )}
                {initialData.nitPropietario === initialData.nitDestinatario && initialData.nitPropietario !== initialData.nitRemitente && (
                  <p style={{ fontSize: 12, color: colors.amber, margin: 0, fontStyle: 'italic' }}>↳ Mismo que el destinatario</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20 }}>
              <div>
                <p style={subsectionTitle}>Remitente (sitio de cargue)</p>
                <SucursalSelector label="Remitente" value={remitenteVal} onChange={setRemitenteVal} error={fieldErrors.remitente} required />
              </div>
              <div>
                <p style={subsectionTitle}>Destinatario (sitio de descargue)</p>
                <SucursalSelector label="Destinatario" value={destinatarioVal} onChange={setDestinatarioVal} error={fieldErrors.destinatario} required />
              </div>
            </div>
            <div style={{ padding: 16, background: colors.bgLight, borderRadius: 8, border: `1px solid ${colors.borderLighter}` }}>
              <p style={{ ...subsectionTitle, borderBottom: 'none', paddingBottom: 0, marginBottom: 10 }}>Propietario de la carga</p>
              <div style={{ marginBottom: 12 }}>
                <RadioPillGroup<PropietarioMode> name="propietarioMode" options={PROPIETARIO_OPTIONS} value={propietarioMode} onChange={handlePropietarioModeChange} />
              </div>
              {propietarioMode !== 'otro' && propietarioSource && (
                <div style={{ fontSize: 13, color: colors.textDefault, background: colors.bgWhite, border: `1px solid ${colors.borderLight}`, borderRadius: 8, padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: colors.textPlaceholder, fontSize: 12 }}>Propietario:</span>
                  <InfoBadge>{propietarioSource.tipoId === 'N' ? 'NIT' : propietarioSource.tipoId === 'C' ? 'CC' : propietarioSource.tipoId} {propietarioSource.nit}</InfoBadge>
                  <span style={{ fontSize: 12, color: colors.textMuted }}>{propietarioSource.empresa}</span>
                </div>
              )}
              {propietarioMode !== 'otro' && !propietarioSource && (
                <p style={{ fontSize: 12, color: colors.textPlaceholder, fontStyle: 'italic' }}>
                  Se copiará del {propietarioMode === 'remitente' ? 'remitente' : 'destinatario'} al completarlo.
                </p>
              )}
              {propietarioMode === 'otro' && (
                <div style={{ marginTop: 4 }}>
                  <SucursalSelector label="Propietario" value={propietarioVal} onChange={setPropietarioVal} error={fieldErrors.propietario} required />
                </div>
              )}
              <FieldError error={propietarioMode !== 'otro' ? fieldErrors.propietario : undefined} />
              <div style={{ marginTop: 12, maxWidth: 200 }}>
                <label style={labelStyle}>Sede propietario</label>
                <input value={form.codSedePropietario} onChange={e => upd('codSedePropietario', e.target.value)} placeholder="1" style={roField} />
                <p style={helpText}>Código de sede RNDC (default: 1)</p>
              </div>
            </div>
          </>
        )}
      </CollapsibleCard>

      {/* ═════════════ CARD 3 — Ruta ═════════════ */}
      <CollapsibleCard
        title="Ruta — Origen y destino"
        subtitle="Municipios de cargue y descargue según código DANE."
        open={openSections[4]} onToggle={() => toggleSection(4)}
        step={3}
        extraStyle={isReadOnly ? {} : lockStyle}
      >
        {isReadOnly ? (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={labelStyle}>Origen (cargue)</label>
                <ROField value={origenLabel} />
                <p style={{ fontSize: 11, color: colors.textMuted, margin: '2px 0 0', fontFamily: 'monospace' }}>DANE {form.origenDane}</p>
              </div>
              {initialData?.remDirRemitente && (
                <div>
                  <label style={labelStyle}>Dirección de cargue</label>
                  <ROField value={initialData.remDirRemitente} />
                </div>
              )}
            </div>
            <span style={{ fontSize: 20, color: colors.border, marginTop: 8 }}>→</span>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={labelStyle}>Destino (descargue)</label>
                <ROField value={destinoLabel} />
                <p style={{ fontSize: 11, color: colors.textMuted, margin: '2px 0 0', fontFamily: 'monospace' }}>DANE {form.destinoDane}</p>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Municipio origen (cargue) *</label>
                <MunicipioAutocomplete value={form.origenDane} placeholder="Buscar municipio de origen…" onSelect={dane => upd('origenDane', dane)} daneFormat="dane8" />
                <FieldError error={fieldErrors.origenDane} />
              </div>
              <div>
                <label style={labelStyle}>Dirección de cargue (REMDIRREMITENTE)</label>
                <input value={form.remDirRemitente} onChange={e => upd('remDirRemitente', e.target.value)}
                  placeholder="Ej: CR 31A 8 82, BRR PENSILVANIA" maxLength={150}
                  style={fieldStyle} />
                <p style={helpText}>Se reporta al RNDC como REMDIRREMITENTE</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Municipio destino (descargue) *</label>
                <MunicipioAutocomplete value={form.destinoDane} placeholder="Buscar municipio de destino…" onSelect={dane => upd('destinoDane', dane)} daneFormat="dane8" />
                <FieldError error={fieldErrors.destinoDane} />
              </div>
            </div>
          </div>
        )}
      </CollapsibleCard>

      {/* ═════════════ CARD 4 — Tiempos logísticos ═════════════ */}
      <CollapsibleCard
        title="Tiempos logísticos"
        subtitle="Obligatorio RNDC desde noviembre 2025. Citas máx. 30 días futuro, diferencia cargue-descargue máx. 6 días."
        open={openSections[5]} onToggle={() => toggleSection(5)}
        step={4}
        extraStyle={isReadOnly ? {} : lockStyle}
      >
        <Grid2 style={{ marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Cita cargue (fecha y hora) {!isReadOnly && '*'}</label>
            {isReadOnly
              ? <ROField value={formatFechaHora(initialData?.fechaHoraCitaCargue)} />
              : <>
                  <input type="datetime-local" value={form.fechaHoraCitaCargue}
                    onChange={e => upd('fechaHoraCitaCargue', e.target.value)}
                    style={errBorder('fechaHoraCitaCargue', fieldErrors)} />
                  <FieldError error={fieldErrors.fechaHoraCitaCargue} />
                </>
            }
          </div>
          <div>
            <label style={labelStyle}>Cita descargue (fecha y hora) {!isReadOnly && '*'}</label>
            {isReadOnly
              ? <ROField value={formatFechaHora(initialData?.fechaHoraCitaDescargue)} />
              : <>
                  <input type="datetime-local" value={form.fechaHoraCitaDescargue}
                    onChange={e => upd('fechaHoraCitaDescargue', e.target.value)}
                    style={errBorder('fechaHoraCitaDescargue', fieldErrors)} />
                  <FieldError error={fieldErrors.fechaHoraCitaDescargue} />
                </>
            }
          </div>
        </Grid2>

        <Grid4 style={{ background: colors.bgLight, borderRadius: 10, padding: 14 }}>
          <div>
            <label style={labelStyle}>Pacto cargue (h)</label>
            <input type="number" min={0} max={72} value={form.horasPactoCarga}
              onChange={e => upd('horasPactoCarga', e.target.value)} disabled={isReadOnly}
              style={isReadOnly ? lockedFieldStyle : fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Pacto cargue (min)</label>
            <input type="number" min={0} max={59} value={form.minutosPactoCarga}
              onChange={e => upd('minutosPactoCarga', e.target.value)} disabled={isReadOnly}
              style={isReadOnly ? lockedFieldStyle : fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Pacto descargue (h)</label>
            <input type="number" min={0} max={72} value={form.horasPactoDescargue}
              onChange={e => upd('horasPactoDescargue', e.target.value)} disabled={isReadOnly}
              style={isReadOnly ? lockedFieldStyle : fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Pacto descargue (min)</label>
            <input type="number" min={0} max={59} value={form.minutosPactoDescargue}
              onChange={e => upd('minutosPactoDescargue', e.target.value)} disabled={isReadOnly}
              style={isReadOnly ? lockedFieldStyle : fieldStyle} />
          </div>
        </Grid4>
        {!isReadOnly && (
          <p style={{ ...helpText, marginTop: 8 }}>
            Tiempo que la empresa dispone para cargar/descargar. Decreto tiempos logísticos — sobrecostos por exceso se calculan automáticamente.
          </p>
        )}
      </CollapsibleCard>

      {/* ═════════════ CARD 5 — Seguro y opcionales ═════════════ */}
      <CollapsibleCard
        title="Seguro y datos opcionales"
        subtitle="El seguro de la mercancía es opcional en el RNDC, pero recomendado."
        open={openSections[6]} onToggle={() => toggleSection(6)}
        step={5}
      >
        <HighlightSection variant="success" title="Seguro de mercancía">
          <Grid2 style={{ marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Valor asegurado ($)</label>
              {isReadOnly
                ? <ROField value={form.valorAsegurado ? `$ ${Number(form.valorAsegurado).toLocaleString('es-CO')}` : '—'} />
                : <input type="number" min={0} placeholder="0" value={form.valorAsegurado} onChange={e => upd('valorAsegurado', e.target.value)} style={fieldStyle} />
              }
            </div>
            <div>
              <label style={labelStyle}>Nro. póliza transporte</label>
              <input value={form.numPolizaTransporte} onChange={e => upd('numPolizaTransporte', e.target.value)}
                placeholder={isReadOnly ? '' : 'POL-2026-XXXXX'} disabled={isReadOnly}
                style={isReadOnly ? lockedFieldStyle : fieldStyle} />
            </div>
          </Grid2>
          <Grid2>
            <div>
              <label style={labelStyle}>Vencimiento póliza</label>
              {isReadOnly
                ? <ROField value={form.fechaVencimientoPoliza ? formatFecha(form.fechaVencimientoPoliza) : '—'} />
                : <input type="date" value={form.fechaVencimientoPoliza} onChange={e => upd('fechaVencimientoPoliza', e.target.value)} style={fieldStyle} />
              }
            </div>
            {!isReadOnly && (
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <p style={{ ...helpText, paddingBottom: 8 }}>El dueño de la póliza y la compañía de seguros se toman del propietario de la carga.</p>
              </div>
            )}
          </Grid2>
        </HighlightSection>

        <Grid2 style={{ marginTop: 16 }}>
          <div>
            <label style={labelStyle}>Orden de servicio generador</label>
            <input value={form.ordenServicioGenerador} onChange={e => upd('ordenServicioGenerador', e.target.value)}
              placeholder={isReadOnly ? '' : 'OS-2026-0001'} maxLength={20} disabled={isReadOnly}
              style={isReadOnly ? lockedFieldStyle : fieldStyle} />
            {!isReadOnly && <p style={helpText}>Orden de compra del cliente (máx 20 chars). Se muestra en la factura electrónica.</p>}
          </div>
          {isReadOnly && initialData?.instruccionesEspeciales ? (
            <div>
              <label style={labelStyle}>Instrucciones especiales</label>
              <ROField value={initialData.instruccionesEspeciales} />
            </div>
          ) : !isReadOnly ? (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <p style={{ ...helpText, paddingBottom: 8, lineHeight: 1.6 }}>
                Campos como <strong>NUMIDGPS</strong> (monitoreo GPS) y <strong>permiso carga extra</strong> (INVIAS)
                se habilitarán cuando se integre seguimiento vehicular.
              </p>
            </div>
          ) : null}
        </Grid2>
      </CollapsibleCard>

      {/* ═════════════ CARD 6 — Metadata (solo ver) ═════════════ */}
      {isReadOnly && initialData && (
        <CollapsibleCard
          title="Información del registro"
          subtitle="Datos de auditoría y estado del registro."
          open={openSections[7]} onToggle={() => toggleSection(7)}
          step={6}
        >
          <Grid2>
            <div>
              <label style={labelStyle}>Estado operativo</label>
              <ROField value={initialData.estado ?? '—'} />
            </div>
            <div>
              <label style={labelStyle}>Estado RNDC</label>
              <div style={{ padding: '6px 0' }}>
                <RemesaEstadoBadge estado={initialData.estadoRndc} />
              </div>
            </div>
            {initialData.nuevoNegocioId && (
              <div>
                <label style={labelStyle}>Negocio asociado</label>
                <div style={{ padding: '6px 0' }}>
                  <Link href={`/operacional/negocios/${initialData.nuevoNegocioId}`}
                    style={{ fontSize: 13, color: colors.blue, textDecoration: 'none', fontWeight: 500 }}>
                    Ver negocio →
                  </Link>
                </div>
              </div>
            )}
            {initialData.numeroRemesaRndc && (
              <div><label style={labelStyle}>Número RNDC</label><ROField value={initialData.numeroRemesaRndc} mono /></div>
            )}
            <div><label style={labelStyle}>Fecha creación</label><ROField value={formatFecha(initialData.createdAt)} /></div>
            {initialData.fechaIngresoRndc && (
              <div><label style={labelStyle}>Ingreso RNDC</label><ROField value={formatFecha(initialData.fechaIngresoRndc)} /></div>
            )}
            <div><label style={labelStyle}>Última actualización</label><ROField value={formatFecha(initialData.updatedAt)} /></div>
          </Grid2>

          {!editable && (
            <div style={{ marginTop: 16, background: colors.orangeBg, border: `1px solid ${colors.orangeBorder}`, borderRadius: 12, padding: '12px 16px' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: colors.orangeText, margin: '0 0 4px' }}>Edición restringida</p>
              <p style={{ fontSize: 12, color: colors.orangeDark, margin: 0 }}>
                Esta remesa está en estado {initialData.estadoRndc} en el RNDC.
                Solo se pueden modificar instrucciones especiales y orden de servicio.
              </p>
            </div>
          )}
        </CollapsibleCard>
      )}

      {/* ─── Error global ─── */}
      {!isReadOnly && <FormErrorBanner message={error} />}

      {/* ─── Acciones ─── */}
      {isReadOnly && initialData ? (
        <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" onClick={() => router.push('/operacional/remesas')}
            style={{ padding: '10px 20px', fontSize: 14, fontWeight: 500, border: '1.5px solid #E2E8F0', borderRadius: 9, background: '#F8FAFC', color: '#374151', cursor: 'pointer' }}>
            ← Volver al listado
          </button>
          {editable && (
            <button type="button" onClick={() => router.push(`/operacional/remesas/${initialData.id}/editar`)}
              style={{ padding: '10px 24px', fontSize: 14, fontWeight: 600, border: 'none', borderRadius: 9, background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#FFFFFF', cursor: 'pointer', boxShadow: '0 2px 6px rgba(5,150,105,0.25)' }}>
              ✎ Editar remesa
            </button>
          )}
        </div>
      ) : (
        <div style={{ borderTop: `1px solid ${colors.borderLight}` }}>
          <FormActions saving={saving} onCancel={() => router.back()}
            submitLabel={isEdit ? 'Actualizar remesa' : 'Crear remesa'}
            leftContent={<p style={{ fontSize: 12, color: colors.textPlaceholder }}>* Campos obligatorios para el RNDC (procesoid 3)</p>} />
        </div>
      )}
    </div>
  );

  if (isReadOnly) return content;

  return <form onSubmit={handleSubmit}>{content}</form>;
}
