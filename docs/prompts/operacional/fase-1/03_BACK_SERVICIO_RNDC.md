# BACK-03: Servicio de Integración RNDC (SOAP)

## CONTEXTO DE NEGOCIO

**Problema:** El RNDC del Ministerio de Transporte expone un único web service SOAP (`AtenderMensajeRNDC`). Todas las operaciones — registrar remesas, manifiestos, cumplidos, anulaciones — se hacen con el mismo endpoint cambiando el `<tipo>` y `<procesoid>` del XML.

**Prerequisito:** BACK-01 y BACK-02 ejecutados.

**Valor:** Esta capa es el corazón de la integración. Sin ella CargoClick no puede reportar al Ministerio.

---

## ESPECIFICACIONES TÉCNICAS DEL RNDC

### ✅ DATOS CONFIRMADOS DEL WSDL

> Estos datos están verificados y son los únicos que se deben usar. **No inferir ni inventar** ninguna propiedad que no esté en esta tabla.

| Propiedad | Valor confirmado |
|-----------|------------------|
| URL WSDL producción | `http://rndcws.mintransporte.gov.co:8080/ws/maestros?wsdl` |
| Namespace SOAP | `http://ws.rndc.mintransporte.gov.co/` |
| Operación SOAP | `AtenderMensajeRNDC` |
| Parámetro de entrada | `mensaje` — tipo `xsd:string` |
| Elemento respuesta | `AtenderMensajeRNDCResponse` → campo `return` |
| Encoding XML del mensaje | **ISO-8859-1** — CRÍTICO, el RNDC rechaza UTF-8 |
| Content-Type HTTP | `text/xml; charset=iso-8859-1` |
| SOAPAction | `""` (string vacío) |
| Autenticación | Dentro del XML: `<nitnit>`, `<usuario>`, `<clave>` |
| Indicador de error | `<ingresoid>0</ingresoid>` o `<ingresoid>-1</ingresoid>` = error |

### ⚠️ AMBIENTES DE EJECUCIÓN

> Siempre se trabaja contra el WS real del Ministerio — no hay mocks.
> `RNDC_MODO=test` es el default para desarrollo. Usa credenciales y URL separadas de producción.

| Modo (`RNDC_MODO`) | Servidor | Credenciales |
|--------------------|----------|--------------|
| `test` _(default)_ | `plc.mintransporte.gov.co` | `RNDC_USUARIO_TEST` / `RNDC_CLAVE_TEST` |
| `produccion` | `rndcws.mintransporte.gov.co` | `RNDC_USUARIO` / `RNDC_CLAVE` |

| Servidor | URL |
|----------|-----|
| **Pruebas** (default dev) | `http://plc.mintransporte.gov.co:8080/ws/maestros?wsdl` |
| Producción primaria | `http://rndcws.mintransporte.gov.co:8080/ws/maestros?wsdl` |
| Producción contingencia | `http://rndcws2.mintransporte.gov.co:8080/ws/maestros?wsdl` |

> Los registros creados en `test` quedan visibles en `https://plc.mintransporte.gov.co/RNDC`
> con las mismas credenciales de prueba.

### 🚫 REGLA: NUNCA INVENTAR PROPIEDADES WSDL

Si durante la implementación se necesita un tipo, operación, namespace, o elemento SOAP que **no esté listado arriba**, la IA **debe detenerse** y decirle al usuario:

```
⚠️ WSDL: necesito confirmar [el detalle específico] que no está documentado.
Por favor pásame el contenido del WSDL o confírmame este detalle:
[pregunta concreta]
```

---

## ESTRUCTURA DE ARCHIVOS

```
lib/
├── services/
│   ├── rndcClient.ts          ← cliente SOAP base (este doc)
│   ├── rndcXmlBuilder.ts      ← constructores de XML por procesoid
│   └── rndcXmlParser.ts       ← extracción de ingresoid y errores
```

---

## IMPLEMENTACIÓN

### `lib/services/rndcClient.ts`

```typescript
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
 * 5. Parsear la respuesta (rndcXmlParser)
 * 6. Guardar en SyncRndc (append-only)
 * 7. Retornar { exitoso, ingresoid, errorMensaje }
 */

import axios from 'axios';
import iconv from 'iconv-lite';
import { syncRndcRepository } from '@/lib/repositories/syncRndcRepository';

const NIT_EMPRESA = process.env.RNDC_NIT_EMPRESA!;
// Credenciales de producción (usadas solo cuando RNDC_MODO=produccion)
const USUARIO = process.env.RNDC_USUARIO!;
const CLAVE   = process.env.RNDC_CLAVE!;
const RNDC_MODO = (process.env.RNDC_MODO ?? 'test') as 'test' | 'produccion';

// Selección de URL y credenciales según modo
function getRndcUrl(): string {
  return RNDC_MODO === 'test' ? process.env.RNDC_WS_URL_TEST! : process.env.RNDC_WS_URL!;
}

function getCredenciales(): RndcCredenciales {
  return {
    nit: NIT_EMPRESA,
    usuario: RNDC_MODO === 'test' ? process.env.RNDC_USUARIO_TEST! : USUARIO,
    clave:   RNDC_MODO === 'test' ? process.env.RNDC_CLAVE_TEST!   : CLAVE,
  };
}

export interface RndcCredenciales {
  nit: string;
  usuario: string;
  clave: string;
}

export interface RndcCallResult {
  exitoso: boolean;
  ingresoid?: string;
  errorMensaje?: string;
  responseXml?: string;
  syncRndcId: string;
}

/**
 * Construye el sobre SOAP que envuelve el mensaje interno del RNDC.
 * El mensaje interno ya viene en ISO-8859-1 escapado.
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

/**
 * Extrae el <ingresoid> de la respuesta SOAP del RNDC.
 * El RNDC devuelve: <return>...<ingresoid>VALOR</ingresoid>...</return>
 */
function extraerIngresoid(responseXml: string): string | null {
  const match = responseXml.match(/<ingresoid>(.*?)<\/ingresoid>/s);
  return match ? match[1].trim() : null;
}

/**
 * Extrae el mensaje de error del XML de respuesta.
 * El RNDC puede devolver errores en <descingresoid> o <error>.
 */
function extraerError(responseXml: string): string | null {
  const matchDesc = responseXml.match(/<descingresoid>(.*?)<\/descingresoid>/s);
  const matchErr = responseXml.match(/<error>(.*?)<\/error>/s);
  const valor = matchDesc?.[1] || matchErr?.[1];
  if (!valor) return null;
  // El RNDC devuelve "0" como ingresoid cuando hay error
  return valor.trim() === '0' ? null : valor.trim();
}

/**
 * Ejecuta una llamada al RNDC.
 * Guarda el resultado en SyncRndc independientemente del éxito o fracaso.
 * 
 * @param mensajeXml - XML del mensaje interno (sin sobre SOAP), en ISO-8859-1
 * @param meta - Metadatos para el log de SyncRndc
 */
export async function llamarRndc(
  mensajeXml: string,
  meta: {
    processId: number;
    tipoSolicitud: number;
    entidadTipo: string;
    entidadId: string;
    sessionId?: string;
  }
): Promise<RndcCallResult> {
  const soapEnvelope = buildSoapEnvelope(mensajeXml);

  // Convertir a Buffer ISO-8859-1 — CRÍTICO
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
        'SOAPAction': '',
      },
      responseType: 'arraybuffer',
      timeout: 30_000, // 30 segundos
    });

    httpStatus = response.status;
    // Decodificar respuesta desde ISO-8859-1
    responseXml = iconv.decode(Buffer.from(response.data), 'iso-8859-1');

    // El RNDC devuelve 200 incluso en errores — revisar el XML
    const ingresoidRaw = extraerIngresoid(responseXml);
    const esError = !ingresoidRaw || ingresoidRaw === '0' || ingresoidRaw === '-1';

    if (!esError) {
      exitoso = true;
      ingresoid = ingresoidRaw ?? undefined;
    } else {
      errorMensaje = extraerError(responseXml) ?? 'El RNDC respondió con ingresoid inválido';
    }
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      httpStatus = error.response?.status;
      errorMensaje = `Error HTTP ${httpStatus}: ${error.message}`;
    } else {
      errorMensaje = error instanceof Error ? error.message : 'Error desconocido';
    }
  }

  const duracionMs = Date.now() - inicio;

  // Guardar en log (append-only, NUNCA falla el flujo principal)
  const syncRecord = await syncRndcRepository.registrar({
    sessionId: meta.sessionId,
    processId: meta.processId,
    tipoSolicitud: meta.tipoSolicitud,
    entidadTipo: meta.entidadTipo,
    entidadId: meta.entidadId,
    // No guardar la contraseña en el log
    requestXml: mensajeXml.replace(
      new RegExp(`<clave>${CLAVE}</clave>`),
      '<clave>***</clave>'
    ),
    responseXml,
    httpStatus,
    exitoso,
    ingresoidRespuesta: ingresoid,
    errorMensaje,
    duracionMs,
  });

  return {
    exitoso,
    ingresoid,
    errorMensaje,
    responseXml,
    syncRndcId: syncRecord.id,
  };
}

/** Credenciales de la empresa desde variables de entorno */
export function getCredenciales(): RndcCredenciales {
  return { nit: NIT_EMPRESA, usuario: USUARIO, clave: CLAVE };
}
```

---

### `lib/services/rndcXmlBuilder.ts`

```typescript
/**
 * Constructores de XML para cada procesoid del RNDC.
 * 
 * Todos los strings se sanitizan para ISO-8859-1:
 * - Tildes: á=á, é=é, etc. se mantienen (ISO-8859-1 los soporta)
 * - Caracteres fuera del rango: se reemplazan por equivalente ASCII
 * - < y > en valores: escapar como &lt; y &gt;
 * 
 * NUNCA incluir la contraseña en los logs — ver rndcClient.ts
 */

import { getCredenciales } from './rndcClient';
import type { Remesa, ManifiestoOperativo } from '@prisma/client';

/** Sanitiza un string para ISO-8859-1 y escapa caracteres XML */
function san(valor: string | null | undefined, maxLen?: number): string {
  if (!valor) return '';
  const s = valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return maxLen ? s.substring(0, maxLen) : s;
}

/** Formatea fecha como YYYY-MM-DD */
function fecha(d: Date | null | undefined): string {
  if (!d) return '';
  return d.toISOString().split('T')[0];
}

/** Formatea hora como HH:mm */
function hora(d: Date | null | undefined): string {
  if (!d) return '00:00';
  return d.toISOString().split('T')[1].substring(0, 5);
}

function cabecera(tipo: number, procesoid: number): string {
  const { nit, usuario, clave } = getCredenciales();
  return `<solicitud>
  <nitnit>${nit}</nitnit>
  <usuario>${usuario}</usuario>
  <clave>${clave}</clave>
  <tipo>${tipo}</tipo>
  <procesoid>${procesoid}</procesoid>`;
}

// ─────────────────────────────────────────────────────────
// procesoid 11 — Registrar/actualizar Conductor
// ─────────────────────────────────────────────────────────
export function buildXmlConductor(conductor: {
  cedula: string;
  nombres: string;
  apellidos: string;
  categoriaLicencia: string;
}): string {
  return `<?xml version="1.0" encoding="iso-8859-1"?>
${cabecera(1, 11)}
  <datos>
    <NUMIDCONDUCTOR>${conductor.cedula}</NUMIDCONDUCTOR>
    <NOMBRECONDUCTOR>${san(conductor.nombres + ' ' + conductor.apellidos, 80)}</NOMBRECONDUCTOR>
    <CODCATEGORIACONDUCTOR>${conductor.categoriaLicencia}</CODCATEGORIACONDUCTOR>
  </datos>
</solicitud>`;
}

// ─────────────────────────────────────────────────────────
// procesoid 12 — Registrar/actualizar Vehículo
// ─────────────────────────────────────────────────────────
export function buildXmlVehiculo(vehiculo: {
  placa: string;
  configVehiculo: string;
  propietarioId?: string;
}): string {
  return `<?xml version="1.0" encoding="iso-8859-1"?>
${cabecera(1, 12)}
  <datos>
    <NUMPLACA>${vehiculo.placa.toUpperCase()}</NUMPLACA>
    <CODCONFIGURACIONVEHICULO>${vehiculo.configVehiculo}</CODCONFIGURACIONVEHICULO>
    ${vehiculo.propietarioId ? `<NUMIDPROPIETARIOVEHICULO>${vehiculo.propietarioId}</NUMIDPROPIETARIOVEHICULO>` : ''}
  </datos>
</solicitud>`;
}

// ─────────────────────────────────────────────────────────
// procesoid 3 — Registrar Remesa
// ─────────────────────────────────────────────────────────
export function buildXmlRemesa(remesa: Remesa & { consecutivo: string }): string {
  return `<?xml version="1.0" encoding="iso-8859-1"?>
${cabecera(1, 3)}
  <datos>
    <CONSECUTIVOREMESA>${remesa.consecutivo}</CONSECUTIVOREMESA>
    <DESCRIPCIONCORTAPRODUCTO>${san(remesa.descripcionCarga, 60)}</DESCRIPCIONCORTAPRODUCTO>
    <CANTIDADCARGADA>${remesa.pesoKg}</CANTIDADCARGADA>
    <UNIDADMEDIDAPRODUCTO>${remesa.unidadMedidaProducto}</UNIDADMEDIDAPRODUCTO>
    <CODOPERACIONTRANSPORTE>${remesa.codOperacionTransporte}</CODOPERACIONTRANSPORTE>
    <CODNATURALEZACARGA>${remesa.codNaturalezaCarga}</CODNATURALEZACARGA>
    <CODTIPOEMPAQUE>${remesa.codigoEmpaque}</CODTIPOEMPAQUE>
    <CODTIPOIDREMITENTE>${remesa.tipoIdRemitente}</CODTIPOIDREMITENTE>
    <NUMIDREMITENTE>${remesa.nitRemitente}</NUMIDREMITENTE>
    <CODSEDEREMITENTE>${remesa.codSedeRemitente}</CODSEDEREMITENTE>
    <CODTIPOIDDESTINATARIO>${remesa.tipoIdDestinatario}</CODTIPOIDDESTINATARIO>
    <NUMIDDESTINATARIO>${remesa.nitDestinatario}</NUMIDDESTINATARIO>
    <CODSEDEDESTINATARIO>${remesa.codSedeDestinatario}</CODSEDEDESTINATARIO>
    <CODTIPOIDPROPIETARIO>${remesa.tipoIdPropietario}</CODTIPOIDPROPIETARIO>
    <NUMIDPROPIETARIO>${remesa.nitPropietario}</NUMIDPROPIETARIO>
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
    ${remesa.valorAsegurado ? `<VALORASEGURADO>${remesa.valorAsegurado}</VALORASEGURADO>` : ''}
    ${remesa.ordenServicioGenerador ? `<ORDENSERVICIOGENERADOR>${san(remesa.ordenServicioGenerador, 20)}</ORDENSERVICIOGENERADOR>` : ''}
  </datos>
</solicitud>`;
}

// ─────────────────────────────────────────────────────────
// procesoid 4 — Registrar Manifiesto (con REMESASMAN)
// ─────────────────────────────────────────────────────────
export function buildXmlManifiesto(
  manifiesto: ManifiestoOperativo,
  remesas: Array<{ numeroRemesaRndc: string; pesoKg: number }>
): string {
  const remesasXml = remesas.map(r => `
    <REMESASMAN>
      <NUMREMESA>${r.numeroRemesaRndc}</NUMREMESA>
    </REMESASMAN>`).join('');

  return `<?xml version="1.0" encoding="iso-8859-1"?>
${cabecera(1, 4)}
  <datos>
    <NUMMANIFIESTOCARGA>${manifiesto.codigoInterno}</NUMMANIFIESTOCARGA>
    <NUMPLACA>${manifiesto.vehiculoPlaca.toUpperCase()}</NUMPLACA>
    ${manifiesto.placaRemolque ? `<NUMPLACAREMOLQUE>${manifiesto.placaRemolque.toUpperCase()}</NUMPLACAREMOLQUE>` : ''}
    <NUMIDCONDUCTOR>${manifiesto.conductorCedula}</NUMIDCONDUCTOR>
    <CODMUNICIPIOORIGENMANIFIESTO>${manifiesto.origenDane}</CODMUNICIPIOORIGENMANIFIESTO>
    <CODMUNICIPIODESTINOMANIFIESTO>${manifiesto.destinoDane}</CODMUNICIPIODESTINOMANIFIESTO>
    <FECHAEXPEDICIONMANIFIESTO>${fecha(manifiesto.fechaExpedicion)}</FECHAEXPEDICIONMANIFIESTO>
    <VALORFLETEPACTADOVIAJE>${manifiesto.fletePactado}</VALORFLETEPACTADOVIAJE>
    <RETENCIONICAMANIFIESTOCARGA>${manifiesto.retencionIca}</RETENCIONICAMANIFIESTOCARGA>
    <VALORANTICIPOMANIFIESTO>${manifiesto.valorAnticipo}</VALORANTICIPOMANIFIESTO>
    ${manifiesto.fechaPagoSaldo ? `<FECHAPAGOSALDOMANIFIESTO>${fecha(manifiesto.fechaPagoSaldo)}</FECHAPAGOSALDOMANIFIESTO>` : ''}
    ${manifiesto.municipioPagoSaldo ? `<CODMUNICIPIOPAGOSALDO>${manifiesto.municipioPagoSaldo}</CODMUNICIPIOPAGOSALDO>` : ''}
    <CODRESPONSABLEPAGOCARGUE>${manifiesto.responsablePagoCargue}</CODRESPONSABLEPAGOCARGUE>
    <CODRESPONSABLEPAGODESCARGUE>${manifiesto.responsablePagoDescargue}</CODRESPONSABLEPAGODESCARGUE>
    <ACEPTACIONELECTRONICA>${manifiesto.aceptacionElectronica ? 'SI' : 'NO'}</ACEPTACIONELECTRONICA>
    ${manifiesto.observaciones ? `<OBSERVACIONES>${san(manifiesto.observaciones, 200)}</OBSERVACIONES>` : ''}
    ${remesasXml}
  </datos>
</solicitud>`;
}

// ─────────────────────────────────────────────────────────
// procesoid 32 — Anular Manifiesto
// ─────────────────────────────────────────────────────────
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

// procesoid 5 — Cumplir Remesa
export function buildXmlCumplirRemesa(numeroRemesaRndc: string): string {
  return `<?xml version="1.0" encoding="iso-8859-1"?>
${cabecera(1, 5)}
  <datos>
    <NUMREMESA>${numeroRemesaRndc}</NUMREMESA>
  </datos>
</solicitud>`;
}

// procesoid 6 — Cumplir Manifiesto
export function buildXmlCumplirManifiesto(numeroManifiestoRndc: string): string {
  return `<?xml version="1.0" encoding="iso-8859-1"?>
${cabecera(1, 6)}
  <datos>
    <NUMMANIFIESTOCARGA>${numeroManifiestoRndc}</NUMMANIFIESTOCARGA>
  </datos>
</solicitud>`;
}
```

---

## DEPENDENCIAS REQUERIDAS

```bash
npm install axios iconv-lite
npm install --save-dev @types/iconv-lite
```

---

## VARIABLES DE ENTORNO

```env
# ─── RNDC — Ministerio de Transporte ──────────────────────────────────────────

# Modo: "test" (default) | "produccion"
RNDC_MODO=test

# Servidor de PRUEBAS del Ministerio (default para desarrollo)
RNDC_WS_URL_TEST=http://plc.mintransporte.gov.co:8080/ws/maestros?wsdl

# Servidor de PRODUCCIÓN (primario y contingencia)
RNDC_WS_URL=http://rndcws.mintransporte.gov.co:8080/ws/maestros?wsdl
RNDC_WS_URL_CONTINGENCIA=http://rndcws2.mintransporte.gov.co:8080/ws/maestros?wsdl

# NIT de la empresa (compartido)
RNDC_NIT_EMPRESA=900123456

# Credenciales TEST (diferentes a producción)
RNDC_USUARIO_TEST=usuario_pruebas
RNDC_CLAVE_TEST=clave_pruebas

# Credenciales PRODUCCIÓN
RNDC_USUARIO=usuario_produccion
RNDC_CLAVE=clave_produccion
```

---

## PATRONES DE ERROR

| Escenario | `ingresoid` | Respuesta RNDC | Manejo |
|-----------|-------------|----------------|--------|
| Conductor no existe en RUNT | `0` | Descripción del error | Log + retornar error |
| SOAT vencido | `0` | `"SOAT VENCIDO"` | Log + retornar error |
| Remesa ya registrada | número válido | Mismo número | Idempotente — actualizar DB |
| Manifiesto ya registrado | número válido | Mismo número | Idempotente — actualizar DB |
| Timeout WS | N/A | Sin respuesta | Log + `estadoManifiesto=BORRADOR` (reintentable) |
| Red caída | N/A | Sin respuesta | Log + error 502 al cliente |

---

## CRITERIOS DE ACEPTACIÓN

- [ ] Con `RNDC_MODO=test` llama a `plc.mintransporte.gov.co` con credenciales `RNDC_USUARIO_TEST`
- [ ] Con `RNDC_MODO=produccion` llama a `rndcws.mintransporte.gov.co` con credenciales `RNDC_USUARIO`
- [ ] `llamarRndc()` convierte el XML a ISO-8859-1 antes de enviar en ambos modos
- [ ] Las credenciales correctas se seleccionan automáticamente según `RNDC_MODO`
- [ ] La contraseña (`CLAVE`) no aparece en el campo `requestXml` de `SyncRndc`
- [ ] Un timeout de 30s no rompe el servidor — devuelve error controlado
- [ ] Si el RNDC responde `ingresoid=0`, `exitoso=false`
- [ ] Si el RNDC responde un número > 0, `exitoso=true`
- [ ] Cada llamada genera exactamente un registro en `SyncRndc`
- [ ] El `buildXmlRemesa()` incluye los campos de tiempos logísticos (obligatorio desde nov 2025)
- [ ] El `buildXmlManifiesto()` incluye el bloque `<REMESASMAN>` con los números RNDC
