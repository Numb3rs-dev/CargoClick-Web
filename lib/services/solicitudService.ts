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
import { logger } from '@/lib/utils/logger';
import { BusinessError } from '@/lib/utils/apiError';
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
  async crearSolicitudInicial(input: CrearSolicitudInicialInput): Promise<Solicitud & { reanudada?: boolean }> {
    logger.info('[SolicitudService]', 'Creando solicitud inicial');

    // Validar con Zod
    const datosValidados = crearSolicitudInicialSchema.parse(input);

    // VALIDACIÓN ANTI-DUPLICADOS: Verificar si existe solicitud reciente del MISMO cliente
    // (teléfono + contacto + empresa deben coincidir los tres; si cualquiera difiere es otro cliente)
    const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const solicitudReciente = await solicitudRepository.buscarClienteReciente(
      datosValidados.telefono,
      datosValidados.contacto,
      datosValidados.empresa ?? '',
      hace24Horas,
    );

    if (solicitudReciente) {
      // Si la solicitud está EN_PROGRESO, reanudarla en lugar de bloquear al usuario
      if (solicitudReciente.estado === 'EN_PROGRESO') {
        logger.info('[SolicitudService]', `Reanudando solicitud EN_PROGRESO: ${solicitudReciente.id}`);
        return { ...solicitudReciente, reanudada: true };
      }

      // Solicitud ya finalizada/cotizada → mensaje amigable con tiempo correcto
      const msDesdeCreacion = Date.now() - solicitudReciente.createdAt.getTime();
      const horasDesde = Math.floor(msDesdeCreacion / (1000 * 60 * 60));
      const minutosDesde = Math.floor(msDesdeCreacion / (1000 * 60));
      const tiempoDesc = horasDesde === 0
        ? minutosDesde <= 1 ? 'hace menos de 1 minuto' : `hace ${minutosDesde} minuto(s)`
        : `hace ${horasDesde} hora(s)`;

      const refVisible = `#COT-${solicitudReciente.codigoRef}`;
      throw new BusinessError(
        `Ya recibimos tu solicitud ${tiempoDesc}. ` +
        `Nos comunicaremos contigo pronto. Ref: ${refVisible}`,
        409
      );
    }

    // Generar ID único y código de referencia externo
    const id = ulid();
    const codigoRef = id.slice(-8).toUpperCase(); // últimos 8 chars del ULID — visible al cliente

    // Guardar en BD
    const solicitud = await solicitudRepository.guardar({
      id,
      codigoRef,
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

    logger.info('[SolicitudService]', `Solicitud creada exitosamente: ${solicitud.id}`);
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
    logger.info('[SolicitudService]', `Actualizando solicitud: ${id}`);

    // Validar con Zod (solo campos enviados)
    const datosValidados = actualizarSolicitudSchema.parse(input);

    // RN-05: Calcular revisionEspecial si se actualiza peso
    const revisionEspecial =
      datosValidados.pesoKg !== undefined
        ? datosValidados.pesoKg > 10000
        : undefined;

    if (revisionEspecial !== undefined) {
      logger.info('[SolicitudService]', `Peso ${datosValidados.pesoKg} kg → revisionEspecial = ${revisionEspecial}`);
    }

    // Actualizar en BD (sin cast a any: campos son compatibles con Prisma update input)
    const solicitudActualizada = await solicitudRepository.actualizar(id, {
      ...datosValidados,
      ...(revisionEspecial !== undefined ? { revisionEspecial } : {}),
    });

    logger.info('[SolicitudService]', `Solicitud actualizada exitosamente: ${id}`);
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
    logger.info('[SolicitudService]', `Completando solicitud: ${id}`);

    // Obtener solicitud actual
    const solicitudActual = await solicitudRepository.obtenerPorId(id);
    if (!solicitudActual) {
      throw new BusinessError('Solicitud no encontrada', 404);
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
      logger.warn('[SolicitudService]', 'Solicitud rechazada: contiene palabras prohibidas');
      throw new BusinessError(
        'No procesamos mudanzas de hogar. Nuestro servicio es exclusivo para transporte empresarial.',
        400
      );
    }

    // Validar solicitud completa con Zod
    const datosValidados = solicitudCompletaSchema.parse(solicitudCompleta);
    logger.info('[SolicitudService]', 'Validación completa exitosa');

    // RN-05: Verificar revisionEspecial
    const revisionEspecial = datosValidados.pesoKg > 10000;

    // Actualizar a estado COMPLETADA
    const solicitudFinal = await solicitudRepository.actualizar(id, {
      ...camposFinales,
      estado: 'COMPLETADA',
      revisionEspecial,
    });

    logger.info('[SolicitudService]', `Solicitud completada exitosamente: ${id}`);

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
    logger.info('[SolicitudService]', `Obteniendo solicitud: ${id}`);

    const solicitud = await solicitudRepository.obtenerPorId(id);
    if (!solicitud) {
      throw new BusinessError('Solicitud no encontrada', 404);
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
    logger.info('[SolicitudService]', `Listando solicitudes por estado: ${estado} limit: ${limit}`);

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
    logger.info('[SolicitudService]', `Cambiando estado de solicitud: ${id} → ${nuevoEstado}`);

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
      logger.warn('[SolicitudService]', `Transición no permitida: ${solicitud.estado} → ${nuevoEstado}`);
      throw new BusinessError(
        `Transición no permitida: ${solicitud.estado} → ${nuevoEstado}`,
        400
      );
    }

    const solicitudActualizada = await solicitudRepository.actualizar(id, { estado: nuevoEstado });

    logger.info('[SolicitudService]', `Estado cambiado exitosamente: ${id} → ${nuevoEstado}`);
    return solicitudActualizada;
  }

  /**
   * Dispara notificaciones de forma asíncrona (no bloqueante)
   * 
   * @param solicitud - Solicitud completada
   * @private
   */
  private dispararNotificaciones(solicitud: Solicitud): void {
    logger.info('[SolicitudService]', `Disparando notificaciones para solicitud: ${solicitud.id}`);

    // Importación dinámica para evitar dependencia circular
    // Se ejecuta en background, no bloquea respuesta al cliente
    import('@/lib/services/notificacionService').then(({ notificacionService }) => {
      notificacionService.enviarTodasLasNotificaciones(solicitud).catch((error: Error) => {
        logger.error('[SolicitudService] Error al enviar notificaciones', error);
        // No propagar error, las notificaciones son secundarias
      });
    }).catch((error: Error) => {
      logger.error('[SolicitudService] NotificacionService no disponible', error);
    });
  }
}

// Exportar instancia única
export const solicitudService = new SolicitudService();
