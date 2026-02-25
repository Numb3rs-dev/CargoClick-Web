/**
 * Hook useConversacion - Motor de Wizard con Guardado Progresivo
 * 
 * Gestiona el flujo completo de 14 pasos para cotización de transporte:
 * - Paso -1: Landing page (no iniciado)
 * - Paso 0: Creación inicial de solicitud (POST)
 * - Pasos 1-12: Guardado progresivo (PATCH)
 * - Paso 13: Completar solicitud (última pregunta)
 * - Manejo de pasos condicionales (destino solo si NACIONAL)
 * - Estados de loading/error
 * 
 * @module useConversacion
 */

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { 
  ConversacionState, 
  UseConversacionReturn,
  DatosFormulario 
} from '@/types';
import { PASOS, TOTAL_PASOS } from '../config/pasos';

/**
 * Interpolar variables en preguntas del bot
 * Ejemplo: "Hola, {contacto}" → "Hola, Juan Pérez"
 * 
 * @param pregunta - Pregunta con placeholders
 * @param datos - Datos del formulario
 * @returns Pregunta con variables reemplazadas
 */
function interpolatePregunta(pregunta: string, datos: Partial<DatosFormulario>): string {
  return pregunta.replace(/{(\w+)}/g, (match, key) => {
    const valor = datos[key as keyof DatosFormulario];
    return valor !== undefined ? String(valor) : match;
  });
}

/**
 * Formatear respuesta del usuario para visualización
 * 
 * @param valor - Valor a formatear
 * @returns String formateado
 */
function formatearRespuesta(valor: any): string {
  if (Array.isArray(valor)) {
    return valor.join(', ');
  }
  if (valor instanceof Date) {
    return valor.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
  return String(valor);
}

/**
 * Limpiar respuesta conversacional del usuario
 * 
 * Elimina prefijos comunes cuando el usuario responde de forma conversacional
 * en lugar de dar respuestas directas.
 * 
 * Ejemplos:
 * - "con Carlos" → "Carlos"
 * - "mi nombre es Juan Pérez" → "Juan Pérez"
 * - "soy María" → "María"
 * - "con la empresa ACME" → "ACME"
 * 
 * @param texto - Texto del usuario
 * @returns Texto limpio
 */
function limpiarRespuestaConversacional(texto: string): string {
  if (typeof texto !== 'string') return texto;
  
  return texto
    .trim()
    // Eliminar "con" al inicio (espacios opcionales)
    .replace(/^con\s+/i, '')
    .replace(/^con\s+el\s+/i, '')
    .replace(/^con\s+la\s+/i, '')
    .replace(/^con\s+los\s+/i, '')
    // Eliminar "mi nombre es"
    .replace(/^mi\s+nombre\s+es\s+/i, '')
    .replace(/^me\s+llamo\s+/i, '')
    // Eliminar "soy"
    .replace(/^soy\s+/i, '')
    // Eliminar "se llama"
    .replace(/^se\s+llama\s+/i, '')
    .replace(/^la\s+empresa\s+se\s+llama\s+/i, '')
    .replace(/^la\s+empresa\s+es\s+/i, '')
    // Eliminar "es"
    .replace(/^es\s+/i, '')
    .trim();
}

/**
 * Hook principal del motor conversacional
 * 
 * Gestiona:
 * - Estado de la conversación (paso actual, mensajes, loading, error)
 * - Datos del formulario
 * - Interacción con API (POST inicial, PATCH progresivos)
 * - Navegación entre pasos (con soporte condicional)
 * - Progreso visual (0-100%)
 * 
 * @returns Objeto con estado, datos y acciones de la conversación
 * 
 * @example
 * ```tsx
 * function ChatComponent() {
 *   const {
 *     pasoConfig,
 *     historialMensajes,
 *     isLoading,
 *     siguientePaso
 *   } = useConversacion();
 *   
 *   return (
 *     <div>
 *       {historialMensajes.map(msg => <Message key={msg.id} {...msg} />)}
 *       <InputField tipo={pasoConfig.tipoInput} onSubmit={siguientePaso} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useConversacion(initialSolicitudId?: string): UseConversacionReturn {
  // Estado principal del wizard
  const [state, setState] = useState<ConversacionState>({
    pasoActual: -1, // Inicia en landing page
    solicitudId: null,
    isLoading: false,
    error: null,
    datosForm: {},
  });

  // Si venimos desde un enlace con ?reanudar=<id>, cargar la solicitud existente y
  // pre-rellenar el formulario saltando directamente al paso incompleto.
  useEffect(() => {
    if (!initialSolicitudId) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    fetch(`/api/solicitudes/${initialSolicitudId}`)
      .then(r => r.json())
      .then(body => {
        if (!body?.data) {
          setState(prev => ({ ...prev, isLoading: false }));
          return;
        }
        const sol = body.data as any;

        const datosReanudados = {
          contacto:           sol.contacto          || '',
          telefono:           sol.telefono          || '',
          empresa:            sol.empresa           || '',
          email:              sol.email             || '',
          telefonoEmpresa:    sol.telefonoEmpresa   || '',
          origen:             sol.origen            || '',
          destino:            sol.destino           || '',
          tipoCarga:          sol.tipoCarga         || 'CARGA_GENERAL',
          tipoServicio:       sol.tipoServicio      || 'NACIONAL',
          pesoKg:             sol.pesoKg            ?? 0,
          dimLargoCm:         sol.dimLargoCm        ?? 0,
          dimAnchoCm:         sol.dimAnchoCm        ?? 0,
          dimAltoCm:          sol.dimAltoCm         ?? 0,
          ...(sol.distanciaKm        ? { distanciaKm:           sol.distanciaKm }        : {}),
          ...(sol.tramoDistancia     ? { tramoDistancia:        sol.tramoDistancia }     : {}),
          ...(sol.tiempoTransitoDesc ? { tiempoTransitoDesc:    sol.tiempoTransitoDesc } : {}),
          ...(sol.vehiculoSugeridoId ? { vehiculoSugeridoId:   sol.vehiculoSugeridoId } : {}),
          ...(sol.vehiculoSugeridoNombre ? { vehiculoSugeridoNombre: sol.vehiculoSugeridoNombre } : {}),
        };

        // Detectar el primer paso incompleto para reanudar ahí
        const pasoInicial =
          !sol.origen || sol.origen === '' ? 0        // sin ruta → paso 0 (origen-destino)
          : !sol.pesoKg || sol.pesoKg === 0 ? 2       // sin peso → paso 2 (peso+dimensiones)
          : TOTAL_PASOS - 1;                          // todo completo → paso 5 (extras)

        console.info('[reanudar] Solicitud cargada, retomando desde paso', pasoInicial, '–', sol.id);

        setState(prev => ({
          ...prev,
          solicitudId:  sol.id,
          datosForm:    { ...prev.datosForm, ...datosReanudados },
          pasoActual:   pasoInicial,
          isLoading:    false,
        }));
      })
      .catch(err => {
        console.error('[reanudar] Error cargando solicitud:', err);
        setState(prev => ({ ...prev, isLoading: false }));
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSolicitudId]);

  // Obtener configuración del paso actual (solo si no está en landing o completado)
  const pasoConfig = useMemo(() => {
    // Landing page (paso -1) o completado (paso >= TOTAL_PASOS) — estados válidos, retornar null.
    // El componente consumidor debe guardar contra este caso.
    if (state.pasoActual < 0 || state.pasoActual >= TOTAL_PASOS) {
      return null;
    }
    const paso = PASOS.find(p => p.id === state.pasoActual);
    if (!paso) {
      // Este caso NO debería ocurrir. Si ocurre es un bug en la navegación del wizard.
      console.warn(`[useConversacion] pasoActual ${state.pasoActual} no tiene configuración en PASOS`);
      return null;
    }
    return paso;
  }, [state.pasoActual]);

  // Determinar si el paso actual debe mostrarse (manejo condicionales)
  const mostrarPaso = useMemo(() => {
    if (!pasoConfig?.condicional) return true;
    return pasoConfig.condicional(state.datosForm);
  }, [pasoConfig, state.datosForm]);

  // Calcular progreso (0-100%)
  const progreso = useMemo(() => {
    return Math.round((state.pasoActual / (TOTAL_PASOS - 1)) * 100);
  }, [state.pasoActual]);

  /**
   * Iniciar formulario desde landing page
   * 
   * Cambia de paso -1 (landing) a paso 0 (primera pregunta)
   */
  const iniciarFormulario = useCallback(() => {
    setState(prev => ({
      ...prev,
      pasoActual: 0,
    }));
  }, []);

  /**
   * PASO 2: Crear solicitud inicial en BD
   * 
   * POST /api/solicitudes con { telefono, contacto, empresa }
   * Backend crea registro con estado: "EN_PROGRESO"
   * 
   * @param telefono - Número de teléfono del contacto
   * @param contacto - Nombre del contacto
   * @param empresa - Nombre de la empresa (opcional)
   * @returns ID de la solicitud creada
   * @throws Error si falla la creación
   */
  const crearSolicitudInicial = useCallback(async (telefono: string, contacto: string, empresa: string): Promise<string> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono, contacto, empresa }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear solicitud');
      }

      const { data } = await response.json();

      setState(prev => ({
        ...prev,
        solicitudId: data.id,
        datosForm: { telefono, contacto, empresa },
        isLoading: false,
      }));

      return data.id;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al crear solicitud';
      setState(prev => ({
        ...prev,
        error: errorMsg,
        isLoading: false,
      }));
      throw error;
    }
  }, []);

  /**
   * PASOS 1-11: Actualizar solicitud progresivamente
   * 
   * PATCH /api/solicitudes/:id con { campo: valor }
   * Backend actualiza registro parcialmente
   * 
   * ESTRATEGIA DE RESILIENCIA:
   * - Si falla: log error pero NO bloquea el flujo
   * - Datos quedan en estado local
   * - Se reintenta en siguiente guardado exitoso
   * 
   * @param campo - Campo a actualizar
   * @param valor - Nuevo valor
   */
  const actualizarSolicitud = useCallback(async (campo: string, valor: any) => {
    if (!state.solicitudId) {
      throw new Error('No hay solicitud iniciada');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // ESPECIAL: Si el campo es pesoKg y valor es objeto, enviar los 4 campos (peso + dims)
      // ESPECIAL: Si el campo es dimLargoCm y valor es objeto, enviar los 3 campos
      // ESPECIAL: Si el campo es origen y valor es objeto, enviar origen+destino juntos
      const payload = 
        campo === 'pesoKg' && typeof valor === 'object' && valor !== null
          ? { pesoKg: valor.pesoKg, dimLargoCm: valor.dimLargoCm, dimAnchoCm: valor.dimAnchoCm, dimAltoCm: valor.dimAltoCm }
          : campo === 'dimLargoCm' && typeof valor === 'object' && valor !== null
          ? { dimLargoCm: valor.dimLargoCm, dimAnchoCm: valor.dimAnchoCm, dimAltoCm: valor.dimAltoCm }
          : campo === 'origen' && typeof valor === 'object' && valor !== null
          ? { origen: valor.origen, destino: valor.destino }
          : { [campo]: valor };

      const response = await fetch(`/api/solicitudes/${state.solicitudId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar solicitud');
      }

      // Actualizar estado local con los datos correctos
      if (campo === 'dimLargoCm' && typeof valor === 'object' && valor !== null) {
        setState(prev => ({
          ...prev,
          datosForm: { 
            ...prev.datosForm, 
            dimLargoCm: valor.dimLargoCm,
            dimAnchoCm: valor.dimAnchoCm,
            dimAltoCm: valor.dimAltoCm,
          },
          isLoading: false,
        }));
      } else if (campo === 'origen' && typeof valor === 'object' && valor !== null) {
        setState(prev => ({
          ...prev,
          datosForm: { ...prev.datosForm, origen: valor.origen, destino: valor.destino },
          isLoading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          datosForm: { ...prev.datosForm, [campo]: valor },
          isLoading: false,
        }));
      }
    } catch (error) {
      // UX: NO bloquear - log error pero continúa
      console.error('Error al guardar (no bloqueante):', error);

      // Actualizar estado local incluso con error
      if (campo === 'pesoKg' && typeof valor === 'object' && valor !== null) {
        setState(prev => ({
          ...prev,
          datosForm: { 
            ...prev.datosForm, 
            pesoKg: valor.pesoKg,
            dimLargoCm: valor.dimLargoCm,
            dimAnchoCm: valor.dimAnchoCm,
            dimAltoCm: valor.dimAltoCm,
          },
          isLoading: false,
          error: 'Error al guardar. Continuaremos e intentaremos nuevamente.',
        }));
      } else if (campo === 'dimLargoCm' && typeof valor === 'object' && valor !== null) {
        setState(prev => ({
          ...prev,
          datosForm: { 
            ...prev.datosForm, 
            dimLargoCm: valor.dimLargoCm,
            dimAnchoCm: valor.dimAnchoCm,
            dimAltoCm: valor.dimAltoCm,
          },
          isLoading: false,
          error: 'Error al guardar. Continuaremos e intentaremos nuevamente.',
        }));
      } else if (campo === 'origen' && typeof valor === 'object' && valor !== null) {
        setState(prev => ({
          ...prev,
          datosForm: { ...prev.datosForm, origen: valor.origen, destino: valor.destino },
          isLoading: false,
          error: 'Error al guardar. Continuaremos e intentaremos nuevamente.',
        }));
      } else {
        setState(prev => ({
          ...prev,
          datosForm: { ...prev.datosForm, [campo]: valor },
          isLoading: false,
          error: 'Error al guardar. Continuaremos e intentaremos nuevamente.',
        }));
      }

      // Auto-limpiar error después de 3 segundos
      setTimeout(() => {
        setState(prev => ({ ...prev, error: null }));
      }, 3000);
    }
  }, [state.solicitudId]);

  /**
   * PASO 12: Completar solicitud
   * 
   * PATCH /api/solicitudes/:id con { fechaRequerida, estado: 'COMPLETADA' }
   * Backend actualiza estado y dispara notificaciones
   * 
   * ESTE ES CRÍTICO: Si falla, SÍ bloqueamos y pedimos reintentar
   * 
   * @param fechaRequerida - Fecha del servicio
   * @throws Error si falla la completación
   */
  const completarSolicitud = useCallback(async (fechaRequerida: Date) => {
    if (!state.solicitudId) {
      throw new Error('No hay solicitud iniciada');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/solicitudes/${state.solicitudId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fechaRequerida: fechaRequerida.toISOString(),
          estado: 'COMPLETADA',
        }),
      });

      if (!response.ok) {
        throw new Error('Error al completar solicitud');
      }

      setState(prev => ({
        ...prev,
        datosForm: { ...prev.datosForm, fechaRequerida },
        isLoading: false,
      }));

      // Wizard: No hay mensaje de confirmación (se muestra PantallaCompletada)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al completar solicitud';
      setState(prev => ({
        ...prev,
        error: errorMsg,
        isLoading: false,
      }));
      throw error;
    }
  }, [state.solicitudId, state.datosForm]);

  /**
   * Avanzar al siguiente paso (Wizard)
   * 
   * Flujo simplificado:
   * 1. Guardar en BD según el paso:
   *    - Pasos 0-1: solo guardar en estado local (sin POST)
   *    - Paso 2: crear solicitud (POST con teléfono)
   *    - Paso 13: completar solicitud (PATCH con estado)
   *    - Resto: actualizar progresivo (PATCH)
   * 2. Calcular siguiente paso (saltando condicionales si aplica)
   * 3. Actualizar pasoActual
   * 
   * @param valor - Respuesta del usuario
   * @throws Error si falla guardado crítico (paso 2 o 13)
   */
  const siguientePaso = useCallback(async (valor: any) => {
    // Guardia: siguientePaso solo puede llamarse estando en un paso activo (0..TOTAL_PASOS-1)
    if (!pasoConfig) return;
    const campo = pasoConfig.campoFormulario;

    // UX: Limpiar respuestas conversacionales para campos de texto
    // (elimina "con", "mi nombre es", "soy", etc.)
    let valorLimpio = valor;
    if (typeof valor === 'string' && (campo === 'contacto' || campo === 'empresa' || campo === 'telefono')) {
      valorLimpio = limpiarRespuestaConversacional(valor);
    }

    // Actualizar estado local con el valor capturado
    // ESPECIAL: Si el campo es dimLargoCm (dimensions input), actualizar los 3 campos
    // ESPECIAL: Si el campo es contacto con valor objeto {contacto,empresa}, actualizar ambos
    // ESPECIAL: Si el campo es telefono con valor objeto {telefono,email}, actualizar ambos
    // ESPECIAL: Si el campo es origen con valor objeto {origen,destino}, actualizar ambos
    if (campo === 'pesoKg' && typeof valorLimpio === 'object' && valorLimpio !== null) {
      setState(prev => ({
        ...prev,
        datosForm: { 
          ...prev.datosForm, 
          pesoKg: valorLimpio.pesoKg,
          dimLargoCm: valorLimpio.dimLargoCm,
          dimAnchoCm: valorLimpio.dimAnchoCm,
          dimAltoCm: valorLimpio.dimAltoCm,
          volumenM3: valorLimpio.volumenM3 ?? null,
          vehiculoSugeridoId: valorLimpio.vehiculoSugeridoId ?? null,
          vehiculoSugeridoNombre: valorLimpio.vehiculoSugeridoNombre ?? null,
        },
      }));
    } else if (campo === 'dimLargoCm' && typeof valorLimpio === 'object' && valorLimpio !== null) {
      setState(prev => ({
        ...prev,
        datosForm: { 
          ...prev.datosForm, 
          dimLargoCm: valorLimpio.dimLargoCm,
          dimAnchoCm: valorLimpio.dimAnchoCm,
          dimAltoCm: valorLimpio.dimAltoCm,
        },
      }));
    } else if (campo === 'contacto' && typeof valorLimpio === 'object' && valorLimpio !== null && 'telefono' in valorLimpio) {
      // client-company-data: { contacto, telefono, empresa?, email?, telefonoEmpresa? }
      const cd = valorLimpio as { contacto: string; telefono: string; empresa?: string; email?: string; telefonoEmpresa?: string };
      setState(prev => ({
        ...prev,
        datosForm: {
          ...prev.datosForm,
          contacto: cd.contacto,
          ...(cd.telefono !== undefined ? { telefono: cd.telefono } : {}),
          ...(cd.empresa !== undefined ? { empresa: cd.empresa } : {}),
          ...(cd.email ? { email: cd.email } : {}),
          ...(cd.telefonoEmpresa !== undefined ? { telefonoEmpresa: cd.telefonoEmpresa } : {}),
        },
      }));
    } else if (campo === 'observaciones' && typeof valorLimpio === 'object' && valorLimpio !== null) {
      // confirmation-extras: captura observaciones + checklist completo si el usuario no saltó
      const ev = valorLimpio as {
        observaciones?: string; skip?: boolean; servicioExpreso?: boolean;
        cargaPeligrosa?: boolean; ayudanteCargue?: boolean; ayudanteDescargue?: boolean;
        cargaFragil?: boolean; necesitaEmpaque?: boolean;
        multiplesDestinosEntrega?: boolean; requiereEscolta?: boolean;
        accesosDificiles?: boolean; cargaSobredimensionada?: boolean;
        detalleCargaPeligrosa?: string; detalleMultiplesDestinos?: string;
        detalleAccesosDificiles?: string; detalleSobredimensionada?: string;
      };
      if (!ev.skip) {
        setState(prev => ({
          ...prev,
          datosForm: {
            ...prev.datosForm,
            observaciones:             ev.observaciones              ?? '',
            servicioExpreso:           ev.servicioExpreso            ?? false,
            cargaPeligrosa:            ev.cargaPeligrosa             ?? false,
            ayudanteCargue:            ev.ayudanteCargue             ?? false,
            ayudanteDescargue:         ev.ayudanteDescargue          ?? false,
            cargaFragil:               ev.cargaFragil                ?? false,
            necesitaEmpaque:           ev.necesitaEmpaque            ?? false,
            multiplesDestinosEntrega:  ev.multiplesDestinosEntrega   ?? false,
            requiereEscolta:           ev.requiereEscolta            ?? false,
            accesosDificiles:          ev.accesosDificiles           ?? false,
            cargaSobredimensionada:    ev.cargaSobredimensionada     ?? false,
            detalleCargaPeligrosa:     ev.detalleCargaPeligrosa      ?? '',
            detalleMultiplesDestinos:  ev.detalleMultiplesDestinos   ?? '',
            detalleAccesosDificiles:   ev.detalleAccesosDificiles    ?? '',
            detalleSobredimensionada:  ev.detalleSobredimensionada   ?? '',
          },
        }));
      }
    } else if (campo === 'origen' && typeof valorLimpio === 'object' && valorLimpio !== null && 'destino' in valorLimpio) {
      const rv = valorLimpio as { origen: string; destino: string; distanciaKm?: number; tramoDistancia?: string; tiempoTransitoDesc?: string };
      const tipoServicio = rv.origen && rv.destino && rv.origen === rv.destino ? 'URBANO' : 'NACIONAL';
      setState(prev => ({
        ...prev,
        datosForm: {
          ...prev.datosForm,
          origen: rv.origen,
          destino: rv.destino,
          tipoServicio,
          ...(typeof rv.distanciaKm === 'number' ? { distanciaKm: rv.distanciaKm } : {}),
          ...(rv.tramoDistancia           ? { tramoDistancia: rv.tramoDistancia }   : {}),
          ...(rv.tiempoTransitoDesc       ? { tiempoTransitoDesc: rv.tiempoTransitoDesc } : {}),
        },
      }));
    } else {
      setState(prev => ({
        ...prev,
        datosForm: { ...prev.datosForm, [campo]: valorLimpio },
      }));
    }

    // 1. Guardar en BD según el paso
    // ─────────────────────────────────────────────────────────────────────────
    // Estrategia:
    //   Pasos 0-3 → solo estado local, SIN llamadas a BD
    //   Paso 4  → POST (crear solicitud) + PATCH con todos los datos acumulados — BLOQUEANTE
    //   Paso 5  → PATCH extras + disparo cotización — fire-and-forget
    // ─────────────────────────────────────────────────────────────────────────

    if (state.pasoActual < TOTAL_PASOS - 2) {
      // ── Pasos 0-3: solo acumular en estado local, sin API ─────────────────
      // fall-through al bloque de cálculo de siguiente paso

    } else if (state.pasoActual === TOTAL_PASOS - 2) {
      // ── Paso 4: datos de contacto/empresa → POST + PATCH completo ─────────
      const cd = typeof valorLimpio === 'object' && valorLimpio !== null
        ? valorLimpio as { contacto: string; telefono: string; empresa?: string; email?: string; telefonoEmpresa?: string }
        : { contacto: '', telefono: '' };

      // Datos acumulados en pasos anteriores
      const d = state.datosForm;

      setState(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        // Si ya hay solicitudId (usuario volvió al paso 4), solo hacer PATCH
        let solicitudId = state.solicitudId;
        if (!solicitudId) {
          const postResp = await fetch('/api/solicitudes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              telefono: cd.telefono,
              contacto: cd.contacto,
              empresa:  cd.empresa || '',
            }),
          });
          if (!postResp.ok) {
            const err = await postResp.json();
            throw new Error(err.error || err.message || 'Error al crear solicitud');
          }
          const { data: postData, reanudada } = await postResp.json();

          if (reanudada === true) {
            // Solicitud EN_PROGRESO existente encontrada: reanudar desde el paso correcto
            const sol = postData as any;
            const datosReanudados = {
              contacto:     sol.contacto     || '',
              telefono:     sol.telefono     || '',
              empresa:      sol.empresa      || '',
              email:        sol.email        || '',
              origen:       sol.origen       || '',
              destino:      sol.destino      || '',
              tipoCarga:    sol.tipoCarga    || 'CARGA_GENERAL',
              tipoServicio: sol.tipoServicio || 'NACIONAL',
              pesoKg:       sol.pesoKg       ?? 0,
              dimLargoCm:   sol.dimLargoCm   ?? 0,
              dimAnchoCm:   sol.dimAnchoCm   ?? 0,
              dimAltoCm:    sol.dimAltoCm    ?? 0,
              ...(sol.distanciaKm        ? { distanciaKm:        sol.distanciaKm }        : {}),
              ...(sol.tramoDistancia     ? { tramoDistancia:     sol.tramoDistancia }     : {}),
              ...(sol.tiempoTransitoDesc ? { tiempoTransitoDesc: sol.tiempoTransitoDesc } : {}),
              ...(sol.telefonoEmpresa    ? { telefonoEmpresa:    sol.telefonoEmpresa }    : {}),
              ...(sol.vehiculoSugeridoId     ? { vehiculoSugeridoId:     sol.vehiculoSugeridoId }     : {}),
              ...(sol.vehiculoSugeridoNombre ? { vehiculoSugeridoNombre: sol.vehiculoSugeridoNombre } : {}),
            };

            // Reanudar desde el paso correcto según los campos ya completados
            const pasoReanudacion = !sol.origen || sol.origen === '' ? 0
              : !sol.pesoKg || sol.pesoKg === 0 ? 2
              : TOTAL_PASOS - 1;

            console.info('[reanudación] Retomando solicitud', sol.id, '→ paso', pasoReanudacion);

            setState(prev => ({
              ...prev,
              solicitudId: sol.id,
              datosForm:   { ...prev.datosForm, ...datosReanudados },
              pasoActual:  pasoReanudacion,
              isLoading:   false,
            }));
            return;
          }

          solicitudId = postData.id as string;
          setState(prev => ({ ...prev, solicitudId }));
        }

        // PATCH con todos los datos acumulados en pasos 0-3 + los del paso 4
        const patchResp = await fetch(`/api/solicitudes/${solicitudId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // Ruta (paso 0)
            origen:       d.origen,
            destino:      d.destino,
            tipoServicio: 'NACIONAL',
            ...(typeof d.distanciaKm === 'number' ? { distanciaKm: d.distanciaKm }             : {}),
            ...(d.tramoDistancia                  ? { tramoDistancia: d.tramoDistancia }        : {}),
            ...(d.tiempoTransitoDesc              ? { tiempoTransitoDesc: d.tiempoTransitoDesc } : {}),
            // Tipo de carga (paso 1)
            tipoCarga: d.tipoCarga,
            // Peso y dimensiones (paso 2)
            pesoKg:     d.pesoKg,
            dimLargoCm: d.dimLargoCm,
            dimAnchoCm: d.dimAnchoCm,
            dimAltoCm:  d.dimAltoCm,
            ...(d.volumenM3 !== undefined && d.volumenM3 !== null ? { volumenM3: d.volumenM3 }                         : {}),
            ...(d.vehiculoSugeridoId                              ? { vehiculoSugeridoId: d.vehiculoSugeridoId }       : {}),
            ...(d.vehiculoSugeridoNombre                          ? { vehiculoSugeridoNombre: d.vehiculoSugeridoNombre } : {}),
            // Fecha requerida (paso 3)
            fechaRequerida: d.fechaRequerida instanceof Date
              ? d.fechaRequerida.toISOString()
              : d.fechaRequerida || null,
            // Datos de empresa opcionales (paso 4)
            empresa: cd.empresa || '',
            ...(cd.email !== undefined                ? { email: cd.email }                              : {}),
            ...(cd.telefonoEmpresa !== undefined      ? { telefonoEmpresa: cd.telefonoEmpresa }          : {}),
          }),
        });
        if (!patchResp.ok) {
          const err = await patchResp.json();
          throw new Error(err.error || err.message || 'Error al guardar solicitud');
        }

        // Disparar cálculo SISETAC de forma asíncrona (fire-and-forget)
        // Los datos ya están guardados en BD → el endpoint puede calcular de inmediato
        fetch(`/api/solicitudes/${solicitudId}/cotizar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fase: 'sisetac' }),
        }).catch(err => console.error('[cotizar-sisetac] Error al generar cotización SISETAC:', err));

        setState(prev => ({
          ...prev,
          pasoActual: TOTAL_PASOS - 1,
          isLoading: false,
        }));
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error al guardar solicitud';
        setState(prev => ({ ...prev, error: errorMsg, isLoading: false }));
      }
      return;

    } else {
      // ── Paso 5: confirmation-extras → PATCH fire-and-forget + marcar completado
      const ev = (typeof valorLimpio === 'object' && valorLimpio !== null)
        ? valorLimpio as {
            observaciones?: string; skip?: boolean; servicioExpreso?: boolean;
            cargaPeligrosa?: boolean; ayudanteCargue?: boolean; ayudanteDescargue?: boolean;
            cargaFragil?: boolean; necesitaEmpaque?: boolean;
            multiplesDestinosEntrega?: boolean; requiereEscolta?: boolean;
            accesosDificiles?: boolean; cargaSobredimensionada?: boolean;
            detalleCargaPeligrosa?: string; detalleMultiplesDestinos?: string;
            detalleAccesosDificiles?: string; detalleSobredimensionada?: string;
          }
        : { skip: true };

      // Marcar como completado inmediatamente (optimista)
      setState(prev => ({
        ...prev,
        datosForm: ev.skip ? prev.datosForm : {
          ...prev.datosForm,
          observaciones:            ev.observaciones             ?? '',
          servicioExpreso:          ev.servicioExpreso           ?? false,
          cargaPeligrosa:           ev.cargaPeligrosa            ?? false,
          ayudanteCargue:           ev.ayudanteCargue            ?? false,
          ayudanteDescargue:        ev.ayudanteDescargue         ?? false,
          cargaFragil:              ev.cargaFragil               ?? false,
          necesitaEmpaque:          ev.necesitaEmpaque           ?? false,
          multiplesDestinosEntrega: ev.multiplesDestinosEntrega  ?? false,
          requiereEscolta:          ev.requiereEscolta           ?? false,
          accesosDificiles:         ev.accesosDificiles          ?? false,
          cargaSobredimensionada:   ev.cargaSobredimensionada    ?? false,
          detalleCargaPeligrosa:    ev.detalleCargaPeligrosa     ?? '',
          detalleMultiplesDestinos: ev.detalleMultiplesDestinos  ?? '',
          detalleAccesosDificiles:  ev.detalleAccesosDificiles   ?? '',
          detalleSobredimensionada: ev.detalleSobredimensionada  ?? '',
        },
        pasoActual: TOTAL_PASOS, // >= TOTAL_PASOS = completado
      }));

      // Actualizar cotización con datos RNDC de manifiestos (fire-and-forget)
      // La cotización SISETAC ya fue creada al completar el paso anterior (paso 4)
      const solicitudIdFinal = state.solicitudId;
      const dispararCotizacion = () => {
        if (!solicitudIdFinal) return;
        fetch(`/api/solicitudes/${solicitudIdFinal}/cotizar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fase: 'rndc' }),
        })
          .catch(err => console.error('[cotizar-rndc] Error al actualizar cotización con manifiestos RNDC:', err));
      };

      // PATCH fire-and-forget si el usuario envió detalles (no hizo "Listo, gracias")
      // La cotización se dispara DESPUÉS del PATCH para que todos los campos estén guardados
      if (!ev.skip && state.solicitudId) {
        fetch(`/api/solicitudes/${state.solicitudId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            observaciones:            ev.observaciones             ?? '',
            servicioExpreso:          ev.servicioExpreso           ?? false,
            cargaPeligrosa:           ev.cargaPeligrosa            ?? false,
            detalleCargaPeligrosa:    ev.detalleCargaPeligrosa     ?? '',
            ayudanteCargue:           ev.ayudanteCargue            ?? false,
            ayudanteDescargue:        ev.ayudanteDescargue         ?? false,
            cargaFragil:              ev.cargaFragil               ?? false,
            necesitaEmpaque:          ev.necesitaEmpaque           ?? false,
            multiplesDestinosEntrega: ev.multiplesDestinosEntrega  ?? false,
            detalleMultiplesDestinos: ev.detalleMultiplesDestinos  ?? '',
            requiereEscolta:          ev.requiereEscolta           ?? false,
            accesosDificiles:         ev.accesosDificiles          ?? false,
            detalleAccesosDificiles:  ev.detalleAccesosDificiles   ?? '',
            cargaSobredimensionada:   ev.cargaSobredimensionada    ?? false,
            detalleSobredimensionada: ev.detalleSobredimensionada  ?? '',
          }),
        })
          .catch(err => console.error('[guardado] PATCH paso 6 fallido (no bloqueante):', err))
          .finally(dispararCotizacion);
      } else {
        // El usuario saltó los extras: cotizar directamente
        dispararCotizacion();
      }
      return;
    }

    // 2. Calcular siguiente paso (saltar condicionales si aplica)
    let siguientePasoNum = state.pasoActual + 1;

    while (siguientePasoNum < TOTAL_PASOS) {
      const siguientePasoConfig = PASOS[siguientePasoNum];
      
      // Si no tiene condicional O la condicional se cumple, usar este paso
      if (!siguientePasoConfig.condicional || 
          siguientePasoConfig.condicional({ ...state.datosForm, [campo]: valorLimpio })) {
        break;
      }
      
      siguientePasoNum++;
    }

    // 3. Actualizar paso actual
    setState(prev => ({
      ...prev,
      pasoActual: siguientePasoNum,
    }));
  }, [
    pasoConfig,
    state.pasoActual,
    state.datosForm,
  ]);

  /**
   * Retroceder un paso (Wizard)
   * 
   * Permite volver atrás para editar respuestas anteriores
   */
  const pasoAnterior = useCallback(() => {
    if (state.pasoActual > 0) {
      setState(prev => ({
        ...prev,
        pasoActual: prev.pasoActual - 1,
        error: null,
        isLoading: false,
      }));
    }
  }, [state.pasoActual]);

  /**
   * Resetear wizard completo
   * 
   * Volver a landing page y limpiar todo
   */
  const resetear = useCallback(() => {
    setState({
      pasoActual: -1, // Volver a landing page
      solicitudId: null,
      isLoading: false,
      error: null,
      datosForm: {},
    });
  }, []);

  return {
    // Estado actual
    pasoActual: state.pasoActual,
    isLoading: state.isLoading,
    error: state.error,

    // Datos
    solicitudId: state.solicitudId,
    datosForm: state.datosForm,

    // Configuración del paso
    pasoConfig,
    mostrarPaso,
    progreso,

    // Acciones
    iniciarFormulario,
    siguientePaso,
    pasoAnterior,
    resetear,
  };
}
