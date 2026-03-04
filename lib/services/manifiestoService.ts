/**
 * Servicio de Manifiestos Operativos — Módulo Operacional CargoClick
 *
 * ManifiestoOperativo agrupa remesas para un despacho físico de carga.
 * Es el documento principal que se registra en el RNDC (procesoid 4).
 *
 * Reglas de negocio críticas:
 * - Solo remesas con estadoRndc=REGISTRADA pueden asignarse a un manifiesto
 * - El conductor y el vehículo deben existir en el directorio local
 * - Se marca ENVIADO antes del SOAP RNDC (evita doble envío ante timeout)
 * - Anulación (procesoid 32) libera las remesas para reasignación
 * - Corrección = anular original + crear nuevo (si anulación falla, no se crea)
 * - codigoInterno es la clave de idempotencia ante el RNDC
 *
 * RNDC: HTTP 200 puede contener error — siempre verificar ingresoid.
 *
 * @module ManifiestoService
 */
import { manifiestoOperativoRepository } from '@/lib/repositories/manifiestoOperativoRepository';
import { remesaRepository } from '@/lib/repositories/remesaRepository';
import { conductorRepository } from '@/lib/repositories/conductorRepository';
import { vehiculoRepository } from '@/lib/repositories/vehiculoRepository';
import { llamarRndc } from './rndcClient';
import {
  buildXmlManifiesto,
  buildXmlAnularManifiesto,
  buildXmlCumplirManifiesto,
} from './rndcXmlBuilder';
import { generarConsecutivo } from '@/lib/utils/consecutivos';
import { prisma } from '@/lib/db/prisma';
import type { ManifiestoOperativo } from '@prisma/client';

// ───────────────────────────────────────────────────────────────────────────────
// TIPOS DE INPUT
// ───────────────────────────────────────────────────────────────────────────────

export interface CrearManifiestoInput {
  /** ID del negocio. Opcional cuando se crea en modo standalone. */
  nuevoNegocioId?: string | null;
  conductorCedula: string;
  vehiculoPlaca: string;
  placaRemolque?: string;
  /** IDs internos de las remesas a incluir (deben estar REGISTRADAS en el RNDC) */
  remesasIds: string[];
  origenMunicipio: string;
  /** Código DANE de 8 dígitos del municipio de origen */
  origenDane: string;
  destinoMunicipio: string;
  /** Código DANE de 8 dígitos del municipio de destino */
  destinoDane: string;
  fletePactado: number;
  valorAnticipo?: number;
  retencionIca?: number;
  /** Fecha en formato ISO "YYYY-MM-DD" */
  fechaExpedicion: string;
  /** Fecha en formato ISO "YYYY-MM-DD" */
  fechaDespacho: string;
  observaciones?: string;
}

// ───────────────────────────────────────────────────────────────────────────────
// SERVICIO
// ───────────────────────────────────────────────────────────────────────────────

export class ManifiestoService {
  /**
   * Crea el manifiesto en DB y lo envía al RNDC (procesoid 4) en una sola operación.
   *
   * Validaciones antes de crear:
   * 1. Conductor existe en el directorio local.
   * 2. Vehículo existe en el directorio local.
   * 3. Todas las remesas tienen estadoRndc=REGISTRADA.
   * 4. Todas las remesas pertenecen al mismo nuevoNegocioId.
   * 5. Ninguna remesa está ya asignada a otro manifiesto.
   *
   * Precondiciones: BACK-01 (schema), BACK-02 (repos), BACK-03 (rndcClient) ejecutados.
   * Postcondiciones:
   * - La transacción DB es atómica: registro del manifiesto + asignación de remesas.
   * - Se llama al RNDC con el manifiesto y sus remesas.
   * - Si RNDC exitoso: estadoManifiesto=REGISTRADO, numeroManifiesto=ingresoid.
   * - Si RNDC falla: estadoManifiesto vuelve a BORRADOR (reintentable con enviarRndc).
   *
   * @param input - Datos del manifiesto a crear
   * @returns RndcCallResult con exitoso, ingresoid, errorMensaje y syncRndcId
   */
  async crear(input: CrearManifiestoInput) {
    // 1. Validar conductor
    const conductor = await conductorRepository.findByCedula(input.conductorCedula);
    if (!conductor) {
      throw new Error(
        `Conductor ${input.conductorCedula} no existe en el directorio`
      );
    }

    // 2. Validar vehículo
    const vehiculo = await vehiculoRepository.findByPlaca(input.vehiculoPlaca);
    if (!vehiculo) {
      throw new Error(
        `Vehículo ${input.vehiculoPlaca} no existe en el directorio`
      );
    }

    // 3. Validar remesas (REGISTRADAS, sin manifiesto asignado)
    const { validas, errores } = await remesaRepository.validarParaManifiesto(
      input.remesasIds
    );
    if (!validas) throw new Error(errores.join('; '));

    // 4. Cargar remesas completas para construir peso total y el XML
    const remesas = await prisma.remesa.findMany({
      where: { id: { in: input.remesasIds } },
    });

    // 5. Calcular peso total (suma de pesoKg de todas las remesas)
    const pesoTotalKg = remesas.reduce((sum, r) => sum + r.pesoKg, 0);

    // 6. Crear el registro en DB (atómico: manifiesto + asignación de remesas)
    const manifiesto = await this._crearRegistroDB({
      input,
      pesoTotalKg,
    });

    // 7. Enviar al RNDC
    return this.enviarRndc(manifiesto.id);
  }

  /**
   * Envía un manifiesto existente al RNDC (procesoid 4).
   * Idempotente: si ya está REGISTRADO retorna sin llamar al RNDC.
   *
   * Patrón de seguridad ante timeout:
   * - Marca ENVIADO antes del SOAP.
   * - Si RNDC falla: vuelve a BORRADOR (reintentable).
   *
   * @param manifiestoId - ID del manifiesto a enviar
   * @returns RndcCallResult con exitoso, ingresoid, errorMensaje y syncRndcId
   */
  async enviarRndc(manifiestoId: string) {
    const manifiesto = await manifiestoOperativoRepository.findById(manifiestoId);
    if (!manifiesto) throw new Error(`Manifiesto ${manifiestoId} no encontrado`);

    // Idempotencia: ya registrado en el RNDC
    if (manifiesto.estadoManifiesto === 'REGISTRADO') {
      return {
        ya_registrado: true,
        numeroManifiesto: manifiesto.numeroManifiesto,
      };
    }

    // CRÍTICO: Marcar como ENVIADO ANTES del SOAP para evitar doble envío ante timeout
    await manifiestoOperativoRepository.actualizarEstado(manifiestoId, 'ENVIADO');

    // Solo incluir en el XML las remesas que tienen número RNDC
    const remesasConNumero = (manifiesto.remesas as Array<{ numeroRemesaRndc: string | null; pesoKg: number }>)
      .filter((r) => r.numeroRemesaRndc !== null);

    const xml = buildXmlManifiesto(
      manifiesto as ManifiestoOperativo,
      remesasConNumero.map((r) => ({
        numeroRemesaRndc: r.numeroRemesaRndc!,
        pesoKg: r.pesoKg,
      }))
    );

    const resultado = await llamarRndc(xml, {
      processId: 4,
      tipoSolicitud: 1,
      entidadTipo: 'ManifiestoOperativo',
      entidadId: manifiestoId,
    });

    if (resultado.exitoso && resultado.ingresoid) {
      // RNDC asignó número de manifiesto
      await manifiestoOperativoRepository.actualizarEstado(
        manifiestoId,
        'REGISTRADO',
        { numeroManifiesto: resultado.ingresoid }
      );
    } else {
      // Volver a BORRADOR para que el operador pueda reintentar
      await manifiestoOperativoRepository.actualizarEstado(manifiestoId, 'BORRADOR');
    }

    return resultado;
  }

  /**
   * Anula un manifiesto en el RNDC (procesoid 32) y libera sus remesas.
   *
   * Precondiciones:
   * - El manifiesto existe y estadoManifiesto=REGISTRADO.
   * - Tiene numeroManifiesto asignado por el RNDC.
   *
   * Postcondiciones (solo si RNDC exitoso):
   * - estadoManifiesto=ANULADO
   * - motivoAnulacion registrado
   * - Todas las remesas del manifiesto: manifiestoOperativoId=null, estado=PENDIENTE
   *   (quedan disponibles para asignarse a otro manifiesto)
   *
   * CRÍTICO: Si el procesoid 32 falla, NO se liberan las remesas. Se propaga el error.
   *
   * @param manifiestoId    - ID del manifiesto a anular
   * @param motivoAnulacion - Descripción del motivo (máx 200 chars para el RNDC)
   * @returns RndcCallResult con exitoso, ingresoid, errorMensaje y syncRndcId
   */
  async anular(manifiestoId: string, motivoAnulacion: string) {
    const manifiesto = await manifiestoOperativoRepository.findById(manifiestoId);
    if (!manifiesto) throw new Error('Manifiesto no encontrado');

    if (manifiesto.estadoManifiesto !== 'REGISTRADO') {
      throw new Error('Solo se pueden anular manifiestos en estado REGISTRADO');
    }
    if (!manifiesto.numeroManifiesto) {
      throw new Error('El manifiesto no tiene número RNDC asignado');
    }

    const xml = buildXmlAnularManifiesto(
      manifiesto.numeroManifiesto,
      motivoAnulacion
    );

    const resultado = await llamarRndc(xml, {
      processId: 32,
      tipoSolicitud: 1,
      entidadTipo: 'ManifiestoOperativo',
      entidadId: manifiestoId,
    });

    if (resultado.exitoso) {
      // Actualizar estado del manifiesto y registrar motivo
      await manifiestoOperativoRepository.actualizarEstado(manifiestoId, 'ANULADO');
      await prisma.manifiestoOperativo.update({
        where: { id: manifiestoId },
        data: { motivoAnulacion },
      });

      // Liberar las remesas para que puedan asignarse a un nuevo manifiesto
      await prisma.remesa.updateMany({
        where: { manifiestoOperativoId: manifiestoId },
        data: { manifiestoOperativoId: null, estado: 'PENDIENTE' },
      });
    }

    return resultado;
  }

  /**
   * Corrección completa de un manifiesto:
   * 1. Anula el manifiesto original (procesoid 32).
   * 2. Crea uno nuevo con los datos originales + correcciones (procesoid 4).
   *    El nuevo manifiesto registra reemplazaManifiestoId = original para trazabilidad.
   *
   * REGLA CRÍTICA: Si el procesoid 32 falla, NO se crea el nuevo manifiesto.
   * El error de anulación se propaga al caller.
   *
   * Precondiciones:
   * - El manifiesto original existe y está REGISTRADO en el RNDC.
   * - Las remesas (originales o nuevas) deben estar REGISTRADAS en el RNDC.
   *
   * @param manifiestoOriginalId - ID del manifiesto a corregir
   * @param motivoAnulacion      - Motivo de la anulación del original
   * @param datosCorregidos      - Solo los campos que cambian; el resto se copia del original
   * @returns Objeto con el ID del manifiesto anulado y el resultado del nuevo
   */
  async corregir(
    manifiestoOriginalId: string,
    motivoAnulacion: string,
    datosCorregidos: Partial<CrearManifiestoInput>
  ) {
    const original = await manifiestoOperativoRepository.findById(manifiestoOriginalId);
    if (!original) throw new Error('Manifiesto original no encontrado');

    // Paso 1: Anular el manifiesto original (procesoid 32)
    // Si falla, se lanza el error y el paso 2 NO se ejecuta
    const anulacion = await this.anular(manifiestoOriginalId, motivoAnulacion);
    if (!anulacion.exitoso) {
      throw new Error(
        `No se pudo anular el manifiesto original: ${anulacion.errorMensaje}`
      );
    }

    // Paso 2: Construir los datos del nuevo manifiesto (original + correcciones)
    const remesasOriginales = (original.remesas as Array<{ id: string }>).map(
      (r) => r.id
    );

    const nuevosInput: CrearManifiestoInput = {
      nuevoNegocioId: original.nuevoNegocioId ?? undefined,
      conductorCedula:
        datosCorregidos.conductorCedula ?? original.conductorCedula,
      vehiculoPlaca:
        datosCorregidos.vehiculoPlaca ?? original.vehiculoPlaca,
      placaRemolque:
        datosCorregidos.placaRemolque ?? original.placaRemolque ?? undefined,
      remesasIds: datosCorregidos.remesasIds ?? remesasOriginales,
      origenMunicipio:
        datosCorregidos.origenMunicipio ?? original.origenMunicipio,
      origenDane: datosCorregidos.origenDane ?? original.origenDane,
      destinoMunicipio:
        datosCorregidos.destinoMunicipio ?? original.destinoMunicipio,
      destinoDane: datosCorregidos.destinoDane ?? original.destinoDane,
      fletePactado:
        datosCorregidos.fletePactado ?? Number(original.fletePactado),
      valorAnticipo:
        datosCorregidos.valorAnticipo ?? Number(original.valorAnticipo),
      retencionIca:
        datosCorregidos.retencionIca ?? original.retencionIca,
      fechaExpedicion:
        datosCorregidos.fechaExpedicion ??
        original.fechaExpedicion.toISOString().split('T')[0],
      fechaDespacho:
        datosCorregidos.fechaDespacho ??
        original.fechaDespacho.toISOString().split('T')[0],
      observaciones:
        datosCorregidos.observaciones ?? original.observaciones ?? undefined,
    };

    // Paso 3: Crear el nuevo manifiesto y enviarlo al RNDC.
    // Usamos el helper privado para obtener el ID del nuevo manifiesto
    // y poder enlazarlo a reemplazaManifiestoId en la misma operación.
    const pesoTotalKg = await prisma.remesa
      .findMany({ where: { id: { in: nuevosInput.remesasIds } } })
      .then((remesas) => remesas.reduce((sum, r) => sum + r.pesoKg, 0));

    // Validar las remesas del nuevo manifiesto
    const { validas, errores } = await remesaRepository.validarParaManifiesto(
      nuevosInput.remesasIds
    );
    if (!validas) throw new Error(errores.join('; '));

    // Crear el nuevo registro en DB con el enlace de corrección
    const nuevoManifiesto = await this._crearRegistroDB({
      input: nuevosInput,
      pesoTotalKg,
      reemplazaManifiestoId: manifiestoOriginalId,
    });

    // Enviar el nuevo manifiesto al RNDC
    const rndcResult = await this.enviarRndc(nuevoManifiesto.id);

    return {
      manifiestoAnuladoId: manifiestoOriginalId,
      nuevoManifiestoId: nuevoManifiesto.id,
      rndcResult,
    };
  }

  /**
   * Cumple (cierra) un manifiesto completado en el RNDC (procesoid 6).
   * Actualiza el negocio padre a COMPLETADO si la operación es exitosa.
   *
   * Precondiciones:
   * - El manifiesto existe y estadoManifiesto=REGISTRADO.
   * - Tiene numeroManifiesto asignado por el RNDC.
   *
   * Postcondiciones (si RNDC exitoso):
   * - estadoManifiesto=CULMINADO
   * - NuevoNegocio.estado=COMPLETADO
   *
   * @param manifiestoId - ID del manifiesto a cumplir
   * @returns RndcCallResult con exitoso, ingresoid, errorMensaje y syncRndcId
   */
  async cumplir(manifiestoId: string) {
    const manifiesto = await manifiestoOperativoRepository.findById(manifiestoId);
    if (!manifiesto) throw new Error('Manifiesto no encontrado');

    if (manifiesto.estadoManifiesto !== 'REGISTRADO') {
      throw new Error('Solo se pueden cumplir manifiestos REGISTRADOS');
    }

    const xml = buildXmlCumplirManifiesto(manifiesto.numeroManifiesto!);

    const resultado = await llamarRndc(xml, {
      processId: 6,
      tipoSolicitud: 1,
      entidadTipo: 'ManifiestoOperativo',
      entidadId: manifiestoId,
    });

    if (resultado.exitoso) {
      await manifiestoOperativoRepository.actualizarEstado(manifiestoId, 'CULMINADO');
      // Cerrar el negocio operativamente (solo si el manifiesto pertenece a uno)
      if (manifiesto.nuevoNegocioId) {
        await prisma.nuevoNegocio.update({
          where: { id: manifiesto.nuevoNegocioId },
          data: { estado: 'COMPLETADO' },
        });
      }
    }

    return resultado;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPERS PRIVADOS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Crea el registro del manifiesto en DB dentro de una $transaction atómica:
   * - Inserta el ManifiestoOperativo
   * - Asigna las remesas al manifiesto (manifiestoOperativoId + estado=ASIGNADA)
   *
   * @param params.input                 - Datos del manifiesto
   * @param params.pesoTotalKg           - Suma de pesoKg de las remesas (ya calculado por el caller)
   * @param params.reemplazaManifiestoId - ID del manifiesto anulado (solo en flujo de corrección)
   * @returns El ManifiestoOperativo creado
   */
  private async _crearRegistroDB(params: {
    input: CrearManifiestoInput;
    pesoTotalKg: number;
    reemplazaManifiestoId?: string;
  }): Promise<ManifiestoOperativo> {
    const { input, pesoTotalKg, reemplazaManifiestoId } = params;

    return prisma.$transaction(async (tx) => {
      const codigoInterno = await generarConsecutivo(
        tx as Parameters<typeof generarConsecutivo>[0],
        'manifiestoOperativo',
        'MF'
      );

      const manifiesto = await tx.manifiestoOperativo.create({
        data: {
          codigoInterno,
          nuevoNegocioId: input.nuevoNegocioId ?? undefined,
          conductorCedula: input.conductorCedula,
          vehiculoPlaca: input.vehiculoPlaca,
          ...(input.placaRemolque && { placaRemolque: input.placaRemolque }),
          origenMunicipio: input.origenMunicipio,
          origenDane: input.origenDane,
          destinoMunicipio: input.destinoMunicipio,
          destinoDane: input.destinoDane,
          pesoTotalKg,
          fletePactado: input.fletePactado,
          valorAnticipo: input.valorAnticipo ?? 0,
          retencionIca: input.retencionIca ?? 4,
          fechaExpedicion: new Date(input.fechaExpedicion),
          fechaDespacho: new Date(input.fechaDespacho),
          ...(input.observaciones && { observaciones: input.observaciones }),
          estadoManifiesto: 'BORRADOR',
          ...(reemplazaManifiestoId && { reemplazaManifiestoId }),
        },
      });

      // Asignar las remesas a este manifiesto (atómico con la creación)
      await tx.remesa.updateMany({
        where: { id: { in: input.remesasIds } },
        data: { manifiestoOperativoId: manifiesto.id, estado: 'ASIGNADA' },
      });

      return manifiesto;
    });
  }
}

/** Singleton exportado para uso en API Routes */
export const manifiestoService = new ManifiestoService();
