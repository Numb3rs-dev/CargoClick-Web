/**
 * Servicio de Remesas — Módulo Operacional CargoClick
 *
 * Remesa es la unidad mínima de carga del módulo operacional.
 * Solo las remesas con estadoRndc=REGISTRADA pueden asignarse a un ManifiestoOperativo.
 *
 * Flujo de una remesa:
 * 1. crear()      → estadoRndc=PENDIENTE, estado=PENDIENTE
 * 2. enviarRndc() → PENDIENTE → ENVIADA (antes SOAP) → REGISTRADA (si exitoso) o PENDIENTE (rollback)
 * 3. [asignación a manifiesto — ManifiestoService.crear()]
 * 4. cumplir()    → procesoid 5 al RNDC, estado → ENTREGADA
 *
 * RNDC: HTTP 200 puede contener error — siempre verificar ingresoid, nunca el HTTP status.
 *
 * @module RemesaService
 */
import { remesaRepository } from '@/lib/repositories/remesaRepository';
import { llamarRndc } from './rndcClient';
import { buildXmlRemesa, buildXmlCumplirRemesa } from './rndcXmlBuilder';
import { generarConsecutivo } from '@/lib/utils/consecutivos';
import { prisma } from '@/lib/db/prisma';

// ───────────────────────────────────────────────────────────────────────────────
// TIPOS DE INPUT
// ───────────────────────────────────────────────────────────────────────────────

export interface CrearRemesaInput {
  // === DESCRIPCIÓN DE LA CARGA ===
  descripcionCarga: string;
  codigoAranceladoCarga?: string;
  pesoKg: number;
  volumenM3?: number;
  unidadMedidaProducto?: string;
  cantidadProducto?: number;

  // === CLASIFICACIÓN RNDC ===
  codOperacionTransporte?: string;
  codNaturalezaCarga?: string;
  codigoEmpaque?: number;
  mercanciaRemesaCod?: number;

  // === CONDICIONALES (naturaleza/operación) ===
  tipoConsolidada?: string;
  codigoUn?: string;
  estadoMercancia?: string;
  grupoEmbalajeEnvase?: string;
  pesoContenedorVacio?: number;

  // === REMITENTE ===
  tipoIdRemitente?: string;
  nitRemitente: string;
  codSedeRemitente?: string;
  empresaRemitente?: string;

  // === DESTINATARIO ===
  tipoIdDestinatario?: string;
  nitDestinatario: string;
  codSedeDestinatario?: string;
  empresaDestinataria?: string;

  // === PROPIETARIO DE LA CARGA ===
  tipoIdPropietario?: string;
  nitPropietario: string;
  codSedePropietario?: string;

  // === PUNTOS ORIGEN-DESTINO ===
  origenMunicipio: string;
  origenDane: string;
  destinoMunicipio: string;
  destinoDane: string;
  /** REMDIRREMITENTE — dirección física del punto de cargue */
  remDirRemitente?: string;

  // === TIEMPOS LOGÍSTICOS (obligatorios RNDC desde nov 2025) ===
  /** ISO datetime "YYYY-MM-DDTHH:mm" o "YYYY-MM-DD" */
  fechaHoraCitaCargue: string;
  /** ISO datetime "YYYY-MM-DDTHH:mm" o "YYYY-MM-DD" */
  fechaHoraCitaDescargue: string;
  horasPactoCarga?: number;
  minutosPactoCarga?: number;
  horasPactoDescargue?: number;
  minutosPactoDescargue?: number;

  // === VALORES ===
  valorDeclarado?: number;
  valorAsegurado?: number;
  ordenServicioGenerador?: string;
  instruccionesEspeciales?: string;

  // === SEGURO ===
  numPolizaTransporte?: string;
  fechaVencimientoPoliza?: string;
}

// ───────────────────────────────────────────────────────────────────────────────
// SERVICIO
// ───────────────────────────────────────────────────────────────────────────────

export class RemesaService {
  /**
   * Crea una remesa asociada a un negocio.
   *
   * El numeroRemesa (REM-YYYY-NNNN) se genera dentro de una $transaction
   * para garantizar unicidad bajo concurrencia.
   *
   * Precondiciones:
   * - El negocio referenciado debe existir (FK a NuevoNegocio).
   * - fechaHoraCitaCargue y fechaHoraCitaDescargue son obligatorios (RNDC desde nov 2025).
   *
   * Postcondiciones:
   * - La remesa queda con estadoRndc=PENDIENTE, lista para enviar al RNDC.
   *
   * @param nuevoNegocioId - ID del negocio al que pertenece esta remesa
   * @param data           - Datos de la carga y logística
   * @returns La remesa creada con su numeroRemesa generado
   * @throws {Error} Si faltan las fechas de cita de cargue/descargue
   */
  async crear(nuevoNegocioId: string | null | undefined, data: CrearRemesaInput) {
    // Validar campos RNDC obligatorios antes de crear
    if (!data.fechaHoraCitaCargue || !data.fechaHoraCitaDescargue) {
      throw new Error(
        'fechaHoraCitaCargue y fechaHoraCitaDescargue son obligatorios (RNDC desde nov 2025)'
      );
    }

    return prisma.$transaction(async (tx) => {
      const numeroRemesa = await generarConsecutivo(
        tx as Parameters<typeof generarConsecutivo>[0],
        'remesa',
        'REM'
      );

      return tx.remesa.create({
        data: {
          numeroRemesa,
          nuevoNegocioId: nuevoNegocioId ?? undefined,
          descripcionCarga: data.descripcionCarga,
          pesoKg: data.pesoKg,
          nitRemitente: data.nitRemitente,
          nitDestinatario: data.nitDestinatario,
          nitPropietario: data.nitPropietario,
          origenMunicipio: data.origenMunicipio,
          origenDane: data.origenDane,
          destinoMunicipio: data.destinoMunicipio,
          destinoDane: data.destinoDane,
          fechaHoraCitaCargue: new Date(data.fechaHoraCitaCargue),
          fechaHoraCitaDescargue: new Date(data.fechaHoraCitaDescargue),
          ...(data.codigoAranceladoCarga && {
            codigoAranceladoCarga: data.codigoAranceladoCarga,
          }),
          ...(data.volumenM3 !== undefined && { volumenM3: data.volumenM3 }),
          ...(data.unidadMedidaProducto && {
            unidadMedidaProducto: data.unidadMedidaProducto,
          }),
          ...(data.cantidadProducto !== undefined && {
            cantidadProducto: data.cantidadProducto,
          }),
          ...(data.codOperacionTransporte && {
            codOperacionTransporte: data.codOperacionTransporte,
          }),
          ...(data.codNaturalezaCarga && { codNaturalezaCarga: data.codNaturalezaCarga }),
          ...(data.codigoEmpaque !== undefined && { codigoEmpaque: data.codigoEmpaque }),
          ...(data.tipoIdRemitente && { tipoIdRemitente: data.tipoIdRemitente }),
          ...(data.codSedeRemitente && { codSedeRemitente: data.codSedeRemitente }),
          ...(data.empresaRemitente && { empresaRemitente: data.empresaRemitente }),
          ...(data.tipoIdDestinatario && {
            tipoIdDestinatario: data.tipoIdDestinatario,
          }),
          ...(data.codSedeDestinatario && {
            codSedeDestinatario: data.codSedeDestinatario,
          }),
          ...(data.empresaDestinataria && {
            empresaDestinataria: data.empresaDestinataria,
          }),
          ...(data.tipoIdPropietario && { tipoIdPropietario: data.tipoIdPropietario }),
          ...(data.codSedePropietario && { codSedePropietario: data.codSedePropietario }),
          ...(data.remDirRemitente && { direccionRemitente: data.remDirRemitente }),
          ...(data.horasPactoCarga !== undefined && {
            horasPactoCarga: data.horasPactoCarga,
          }),
          ...(data.minutosPactoCarga !== undefined && {
            minutosPactoCarga: data.minutosPactoCarga,
          }),
          ...(data.horasPactoDescargue !== undefined && {
            horasPactoDescargue: data.horasPactoDescargue,
          }),
          ...(data.minutosPactoDescargue !== undefined && {
            minutosPactoDescargue: data.minutosPactoDescargue,
          }),
          ...(data.valorDeclarado !== undefined && {
            valorDeclarado: data.valorDeclarado,
          }),
          ...(data.valorAsegurado !== undefined && {
            valorAsegurado: data.valorAsegurado,
          }),
          ...(data.ordenServicioGenerador && {
            ordenServicioGenerador: data.ordenServicioGenerador,
          }),
          ...(data.instruccionesEspeciales && {
            instruccionesEspeciales: data.instruccionesEspeciales,
          }),
          // Nuevos campos RNDC
          ...(data.mercanciaRemesaCod !== undefined && {
            mercanciaRemesaCod: data.mercanciaRemesaCod,
          }),
          ...(data.tipoConsolidada && { tipoConsolidada: data.tipoConsolidada }),
          ...(data.codigoUn && { codigoUn: data.codigoUn }),
          ...(data.estadoMercancia && { estadoMercancia: data.estadoMercancia }),
          ...(data.grupoEmbalajeEnvase && { grupoEmbalajeEnvase: data.grupoEmbalajeEnvase }),
          ...(data.pesoContenedorVacio !== undefined && {
            pesoContenedorVacio: data.pesoContenedorVacio,
          }),
          ...(data.numPolizaTransporte && {
            numPolizaTransporte: data.numPolizaTransporte,
          }),
          ...(data.fechaVencimientoPoliza && {
            fechaVencimientoPoliza: new Date(data.fechaVencimientoPoliza),
          }),
        },
      });
    });
  }

  /**
   * Envía la remesa al RNDC (procesoid 3).
   *
   * Precondición: La remesa existe y estadoRndc es PENDIENTE (primera vez)
   *               o ENVIADA con error previo (reintento implícito).
   *
   * Idempotencia: Si ya está REGISTRADA, retorna sin llamar al RNDC.
   *
   * Patrón de seguridad ante timeout (marcador ENVIADA antes del SOAP):
   * - Si hay timeout, la remesa queda en ENVIADA y no se reenvía automáticamente.
   * - El operador puede reintentar desde el panel: el servicio la trata como PENDIENTE.
   *   (El RNDC rechazará un duplicado por el campo CONSECUTIVOREMESA).
   *
   * Postcondiciones:
   * - exitoso: estadoRndc=REGISTRADA, numeroRemesaRndc=ingresoid del RNDC
   * - fallido: estadoRndc=PENDIENTE (rollback para permitir reintento)
   * - Siempre: crea registro en SyncRndc
   *
   * RNDC: HTTP 200 puede contener error — siempre verificar ingresoid.
   *
   * @param remesaId - ID de la remesa a enviar al RNDC
   * @returns RndcCallResult con exitoso, ingresoid, errorMensaje y syncRndcId
   * @throws {Error} Si la remesa no existe o le faltan las fechas de cita
   */
  async enviarRndc(remesaId: string) {
    const remesa = await remesaRepository.findById(remesaId);
    if (!remesa) throw new Error(`Remesa ${remesaId} no encontrada`);

    // Idempotencia: ya registrada, no llamar de nuevo al RNDC
    if (remesa.estadoRndc === 'REGISTRADA') {
      return { ya_registrada: true, numeroRemesaRndc: remesa.numeroRemesaRndc };
    }

    if (!remesa.fechaHoraCitaCargue || !remesa.fechaHoraCitaDescargue) {
      throw new Error(
        'La remesa no tiene fechas de cita de cargue/descargue — requeridas por el RNDC desde nov 2025'
      );
    }

    // CRÍTICO: Marcar como ENVIADA ANTES del SOAP para evitar doble envío si hay timeout
    await remesaRepository.actualizarEstadoRndc(remesaId, 'ENVIADA');

    const xml = buildXmlRemesa({
      ...remesa,
      consecutivo: remesa.numeroRemesa,
    });

    const resultado = await llamarRndc(xml, {
      processId: 3,
      tipoSolicitud: 1,
      entidadTipo: 'Remesa',
      entidadId: remesaId,
    });

    if (resultado.exitoso && resultado.ingresoid) {
      // RNDC asignó número de remesa — marcar como REGISTRADA
      await remesaRepository.actualizarEstadoRndc(
        remesaId,
        'REGISTRADA',
        resultado.ingresoid,
        resultado.responseXml ? { responseXml: resultado.responseXml } : undefined
      );
    } else {
      // Volver a PENDIENTE para que el operador pueda reintentar
      await remesaRepository.actualizarEstadoRndc(remesaId, 'PENDIENTE');
    }

    return resultado;
  }

  /**
   * Cumple (entrega) una remesa en el RNDC (procesoid 5).
   *
   * Precondiciones:
   * - La remesa existe.
   * - estadoRndc=REGISTRADA (tiene numeroRemesaRndc asignado).
   *
   * Postcondiciones:
   * - Si exitoso: estado→ENTREGADA.
   *
   * @param remesaId - ID de la remesa a cumplir
   * @returns RndcCallResult con exitoso, ingresoid, errorMensaje y syncRndcId
   * @throws {Error} Si la remesa no existe o no está REGISTRADA en el RNDC
   */
  async cumplir(remesaId: string) {
    const remesa = await remesaRepository.findById(remesaId);
    if (!remesa) throw new Error(`Remesa ${remesaId} no encontrada`);

    if (remesa.estadoRndc !== 'REGISTRADA') {
      throw new Error('Solo se pueden cumplir remesas con estadoRndc=REGISTRADA');
    }

    const xml = buildXmlCumplirRemesa(remesa.numeroRemesaRndc!);

    const resultado = await llamarRndc(xml, {
      processId: 5,
      tipoSolicitud: 1,
      entidadTipo: 'Remesa',
      entidadId: remesaId,
    });

    if (resultado.exitoso) {
      await remesaRepository.update(remesaId, { estado: 'ENTREGADA' });
    }

    return resultado;
  }
}

/** Singleton exportado para uso en API Routes */
export const remesaService = new RemesaService();
