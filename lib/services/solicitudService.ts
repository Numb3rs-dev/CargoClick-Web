/**
 * Servicio de lógica de negocio para Solicitudes
 * 
 * Responsabilidades:
 * - Aplicar reglas de negocio
 * - Validar datos con Zod
 * - Generar IDs únicos (ULID)
 * - Calcular campos derivados (revisionEspecial)
 * - Orquestar operaciones con repositorio
 * - Coordinar notificaciones (sin bloquear)
 * 
 * NO incluye:
 * - Operaciones de persistencia directas (usa repositorio)
 * - Envío directo de notificaciones (usa NotificacionService)
 * 
 * @module SolicitudService
 */

import { ulid } from 'ulid';
import { Solicitud } from '.prisma/client';
import { solicitudRepository } from '@/lib/repositories/solicitudRepository';
import {
  crearSolicitudInicialSchema,
  actualizarSolicitudSchema,
  solicitudCompletaSchema,
  type CrearSolicitudInicialInput,
  type ActualizarSolicitudInput,
} from '@/lib/validations/schemas';

export class SolicitudService {
  /**
   * Crea una solicitud inicial con estado EN_PROGRESO (paso 2 del flujo conversacional)
   * 
   * VALIDACIÓN ANTI-DUPLICADOS:
   * - Verifica si existe solicitud con mismo teléfono en últimas 24h
   * - Si existe: retorna error amigable con ID de solicitud previa
   * - Si no existe: crea nueva solicitud
   * 
   * @param input - Requiere teléfono, contacto y empresa (opcional)
   * @returns Solicitud recién creada con ID generado
   * @throws Error si validación falla o hay duplicado reciente
   * 
   * @example
   * const solicitud = await service.crearSolicitudInicial({
   *   telefono: '+573001234567',
   *   contacto: 'Juan Pérez',
   *   empresa: 'ACME Corp' // opcional
   * });
   * // solicitud.id = "01JXX..."
   * // solicitud.estado = "EN_PROGRESO"
   */
  async crearSolicitudInicial(input: CrearSolicitudInicialInput): Promise<Solicitud> {
    console.log('[SolicitudService] Creando solicitud inicial con datos:', input);

    // Validar con Zod
    const datosValidados = crearSolicitudInicialSchema.parse(input);

    // VALIDACIÓN ANTI-DUPLICADOS: Verificar si existe solicitud reciente con mismo teléfono
    const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const solicitudReciente = await solicitudRepository.buscarPorTelefonoReciente(
      datosValidados.telefono,
      hace24Horas
    );

    if (solicitudReciente) {
      const horasDesdeCreacion = Math.floor(
        (Date.now() - solicitudReciente.createdAt.getTime()) / (1000 * 60 * 60)
      );
      
      throw new Error(
        `Ya recibimos tu solicitud hace ${horasDesdeCreacion} hora(s). ` +
        `Nos comunicaremos contigo pronto. ID: ${solicitudReciente.id}`
      );
    }

    // Generar ID único
    const id = ulid();

    // Guardar en BD
    const solicitud = await solicitudRepository.guardar({
      id,
      telefono: datosValidados.telefono,
      contacto: datosValidados.contacto,
      empresa: datosValidados.empresa || '', // Opcional
      email: '',
      tipoServicio: 'URBANO', // Default, se actualizará
      origen: '',
      tipoCarga: 'CARGA_GENERAL', // Default
      pesoKg: 0,
      dimLargoCm: 0,
      dimAnchoCm: 0,
      dimAltoCm: 0,
      valorAsegurado: 0,
      condicionesCargue: [],
      fechaRequerida: new Date(),
      estado: 'EN_PROGRESO',
      revisionEspecial: false,
    });

    console.info('[SolicitudService] Solicitud creada exitosamente:', solicitud.id);
    return solicitud;
  }

  /**
   * Actualiza campos de una solicitud existente (guardado progresivo)
   * 
   * Aplica reglas de negocio:
   * - RN-05: Si pesoKg > 10,000 → revisionEspecial = true
   * 
   * @param id - ULID de la solicitud
   * @param input - Campos a actualizar (parcial)
   * @returns Solicitud actualizada
   * @throws Error si ID no existe o validación falla
   * 
   * @example
   * const actualizada = await service.actualizarSolicitud('01JXX...', {
   *   contacto: 'Juan Pérez',
   *   email: 'juan@acme.com'
   * });
   */
  async actualizarSolicitud(id: string, input: ActualizarSolicitudInput): Promise<Solicitud> {
    console.log('[SolicitudService] Actualizando solicitud:', id, input);

    // Validar con Zod (solo campos enviados)
    const datosValidados = actualizarSolicitudSchema.parse(input);

    // Preparar datos para actualización
    const dataUpdate: any = { ...datosValidados };

    // RN-05: Calcular revisionEspecial si se actualiza peso
    if (datosValidados.pesoKg !== undefined) {
      dataUpdate.revisionEspecial = datosValidados.pesoKg > 10000;
      console.log(
        `[SolicitudService] Peso ${datosValidados.pesoKg} kg → revisionEspecial = ${dataUpdate.revisionEspecial}`
      );
    }

    // Actualizar en BD
    const solicitudActualizada = await solicitudRepository.actualizar(id, dataUpdate);

    console.info('[SolicitudService] Solicitud actualizada exitosamente:', id);
    return solicitudActualizada;
  }

  /**
   * Completa una solicitud y dispara notificaciones (paso final)
   * 
   * Valida solicitud completa con todas las reglas de negocio:
   * - RN-01: Destino obligatorio si tipo = NACIONAL
   * - RN-02: Rechaza mudanzas de hogar
   * - RN-03: Peso en rango válido
   * - RN-04: Fecha no en el pasado
   * 
   * @param id - ULID de la solicitud
   * @param camposFinales - Últimos campos a completar
   * @returns Solicitud completada con estado COMPLETADA
   * @throws Error si validación completa falla
   * 
   * @example
   * const completa = await service.completarSolicitud('01JXX...', {
   *   fechaRequerida: new Date('2026-03-01')
   * });
   * // Se dispararon notificaciones (email + WhatsApp)
   */
  async completarSolicitud(
    id: string,
    camposFinales: Partial<ActualizarSolicitudInput>
  ): Promise<Solicitud> {
    console.log('[SolicitudService] Completando solicitud:', id, camposFinales);

    // Obtener solicitud actual
    const solicitudActual = await solicitudRepository.obtenerPorId(id);
    if (!solicitudActual) {
      throw new Error('Solicitud no encontrada');
    }

    // Combinar datos actuales con campos finales
    const solicitudCompleta = {
      ...solicitudActual,
      ...camposFinales,
      // Convertir Prisma.Decimal a number para validación
      pesoKg: Number(solicitudActual.pesoKg),
      valorAsegurado: Number(solicitudActual.valorAsegurado),
      dimLargoCm: Number(solicitudActual.dimLargoCm),
      dimAnchoCm: Number(solicitudActual.dimAnchoCm),
      dimAltoCm: Number(solicitudActual.dimAltoCm),
    };

    // RN-02: Rechazar si contiene palabras prohibidas
    // Solo validar tipoCarga ya que dimensiones ahora son campos numéricos
    const textoCompleto = solicitudCompleta.tipoCarga.toLowerCase();

    if (textoCompleto.includes('hogar') || textoCompleto.includes('mudanza')) {
      console.error('[SolicitudService] Solicitud rechazada: contiene palabras prohibidas');
      throw new Error(
        'No procesamos mudanzas de hogar. Nuestro servicio es exclusivo para transporte empresarial.'
      );
    }

    // Validar solicitud completa con Zod
    const datosValidados = solicitudCompletaSchema.parse(solicitudCompleta);
    console.log('[SolicitudService] Validación completa exitosa');

    // RN-05: Verificar revisionEspecial
    const revisionEspecial = datosValidados.pesoKg > 10000;

    // Actualizar a estado COMPLETADA
    const solicitudFinal = await solicitudRepository.actualizar(id, {
      ...camposFinales,
      estado: 'COMPLETADA',
      revisionEspecial,
    });

    console.info('[SolicitudService] Solicitud completada exitosamente:', id);

    // Disparar notificaciones (asíncrono, no bloqueante)
    this.dispararNotificaciones(solicitudFinal);

    return solicitudFinal;
  }

  /**
   * Obtiene una solicitud por su ID
   * 
   * @param id - ULID de la solicitud
   * @returns Solicitud encontrada
   * @throws Error si no existe
   */
  async obtenerPorId(id: string): Promise<Solicitud> {
    console.log('[SolicitudService] Obteniendo solicitud:', id);

    const solicitud = await solicitudRepository.obtenerPorId(id);
    if (!solicitud) {
      throw new Error('Solicitud no encontrada');
    }

    return solicitud;
  }

  /**
   * Lista solicitudes por estado
   * 
   * @param estado - Estado a filtrar
   * @param limit - Máximo de resultados
   * @returns Array de solicitudes
   */
  async listarPorEstado(estado: 'PENDIENTE' | 'COTIZADO' | 'RECHAZADO' | 'CERRADO', limit?: number): Promise<Solicitud[]> {
    console.log('[SolicitudService] Listando solicitudes por estado:', estado, 'limit:', limit);

    return await solicitudRepository.listarPorEstado(estado, limit);
  }

  /**
   * Cambia el estado de una solicitud validando transiciones permitidas
   * 
   * Transiciones válidas:
   * - PENDIENTE → COTIZADO
   * - PENDIENTE → RECHAZADO
   * - COTIZADO → CERRADO
   * - COTIZADO → RECHAZADO
   * 
   * @param id - ULID de la solicitud
   * @param nuevoEstado - Estado destino
   * @returns Solicitud actualizada
   * @throws Error si transición no permitida
   */
  async cambiarEstado(
    id: string,
    nuevoEstado: 'PENDIENTE' | 'COTIZADO' | 'RECHAZADO' | 'CERRADO'
  ): Promise<Solicitud> {
    console.log('[SolicitudService] Cambiando estado de solicitud:', id, '→', nuevoEstado);

    const solicitud = await this.obtenerPorId(id);

    // Validar transición de estado (RN-07)
    const transicionesValidas: Record<string, string[]> = {
      PENDIENTE: ['COTIZADO', 'RECHAZADO'],
      COTIZADO: ['CERRADO', 'RECHAZADO'],
      RECHAZADO: [], // Estado terminal
      CERRADO: [], // Estado terminal
    };

    const estadosPermitidos = transicionesValidas[solicitud.estado] || [];
    if (!estadosPermitidos.includes(nuevoEstado)) {
      console.error(
        `[SolicitudService] Transición no permitida: ${solicitud.estado} → ${nuevoEstado}`
      );
      throw new Error(
        `Transición no permitida: ${solicitud.estado} → ${nuevoEstado}`
      );
    }

    const solicitudActualizada = await solicitudRepository.actualizar(id, { estado: nuevoEstado });

    console.info('[SolicitudService] Estado cambiado exitosamente:', id, '→', nuevoEstado);
    return solicitudActualizada;
  }

  /**
   * Dispara notificaciones de forma asíncrona (no bloqueante)
   * 
   * @param solicitud - Solicitud completada
   * @private
   */
  private dispararNotificaciones(solicitud: Solicitud): void {
    console.log('[SolicitudService] Disparando notificaciones para solicitud:', solicitud.id);

    // Importación dinámica para evitar dependencia circular
    // Se ejecuta en background, no bloquea respuesta al cliente
    import('@/lib/services/notificacionService').then(({ notificacionService }) => {
      notificacionService.enviarTodasLasNotificaciones(solicitud).catch((error: Error) => {
        console.error('[SolicitudService] Error al enviar notificaciones:', error);
        // No propagar error, las notificaciones son secundarias
      });
    }).catch((error: Error) => {
      console.error('[SolicitudService] NotificacionService no disponible:', error);
    });
  }
}

// Exportar instancia única
export const solicitudService = new SolicitudService();
