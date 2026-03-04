/**
 * Constructores de XML para cada procesoid del RNDC del Ministerio de Transporte.
 *
 * Todos los strings de negocio se sanitizan para ISO-8859-1 vía san():
 * - Tildes (á, é, í, ó, ú, ñ) se mantienen (ISO-8859-1 los soporta)
 * - Los caracteres especiales XML (&, <, >, ") se escapan
 * - La longitud máxima se trunca según los límites del campo RNDC
 *
 * ⚠️  NUNCA incluir la contraseña en los logs — ver rndcClient.ts para el enmascaramiento.
 * ⚠️  Todos los XML llevan encoding="iso-8859-1" y serán codificados en iconv.encode()
 *     en rndcClient.ts antes del POST. No codificar aquí.
 *
 * @module rndcXmlBuilder
 */

import { getCredenciales } from './rndcClient';
import type { Remesa, ManifiestoOperativo } from '@prisma/client';

// ───────────────────────────────────────────────────────────────────────────────
// UTILIDADES DE SANITIZACIÓN Y FORMATO
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Sanitiza un string para uso seguro dentro de nodos XML en ISO-8859-1.
 * Escapa los caracteres reservados XML y opcionalmente trunca al máximo de caracteres.
 *
 * @param valor - String a sanitizar (null/undefined retorna string vacío)
 * @param maxLen - Longitud máxima del resultado (opcional)
 */
function san(valor: string | null | undefined, maxLen?: number): string {
  if (!valor) return '';
  const s = valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return maxLen ? s.substring(0, maxLen) : s;
}

/**
 * Formatea una fecha como YYYY-MM-DD para los campos de fecha del RNDC.
 *
 * @param d - Fecha a formatear (null/undefined retorna string vacío)
 */
function fecha(d: Date | null | undefined): string {
  if (!d) return '';
  return d.toISOString().split('T')[0];
}

/**
 * Formatea una hora como HH:mm para los campos de hora del RNDC.
 *
 * @param d - Fecha/hora a formatear (null/undefined retorna "00:00")
 */
function hora(d: Date | null | undefined): string {
  if (!d) return '00:00';
  return d.toISOString().split('T')[1].substring(0, 5);
}

// ───────────────────────────────────────────────────────────────────────────────
// CABECERA COMÚN RNDC
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Construye los nodos de cabecera comunes a todas las solicitudes RNDC:
 * nitnit, usuario, clave, tipo y procesoid.
 *
 * Las credenciales se obtienen en tiempo de ejecución según RNDC_MODO.
 *
 * @param tipo      - Tipo de solicitud RNDC (1 = enviar/registrar)
 * @param procesoid - Identificador del proceso RNDC (3, 4, 5, 6, 11, 12, 32)
 */
function cabecera(tipo: number, procesoid: number): string {
  const { nit, usuario, clave } = getCredenciales();
  return `<solicitud>
  <nitnit>${nit}</nitnit>
  <usuario>${usuario}</usuario>
  <clave>${clave}</clave>
  <tipo>${tipo}</tipo>
  <procesoid>${procesoid}</procesoid>`;
}

// ───────────────────────────────────────────────────────────────────────────────
// procesoid 11 — Registrar / Actualizar Conductor
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Construye el XML RNDC para registrar o actualizar un conductor (procesoid 11).
 *
 * Precondiciones: El conductor debe tener cédula, nombres, apellidos y categoría de licencia.
 * Postcondiciones: Si exitoso, el conductor queda visible en el portal RNDC del Ministerio.
 *
 * @param conductor - Datos del conductor a reportar al RNDC
 */
export function buildXmlConductor(conductor: {
  cedula: string;
  nombres: string;
  apellidos: string;
  /** Categoría de licencia de conducción (ej: B3, C3) */
  categoriaLicencia: string;
}): string {
  return `<?xml version="1.0" encoding="iso-8859-1"?>
${cabecera(1, 11)}
  <datos>
    <NUMIDCONDUCTOR>${conductor.cedula}</NUMIDCONDUCTOR>
    <NOMBRECONDUCTOR>${san(`${conductor.nombres} ${conductor.apellidos}`, 80)}</NOMBRECONDUCTOR>
    <CODCATEGORIACONDUCTOR>${conductor.categoriaLicencia}</CODCATEGORIACONDUCTOR>
  </datos>
</solicitud>`;
}

// ───────────────────────────────────────────────────────────────────────────────
// procesoid 12 — Registrar / Actualizar Vehículo
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Construye el XML RNDC para registrar o actualizar un vehículo (procesoid 12).
 *
 * Precondiciones: El vehículo debe tener placa y configuración RNDC válida.
 * Postcondiciones: Si exitoso, el vehículo queda habilitado para asignar a manifiestos.
 *
 * @param vehiculo - Datos del vehículo a reportar al RNDC
 */
export function buildXmlVehiculo(vehiculo: {
  placa: string;
  /** Código de configuración del vehículo RNDC (ej: C2, C3S3) */
  configVehiculo: string;
  /** Número de identificación del propietario (opcional) */
  propietarioId?: string;
}): string {
  return `<?xml version="1.0" encoding="iso-8859-1"?>
${cabecera(1, 12)}
  <datos>
    <NUMPLACA>${vehiculo.placa.toUpperCase()}</NUMPLACA>
    <CODCONFIGURACIONVEHICULO>${vehiculo.configVehiculo}</CODCONFIGURACIONVEHICULO>
    ${vehiculo.propietarioId
      ? `<NUMIDPROPIETARIOVEHICULO>${vehiculo.propietarioId}</NUMIDPROPIETARIOVEHICULO>`
      : ''}
  </datos>
</solicitud>`;
}

// ───────────────────────────────────────────────────────────────────────────────
// procesoid 3 — Registrar Remesa
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Construye el XML RNDC para registrar una remesa (procesoid 3).
 *
 * Incluye los campos de tiempos logísticos obligatorios desde noviembre 2025:
 * HORASPACTOCARGA, MINUTOSPACTOCARGA, HORASPACTODESCARGUE, MINUTOSPACTODESCARGUE.
 *
 * Precondiciones: La remesa debe tener todos los campos requeridos del schema Prisma.
 * Postcondiciones: Si exitoso, <ingresoid> contiene el número de remesa asignado por el RNDC.
 *
 * @param remesa - Entidad Remesa de Prisma + campo consecutivo generado
 */
export function buildXmlRemesa(remesa: Remesa & { consecutivo: string }): string {
  return `<?xml version="1.0" encoding="iso-8859-1"?>
${cabecera(1, 3)}
  <datos>
    <CONSECUTIVOREMESA>${remesa.consecutivo}</CONSECUTIVOREMESA>
    <DESCRIPCIONCORTAPRODUCTO>${san(remesa.descripcionCarga, 60)}</DESCRIPCIONCORTAPRODUCTO>
    <CANTIDADCARGADA>${remesa.pesoKg}</CANTIDADCARGADA>
    <UNIDADMEDIDACAPACIDAD>1</UNIDADMEDIDACAPACIDAD>
    ${remesa.unidadMedidaProducto && remesa.unidadMedidaProducto !== 'KGM'
      ? `<UNIDADMEDIDAPRODUCTO>${remesa.unidadMedidaProducto}</UNIDADMEDIDAPRODUCTO>`
      : ''}
    <CODOPERACIONTRANSPORTE>${remesa.codOperacionTransporte}</CODOPERACIONTRANSPORTE>
    <CODNATURALEZACARGA>${remesa.codNaturalezaCarga}</CODNATURALEZACARGA>
    ${remesa.codigoUn ? `<CODIGOUN>${san(remesa.codigoUn, 4)}</CODIGOUN>` : ''}
    ${remesa.estadoMercancia ? `<ESTADOMERCANCIA>${remesa.estadoMercancia}</ESTADOMERCANCIA>` : ''}
    ${remesa.grupoEmbalajeEnvase ? `<GRUPOEMBALAJEENVASE>${remesa.grupoEmbalajeEnvase}</GRUPOEMBALAJEENVASE>` : ''}
    <CODTIPOEMPAQUE>${remesa.codigoEmpaque}</CODTIPOEMPAQUE>
    <MERCANCIAREMESA>${(remesa.codigoAranceladoCarga || '009880').padStart(6, '0').substring(0, 6)}</MERCANCIAREMESA>
    ${remesa.cantidadProducto ? `<CANTIDADPRODUCTO>${remesa.cantidadProducto}</CANTIDADPRODUCTO>` : ''}
    <CODTIPOIDREMITENTE>${remesa.tipoIdRemitente}</CODTIPOIDREMITENTE>
    <NUMIDREMITENTE>${remesa.nitRemitente}</NUMIDREMITENTE>
    <CODSEDEREMITENTE>${remesa.codSedeRemitente}</CODSEDEREMITENTE>
    ${remesa.direccionRemitente ? `<REMDIRREMITENTE>${san(remesa.direccionRemitente, 100)}</REMDIRREMITENTE>` : ''}
    <CODTIPOIDDESTINATARIO>${remesa.tipoIdDestinatario}</CODTIPOIDDESTINATARIO>
    <NUMIDDESTINATARIO>${remesa.nitDestinatario}</NUMIDDESTINATARIO>
    <CODSEDEDESTINATARIO>${remesa.codSedeDestinatario}</CODSEDEDESTINATARIO>
    <CODTIPOIDPROPIETARIO>${remesa.tipoIdPropietario}</CODTIPOIDPROPIETARIO>
    <NUMIDPROPIETARIO>${remesa.nitPropietario}</NUMIDPROPIETARIO>
    <CODSEDEPROPIETARIO>${remesa.codSedePropietario || '1'}</CODSEDEPROPIETARIO>
    <CODMUNICIPIOORIGEN>${remesa.origenDane}</CODMUNICIPIOORIGEN>
    <CODMUNICIPIODESTINO>${remesa.destinoDane}</CODMUNICIPIODESTINO>
    <FECHACITAPACTADACARGUE>${fecha(remesa.fechaHoraCitaCargue)}</FECHACITAPACTADACARGUE>
    <HORACITAPACTADACARGUE>${hora(remesa.fechaHoraCitaCargue)}</HORACITAPACTADACARGUE>
    <FECHACITAPACTADADESCARGUE>${fecha(remesa.fechaHoraCitaDescargue)}</FECHACITAPACTADADESCARGUE>
    <HORACITAPACTADADESCARGUEREMESA>${hora(remesa.fechaHoraCitaDescargue)}</HORACITAPACTADADESCARGUEREMESA>
    <HORASPACTOCARGA>${remesa.horasPactoCarga}</HORASPACTOCARGA>
    <MINUTOSPACTOCARGA>${remesa.minutosPactoCarga}</MINUTOSPACTOCARGA>
    <HORASPACTODESCARGUE>${remesa.horasPactoDescargue}</HORASPACTODESCARGUE>
    <MINUTOSPACTODESCARGUE>${remesa.minutosPactoDescargue}</MINUTOSPACTODESCARGUE>
    ${remesa.valorAsegurado
      ? `<VALORASEGURADO>${remesa.valorAsegurado}</VALORASEGURADO>`
      : ''}
    ${remesa.ordenServicioGenerador
      ? `<ORDENSERVICIOGENERADOR>${san(remesa.ordenServicioGenerador, 20)}</ORDENSERVICIOGENERADOR>`
      : ''}
    ${remesa.numPolizaTransporte
      ? `<NUMPOLIZATRANSPORTE>${san(remesa.numPolizaTransporte, 30)}</NUMPOLIZATRANSPORTE>`
      : ''}
    ${remesa.fechaVencimientoPoliza
      ? `<FECHAVENCIMIENTOPOLIZACARGA>${fecha(remesa.fechaVencimientoPoliza)}</FECHAVENCIMIENTOPOLIZACARGA>`
      : ''}
    ${remesa.companiaSeguriNit
      ? `<COMPANIASEGURO>${remesa.companiaSeguriNit}</COMPANIASEGURO>`
      : ''}
    ${remesa.permisoCargaExtra
      ? `<PERMISOCARGAEXTRA>${san(remesa.permisoCargaExtra, 30)}</PERMISOCARGAEXTRA>`
      : ''}
    ${remesa.numIdGps
      ? `<NUMIDGPS>${remesa.numIdGps}</NUMIDGPS>`
      : ''}
  </datos>
</solicitud>`;
}

// ───────────────────────────────────────────────────────────────────────────────
// procesoid 4 — Registrar Manifiesto (con bloque REMESASMAN)
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Construye el XML RNDC para registrar un manifiesto de carga (procesoid 4).
 *
 * CRÍTICO: Incluye el bloque <REMESASMAN> con los números de remesa RNDC de cada
 * remesa asignada al manifiesto. Solo remesas con estadoRndc=REGISTRADA pueden incluirse.
 *
 * Precondiciones:
 * - El manifiesto debe tener codigoInterno, conductor, vehículo, ruta y valores.
 * - Cada remesa en el array debe tener su numeroRemesaRndc (asignado en procesoid 3).
 *
 * Postcondiciones: Si exitoso, <ingresoid> contiene el número de manifiesto del RNDC.
 *
 * @param manifiesto - Entidad ManifiestoOperativo de Prisma
 * @param remesas    - Remesas adjuntas con su número RNDC y peso
 */
export function buildXmlManifiesto(
  manifiesto: ManifiestoOperativo,
  remesas: Array<{ numeroRemesaRndc: string; pesoKg: number }>
): string {
  const remesasXml = remesas
    .map(
      (r) => `
    <REMESASMAN>
      <NUMREMESA>${r.numeroRemesaRndc}</NUMREMESA>
    </REMESASMAN>`
    )
    .join('');

  return `<?xml version="1.0" encoding="iso-8859-1"?>
${cabecera(1, 4)}
  <datos>
    <NUMMANIFIESTOCARGA>${manifiesto.codigoInterno}</NUMMANIFIESTOCARGA>
    <NUMPLACA>${manifiesto.vehiculoPlaca.toUpperCase()}</NUMPLACA>
    ${manifiesto.placaRemolque
      ? `<NUMPLACAREMOLQUE>${manifiesto.placaRemolque.toUpperCase()}</NUMPLACAREMOLQUE>`
      : ''}
    <NUMIDCONDUCTOR>${manifiesto.conductorCedula}</NUMIDCONDUCTOR>
    <CODMUNICIPIOORIGENMANIFIESTO>${manifiesto.origenDane}</CODMUNICIPIOORIGENMANIFIESTO>
    <CODMUNICIPIODESTINOMANIFIESTO>${manifiesto.destinoDane}</CODMUNICIPIODESTINOMANIFIESTO>
    <FECHAEXPEDICIONMANIFIESTO>${fecha(manifiesto.fechaExpedicion)}</FECHAEXPEDICIONMANIFIESTO>
    <VALORFLETEPACTADOVIAJE>${manifiesto.fletePactado}</VALORFLETEPACTADOVIAJE>
    <RETENCIONICAMANIFIESTOCARGA>${manifiesto.retencionIca}</RETENCIONICAMANIFIESTOCARGA>
    <VALORANTICIPOMANIFIESTO>${manifiesto.valorAnticipo}</VALORANTICIPOMANIFIESTO>
    ${manifiesto.fechaPagoSaldo
      ? `<FECHAPAGOSALDOMANIFIESTO>${fecha(manifiesto.fechaPagoSaldo)}</FECHAPAGOSALDOMANIFIESTO>`
      : ''}
    ${manifiesto.municipioPagoSaldo
      ? `<CODMUNICIPIOPAGOSALDO>${manifiesto.municipioPagoSaldo}</CODMUNICIPIOPAGOSALDO>`
      : ''}
    <CODRESPONSABLEPAGOCARGUE>${manifiesto.responsablePagoCargue}</CODRESPONSABLEPAGOCARGUE>
    <CODRESPONSABLEPAGODESCARGUE>${manifiesto.responsablePagoDescargue}</CODRESPONSABLEPAGODESCARGUE>
    <ACEPTACIONELECTRONICA>${manifiesto.aceptacionElectronica ? 'SI' : 'NO'}</ACEPTACIONELECTRONICA>
    ${manifiesto.observaciones
      ? `<OBSERVACIONES>${san(manifiesto.observaciones, 200)}</OBSERVACIONES>`
      : ''}
    ${remesasXml}
  </datos>
</solicitud>`;
}

// ───────────────────────────────────────────────────────────────────────────────
// procesoid 32 — Anular Manifiesto
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Construye el XML RNDC para anular un manifiesto (procesoid 32).
 *
 * Flujo de corrección: 32 (anular) → liberar remesas → 4 (crear nuevo manifiesto)
 * CRÍTICO: Si el procesoid 32 falla, NO se crea el nuevo manifiesto. Se propaga el error.
 *
 * @param numeroManifiestoRndc - Número de manifiesto asignado por el RNDC (campo numeroManifiesto)
 * @param motivo               - Descripción textual del motivo de anulación (máx 200 chars)
 */
export function buildXmlAnularManifiesto(
  numeroManifiestoRndc: string,
  motivo: string
): string {
  return `<?xml version="1.0" encoding="iso-8859-1"?>
${cabecera(1, 32)}
  <datos>
    <NUMMANIFIESTOCARGA>${numeroManifiestoRndc}</NUMMANIFIESTOCARGA>
    <MOTIVOANULACION>${san(motivo, 200)}</MOTIVOANULACION>
  </datos>
</solicitud>`;
}

// ───────────────────────────────────────────────────────────────────────────────
// procesoid 5 — Cumplir Remesa
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Construye el XML RNDC para cumplir (entregar) una remesa (procesoid 5).
 *
 * Precondiciones: La remesa debe tener estadoRndc=REGISTRADA y numeroRemesaRndc asignado.
 *
 * @param numeroRemesaRndc - Número de remesa asignado por el RNDC en el procesoid 3
 */
export function buildXmlCumplirRemesa(numeroRemesaRndc: string): string {
  return `<?xml version="1.0" encoding="iso-8859-1"?>
${cabecera(1, 5)}
  <datos>
    <NUMREMESA>${numeroRemesaRndc}</NUMREMESA>
  </datos>
</solicitud>`;
}

// ───────────────────────────────────────────────────────────────────────────────
// procesoid 6 — Cumplir Manifiesto
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Construye el XML RNDC para cumplir (cerrar) un manifiesto (procesoid 6).
 *
 * Precondiciones: El manifiesto debe estar en estadoManifiesto=ACTIVO y
 * tener numeroManifiesto asignado por el RNDC.
 *
 * @param numeroManifiestoRndc - Número de manifiesto asignado por el RNDC en el procesoid 4
 */
export function buildXmlCumplirManifiesto(numeroManifiestoRndc: string): string {
  return `<?xml version="1.0" encoding="iso-8859-1"?>
${cabecera(1, 6)}
  <datos>
    <NUMMANIFIESTOCARGA>${numeroManifiestoRndc}</NUMMANIFIESTOCARGA>
  </datos>
</solicitud>`;
}
