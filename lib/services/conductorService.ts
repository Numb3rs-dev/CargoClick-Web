/**
 * Servicio de Conductores — Módulo Operacional CargoClick
 *
 * Orquesta el directorio local de conductores y la sincronización al RNDC.
 * La creación en el directorio y el sync RNDC son dos operaciones separadas:
 * primero se crea el conductor localmente, luego el operador ejecuta el sync.
 *
 * Reglas de negocio:
 * - No se pueden registrar dos conductores con la misma cédula
 * - El sync RNDC usa procesoid 11 (Registrar/Actualizar Conductor)
 * - No se guarda la contraseña en SyncRndc — el enmascaramiento ocurre en rndcClient
 *
 * @module ConductorService
 */
import { conductorRepository } from '@/lib/repositories/conductorRepository';
import { llamarRndc } from './rndcClient';
import { buildXmlConductor } from './rndcXmlBuilder';
import type { Prisma, CategoriaLicencia } from '@prisma/client';

// ───────────────────────────────────────────────────────────────────────────────
// TIPOS DE INPUT
// ───────────────────────────────────────────────────────────────────────────────

export interface CrearConductorInput {
  cedula: string;
  nombres: string;
  apellidos: string;
  categoriaLicencia: CategoriaLicencia;
  /** Fecha de vigencia de la licencia en formato ISO "YYYY-MM-DD" */
  licenciaVigencia?: string;
  telefono?: string;
  email?: string;
  notas?: string;
}

// ───────────────────────────────────────────────────────────────────────────────
// SERVICIO
// ───────────────────────────────────────────────────────────────────────────────

export class ConductorService {
  /**
   * Crea un conductor en el directorio local.
   *
   * NO sincroniza al RNDC en esta operación — el sync es una acción separada
   * que el operador ejecuta desde el panel de directorio.
   *
   * Precondiciones: No debe existir conductor con la misma cédula.
   * Postcondiciones: El conductor queda en DB con estadoRndc=PENDIENTE implícito
   *                  (no se envía al RNDC hasta que se llame syncRndc).
   *
   * @param input - Datos del conductor a crear
   * @returns El conductor creado
   * @throws {Error} Si ya existe un conductor con esa cédula
   */
  async crear(input: CrearConductorInput) {
    const existente = await conductorRepository.findByCedula(input.cedula);
    if (existente) {
      throw new Error(`Ya existe un conductor con cédula ${input.cedula}`);
    }

    return conductorRepository.create({
      cedula: input.cedula,
      nombres: input.nombres,
      apellidos: input.apellidos,
      categoriaLicencia: input.categoriaLicencia,
      ...(input.licenciaVigencia && {
        licenciaVigencia: new Date(input.licenciaVigencia),
      }),
      ...(input.telefono && { telefono: input.telefono }),
      ...(input.email && { email: input.email }),
      ...(input.notas && { notas: input.notas }),
    });
  }

  /**
   * Actualiza datos de un conductor existente en el directorio local.
   *
   * Nota: Si se cambia categoría de licencia tras un sync RNDC, el operador
   * debe volver a ejecutar syncRndc para reflejar el cambio en el Ministerio.
   *
   * @param cedula - Cédula del conductor a actualizar
   * @param data   - Campos a actualizar (parcial)
   * @returns El conductor actualizado
   * @throws {Error} Si el conductor no existe
   */
  async actualizar(cedula: string, data: Partial<CrearConductorInput>) {
    const conductor = await conductorRepository.findByCedula(cedula);
    if (!conductor) throw new Error(`Conductor ${cedula} no encontrado`);

    const updateData: Prisma.ConductorUpdateInput = { ...data };
    if (data.licenciaVigencia) {
      updateData.licenciaVigencia = new Date(data.licenciaVigencia);
    }
    // Eliminar el campo string original para que no genere conflicto de tipos
    delete (updateData as Record<string, unknown>).licenciaVigencia;
    if (data.licenciaVigencia) {
      updateData.licenciaVigencia = new Date(data.licenciaVigencia);
    }

    return conductorRepository.update(cedula, updateData);
  }

  /**
   * Registra o actualiza el conductor en el RNDC (procesoid 11).
   * Guarda el resultado completo en SyncRndc (append-only).
   *
   * Precondiciones: El conductor debe existir en el directorio local.
   * Postcondiciones:
   * - Si exitoso: el conductor queda registrado en el portal del Ministerio.
   * - En cualquier caso: se crea un registro en SyncRndc con el resultado.
   *
   * RNDC: HTTP 200 puede contener error — siempre verificar ingresoid.
   *
   * @param cedula - Cédula del conductor a sincronizar
   * @returns RndcCallResult con exitoso, ingresoid, errorMensaje y syncRndcId
   * @throws {Error} Si el conductor no existe en el directorio local
   */
  async syncRndc(cedula: string) {
    const conductor = await conductorRepository.findByCedula(cedula);
    if (!conductor) throw new Error(`Conductor ${cedula} no encontrado`);

    const xml = buildXmlConductor({
      cedula: conductor.cedula,
      nombres: conductor.nombres,
      apellidos: conductor.apellidos,
      categoriaLicencia: conductor.categoriaLicencia,
    });

    return llamarRndc(xml, {
      processId: 11,
      tipoSolicitud: 1,
      entidadTipo: 'Conductor',
      entidadId: conductor.id,
    });
  }
}

/** Singleton exportado para uso en API Routes */
export const conductorService = new ConductorService();
