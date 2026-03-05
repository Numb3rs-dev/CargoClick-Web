# BACK-01-F3 — Integración RUNT en Tiempo Real

## Contexto

En Fase 1 se implementó la consulta RUNT mediante **snapshot manual** en el RNDC (procesoid 30). Esta fase reemplaza eso con la **API RUNT Bridge real-time**, que permite consultas directas al RUNT sin intermediar el RNDC.

**Prerequisito crítico:** La empresa debe estar vinculada como Actor RUNT. Sin esto no hay credenciales de acceso.

---

## Diferencia Fase 1 vs Fase 3

| Aspecto | Fase 1 (snapshot RNDC) | Fase 3 (RUNT Bridge) |
|---------|------------------------|----------------------|
| Latencia | 24-48h de desfase | Tiempo real |
| Costo | Incluido en RNDC | Costo por consulta |
| Precisión | Datos del día anterior | Datos en tiempo real |
| Requisito | Solo credenciales RNDC | Vinculación actor RUNT |

---

## Gestión previa requerida

1. Ingresar como empresa a [https://www.runt.gov.co/actores/empresas-de-transporte](https://www.runt.gov.co/actores/empresas-de-transporte)
2. Solicitar credenciales de la **API Bridge**
3. Recibir: `RUNT_CLIENT_ID`, `RUNT_CLIENT_SECRET`, `RUNT_ACTOR_CODE`
4. Probar en ambiente de homologación: [https://www.runt.gov.co/runt/appback/portalTestBridgeApp/#/](https://www.runt.gov.co/runt/appback/portalTestBridgeApp/#/)

---

## Variables de entorno

```env
# RUNT Bridge API
RUNT_API_URL=https://api.runt.gov.co/v1          # producción
RUNT_API_URL_TEST=https://test-api.runt.gov.co/v1 # homologación
RUNT_CLIENT_ID=xxx
RUNT_CLIENT_SECRET=xxx
RUNT_ACTOR_CODE=xxx
RUNT_AMBIENTE=test  # 'test' | 'produccion'
```

---

## Implementación

### `lib/services/runtService.ts` — versión Bridge

```typescript
import axios from 'axios';

const BASE_URL = process.env.RUNT_AMBIENTE === 'produccion'
  ? process.env.RUNT_API_URL!
  : process.env.RUNT_API_URL_TEST!;

let tokenCache: { token: string; expira: number } | null = null;

// ── Auth ──────────────────────────────────────────────────────────────────

async function obtenerToken(): Promise<string> {
  if (tokenCache && tokenCache.expira > Date.now()) {
    return tokenCache.token;
  }

  const res = await axios.post(`${BASE_URL}/auth/token`, {
    client_id:     process.env.RUNT_CLIENT_ID,
    client_secret: process.env.RUNT_CLIENT_SECRET,
    actor_code:    process.env.RUNT_ACTOR_CODE,
    grant_type:    'client_credentials',
  });

  const token  = res.data.access_token as string;
  const expiry = (res.data.expires_in as number) * 1000;

  tokenCache = { token, expira: Date.now() + expiry - 30_000 };
  return token;
}

// ── Consultas ─────────────────────────────────────────────────────────────

export interface VehiculoRuntInfo {
  placa:           string;
  estado:          string;  // 'ACTIVO' | 'INACTIVO' | 'BAJA'
  clase:           string;
  marca:           string;
  modelo:          number;
  cilindraje?:     number;
  color:           string;
  vigenciaSoat:    string;  // fecha ISO
  vigenciaTecno:   string;  // fecha ISO
  propietario:     string;
  nitPropietario:  string;
  tieneInfraccion: boolean;
}

/**
 * Consulta información del vehículo en el RUNT (tiempo real).
 * Reemplaza procesoid 30 del RNDC.
 */
export async function consultarVehiculoRunt(placa: string): Promise<VehiculoRuntInfo> {
  const token = await obtenerToken();

  const res = await axios.get(`${BASE_URL}/vehiculos/${placa.toUpperCase()}`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 10_000,
  });

  return mapearVehiculo(res.data);
}

export interface ConductorRuntInfo {
  cedula:             string;
  nombre:             string;
  categoria:          string;  // 'C1', 'C2', 'C3', etc.
  vigenciaLicencia:   string;  // fecha ISO
  estado:             string;  // 'ACTIVO' | 'SUSPENDIDO' | 'CANCELADO'
  restricciones?:     string[];
  multasPendientes:   number;
}

/**
 * Consulta información del conductor en el RUNT (tiempo real).
 */
export async function consultarConductorRunt(cedula: string): Promise<ConductorRuntInfo> {
  const token = await obtenerToken();

  const res = await axios.get(`${BASE_URL}/conductores/${cedula}`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 10_000,
  });

  return mapearConductor(res.data);
}

// ── Mapeo respuesta ───────────────────────────────────────────────────────

function mapearVehiculo(raw: any): VehiculoRuntInfo {
  return {
    placa:           raw.placa,
    estado:          raw.estado,
    clase:           raw.clase,
    marca:           raw.marca,
    modelo:          raw.modelo,
    cilindraje:      raw.cilindraje,
    color:           raw.color,
    vigenciaSoat:    raw.soat?.vigencia,
    vigenciaTecno:   raw.tecnomecanica?.vigencia,
    propietario:     raw.propietario?.nombre,
    nitPropietario:  raw.propietario?.documento,
    tieneInfraccion: Boolean(raw.multasPendientes),
  };
}

function mapearConductor(raw: any): ConductorRuntInfo {
  return {
    cedula:           raw.cedula,
    nombre:           `${raw.nombres} ${raw.apellidos}`,
    categoria:        raw.licencia?.categoria,
    vigenciaLicencia: raw.licencia?.vigencia,
    estado:           raw.licencia?.estado,
    restricciones:    raw.restricciones,
    multasPendientes: raw.multasPendientes ?? 0,
  };
}
```

---

### Endpoint API

```typescript
// app/api/runt/vehiculo/[placa]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { consultarVehiculoRunt } from '@/lib/services/runtService';

export async function GET(
  _req: NextRequest,
  { params }: { params: { placa: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const vehiculo = await consultarVehiculoRunt(params.placa);
    return NextResponse.json({ vehiculo });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error consultando RUNT';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
```

---

## Migración desde Fase 1

En Fase 1, la validación de vehículos usaba el snapshot del RNDC. Al activar Fase 3:

1. Reemplazar llamadas a `consultarVehiculoRndc()` por `consultarVehiculoRunt()`
2. Actualizar el campo `fuenteDatos` en el modelo `Vehiculo` a `'RUNT_BRIDGE'`
3. Mantener la función RNDC como fallback en caso de indisponibilidad RUNT

```typescript
// Patrón recomendado: RUNT con fallback a RNDC
export async function obtenerInfoVehiculo(placa: string) {
  try {
    return await consultarVehiculoRunt(placa);
  } catch (err) {
    console.warn('[RUNT] Fallback a RNDC para placa:', placa, err);
    return await consultarVehiculoRndc(placa); // función Fase 1
  }
}
```

---

## Costos y quotas

- El RUNT cobra por consulta (verificar tarifa vigente con el actor asignado)
- Implementar caché local de 24h para reducir costos (los datos RUNT no cambian intra-día)
- Alertar en logs cuando se use el caché vs. datos frescos
