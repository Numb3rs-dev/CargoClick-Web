# BACK-04-F2 — API Endpoints (Fase 2)

## Contexto

Define los nuevos endpoints Next.js App Router para los servicios de Fase 2. Todos van bajo el directorio `app/api/`.

---

## Estructura de rutas

```
app/api/
├── sice-tac/
│   └── consultar/
│       └── route.ts          GET  → consulta tarifa SICE-TAC
├── manifiestos/
│   └── [id]/
│       ├── aceptacion-conductor/
│       │   └── route.ts       GET (estado) + POST (iniciar flujo)
│       └── novedades-gps/
│           └── route.ts       GET (listar) + POST (registrar)
├── aceptacion-conductor/
│   └── confirmar/
│       └── route.ts          POST → endpoint público para el conductor
└── facturas/
    └── route.ts               GET (listar) + POST (crear)
    └── [id]/
        ├── route.ts           GET (detalle)
        ├── dian-aprobacion/
        │   └── route.ts       POST → webhook DIAN
        └── reportar-rndc/
            └── route.ts       POST → reportar al RNDC
```

---

## Implementación

### `app/api/sice-tac/consultar/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { obtenerTarifaSiceTac, getPeriodoActual, mapearConfiguracionVehiculo } from '@/lib/services/siceTacService';

// GET /api/sice-tac/consultar?origen=76001000&destino=11001000&vehiculo=3S3&condicion=1
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const origen       = searchParams.get('origen');
  const destino      = searchParams.get('destino');
  const vehiculo     = searchParams.get('vehiculo');   // código directo o tipo interno
  const condicion    = (searchParams.get('condicion') ?? '1') as '1' | '2';
  const periodo      = searchParams.get('periodo') ?? getPeriodoActual();

  if (!origen || !destino || !vehiculo) {
    return NextResponse.json(
      { error: 'Parámetros requeridos: origen, destino, vehiculo' },
      { status: 400 }
    );
  }

  try {
    const configuracionId = vehiculo.length <= 4 && vehiculo.match(/^[0-9VS]/)
      ? vehiculo
      : mapearConfiguracionVehiculo(vehiculo);

    const tarifa = await obtenerTarifaSiceTac({
      periodo,
      configuracionId,
      condicionCargaId: condicion,
      origenDane:       origen,
      destinoDane:      destino,
    });

    return NextResponse.json({ ok: true, tarifa });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error consultando SICE-TAC';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
```

---

### `app/api/manifiestos/[id]/aceptacion-conductor/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import {
  iniciarAceptacionConductor,
  sincronizarEstadoAceptacion,
} from '@/lib/services/aceptacionConductorService';

// GET — Consulta estado de aceptación del manifiesto
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  // Sincronizar desde RNDC si hay aceptación pendiente
  await sincronizarEstadoAceptacion(params.id);

  const aceptacion = await prisma.aceptacionConductor.findUnique({
    where: { manifiestoId: params.id },
    select: {
      estadoRndc:      true,
      fechaAceptacion: true,
      nombreConductor: true,
      cedula:          true,
    },
  });

  return NextResponse.json({ aceptacion });
}

// POST — Inicia flujo de aceptación (genera URL para el conductor)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const manifiesto = await prisma.manifiesto.findUniqueOrThrow({
    where: { id: params.id },
    include: { conductor: true },
  });

  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';

  const { url, token } = await iniciarAceptacionConductor(
    params.id,
    manifiesto.numeroManifiesto,
    manifiesto.conductor.cedula,
    manifiesto.conductor.nombre,
    ip
  );

  return NextResponse.json({ ok: true, url, token });
}
```

---

### `app/api/aceptacion-conductor/confirmar/route.ts`

> Endpoint **público** — sin autenticación Clerk — llamado por el conductor desde su celular.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { procesarAceptacion } from '@/lib/services/aceptacionConductorService';

// POST /api/aceptacion-conductor/confirmar
// Body: { token: string }
export async function POST(req: NextRequest) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 400 });

  try {
    const resultado = await procesarAceptacion(token);
    return NextResponse.json(resultado);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error procesando aceptación';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
```

---

### `app/api/manifiestos/[id]/novedades-gps/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { registrarNovedad, obtenerNovedadesManifiesto } from '@/lib/services/gpsService';
import { prisma } from '@/lib/db/prisma';
import { TipoNovedadGPS } from '@prisma/client';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const novedades = await obtenerNovedadesManifiesto(params.id);
  return NextResponse.json({ novedades });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { tipo, latitud, longitud, municipioDane, descripcion } = await req.json();

  const manifiesto = await prisma.manifiesto.findUniqueOrThrow({
    where: { id: params.id },
  });

  const novedad = await registrarNovedad(
    params.id,
    manifiesto.numeroManifiesto,
    tipo as TipoNovedadGPS,
    { latitud, longitud, municipioDane, descripcion },
    userId
  );

  return NextResponse.json({ ok: true, novedad }, { status: 201 });
}
```

---

### `app/api/facturas/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { crearFactura, listarFacturas } from '@/lib/services/facturaElectronicaService';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const nuevoNegocioId = searchParams.get('nuevoNegocioId') ?? undefined;

  const facturas = await listarFacturas(nuevoNegocioId);
  return NextResponse.json({ facturas });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();
  const factura = await crearFactura({ ...body, creadaPor: userId });
  return NextResponse.json({ ok: true, factura }, { status: 201 });
}
```

---

### `app/api/facturas/[id]/reportar-rndc/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { reportarFacturaAlRndc } from '@/lib/services/facturaElectronicaService';

// POST /api/facturas/[id]/reportar-rndc
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const factura = await reportarFacturaAlRndc(params.id);
    return NextResponse.json({ ok: true, factura });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error reportando al RNDC';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
```

---

### `app/api/facturas/[id]/dian-aprobacion/route.ts`

Webhook llamado por el proveedor DIAN cuando aprueba una factura.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { registrarAprobacionDian } from '@/lib/services/facturaElectronicaService';

// POST — webhook externo del proveedor DIAN — sin Clerk auth
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Validar secret del proveedor DIAN
  const secret = req.headers.get('x-webhook-secret');
  if (secret !== process.env.DIAN_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { cufe, xmlDian, respuestaDian } = await req.json();

  await registrarAprobacionDian(params.id, cufe, xmlDian, respuestaDian);
  return NextResponse.json({ ok: true });
}
```

---

## Variables de entorno adicionales necesarias

```env
NEXT_PUBLIC_APP_URL=https://app.cargoclick.co
DIAN_WEBHOOK_SECRET=secreto_para_validar_webhook_dian
```
