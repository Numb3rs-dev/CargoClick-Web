# BACK-02-F3 — Integración SIMIT: Consulta de Multas

## Contexto

El **SIMIT** (Sistema Integrado de Información sobre las Multas y Sanciones por Infracciones de Tránsito) permite consultar el historial de multas de conductores y vehículos. Es relevante para CargoClick porque:
- Permite validar conductores antes de asignar viajes
- Permite detectar vehículos con restricciones de circulación
- Es requisito en algunos contratos de carga especial

---

## Requisito previo — CRÍTICO

**No existe API SIMIT pública y gratuita.** Las opciones son:

| Opción | Descripción | Costo |
|--------|-------------|-------|
| **Acuerdo FCM** | Acuerdo con la Federación Colombiana de Municipios para acceso B2B | Por gestión institucional |
| **Portal web SIMIT** | `https://www.fcm.org.co/simit` — scraping (frágil) | Gratis pero no recomendado |
| **Proveedor tercero** | APIs de terceros como Certi, ASIS, Konfío que integran SIMIT | Tarifa por consulta |
| **RUNT multas** | El RUNT ya expone `multasPendientes` en la consulta de conductor (Fase 3-A) | Incluido en RUNT Bridge |

> **Recomendación:** Primero activar Fase 3-A (RUNT Bridge). La propiedad `multasPendientes` del conductor ya cubre el caso de uso principal. Solo implementar SIMIT completo si el cliente necesita el detalle de cada infracción.

---

## Variables de entorno

```env
# Opción 1: Proveedor tercero de SIMIT (ej. Certi, ASIS)
SIMIT_PROVIDER_URL=https://api.proveedor-simit.co/v1
SIMIT_PROVIDER_API_KEY=xxx

# Opción 2: Portal FCM con sesión
# No recomendado en producción — solo para POC
SIMIT_FCM_URL=https://www.fcm.org.co/simit/#/estado-conductor
```

---

## Implementación

### `lib/services/simitService.ts`

```typescript
import axios from 'axios';

export interface MultaSimit {
  id:          string;
  descripcion: string;
  valor:       number;
  fecha:       string;       // fecha infracción
  estado:      'PENDIENTE' | 'PAGADA' | 'EN_PROCESO';
  municipio:   string;
  secretaria:  string;
}

export interface ConsultaSimitResult {
  documento:    string;
  nombre?:      string;
  totalDeuda:   number;
  cantidadMultas: number;
  multas:       MultaSimit[];
  fuente:       'SIMIT_API' | 'RUNT_RESUMEN' | 'NO_DISPONIBLE';
}

/**
 * Consulta multas de un conductor por cédula.
 * Intenta el proveedor SIMIT; si no está configurado, usa resumen del RUNT.
 */
export async function consultarMultasConductor(
  cedula: string
): Promise<ConsultaSimitResult> {
  if (process.env.SIMIT_PROVIDER_URL && process.env.SIMIT_PROVIDER_API_KEY) {
    return consultarViaSimitProvider(cedula, 'conductor');
  }

  // Fallback: datos básicos del RUNT (Fase 3-A)
  // La función consultarConductorRunt ya devuelve multasPendientes
  return {
    documento:    cedula,
    totalDeuda:   0,
    cantidadMultas: 0,
    multas:       [],
    fuente:       'NO_DISPONIBLE',
  };
}

/**
 * Consulta multas de un vehículo por placa.
 */
export async function consultarMultasVehiculo(
  placa: string
): Promise<ConsultaSimitResult> {
  if (process.env.SIMIT_PROVIDER_URL && process.env.SIMIT_PROVIDER_API_KEY) {
    return consultarViaSimitProvider(placa, 'vehiculo');
  }

  return {
    documento:    placa,
    totalDeuda:   0,
    cantidadMultas: 0,
    multas:       [],
    fuente:       'NO_DISPONIBLE',
  };
}

async function consultarViaSimitProvider(
  documento: string,
  tipo: 'conductor' | 'vehiculo'
): Promise<ConsultaSimitResult> {
  const res = await axios.get(
    `${process.env.SIMIT_PROVIDER_URL}/multas/${tipo}/${documento}`,
    {
      headers: { 'X-API-Key': process.env.SIMIT_PROVIDER_API_KEY },
      timeout: 15_000,
    }
  );

  const raw = res.data;
  return {
    documento,
    nombre:       raw.nombre,
    totalDeuda:   raw.totalDeuda ?? 0,
    cantidadMultas: (raw.multas ?? []).length,
    multas:       (raw.multas ?? []).map(mapearMulta),
    fuente:       'SIMIT_API',
  };
}

function mapearMulta(raw: any): MultaSimit {
  return {
    id:          raw.id ?? raw.codigoInfraccion,
    descripcion: raw.descripcion ?? raw.infraccion,
    valor:       raw.valor ?? raw.monto,
    fecha:       raw.fecha,
    estado:      raw.estado?.toUpperCase() ?? 'PENDIENTE',
    municipio:   raw.municipio,
    secretaria:  raw.secretaria ?? raw.organismo,
  };
}
```

---

### Endpoint API

```typescript
// app/api/simit/conductor/[cedula]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { consultarMultasConductor } from '@/lib/services/simitService';

export async function GET(
  _req: NextRequest,
  { params }: { params: { cedula: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const resultado = await consultarMultasConductor(params.cedula);
    return NextResponse.json({ resultado });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error consultando SIMIT';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
```

---

## Uso en validación de conductor

Integrar en la validación al crear un manifiesto (antes de confirmar conductor):

```typescript
// En el servicio de manifiestos al asignar conductor:
const multas = await consultarMultasConductor(conductor.cedula);
if (multas.totalDeuda > 5_000_000) {
  // Alerta — no bloquear, solo informar
  await crearAlerta({
    tipo: 'CONDUCTOR_CON_DEUDA_SIMIT',
    descripcion: `Conductor tiene $${multas.totalDeuda.toLocaleString('es-CO')} en multas SIMIT`,
    nuevoNegocioId: negocioId,
  });
}
```

---

## Caché recomendada

Las multas SIMIT no cambian frecuentemente. Implementar caché de 24h en Redis o en la BD (tabla `ConsultasSimit`) para reducir costos y mejorar performance.
