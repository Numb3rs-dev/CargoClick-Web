/**
 * Hook useConversacion - Motor de Wizard con Guardado Progresivo
 *
 * Gestiona el flujo completo de pasos para cotización de transporte:
 * - Paso -1: Landing page (no iniciado)
 * - Pasos 0-3: Acumulación local (sin API)
 * - Paso 4: POST crear solicitud + PATCH todos los datos acumulados
 * - Paso 5: PATCH extras fire-and-forget + disparar cotización RNDC
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
  DatosFormulario,
} from '@/types';
import { PASOS, TOTAL_PASOS } from '../config/pasos';
import {
  limpiarRespuestaConversacional,
  aplicarValorAlForm,
  construirPayloadPaso4,
  construirPayloadExtras,
} from './conversacionUtils';
import {
  apiCrearSolicitud,
  apiPatchSolicitud,
  apiDispararCotizacion,
  apiCargarSolicitud,
} from './solicitudApiClient';

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

  // Se venimos de un enlace con ?reanudar=<id>, cargar la solicitud existente y
  // pre-rellenar el formulario saltando directamente al paso incompleto.
  useEffect(() => {
    if (!initialSolicitudId) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    apiCargarSolicitud(initialSolicitudId)
      .then(sol => {
        if (!sol) {
          setState(prev => ({ ...prev, isLoading: false }));
          return;
        }

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
          ...(sol.distanciaKm            ? { distanciaKm:             sol.distanciaKm }            : {}),
          ...(sol.tramoDistancia         ? { tramoDistancia:          sol.tramoDistancia }         : {}),
          ...(sol.tiempoTransitoDesc     ? { tiempoTransitoDesc:      sol.tiempoTransitoDesc }     : {}),
          ...(sol.vehiculoSugeridoId     ? { vehiculoSugeridoId:      sol.vehiculoSugeridoId }     : {}),
          ...(sol.vehiculoSugeridoNombre ? { vehiculoSugeridoNombre:  sol.vehiculoSugeridoNombre } : {}),
        };

        // Detectar el primer paso incompleto para reanudar ahí
        const pasoInicial =
          !sol.origen  || sol.origen  === '' ? 0       // sin ruta → paso 0 (origen-destino)
          : !sol.pesoKg || sol.pesoKg === 0  ? 2       // sin peso  → paso 2 (peso+dimensiones)
          : TOTAL_PASOS - 1;                           // todo completo → paso 5 (extras)

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
    const delta = aplicarValorAlForm(campo, valorLimpio);
    if (delta !== null) {
      setState(prev => ({
        ...prev,
        datosForm: { ...prev.datosForm, ...delta },
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

      // Datos acumulados en pasos anteriores (nota: state.datosForm aún NO tiene los del paso 4
      // porque el setState de arriba es asíncrono; por eso tomamos contacto/empresa desde `cd`).
      const d = state.datosForm;

      setState(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        // Si ya hay solicitudId (usuario volvió al paso 4), solo hacer PATCH
        let solicitudId = state.solicitudId;
        if (!solicitudId) {
          const resultado = await apiCrearSolicitud(
            cd.telefono  ?? '',
            cd.contacto  ?? '',
            cd.empresa   ?? '',
          );

          if (resultado.reanudada === true) {
            // Solicitud EN_PROGRESO existente encontrada: reanudar desde el paso correcto
            const sol = resultado.data;
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
              ...(sol.distanciaKm            ? { distanciaKm:             sol.distanciaKm }            : {}),
              ...(sol.tramoDistancia         ? { tramoDistancia:          sol.tramoDistancia }         : {}),
              ...(sol.tiempoTransitoDesc     ? { tiempoTransitoDesc:      sol.tiempoTransitoDesc }     : {}),
              ...(sol.telefonoEmpresa        ? { telefonoEmpresa:         sol.telefonoEmpresa }        : {}),
              ...(sol.vehiculoSugeridoId     ? { vehiculoSugeridoId:      sol.vehiculoSugeridoId }     : {}),
              ...(sol.vehiculoSugeridoNombre ? { vehiculoSugeridoNombre:  sol.vehiculoSugeridoNombre } : {}),
            };

            // Reanudar desde el paso correcto según los campos ya completados
            const pasoReanudacion =
              !sol.origen || sol.origen === '' ? 0
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

          solicitudId = resultado.id;
          setState(prev => ({ ...prev, solicitudId }));
        }

        // PATCH con todos los datos acumulados en pasos 0-3 + los del paso 4
        await apiPatchSolicitud(solicitudId, construirPayloadPaso4(d, cd));

        // Disparar cálculo SISETAC de forma asíncrona (fire-and-forget)
        apiDispararCotizacion(solicitudId, 'sisetac');

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
          ...construirPayloadExtras(ev),
        },
        pasoActual: TOTAL_PASOS, // >= TOTAL_PASOS = completado
      }));

      // Actualizar cotización con datos RNDC de manifiestos (fire-and-forget)
      const solicitudIdFinal = state.solicitudId;
      const dispararRndc = () => {
        if (!solicitudIdFinal) return;
        apiDispararCotizacion(solicitudIdFinal, 'rndc');
      };

      // PATCH fire-and-forget si el usuario envió detalles (no hizo "Listo, gracias")
      // La cotización RNDC se dispara DESPUÉS del PATCH para que todos los campos estén guardados
      if (!ev.skip && state.solicitudId) {
        apiPatchSolicitud(state.solicitudId, construirPayloadExtras(ev))
          .catch(err => console.error('[guardado] PATCH paso 5 fallido (no bloqueante):', err))
          .finally(dispararRndc);
      } else {
        // El usuario saltó los extras: cotizar directamente
        dispararRndc();
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
