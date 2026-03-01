# BACK-05: Capa API — Endpoints Operacionales

## CONTEXTO DE NEGOCIO

**Problema:** Los servicios de BACK-04 están listos. Ahora necesitamos los route handlers de Next.js App Router que los exponen al frontend. Estos handlers son thin controllers: validan con Zod, delegan al servicio, mapean errores a HTTP.

**Prerequisito:** BACK-01 al BACK-04 ejecutados.

---

## CONVENCIONES GLOBALES

### Respuesta exitosa
```json
{ "data": { ... } }
{ "data": [...], "meta": { "total": 100, "page": 1, "pageSize": 20 } }
```

### Errores del sistema
```json
{ "error": "VALIDATION_ERROR", "message": "...", "fields": { "campo": "mensaje" } }
{ "error": "NOT_FOUND", "message": "..." }
{ "error": "CONFLICT", "message": "..." }
{ "error": "UNAUTHORIZED", "message": "..." }
```

### Error RNDC (502)
```json
{
  "error": "RNDC_ERROR",
  "message": "El RNDC rechazó la operación",
  "rndcResponse": "...",
  "syncRndcId": "cuid..."
}
```

### Middleware de autenticación
Todas las rutas internas usan `auth()` de `@clerk/nextjs/server`.
Las rutas de encuesta (`/api/encuestas/[token]`) son **públicas**.

### Zod helpers globales
```typescript
// lib/validations/queryParams.ts
import { z } from 'zod';
export const paginacion = z.object({
  page:     z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  q:        z.string().optional(),
});
```

---

## HELPER COMPARTIDO

```typescript
// lib/utils/apiHelpers.ts
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Autenticación requerida' },
      { status: 401 }
    );
  }
  return userId;
}

export function ok<T>(data: T, meta?: object) {
  return NextResponse.json({ data, ...(meta && { meta }) });
}

export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    const fields: Record<string, string> = {};
    error.errors.forEach((e) => { fields[e.path.join('.')] = e.message; });
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Datos inválidos', fields },
      { status: 422 }
    );
  }
  if (error instanceof Error) {
    if (error.message.includes('no encontrado')) {
      return NextResponse.json({ error: 'NOT_FOUND', message: error.message }, { status: 404 });
    }
    if (error.message.includes('Ya existe')) {
      return NextResponse.json({ error: 'CONFLICT', message: error.message }, { status: 409 });
    }
  }
  console.error('[API Error]', error);
  return NextResponse.json(
    { error: 'INTERNAL_ERROR', message: 'Error interno del servidor' },
    { status: 500 }
  );
}

export function rndcError(resultado: { errorMensaje?: string; responseXml?: string; syncRndcId: string }) {
  return NextResponse.json(
    {
      error: 'RNDC_ERROR',
      message: resultado.errorMensaje ?? 'El RNDC rechazó la operación',
      rndcResponse: resultado.responseXml,
      syncRndcId: resultado.syncRndcId,
    },
    { status: 502 }
  );
}
```

---

## GRUPO 1 — Conductores

### `app/api/conductores/route.ts`
```typescript
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { conductorService } from '@/lib/services/conductorService';
import { conductorRepository } from '@/lib/repositories/conductorRepository';
import { paginacion } from '@/lib/validations/queryParams';
import { requireAuth, ok, handleError } from '@/lib/utils/apiHelpers';

const crearSchema = z.object({
  cedula:            z.string().min(5).max(20),
  nombres:           z.string().min(2).max(80),
  apellidos:         z.string().min(2).max(80),
  categoriaLicencia: z.enum(['A1','A2','B1','B2','B3','C1','C2','C3']),
  licenciaVigencia:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  telefono:          z.string().min(7).max(20).optional(),
  email:             z.string().email().optional(),
  notas:             z.string().max(500).optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const params = paginacion.safeParse(
    Object.fromEntries(req.nextUrl.searchParams)
  );
  if (!params.success) return handleError(params.error);

  const { data: conductores, total } = await conductorRepository.findAll(params.data);
  const { page, pageSize } = params.data;
  return ok(conductores, { total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  try {
    const body = crearSchema.parse(await req.json());
    const conductor = await conductorService.crear(body);
    return ok(conductor);
  } catch (e) { return handleError(e); }
}
```

### `app/api/conductores/[cedula]/route.ts`
```typescript
import { NextRequest } from 'next/server';
import { conductorRepository } from '@/lib/repositories/conductorRepository';
import { ok, handleError, requireAuth } from '@/lib/utils/apiHelpers';

export async function GET(req: NextRequest, { params }: { params: { cedula: string } }) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const conductor = await conductorRepository.findByCedula(params.cedula);
  if (!conductor) return handleError(new Error(`Conductor ${params.cedula} no encontrado`));
  return ok(conductor);
}
```

### `app/api/conductores/[cedula]/sync-rndc/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { conductorService } from '@/lib/services/conductorService';
import { ok, rndcError, requireAuth } from '@/lib/utils/apiHelpers';

export async function POST(req: NextRequest, { params }: { params: { cedula: string } }) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const resultado = await conductorService.syncRndc(params.cedula);
  if (!resultado.exitoso) return rndcError(resultado);
  return ok({ syncRndcId: resultado.syncRndcId, ingresoid: resultado.ingresoid });
}
```

---

## GRUPO 2 — Vehículos

> Patrón idéntico al de Conductores — cambiar `cedula` por `placa`.

```
app/api/vehiculos/route.ts              → GET (list), POST (crear)
app/api/vehiculos/[placa]/route.ts      → GET (detalle)
app/api/vehiculos/[placa]/sync-rndc/route.ts → POST (sync al RNDC procesoid 12)
```

### `app/api/vehiculos/route.ts` (schema)
```typescript
const crearVehiculoSchema = z.object({
  placa:              z.string().min(5).max(7).toUpperCase(),
  configVehiculo:     z.string().min(2).max(20),
  propietarioId:      z.string().optional(),
  marca:              z.string().optional(),
  modelo:             z.coerce.number().min(1900).max(2100).optional(),
  capacidadToneladasMax: z.coerce.number().positive().optional(),
  notas:              z.string().max(500).optional(),
});
```

---

## GRUPO 3 — Nuevo Negocio

### `app/api/negocios/route.ts`
```typescript
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { nuevoNegocioService } from '@/lib/services/nuevoNegocioService';
import { nuevoNegocioRepository } from '@/lib/repositories/nuevoNegocioRepository';
import { paginacion } from '@/lib/validations/queryParams';
import { requireAuth, ok, handleError } from '@/lib/utils/apiHelpers';

const crearSchema = z.object({
  solicitudId:          z.string().cuid().optional(),
  cotizacionId:         z.string().cuid().optional(),
  ajusteComercialId:    z.string().cuid().optional(),
  clienteNombre:        z.string().min(2).max(100).optional(),
  clienteNit:           z.string().max(20).optional(),
  fechaDespachoEstimada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notas:                z.string().max(1000).optional(),
}).refine(
  (d) => d.solicitudId || d.clienteNombre,
  { message: 'Se requiere solicitudId (Ruta A) o clienteNombre (Ruta B)' }
);

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const params = paginacion.extend({
    estado: z.string().optional(),
  }).safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!params.success) return handleError(params.error);

  const result = await nuevoNegocioRepository.findAll(params.data);
  return ok(result.data, result.meta);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  try {
    const body = crearSchema.parse(await req.json());
    const negocio = await nuevoNegocioService.crear(body);
    return ok(negocio);
  } catch (e) { return handleError(e); }
}
```

### `app/api/negocios/[id]/route.ts`
```typescript
// GET → findById con includes completos
// PATCH → actualizar estado, notas, fechaDespachoEstimada
```

### `app/api/negocios/[id]/cancelar/route.ts`
```typescript
// POST → nuevoNegocioService.cancelar(id)
```

---

## GRUPO 4 — Remesas

### `app/api/negocios/[id]/remesas/route.ts`
```typescript
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { remesaService } from '@/lib/services/remesaService';
import { remesaRepository } from '@/lib/repositories/remesaRepository';
import { requireAuth, ok, handleError } from '@/lib/utils/apiHelpers';

const crearRemesaSchema = z.object({
  descripcionCarga:      z.string().min(3).max(60),
  pesoKg:                z.number().positive(),
  unidadMedidaProducto:  z.string().length(2),
  codOperacionTransporte: z.string(),
  codNaturalezaCarga:    z.string(),
  codigoEmpaque:         z.string(),
  tipoIdRemitente:       z.string(),
  nitRemitente:          z.string(),
  codSedeRemitente:      z.string().default('0'),
  tipoIdDestinatario:    z.string(),
  nitDestinatario:       z.string(),
  codSedeDestinatario:   z.string().default('0'),
  tipoIdPropietario:     z.string(),
  nitPropietario:        z.string(),
  origenDane:            z.string().length(5),
  destinoDane:           z.string().length(5),
  // Obligatorios desde nov 2025
  fechaHoraCitaCargue:   z.string().datetime(),
  fechaHoraCitaDescargue: z.string().datetime(),
  horasPactoCarga:       z.number().min(0).max(23).default(0),
  minutosPactoCarga:     z.number().min(0).max(59).default(0),
  horasPactoDescargue:   z.number().min(0).max(23).default(0),
  minutosPactoDescargue: z.number().min(0).max(59).default(0),
  // Opcionales
  valorAsegurado:        z.number().optional(),
  ordenServicioGenerador: z.string().max(20).optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const remesas = await remesaRepository.findByNegocio(params.id);
  return ok(remesas);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  try {
    const body = crearRemesaSchema.parse(await req.json());
    const remesa = await remesaService.crear(params.id, body);
    return ok(remesa);
  } catch (e) { return handleError(e); }
}
```

### `app/api/remesas/[id]/enviar-rndc/route.ts`
```typescript
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const resultado = await remesaService.enviarRndc(params.id);
  if ('ya_registrada' in resultado) return ok(resultado);
  if (!resultado.exitoso) return rndcError(resultado);
  return ok({
    numeroRemesaRndc: resultado.ingresoid,
    syncRndcId: resultado.syncRndcId,
  });
}
```

### `app/api/remesas/[id]/cumplir/route.ts`
```typescript
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  try {
    const resultado = await remesaService.cumplir(params.id);
    if (!resultado.exitoso) return rndcError(resultado);
    return ok({ cumplido: true, syncRndcId: resultado.syncRndcId });
  } catch (e) { return handleError(e); }
}
```

---

## GRUPO 5 — Manifiestos

### `app/api/manifiestos/route.ts`
```typescript
const crearManifiestoSchema = z.object({
  nuevoNegocioId:    z.string().cuid(),
  conductorCedula:   z.string().min(5).max(20),
  vehiculoPlaca:     z.string().min(5).max(7),
  placaRemolque:     z.string().optional(),
  remesasIds:        z.array(z.string().cuid()).min(1),
  origenMunicipio:   z.string().min(3),
  origenDane:        z.string().length(5),
  destinoMunicipio:  z.string().min(3),
  destinoDane:       z.string().length(5),
  fletePactado:      z.number().positive(),
  valorAnticipo:     z.number().min(0).default(0),
  retencionIca:      z.number().min(0).default(4),
  fechaExpedicion:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fechaDespacho:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  observaciones:     z.string().max(200).optional(),
});

// POST → manifiestoService.crear(body) — crea + envía al RNDC
// GET  → manifiestoRepository.findAll(params)
```

### `app/api/manifiestos/[id]/cumplir/route.ts`
```typescript
// POST → manifiestoService.cumplir(id)
```

### `app/api/manifiestos/[id]/anular/route.ts`
```typescript
const anularSchema = z.object({
  motivoAnulacion: z.string().min(10).max(200),
});
// POST → manifiestoService.anular(id, motivo)
```

### `app/api/manifiestos/[id]/corregir/route.ts`
```typescript
const corregirSchema = z.object({
  motivoAnulacion: z.string().min(10).max(200),
  datosCorregidos:  crearManifiestoSchema.partial().omit({ nuevoNegocioId: true }),
});
// POST → manifiestoService.corregir(id, motivo, datos)
```

---

## GRUPO 6 — Seguimiento

### `app/api/negocios/[id]/seguimiento/route.ts`
```typescript
const hitoSchema = z.object({
  hito: z.enum([
    'CONDUCTOR_ASIGNADO','VEHICULO_EN_ORIGEN','CARGUE_INICIADO',
    'CARGUE_COMPLETADO','EN_TRANSITO','LLEGADA_DESTINO',
    'DESCARGUE_INICIADO','DESCARGUE_COMPLETADO','ENTREGADO'
  ]),
  descripcion:    z.string().max(300).optional(),
  ubicacion:      z.string().max(100).optional(),
  evidenciaUrl:   z.string().url().optional(),
  notificarCliente: z.boolean().default(false),
});

// POST → SeguimientoClienteRepository.crear() + notificación opcional
// GET  → SeguimientoClienteRepository.findByNegocio()
```

---

## GRUPO 7 — Encuesta (RUTAS PÚBLICAS)

### `app/api/encuestas/[token]/route.ts`
```typescript
// ⚠️ NO requiere auth — el token es el mecanismo de acceso

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const encuesta = await prisma.encuestaPostEntrega.findFirst({
    where: { tokenAcceso: params.token },
    include: { negocio: { select: { codigoNegocio: true, clienteNombre: true } } },
  });
  if (!encuesta) {
    return NextResponse.json({ error: 'NOT_FOUND', message: 'Encuesta no encontrada o link inválido' }, { status: 404 });
  }
  if (encuesta.respondidoEn) {
    return NextResponse.json({ error: 'CONFLICT', message: 'Esta encuesta ya fue respondida' }, { status: 409 });
  }
  return ok({ negocioCode: encuesta.negocio.codigoNegocio, tokenAcceso: encuesta.tokenAcceso });
}

const respuestaSchema = z.object({
  puntuacion:  z.number().min(1).max(5),
  comentarios: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const encuesta = await prisma.encuestaPostEntrega.findFirst({
      where: { tokenAcceso: params.token },
    });
    if (!encuesta) return NextResponse.json({ error: 'NOT_FOUND', message: 'Link inválido' }, { status: 404 });
    if (encuesta.respondidoEn) return NextResponse.json({ error: 'CONFLICT', message: 'Ya respondida' }, { status: 409 });

    const body = respuestaSchema.parse(await req.json());
    await prisma.encuestaPostEntrega.update({
      where: { id: encuesta.id },
      data: { puntuacion: body.puntuacion, comentarios: body.comentarios, respondidoEn: new Date() },
    });
    return ok({ gracias: true });
  } catch (e) { return handleError(e); }
}
```

---

## GRUPO 8 — RNDC Admin

### `app/api/rndc/sync-log/route.ts`
```typescript
// GET → SyncRndcRepository.findAll({ page, pageSize, exitoso, processId })
```

### `app/api/rndc/sync-log/[id]/reintentar/route.ts`
```typescript
// POST → Re-ejecutar desde el requestXml guardado en SyncRndc
// Llamar llamarRndc() con el mismo XML → crea nuevo registro SyncRndc
```

---

## GRUPO 9 — Parámetros

### `app/api/parametros/mensuales/route.ts`
```typescript
const parametrosMensualesSchema = z.object({
  mes:            z.number().min(1).max(12),
  anio:           z.number().min(2020),
  precioDieselPorKm: z.number().positive(),            // ACPM
  factorPeaje:    z.number().positive().default(1),
  factorCargaUtil: z.number().positive().default(1),
});

// GET  → obtener parámetros del mes actual
// POST → actualizar/crear parámetros del mes
// Util para la cotización operativa (no RNDC)
```

---

## RESUMEN DE RUTAS

| Método | Ruta | Servicio usado |
|--------|------|----------------|
| GET | `/api/conductores` | ConductorRepository |
| POST | `/api/conductores` | ConductorService.crear |
| GET | `/api/conductores/[cedula]` | ConductorRepository |
| POST | `/api/conductores/[cedula]/sync-rndc` | ConductorService.syncRndc |
| GET | `/api/vehiculos` | VehiculoRepository |
| POST | `/api/vehiculos` | VehiculoService.crear |
| POST | `/api/vehiculos/[placa]/sync-rndc` | VehiculoService.syncRndc |
| GET | `/api/negocios` | NuevoNegocioRepository |
| POST | `/api/negocios` | NuevoNegocioService.crear |
| GET | `/api/negocios/[id]` | NuevoNegocioRepository |
| POST | `/api/negocios/[id]/cancelar` | NuevoNegocioService.cancelar |
| GET | `/api/negocios/[id]/remesas` | RemesaRepository |
| POST | `/api/negocios/[id]/remesas` | RemesaService.crear |
| POST | `/api/remesas/[id]/enviar-rndc` | RemesaService.enviarRndc |
| POST | `/api/remesas/[id]/cumplir` | RemesaService.cumplir |
| GET | `/api/manifiestos` | ManifiestoRepository |
| POST | `/api/manifiestos` | ManifiestoService.crear |
| GET | `/api/manifiestos/[id]` | ManifiestoRepository |
| POST | `/api/manifiestos/[id]/cumplir` | ManifiestoService.cumplir |
| POST | `/api/manifiestos/[id]/anular` | ManifiestoService.anular |
| POST | `/api/manifiestos/[id]/corregir` | ManifiestoService.corregir |
| GET | `/api/negocios/[id]/seguimiento` | SeguimientoRepository |
| POST | `/api/negocios/[id]/seguimiento` | SeguimientoRepository.crear |
| GET | `/api/encuestas/[token]` | Prisma directo — PÚBLICA |
| POST | `/api/encuestas/[token]` | Prisma directo — PÚBLICA |
| GET | `/api/rndc/sync-log` | SyncRndcRepository |
| POST | `/api/rndc/sync-log/[id]/reintentar` | llamarRndc() |
| GET | `/api/parametros/mensuales` | Prisma directo |
| POST | `/api/parametros/mensuales` | Prisma directo |

---

## CRITERIOS DE ACEPTACIÓN

- [ ] Todos los endpoints protegidos retornan 401 sin token Clerk
- [ ] `/api/encuestas/[token]` es accesible sin autenticación
- [ ] Los errores de Zod se mapean a 422 con el objeto `fields`
- [ ] Los errores "no encontrado" se mapean a 404
- [ ] Los conflictos ("Ya existe") se mapean a 409
- [ ] Los errores RNDC se mapean a 502 con `syncRndcId`
- [ ] `POST /api/manifiestos` es idempotente si el RNDC ya registró el manifiesto
- [ ] `POST /api/encuestas/[token]` retorna 409 si ya fue respondida
- [ ] TypeScript compila sin errores en strict mode
