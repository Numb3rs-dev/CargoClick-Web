/**
 * conversacionUtils.ts
 *
 * Funciones puras de soporte para el wizard de cotización.
 * Sin estado React ni efectos secundarios — únicamente transformaciones de datos.
 */

import type { DatosFormulario } from '@/types';

// ── Interpolación y formateo ──────────────────────────────────────────────────

/**
 * Interpolar variables en preguntas del bot.
 * Ejemplo: "Hola, {contacto}" → "Hola, Juan Pérez"
 */
export function interpolatePregunta(pregunta: string, datos: Partial<DatosFormulario>): string {
  return pregunta.replace(/{(\w+)}/g, (match, key) => {
    const valor = datos[key as keyof DatosFormulario];
    return valor !== undefined ? String(valor) : match;
  });
}

/**
 * Formatear respuesta del usuario para visualización.
 */
export function formatearRespuesta(valor: unknown): string {
  if (Array.isArray(valor)) return valor.join(', ');
  if (valor instanceof Date) {
    return valor.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  return String(valor);
}

/**
 * Limpiar respuesta conversacional del usuario.
 * Elimina prefijos como "con", "mi nombre es", "soy", etc.
 *
 * Ejemplos:
 *   "con Carlos"            → "Carlos"
 *   "mi nombre es Juan"     → "Juan"
 *   "soy María"             → "María"
 */
export function limpiarRespuestaConversacional(texto: string): string {
  if (typeof texto !== 'string') return texto;

  return texto
    .trim()
    .replace(/^con\s+/i, '')
    .replace(/^con\s+el\s+/i, '')
    .replace(/^con\s+la\s+/i, '')
    .replace(/^con\s+los\s+/i, '')
    .replace(/^mi\s+nombre\s+es\s+/i, '')
    .replace(/^me\s+llamo\s+/i, '')
    .replace(/^soy\s+/i, '')
    .replace(/^se\s+llama\s+/i, '')
    .replace(/^la\s+empresa\s+se\s+llama\s+/i, '')
    .replace(/^la\s+empresa\s+es\s+/i, '')
    .replace(/^es\s+/i, '')
    .trim();
}

// ── Normalización de valores de formulario ────────────────────────────────────

type ExtrasValue = {
  skip?: boolean;
  observaciones?: string;
  servicioExpreso?: boolean;
  cargaPeligrosa?: boolean;
  ayudanteCargue?: boolean;
  ayudanteDescargue?: boolean;
  cargaFragil?: boolean;
  necesitaEmpaque?: boolean;
  multiplesDestinosEntrega?: boolean;
  requiereEscolta?: boolean;
  accesosDificiles?: boolean;
  cargaSobredimensionada?: boolean;
  detalleCargaPeligrosa?: string;
  detalleMultiplesDestinos?: string;
  detalleAccesosDificiles?: string;
  detalleSobredimensionada?: string;
};

/**
 * Dado el nombre del campo y el valor capturado en el paso actual, devuelve
 * el fragmento de DatosFormulario que debe fusionarse al estado.
 *
 * Retorna null cuando el valor NO debe aplicarse al formulario
 * (p.ej. extras con skip=true).
 */
export function aplicarValorAlForm(
  campo: string,
  valorLimpio: unknown,
): Partial<DatosFormulario> | null {
  // Peso + dimensiones + vehículo sugerido
  if (campo === 'pesoKg' && typeof valorLimpio === 'object' && valorLimpio !== null) {
    const v = valorLimpio as {
      pesoKg: number;
      dimLargoCm: number;
      dimAnchoCm: number;
      dimAltoCm: number;
      volumenM3?: number | null;
      vehiculoSugeridoId?: string | null;
      vehiculoSugeridoNombre?: string | null;
    };
    return {
      pesoKg:                 v.pesoKg,
      dimLargoCm:             v.dimLargoCm,
      dimAnchoCm:             v.dimAnchoCm,
      dimAltoCm:              v.dimAltoCm,
      volumenM3:              v.volumenM3              ?? null,
      vehiculoSugeridoId:     v.vehiculoSugeridoId     ?? null,
      vehiculoSugeridoNombre: v.vehiculoSugeridoNombre ?? null,
    };
  }

  // Solo dimensiones
  if (campo === 'dimLargoCm' && typeof valorLimpio === 'object' && valorLimpio !== null) {
    const v = valorLimpio as { dimLargoCm: number; dimAnchoCm: number; dimAltoCm: number };
    return { dimLargoCm: v.dimLargoCm, dimAnchoCm: v.dimAnchoCm, dimAltoCm: v.dimAltoCm };
  }

  // Datos de contacto/empresa (objeto con telefono)
  if (
    campo === 'contacto' &&
    typeof valorLimpio === 'object' &&
    valorLimpio !== null &&
    'telefono' in valorLimpio
  ) {
    const cd = valorLimpio as {
      contacto: string;
      telefono: string;
      empresa?: string;
      email?: string;
      telefonoEmpresa?: string;
    };
    return {
      contacto: cd.contacto,
      ...(cd.telefono       !== undefined ? { telefono:        cd.telefono        } : {}),
      ...(cd.empresa        !== undefined ? { empresa:         cd.empresa         } : {}),
      ...(cd.email                        ? { email:           cd.email           } : {}),
      ...(cd.telefonoEmpresa !== undefined ? { telefonoEmpresa: cd.telefonoEmpresa } : {}),
    };
  }

  // Extras / checklist (puede venir con skip=true → no aplicar)
  if (campo === 'observaciones' && typeof valorLimpio === 'object' && valorLimpio !== null) {
    const ev = valorLimpio as ExtrasValue;
    if (ev.skip) return null;
    return {
      observaciones:             ev.observaciones             ?? '',
      servicioExpreso:           ev.servicioExpreso           ?? false,
      cargaPeligrosa:            ev.cargaPeligrosa            ?? false,
      ayudanteCargue:            ev.ayudanteCargue            ?? false,
      ayudanteDescargue:         ev.ayudanteDescargue         ?? false,
      cargaFragil:               ev.cargaFragil               ?? false,
      necesitaEmpaque:           ev.necesitaEmpaque           ?? false,
      multiplesDestinosEntrega:  ev.multiplesDestinosEntrega  ?? false,
      requiereEscolta:           ev.requiereEscolta           ?? false,
      accesosDificiles:          ev.accesosDificiles          ?? false,
      cargaSobredimensionada:    ev.cargaSobredimensionada    ?? false,
      detalleCargaPeligrosa:     ev.detalleCargaPeligrosa     ?? '',
      detalleMultiplesDestinos:  ev.detalleMultiplesDestinos  ?? '',
      detalleAccesosDificiles:   ev.detalleAccesosDificiles   ?? '',
      detalleSobredimensionada:  ev.detalleSobredimensionada  ?? '',
    };
  }

  // Ruta origen → destino (objeto con destino)
  if (
    campo === 'origen' &&
    typeof valorLimpio === 'object' &&
    valorLimpio !== null &&
    'destino' in valorLimpio
  ) {
    const rv = valorLimpio as {
      origen: string;
      destino: string;
      distanciaKm?: number;
      tramoDistancia?: string;
      tiempoTransitoDesc?: string;
    };
    const tipoServicio =
      rv.origen && rv.destino && rv.origen === rv.destino ? 'URBANO' : 'NACIONAL';
    return {
      origen:       rv.origen,
      destino:      rv.destino,
      tipoServicio,
      ...(typeof rv.distanciaKm === 'number' ? { distanciaKm:        rv.distanciaKm        } : {}),
      ...(rv.tramoDistancia                  ? { tramoDistancia:      rv.tramoDistancia      } : {}),
      ...(rv.tiempoTransitoDesc              ? { tiempoTransitoDesc:  rv.tiempoTransitoDesc  } : {}),
    };
  }

  // Caso general: campo escalar
  return { [campo]: valorLimpio } as Partial<DatosFormulario>;
}

// ── Construcción de payloads HTTP ─────────────────────────────────────────────

/**
 * Construye el cuerpo del PATCH que se envía al completar el paso 4
 * (datos de contacto + todos los pasos acumulados anteriores).
 */
export function construirPayloadPaso4(
  d: Partial<DatosFormulario>,
  cd: {
    contacto: string;
    telefono: string;
    empresa?: string;
    email?: string;
    telefonoEmpresa?: string;
  },
): Record<string, unknown> {
  return {
    // Ruta (paso 0)
    origen:       d.origen,
    destino:      d.destino,
    tipoServicio: 'NACIONAL',
    ...(typeof d.distanciaKm === 'number' ? { distanciaKm:        d.distanciaKm        } : {}),
    ...(d.tramoDistancia                  ? { tramoDistancia:      d.tramoDistancia      } : {}),
    ...(d.tiempoTransitoDesc              ? { tiempoTransitoDesc:  d.tiempoTransitoDesc  } : {}),
    // Tipo de carga (paso 1)
    tipoCarga: d.tipoCarga,
    // Peso y dimensiones (paso 2)
    pesoKg:     d.pesoKg,
    dimLargoCm: d.dimLargoCm,
    dimAnchoCm: d.dimAnchoCm,
    dimAltoCm:  d.dimAltoCm,
    ...(d.volumenM3 !== undefined && d.volumenM3 !== null ? { volumenM3:              d.volumenM3              } : {}),
    ...(d.vehiculoSugeridoId                              ? { vehiculoSugeridoId:      d.vehiculoSugeridoId      } : {}),
    ...(d.vehiculoSugeridoNombre                          ? { vehiculoSugeridoNombre:  d.vehiculoSugeridoNombre  } : {}),
    // Fecha requerida (paso 3)
    fechaRequerida:
      d.fechaRequerida instanceof Date
        ? d.fechaRequerida.toISOString()
        : d.fechaRequerida || null,
    // Datos de empresa opcionales (paso 4)
    empresa: cd.empresa || '',
    ...(cd.email             !== undefined ? { email:            cd.email            } : {}),
    ...(cd.telefonoEmpresa   !== undefined ? { telefonoEmpresa:  cd.telefonoEmpresa  } : {}),
  };
}

/**
 * Construye el cuerpo del PATCH fire-and-forget del paso 5 (extras / checklist).
 */
export function construirPayloadExtras(ev: ExtrasValue): Record<string, unknown> {
  return {
    observaciones:             ev.observaciones             ?? '',
    servicioExpreso:           ev.servicioExpreso           ?? false,
    cargaPeligrosa:            ev.cargaPeligrosa            ?? false,
    detalleCargaPeligrosa:     ev.detalleCargaPeligrosa     ?? '',
    ayudanteCargue:            ev.ayudanteCargue            ?? false,
    ayudanteDescargue:         ev.ayudanteDescargue         ?? false,
    cargaFragil:               ev.cargaFragil               ?? false,
    necesitaEmpaque:           ev.necesitaEmpaque           ?? false,
    multiplesDestinosEntrega:  ev.multiplesDestinosEntrega  ?? false,
    detalleMultiplesDestinos:  ev.detalleMultiplesDestinos  ?? '',
    requiereEscolta:           ev.requiereEscolta           ?? false,
    accesosDificiles:          ev.accesosDificiles          ?? false,
    detalleAccesosDificiles:   ev.detalleAccesosDificiles   ?? '',
    cargaSobredimensionada:    ev.cargaSobredimensionada    ?? false,
    detalleSobredimensionada:  ev.detalleSobredimensionada  ?? '',
  };
}
