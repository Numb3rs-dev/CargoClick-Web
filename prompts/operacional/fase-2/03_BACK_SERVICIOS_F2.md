# BACK-03-F2 — Servicios de Negocio (Fase 2)

## Contexto

Implementa la capa de servicios de negocio para Fase 2. Cada servicio orquesta llamadas al RNDC (via rndcService), persistencia en BD (via Prisma) y lógica de negocio.

**Prerequisito:** `01_BACK_SCHEMA_F2.md` aplicado y migración ejecutada.

---

## Arquitectura de servicios Fase 2

```
lib/services/
├── siceTacService.ts         — Consulta tarifas SICE-TAC con caché
├── aceptacionConductorService.ts — Flujo firma electrónica conductor
├── gpsService.ts             — Novedades GPS + consultas
└── facturaElectronicaService.ts — Orquesta flujo DIAN → RNDC
```

---

## 1. `siceTacService.ts`

Consulta el valor de flete SICE-TAC con caché de 1 hora (los datos cambian mensualmente).

```typescript
// lib/services/siceTacService.ts
import { consultarSiceTac, SiceTacConsultaInput, SiceTacConsultaResult } from './rndcService';

// Caché simple en memoria (válido para instancia única Next.js)
// Para multi-instancia usar Redis
const cache = new Map<string, { resultado: SiceTacConsultaResult; expira: number }>();

function cacheKey(input: SiceTacConsultaInput): string {
  return `${input.periodo}-${input.configuracionId}-${input.condicionCargaId}-${input.origenDane}-${input.destinoDane}`;
}

export async function obtenerTarifaSiceTac(
  input: SiceTacConsultaInput
): Promise<SiceTacConsultaResult> {
  const key = cacheKey(input);
  const ahora = Date.now();
  const cached = cache.get(key);

  if (cached && cached.expira > ahora) {
    return cached.resultado;
  }

  const resultado = await consultarSiceTac(input);

  cache.set(key, {
    resultado,
    expira: ahora + 60 * 60 * 1000, // 1 hora
  });

  return resultado;
}

/**
 * Obtiene el período actual en formato YYYYMM.
 * SICE-TAC usa el período del mes en curso.
 */
export function getPeriodoActual(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `${yyyy}${mm}`;
}

/**
 * Convierte la configuración del vehículo al código SICE-TAC.
 * Usar la configuración almacenada en el modelo Vehiculo.
 */
export function mapearConfiguracionVehiculo(tipoCamion: string): string {
  const mapa: Record<string, string> = {
    TRACTOMULA_3S3: '3S3',
    TRACTOMULA_3S2: '3S2',
    TRACTOMULA_2S3: '2S3',
    TRACTOMULA_2S2: '2S2',
    CAMION_3: '3',
    CAMION_2: '2',
    LIVIANO_2L1: '2L1',
    LIVIANO_2L2: '2L2',
    LIVIANO_2L3: '2L3',
    VOLQUETA_V2: 'V2',
    VOLQUETA_V3: 'V3',
    VOLQUETA_V4: 'V4',
  };
  return mapa[tipoCamion] ?? '2S3'; // default razonable
}
```

---

## 2. `aceptacionConductorService.ts`

Gestiona el flujo de aceptación electrónica del conductor.

```typescript
// lib/services/aceptacionConductorService.ts
import { prisma } from '@/lib/db/prisma';
import {
  consultarAceptacionConductor,
  registrarAceptacionConductor,
} from './rndcService';
import crypto from 'crypto';

/**
 * Inicia el proceso de aceptación: genera token y persiste en BD.
 * Devuelve la URL corta que se puede enviar al conductor (SMS/WhatsApp).
 */
export async function iniciarAceptacionConductor(
  manifiestoId: string,
  manifiestoNumeroRndc: string,
  cedulaConductor: string,
  nombreConductor: string,
  ipCliente: string
): Promise<{ url: string; token: string }> {
  const token = crypto.randomBytes(32).toString('hex');

  await prisma.aceptacionConductor.upsert({
    where: { manifiestoId },
    create: {
      manifiestoId,
      cedula: cedulaConductor,
      nombreConductor,
      tokenAceptacion: token,
      ipCliente,
    },
    update: {
      tokenAceptacion: token,
      ipCliente,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.cargoclick.co';
  return {
    url: `${baseUrl}/aceptacion-conductor?token=${token}`,
    token,
  };
}

/**
 * Procesa la aceptación del conductor cuando hace clic en el enlace.
 * 1. Valida el token
 * 2. Llama al RNDC procesoid=75
 * 3. Actualiza BD con fecha de aceptación y respuesta RNDC
 */
export async function procesarAceptacion(token: string): Promise<{
  exito: boolean;
  mensaje: string;
  nombreConductor: string;
}> {
  const aceptacion = await prisma.aceptacionConductor.findUnique({
    where: { tokenAceptacion: token },
    include: { manifiesto: true },
  });

  if (!aceptacion) throw new Error('Token de aceptación inválido o expirado');
  if (aceptacion.fechaAceptacion) {
    return {
      exito: true,
      mensaje: 'Manifiesto ya fue aceptado previamente',
      nombreConductor: aceptacion.nombreConductor,
    };
  }

  const resultado = await registrarAceptacionConductor({
    manifiestoNumero: aceptacion.manifiesto.numeroManifiesto,
    cedulaConductor: aceptacion.cedula,
  });

  await prisma.aceptacionConductor.update({
    where: { id: aceptacion.id },
    data: {
      fechaAceptacion: resultado.exito ? new Date() : undefined,
      estadoRndc: resultado.exito ? 'ACEPTADO' : 'ERROR',
      descripcionRndc: resultado.mensaje,
    },
  });

  return {
    exito: resultado.exito,
    mensaje: resultado.mensaje,
    nombreConductor: aceptacion.nombreConductor,
  };
}

/**
 * Sincroniza el estado de aceptación desde el RNDC.
 * Usar en background job o al cargar el detalle del manifiesto.
 */
export async function sincronizarEstadoAceptacion(
  manifiestoId: string
): Promise<void> {
  const aceptacion = await prisma.aceptacionConductor.findUnique({
    where: { manifiestoId },
    include: { manifiesto: true },
  });
  if (!aceptacion) return;

  const estado = await consultarAceptacionConductor({
    manifiestoNumero: aceptacion.manifiesto.numeroManifiesto,
    cedulaConductor: aceptacion.cedula,
  });

  if (estado.aceptado && !aceptacion.fechaAceptacion) {
    await prisma.aceptacionConductor.update({
      where: { id: aceptacion.id },
      data: {
        fechaAceptacion: estado.fecha ? new Date(estado.fecha) : new Date(),
        estadoRndc: 'ACEPTADO',
      },
    });
  }
}
```

---

## 3. `gpsService.ts`

Registro y consulta de novedades GPS.

```typescript
// lib/services/gpsService.ts
import { prisma } from '@/lib/db/prisma';
import { registrarNovedadGPS, consultarNovedadesGPS, NovedadGPSInput } from './rndcService';
import { TipoNovedadGPS } from '@prisma/client';

export async function registrarNovedad(
  manifiestoId: string,
  manifiestoNumeroRndc: string,
  tipo: TipoNovedadGPS,
  datos: {
    latitud?: number;
    longitud?: number;
    municipioDane?: string;
    descripcion?: string;
  },
  registradaPor: string
) {
  // Mapa enum interno → código RNDC
  const tiposRndc: Record<TipoNovedadGPS, string> = {
    INICIO_CARGUE:    '1',
    FIN_CARGUE:       '2',
    INICIO_VIAJE:     '3',
    EN_RUTA:          '4',
    LLEGADA_DESTINO:  '5',
    INICIO_DESCARGUE: '6',
    FIN_DESCARGUE:    '7',
    NOVEDAD_TRANSITO: '8',
  };

  const input: NovedadGPSInput = {
    manifiestoNumero: manifiestoNumeroRndc,
    tipoNovedad: tiposRndc[tipo],
    latitud:     datos.latitud?.toString(),
    longitud:    datos.longitud?.toString(),
    municipioDane: datos.municipioDane,
    descripcion:  datos.descripcion,
  };

  const resultado = await registrarNovedadGPS(input);

  const novedad = await prisma.novedadGPS.create({
    data: {
      manifiestoId,
      tipo,
      latitud:     datos.latitud !== undefined ? datos.latitud : undefined,
      longitud:    datos.longitud !== undefined ? datos.longitud : undefined,
      municipioDane: datos.municipioDane,
      descripcion: datos.descripcion,
      estadoRndc:  resultado.exito ? 'REGISTRADA' : 'ERROR',
      codigoRndc:  resultado.mensaje,
      fechaRegistro: resultado.exito ? new Date() : undefined,
      registradaPor,
    },
  });

  return novedad;
}

export async function obtenerNovedadesManifiesto(manifiestoId: string) {
  return prisma.novedadGPS.findMany({
    where: { manifiestoId },
    orderBy: { registradaEn: 'asc' },
  });
}
```

---

## 4. `facturaElectronicaService.ts`

Orquesta el flujo completo DIAN → RNDC.

```typescript
// lib/services/facturaElectronicaService.ts
import { prisma } from '@/lib/db/prisma';
import { registrarFacturaRndc } from './rndcService';
import { EstadoFacturaDian, EstadoFacturaRndc } from '@prisma/client';

// ── Creación ──────────────────────────────────────────────────────────────

export async function crearFactura(datos: {
  nuevoNegocioId: string;
  nitAdquirente: string;
  nombreAdquirente: string;
  subtotal: number;
  remesasIds: string[];
  creadaPor: string;
}) {
  const consecutivo = await generarConsecutivoFactura();

  return prisma.facturaElectronica.create({
    data: {
      nuevoNegocioId: datos.nuevoNegocioId,
      numeroFactura:  `FT-001-${consecutivo}`,
      nitAdquirente:  datos.nitAdquirente,
      nombreAdquirente: datos.nombreAdquirente,
      subtotal:  datos.subtotal,
      iva:       0,
      total:     datos.subtotal, // transporte 0% IVA
      remesasIds: datos.remesasIds,
      creadaPor:  datos.creadaPor,
      estadoDian: EstadoFacturaDian.BORRADOR,
      estadoRndc: EstadoFacturaRndc.PENDIENTE,
    },
  });
}

// ── Registro DIAN (externo) ───────────────────────────────────────────────

/**
 * Actualiza la factura con el CUFE devuelto por el proveedor DIAN.
 * Este método es llamado por el webhook del proveedor de facturación.
 */
export async function registrarAprobacionDian(
  facturaId: string,
  cufe: string,
  xmlDian: string,
  respuestaDian: object
) {
  return prisma.facturaElectronica.update({
    where: { id: facturaId },
    data: {
      cufe,
      xmlDian,
      respuestaDian,
      estadoDian: EstadoFacturaDian.APROBADA,
    },
  });
}

// ── Reporte al RNDC ───────────────────────────────────────────────────────

/**
 * Reporta una factura aprobada por DIAN al RNDC (procesoid=86).
 * Prerequisito: factura.estadoDian === APROBADA y cufe != null.
 */
export async function reportarFacturaAlRndc(facturaId: string) {
  const factura = await prisma.facturaElectronica.findUniqueOrThrow({
    where: { id: facturaId },
  });

  if (factura.estadoDian !== EstadoFacturaDian.APROBADA || !factura.cufe) {
    throw new Error('La factura debe estar aprobada por DIAN antes de reportar al RNDC');
  }

  const resultado = await registrarFacturaRndc({
    cufe:            factura.cufe,
    numeroFactura:   factura.numeroFactura,
    fechaExpedicion: factura.fechaExpedicion.toISOString(),
    nitEmpresa:      process.env.DIAN_EMPRESA_NIT!,
    nitAdquirente:   factura.nitAdquirente,
    nombreAdquirente: factura.nombreAdquirente,
    total:           Number(factura.total),
    remesasIds:      factura.remesasIds,
  });

  return prisma.facturaElectronica.update({
    where: { id: facturaId },
    data: {
      estadoRndc:    resultado.exito
        ? EstadoFacturaRndc.REGISTRADA
        : EstadoFacturaRndc.ERROR_RNDC,
      respuestaRndc: resultado as unknown as object,
    },
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────

async function generarConsecutivoFactura(): Promise<string> {
  const count = await prisma.facturaElectronica.count();
  return String(count + 1).padStart(6, '0');
}

export async function listarFacturas(nuevoNegocioId?: string) {
  return prisma.facturaElectronica.findMany({
    where: nuevoNegocioId ? { nuevoNegocioId } : undefined,
    orderBy: { creadaEn: 'desc' },
    include: { nuevoNegocio: { select: { id: true } } },
  });
}
```
