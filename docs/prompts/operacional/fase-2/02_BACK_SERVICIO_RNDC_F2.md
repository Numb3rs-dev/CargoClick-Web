# BACK-02-F2 — Servicio RNDC: Nuevos Procesoids (Fase 2)

## Contexto

Extiende `lib/services/rndcService.ts` (implementado en Fase 1) con los XML builders y métodos de llamada para los procesoids de Fase 2.

**Procesoids a implementar:**

| procesoid | tipo | Operación |
|-----------|------|-----------|
| 26 | 6 | Consulta tarifas SICE-TAC en tiempo real |
| 38 | 1 | Corrección de datos en remesa registrada |
| 73 | 3 | Consulta estado aceptación conductor (por manifiesto) |
| 75 | 1 | Registrar aceptación electrónica del conductor |
| 45 | 1 | Registrar novedad GPS de un viaje |
| 46 | 3 | Consultar novedades GPS de un manifiesto |
| 86 | 1 | Registrar factura electrónica de transporte |

---

## Tarea: Agregar funciones al servicio RNDC existente

### Tipos TypeScript para Fase 2

Agregar en `lib/services/rndcService.ts` (o en `types/rndc.ts` si existe):

```typescript
// ── Procesoid 26: SICE-TAC ────────────────────────────────────────────────
export interface SiceTacConsultaInput {
  periodo: string;           // 'YYYYMM'
  configuracionId: string;   // '3S3', '2S2', '3', etc.
  condicionCargaId: '1' | '2'; // 1=Cargado, 2=Vacío
  origenDane: string;        // cód. DANE origen  ej. '76001000'
  destinoDane: string;       // cód. DANE destino ej. '11001000'
}

export interface SiceTacConsultaResult {
  valormoviliza: number;     // flete total COP
  valorhora: number;         // costo hora de espera
  horasrecorrido: number;
  via: string;
  periodo: string;
}

// ── Procesoid 38: Corrección remesa ───────────────────────────────────────
export interface CorreccionRemesaInput {
  remesaId: string;          // ID RNDC de la remesa original
  camposCambiados: Record<string, string>; // solo los campos a modificar
}

// ── Procesoid 73/75: Aceptación conductor ─────────────────────────────────
export interface AceptacionConductorInput {
  manifiestoNumero: string;  // número RNDC del manifiesto
  cedulaConductor: string;
}

// ── Procesoid 45/46: GPS ──────────────────────────────────────────────────
export interface NovedadGPSInput {
  manifiestoNumero: string;
  tipoNovedad: string;       // código RNDC de tipo novedad
  latitud?: string;
  longitud?: string;
  municipioDane?: string;
  descripcion?: string;
}

// ── Procesoid 86: Factura electrónica ─────────────────────────────────────
export interface FacturaRndcInput {
  cufe: string;              // CUFE emitido por DIAN (requisito)
  numeroFactura: string;
  fechaExpedicion: string;   // ISO 8601
  nitEmpresa: string;
  nitAdquirente: string;
  nombreAdquirente: string;
  total: number;
  remesasIds: string[];      // IDs RNDC de las remesas cubiertas
}
```

---

### Procesoid 26 — SICE-TAC tiempo real

```typescript
/**
 * Consulta el valor de flete SICE-TAC para una ruta y configuración de vehículo.
 * procesoid=26, tipo=6 (consulta especial de maestros)
 *
 * Configuraciones de vehículo disponibles:
 *   3S3 (34t), 3S2 (28t), 2S3 (30t), 2S2 (25t),
 *   3 (16t), 2 (10t), 2L1/2L2/2L3 (livianos), V2/V3/V4 (volquetas)
 */
export async function consultarSiceTac(
  input: SiceTacConsultaInput
): Promise<SiceTacConsultaResult> {
  const xml = buildXmlSiceTac(input);
  const respuesta = await ejecutarLlamadaRndc(xml);
  return parsearRespuestaSiceTac(respuesta);
}

function buildXmlSiceTac(input: SiceTacConsultaInput): string {
  return `<?xml version="1.0" encoding="ISO-8859-1"?>
<RNDC>
  <solicitud>
    <tipo>6</tipo>
    <procesoid>26</procesoid>
    <usuario>${proceso.env.RNDC_USUARIO_EFECTIVO}</usuario>
    <clave>${proceso.env.RNDC_CLAVE_EFECTIVA}</clave>
  </solicitud>
  <documento>
    <PERIODO>'${input.periodo}'</PERIODO>
    <CONFIGURACIONESID>'${input.configuracionId}'</CONFIGURACIONESID>
    <CONDICIONCARGAID>'${input.condicionCargaId}'</CONDICIONCARGAID>
    <ORIGEN>'${input.origenDane}'</ORIGEN>
    <DESTINO>'${input.destinoDane}'</DESTINO>
  </documento>
</RNDC>`;
}

function parsearRespuestaSiceTac(respuestaXml: string): SiceTacConsultaResult {
  // El WS devuelve la estructura en el nodo <respuesta> o <RESULTADOS>
  // Parsear con xml2js o similar — extraer:
  // valormoviliza, valorhora, horasrecorrido, via, PERIODO
  const parsed = parsearXmlRndc(respuestaXml); // función helper existente Fase 1
  const datos = parsed?.RNDC?.respuesta?.[0] ?? parsed?.RNDC?.RESULTADOS?.[0];
  return {
    valormoviliza: Number(datos?.valormoviliza?.[0] ?? 0),
    valorhora:     Number(datos?.valorhora?.[0] ?? 0),
    horasrecorrido: Number(datos?.horasrecorrido?.[0] ?? 0),
    via:           String(datos?.via?.[0] ?? ''),
    periodo:       String(datos?.PERIODO?.[0] ?? input.periodo),
  };
}
```

---

### Procesoid 38 — Corrección de remesa

```typescript
/**
 * Corrige campos de una remesa ya registrada en el RNDC.
 * procesoid=38, tipo=1
 * Solo se pueden corregir campos no bloqueados (fecha, origen, destino, mercancía).
 */
export async function corregirRemesa(
  input: CorreccionRemesaInput
): Promise<{ exito: boolean; mensaje: string }> {
  const xml = buildXmlCorreccionRemesa(input);
  const respuesta = await ejecutarLlamadaRndc(xml);
  return parsearRespuestaGenericaRndc(respuesta);
}

function buildXmlCorreccionRemesa(input: CorreccionRemesaInput): string {
  const camposXml = Object.entries(input.camposCambiados)
    .map(([k, v]) => `    <${k}>'${v}'</${k}>`)
    .join('\n');

  return `<?xml version="1.0" encoding="ISO-8859-1"?>
<RNDC>
  <solicitud>
    <tipo>1</tipo>
    <procesoid>38</procesoid>
    <usuario>${process.env.RNDC_USUARIO_EFECTIVO}</usuario>
    <clave>${process.env.RNDC_CLAVE_EFECTIVA}</clave>
  </solicitud>
  <documento>
    <REMESAID>'${input.remesaId}'</REMESAID>
${camposXml}
  </documento>
</RNDC>`;
}
```

---

### Procesoids 73 y 75 — Aceptación electrónica del conductor

```typescript
/**
 * Consulta si el conductor ya aceptó electrónicamente el manifiesto.
 * procesoid=73, tipo=3 (consulta)
 */
export async function consultarAceptacionConductor(
  input: AceptacionConductorInput
): Promise<{ aceptado: boolean; fecha?: string; estado: string }> {
  const xml = buildXmlConsultaAceptacion(input);
  const respuesta = await ejecutarLlamadaRndc(xml);
  // Parsear resultado — campos: ESTADOACEPTACION, FECHAACEPTACION
  return parsearRespuestaAceptacion(respuesta);
}

/**
 * Registra la aceptación electrónica del conductor en el RNDC.
 * procesoid=75, tipo=1 (registro)
 * Debe llamarse una vez el conductor confirma via portal/app.
 */
export async function registrarAceptacionConductor(
  input: AceptacionConductorInput
): Promise<{ exito: boolean; mensaje: string }> {
  const xml = buildXmlRegistroAceptacion(input);
  const respuesta = await ejecutarLlamadaRndc(xml);
  return parsearRespuestaGenericaRndc(respuesta);
}

function buildXmlConsultaAceptacion(input: AceptacionConductorInput): string {
  return `<?xml version="1.0" encoding="ISO-8859-1"?>
<RNDC>
  <solicitud>
    <tipo>3</tipo>
    <procesoid>73</procesoid>
    <usuario>${process.env.RNDC_USUARIO_EFECTIVO}</usuario>
    <clave>${process.env.RNDC_CLAVE_EFECTIVA}</clave>
  </solicitud>
  <documento>
    <MANIFESTOID>'${input.manifiestoNumero}'</MANIFESTOID>
    <CEDULA>'${input.cedulaConductor}'</CEDULA>
  </documento>
</RNDC>`;
}

function buildXmlRegistroAceptacion(input: AceptacionConductorInput): string {
  return `<?xml version="1.0" encoding="ISO-8859-1"?>
<RNDC>
  <solicitud>
    <tipo>1</tipo>
    <procesoid>75</procesoid>
    <usuario>${process.env.RNDC_USUARIO_EFECTIVO}</usuario>
    <clave>${process.env.RNDC_CLAVE_EFECTIVA}</clave>
  </solicitud>
  <documento>
    <MANIFESTOID>'${input.manifiestoNumero}'</MANIFESTOID>
    <CEDULA>'${input.cedulaConductor}'</CEDULA>
  </documento>
</RNDC>`;
}
```

---

### Procesoids 45 y 46 — GPS / Novedades de flota

```typescript
/**
 * Registra una novedad GPS de un viaje en el RNDC.
 * procesoid=45, tipo=1
 */
export async function registrarNovedadGPS(
  input: NovedadGPSInput
): Promise<{ exito: boolean; mensaje: string }> {
  const xml = buildXmlNovedadGPS(input);
  const respuesta = await ejecutarLlamadaRndc(xml);
  return parsearRespuestaGenericaRndc(respuesta);
}

/**
 * Consulta novedades GPS registradas para un manifiesto.
 * procesoid=46, tipo=3
 */
export async function consultarNovedadesGPS(
  manifiestoNumero: string
): Promise<NovedadGPSInput[]> {
  const xml = buildXmlConsultaNovedades(manifiestoNumero);
  const respuesta = await ejecutarLlamadaRndc(xml);
  return parsearRespuestaNovedades(respuesta);
}

function buildXmlNovedadGPS(input: NovedadGPSInput): string {
  return `<?xml version="1.0" encoding="ISO-8859-1"?>
<RNDC>
  <solicitud>
    <tipo>1</tipo>
    <procesoid>45</procesoid>
    <usuario>${process.env.RNDC_USUARIO_EFECTIVO}</usuario>
    <clave>${process.env.RNDC_CLAVE_EFECTIVA}</clave>
  </solicitud>
  <documento>
    <MANIFESTOID>'${input.manifiestoNumero}'</MANIFESTOID>
    <TIPONOVEDADID>'${input.tipoNovedad}'</TIPONOVEDADID>
    ${input.latitud    ? `<LATITUD>'${input.latitud}'</LATITUD>` : ''}
    ${input.longitud   ? `<LONGITUD>'${input.longitud}'</LONGITUD>` : ''}
    ${input.municipioDane ? `<MUNICIPIOID>'${input.municipioDane}'</MUNICIPIOID>` : ''}
    ${input.descripcion   ? `<DESCRIPCION>'${escapeXml(input.descripcion)}'</DESCRIPCION>` : ''}
  </documento>
</RNDC>`;
}

function buildXmlConsultaNovedades(manifiestoNumero: string): string {
  return `<?xml version="1.0" encoding="ISO-8859-1"?>
<RNDC>
  <solicitud>
    <tipo>3</tipo>
    <procesoid>46</procesoid>
    <usuario>${process.env.RNDC_USUARIO_EFECTIVO}</usuario>
    <clave>${process.env.RNDC_CLAVE_EFECTIVA}</clave>
  </solicitud>
  <documento>
    <MANIFESTOID>'${manifiestoNumero}'</MANIFESTOID>
  </documento>
</RNDC>`;
}
```

---

### Procesoid 86 — Factura Electrónica de Transporte

> **Importante:** El CUFE es obligatorio. Debe obtenerse previamente de la DIAN
> a través del proveedor de facturación electrónica (Siigo, Alegra, Factura1, etc.).
> El RNDC solo acepta facturas ya aprobadas por la DIAN.

```typescript
/**
 * Registra en el RNDC una factura electrónica ya aprobada por la DIAN.
 * procesoid=86, tipo=1
 * Prerequisito: factura.estadoDian === 'APROBADA' y factura.cufe existe.
 */
export async function registrarFacturaRndc(
  input: FacturaRndcInput
): Promise<{ exito: boolean; mensaje: string }> {
  const xml = buildXmlFacturaElectronica(input);
  const respuesta = await ejecutarLlamadaRndc(xml);
  return parsearRespuestaGenericaRndc(respuesta);
}

function buildXmlFacturaElectronica(input: FacturaRndcInput): string {
  const remesasXml = input.remesasIds
    .map(id => `    <REMESAID>'${id}'</REMESAID>`)
    .join('\n');

  return `<?xml version="1.0" encoding="ISO-8859-1"?>
<RNDC>
  <solicitud>
    <tipo>1</tipo>
    <procesoid>86</procesoid>
    <usuario>${process.env.RNDC_USUARIO_EFECTIVO}</usuario>
    <clave>${process.env.RNDC_CLAVE_EFECTIVA}</clave>
  </solicitud>
  <documento>
    <CUFE>'${input.cufe}'</CUFE>
    <NUMEROFACTURA>'${input.numeroFactura}'</NUMEROFACTURA>
    <FECHAEXPEDICION>'${input.fechaExpedicion}'</FECHAEXPEDICION>
    <NITEMPRESA>'${input.nitEmpresa}'</NITEMPRESA>
    <NITADQUIRENTE>'${input.nitAdquirente}'</NITADQUIRENTE>
    <NOMBREADQUIRENTE>'${escapeXml(input.nombreAdquirente)}'</NOMBREADQUIRENTE>
    <VALORTOTAL>'${input.total}'</VALOROTAL>
${remesasXml}
  </documento>
</RNDC>`;
}
```

---

## Helper recomendado

Agregar helper `escapeXml` si no existe en el servicio:

```typescript
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
```

---

## Notas de implementación

- Reutilizar `ejecutarLlamadaRndc()` de Fase 1 — ya maneja credenciales test/producción y encoding ISO-8859-1
- Reutilizar `parsearRespuestaGenericaRndc()` de Fase 1 para respuestas simples (exito/mensaje)
- Para parsear respuestas con datos (como SiceTac), implementar parsers específicos
- Los logs de cada llamada deben incluir `procesoid` para facilitar debugging
