/**
 * Servicio de Vehículos — Módulo Operacional CargoClick
 *
 * Orquesta el directorio local de vehículos y la sincronización al RNDC.
 * La creación en el directorio y el sync RNDC son dos operaciones separadas:
 * primero se crea el vehículo localmente, luego el operador ejecuta el sync.
 *
 * Reglas de negocio:
 * - No se pueden registrar dos vehículos con la misma placa
 * - El sync RNDC usa procesoid 12 (Registrar/Actualizar Vehículo)
 * - configVehiculo es requerido para el XML RNDC (C2, C3, C2S2, C3S3, etc.)
 *
 * @module VehiculoService
 */
import { vehiculoRepository } from '@/lib/repositories/vehiculoRepository';
import { llamarRndc } from './rndcClient';
import { buildXmlVehiculo } from './rndcXmlBuilder';
import type { Prisma } from '@prisma/client';

// ───────────────────────────────────────────────────────────────────────────────
// TIPOS DE INPUT
// ───────────────────────────────────────────────────────────────────────────────

export interface CrearVehiculoInput {
  placa: string;
  propietarioNombre?: string;
  propietarioId?: string;
  /** Configuración vehicular SISETAC: C2, C3, C2S2, C2S3, C3S2, C3S3 */
  configVehiculo?: string;
  capacidadTon?: number;
  tipoVehiculo?: string;
  anioVehiculo?: number;
  /** Fecha de vigencia SOAT en formato ISO "YYYY-MM-DD" */
  soatVigencia?: string;
  /** Fecha de vigencia RTM en formato ISO "YYYY-MM-DD" */
  rtmVigencia?: string;
  notas?: string;
}

// ───────────────────────────────────────────────────────────────────────────────
// SERVICIO
// ───────────────────────────────────────────────────────────────────────────────

export class VehiculoService {
  /**
   * Crea un vehículo en el directorio local.
   *
   * NO sincroniza al RNDC en esta operación — el sync es una acción separada
   * que el operador ejecuta desde el panel de directorio.
   *
   * Precondiciones: No debe existir vehículo con la misma placa.
   * Postcondiciones: El vehículo queda en DB, disponible para asignar a manifiestos
   *                  una vez que se sincronice exitosamente con el RNDC.
   *
   * @param input - Datos del vehículo a crear
   * @returns El vehículo creado
   * @throws {Error} Si ya existe un vehículo con esa placa
   */
  async crear(input: CrearVehiculoInput) {
    const existente = await vehiculoRepository.findByPlaca(input.placa);
    if (existente) {
      throw new Error(`Ya existe un vehículo con placa ${input.placa}`);
    }

    return vehiculoRepository.create({
      placa: input.placa.toUpperCase(),
      ...(input.propietarioNombre && { propietarioNombre: input.propietarioNombre }),
      ...(input.propietarioId && { propietarioId: input.propietarioId }),
      ...(input.configVehiculo && { configVehiculo: input.configVehiculo }),
      ...(input.capacidadTon !== undefined && { capacidadTon: input.capacidadTon }),
      ...(input.tipoVehiculo && { tipoVehiculo: input.tipoVehiculo }),
      ...(input.anioVehiculo !== undefined && { anioVehiculo: input.anioVehiculo }),
      ...(input.soatVigencia && { soatVigencia: new Date(input.soatVigencia) }),
      ...(input.rtmVigencia && { rtmVigencia: new Date(input.rtmVigencia) }),
      ...(input.notas && { notas: input.notas }),
    });
  }

  /**
   * Actualiza datos de un vehículo existente en el directorio local.
   *
   * Nota: Si se cambia configVehiculo tras un sync RNDC, el operador
   * debe volver a ejecutar syncRndc para reflejar el cambio en el Ministerio.
   *
   * @param placa - Placa del vehículo a actualizar
   * @param data  - Campos a actualizar (parcial)
   * @returns El vehículo actualizado
   * @throws {Error} Si el vehículo no existe
   */
  async actualizar(placa: string, data: Partial<CrearVehiculoInput>) {
    const vehiculo = await vehiculoRepository.findByPlaca(placa);
    if (!vehiculo) throw new Error(`Vehículo ${placa} no encontrado`);

    const updateData: Prisma.VehiculoUpdateInput = {};

    if (data.propietarioNombre !== undefined) updateData.propietarioNombre = data.propietarioNombre;
    if (data.propietarioId !== undefined) updateData.propietarioId = data.propietarioId;
    if (data.configVehiculo !== undefined) updateData.configVehiculo = data.configVehiculo;
    if (data.capacidadTon !== undefined) updateData.capacidadTon = data.capacidadTon;
    if (data.tipoVehiculo !== undefined) updateData.tipoVehiculo = data.tipoVehiculo;
    if (data.anioVehiculo !== undefined) updateData.anioVehiculo = data.anioVehiculo;
    if (data.soatVigencia) updateData.soatVigencia = new Date(data.soatVigencia);
    if (data.rtmVigencia) updateData.rtmVigencia = new Date(data.rtmVigencia);
    if (data.notas !== undefined) updateData.notas = data.notas;

    return vehiculoRepository.update(placa, updateData);
  }

  /**
   * Registra o actualiza el vehículo en el RNDC (procesoid 12).
   * Guarda el resultado completo en SyncRndc (append-only).
   *
   * Precondiciones:
   * - El vehículo debe existir en el directorio local.
   * - Debe tener configVehiculo para que el XML sea válido.
   *
   * Postcondiciones:
   * - Si exitoso: el vehículo queda habilitado para asignar a manifiestos en el Ministerio.
   * - En cualquier caso: se crea un registro en SyncRndc con el resultado.
   *
   * RNDC: HTTP 200 puede contener error — siempre verificar ingresoid.
   *
   * @param placa - Placa del vehículo a sincronizar
   * @returns RndcCallResult con exitoso, ingresoid, errorMensaje y syncRndcId
   * @throws {Error} Si el vehículo no existe o no tiene configVehiculo
   */
  async syncRndc(placa: string) {
    const vehiculo = await vehiculoRepository.findByPlaca(placa);
    if (!vehiculo) throw new Error(`Vehículo ${placa} no encontrado`);
    if (!vehiculo.configVehiculo) {
      throw new Error(
        `El vehículo ${placa} no tiene configVehiculo configurado (requerido por el RNDC)`
      );
    }

    const xml = buildXmlVehiculo({
      placa: vehiculo.placa,
      configVehiculo: vehiculo.configVehiculo,
      ...(vehiculo.propietarioId && { propietarioId: vehiculo.propietarioId }),
    });

    return llamarRndc(xml, {
      processId: 12,
      tipoSolicitud: 1,
      entidadTipo: 'Vehiculo',
      entidadId: vehiculo.id,
    });
  }
}

/** Singleton exportado para uso en API Routes */
export const vehiculoService = new VehiculoService();
