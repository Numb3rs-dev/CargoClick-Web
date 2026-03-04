/**
 * Cliente SOAP para el RNDC del Ministerio de Transporte de Colombia.
 *
 * ⚠️  CRÍTICO: El RNDC SOLO acepta XML en ISO-8859-1.
 *     Cualquier carácter UTF-8 fuera del rango ISO causará rechazo silencioso.
 *
 * Flujo de una llamada:
 * 1. Construir el XML del mensaje interno (rndcXmlBuilder)
 * 2. Envolver en el sobre SOAP
 * 3. Codificar en ISO-8859-1
 * 4. POST al endpoint
 * 5. Parsear la respuesta (extraerIngresoid / extraerError)
 * 6. Guardar en SyncRndc (append-only)
 * 7. Retornar { exitoso, ingresoid, errorMensaje, syncRndcId }
 *
 * @module rndcClient
 */

import axios from 'axios';
import iconv from 'iconv-lite';
import { syncRndcRepository } from '@/lib/repositories/syncRndcRepository';

// ───────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN DE MODO Y CREDENCIALES
// ───────────────────────────────────────────────────────────────────────────────

const RNDC_MODO = (process.env.RNDC_MODO ?? 'test') as 'test' | 'produccion';

/**
 * Retorna la URL del WS RNDC según el modo activo.
 * - test       → plc.mintransporte.gov.co (servidor de pruebas del Ministerio)
 * - produccion → rndcws.mintransporte.gov.co
 */
function getRndcUrl(): string {
  return RNDC_MODO === 'test'
    ? process.env.RNDC_WS_URL_TEST!
    : process.env.RNDC_WS_URL!;
}

export interface RndcCredenciales {
  /** NIT de la empresa transportadora */
  nit: string;
  /** Usuario RNDC del modo activo */
  usuario: string;
  /** Contraseña RNDC del modo activo */
  clave: string;
}

/**
 * Retorna las credenciales RNDC según el modo activo.
 * - test       → RNDC_USUARIO_TEST / RNDC_CLAVE_TEST
 * - produccion → RNDC_USUARIO / RNDC_CLAVE
 *
 * Esta función es importada por rndcXmlBuilder para construir las cabeceras XML.
 */
export function getCredenciales(): RndcCredenciales {
  const nit = process.env.RNDC_NIT_EMPRESA!;
  if (RNDC_MODO === 'test') {
    return {
      nit,
      usuario: process.env.RNDC_USUARIO_TEST!,
      clave: process.env.RNDC_CLAVE_TEST!,
    };
  }
  return {
    nit,
    usuario: process.env.RNDC_USUARIO!,
    clave: process.env.RNDC_CLAVE!,
  };
}

// ───────────────────────────────────────────────────────────────────────────────
// TIPOS DE RESULTADO
// ───────────────────────────────────────────────────────────────────────────────

export interface RndcCallResult {
  /** true si el RNDC respondió con ingresoid > 0 */
  exitoso: boolean;
  /** Valor de <ingresoid> cuando exitoso=true */
  ingresoid?: string;
  /** Mensaje de error cuando exitoso=false */
  errorMensaje?: string;
  /** XML completo de la respuesta SOAP (decodificado a UTF-8 para almacenamiento) */
  responseXml?: string;
  /** ID del registro SyncRndc creado para este intento. Retornar al cliente en errores 502. */
  syncRndcId: string;
}

// ───────────────────────────────────────────────────────────────────────────────
// CONSTRUCCIÓN DEL SOBRE SOAP
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Construye el sobre SOAP que envuelve el mensaje interno del RNDC.
 *
 * El mensaje interno se empaqueta en CDATA para preservar caracteres especiales
 * del XML interno sin necesidad de doble-escape.
 *
 * @param mensajeXml - XML del mensaje interno construido por rndcXmlBuilder
 */
function buildSoapEnvelope(mensajeXml: string): string {
  return `<?xml version="1.0" encoding="iso-8859-1"?>
<soapenv:Envelope
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:ws="http://ws.rndc.mintransporte.gov.co/">
  <soapenv:Header/>
  <soapenv:Body>
    <ws:AtenderMensajeRNDC>
      <mensaje><![CDATA[${mensajeXml}]]></mensaje>
    </ws:AtenderMensajeRNDC>
  </soapenv:Body>
</soapenv:Envelope>`;
}

// ───────────────────────────────────────────────────────────────────────────────
// PARSEO DE RESPUESTA RNDC
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Extrae el valor de <ingresoid> de la respuesta SOAP del RNDC.
 *
 * CRÍTICO: El RNDC devuelve HTTP 200 aunque haya error.
 * - ingresoid > 0 → operación exitosa
 * - ingresoid = 0 o -1 → error aunque HTTP 200
 *
 * @param responseXml - XML completo de la respuesta SOAP
 */
function extraerIngresoid(responseXml: string): string | null {
  const match = responseXml.match(/<ingresoid>(.*?)<\/ingresoid>/s);
  return match ? match[1].trim() : null;
}

/**
 * Extrae el mensaje de error de la respuesta RNDC.
 * Busca en <descingresoid> y como fallback en <error>.
 * Retorna null si el valor capturado es "0" (código numérico, no descripción).
 *
 * @param responseXml - XML completo de la respuesta SOAP
 */
function extraerError(responseXml: string): string | null {
  const matchDesc = responseXml.match(/<descingresoid>(.*?)<\/descingresoid>/s);
  const matchErr  = responseXml.match(/<error>(.*?)<\/error>/s);
  const valor = matchDesc?.[1] ?? matchErr?.[1];
  if (!valor) return null;
  const trimmed = valor.trim();
  // "0" es un código numérico, no una descripción útil
  return trimmed === '0' ? null : trimmed;
}

// ───────────────────────────────────────────────────────────────────────────────
// LLAMADA PRINCIPAL AL RNDC
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Ejecuta una llamada al endpoint SOAP del RNDC del Ministerio de Transporte.
 *
 * Postcondiciones:
 * - SIEMPRE crea un registro en SyncRndc (exitoso o fallido)
 * - La contraseña NUNCA aparece en requestXml del SyncRndc
 * - Un timeout o error de red no rompe el servidor — retorna error controlado
 *
 * @param mensajeXml - XML del mensaje interno (procesoid específico), sin sobre SOAP
 * @param meta - Metadatos para el registro de auditoría en SyncRndc
 * @returns RndcCallResult con exitoso, ingresoid, errorMensaje y syncRndcId
 *
 * @example
 * const resultado = await llamarRndc(buildXmlConductor(conductor), {
 *   processId: 11,
 *   tipoSolicitud: 1,
 *   entidadTipo: 'Conductor',
 *   entidadId: conductor.cedula,
 * });
 */
export async function llamarRndc(
  mensajeXml: string,
  meta: {
    /** procesoid RNDC: 3=Remesa, 4=Manifiesto, 5=CumplirRemesa, 6=CumplirManifiesto, 11=Conductor, 12=Vehículo, 32=AnularManifiesto */
    processId: number;
    /** Tipo de solicitud RNDC: 1=enviar */
    tipoSolicitud: number;
    /** Tipo de entidad: "Remesa" | "ManifiestoOperativo" | "Conductor" | "Vehiculo" */
    entidadTipo: string;
    /** ID o clave natural de la entidad (cédula, placa, numeroRemesa, codigoInterno) */
    entidadId: string;
    /** Agrupa llamadas del mismo flujo (ej: crear negocio completo) */
    sessionId?: string;
  }
): Promise<RndcCallResult> {
  const url = getRndcUrl();
  const soapEnvelope = buildSoapEnvelope(mensajeXml);

  // CRÍTICO: Convertir a Buffer ISO-8859-1 antes del POST
  const bodyBuffer = iconv.encode(soapEnvelope, 'iso-8859-1');

  let httpStatus: number | undefined;
  let responseXml: string | undefined;
  let exitoso = false;
  let ingresoid: string | undefined;
  let errorMensaje: string | undefined;
  const inicio = Date.now();

  try {
    const response = await axios.post(url, bodyBuffer, {
      headers: {
        'Content-Type': 'text/xml; charset=iso-8859-1',
        SOAPAction: '',
      },
      responseType: 'arraybuffer',
      timeout: 30_000, // 30 segundos
    });

    httpStatus = response.status;
    // Decodificar respuesta desde ISO-8859-1 a string JS (UTF-16 interno)
    responseXml = iconv.decode(Buffer.from(response.data as ArrayBuffer), 'iso-8859-1');

    // CRÍTICO: El RNDC devuelve HTTP 200 incluso en errores — revisar ingresoid
    const ingresoidRaw = extraerIngresoid(responseXml);
    const esError = !ingresoidRaw || ingresoidRaw === '0' || ingresoidRaw === '-1';

    if (!esError) {
      exitoso = true;
      ingresoid = ingresoidRaw ?? undefined;
    } else {
      errorMensaje =
        extraerError(responseXml) ?? 'El RNDC respondió con ingresoid inválido';
    }
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      httpStatus = error.response?.status;
      errorMensaje = `Error HTTP ${httpStatus ?? 'sin respuesta'}: ${error.message}`;
    } else {
      errorMensaje = error instanceof Error ? error.message : 'Error desconocido';
    }
  }

  const duracionMs = Date.now() - inicio;

  // Enmascarar la contraseña del modo activo antes de persistir
  const claveActiva = getCredenciales().clave;
  const requestXmlSeguro = mensajeXml.replace(
    new RegExp(`<clave>${escapeRegExp(claveActiva)}</clave>`, 'g'),
    '<clave>***</clave>'
  );

  // Guardar en SyncRndc (append-only, NUNCA falla el flujo principal)
  let syncRecord: { id: string };
  try {
    syncRecord = await syncRndcRepository.registrar({
      sessionId: meta.sessionId,
      processId: meta.processId,
      tipoSolicitud: meta.tipoSolicitud,
      entidadTipo: meta.entidadTipo,
      entidadId: meta.entidadId,
      requestXml: requestXmlSeguro,
      responseXml,
      httpStatus,
      exitoso,
      ingresoidRespuesta: ingresoid,
      errorMensaje,
      duracionMs,
    });
  } catch (logError: unknown) {
    // El fallo del log NO debe interrumpir el flujo — solo registrar en consola
    console.error('[rndcClient] Error al guardar SyncRndc:', logError);
    syncRecord = { id: 'log-fallido' };
  }

  return {
    exitoso,
    ingresoid,
    errorMensaje,
    responseXml,
    syncRndcId: syncRecord.id,
  };
}

// ───────────────────────────────────────────────────────────────────────────────
// UTILIDADES INTERNAS
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Escapa caracteres especiales de regex en un string.
 * Necesario para construir el RegExp de enmascaramiento de contraseña.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
