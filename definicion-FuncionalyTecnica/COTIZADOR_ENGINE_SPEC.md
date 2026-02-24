# Especificación Técnica — Motor de Cotización de Flete

**Fecha:** Febrero 2026  
**Versión:** 1.0  
**Propósito:** Definir cómo pasar de los datos del wizard → costo técnico (SISETAC) → tarifa sugerida al cliente  
**Base normativa:** Resolución MinTransporte 20213040034405 · Protocolo SICE-TAC

---

## Índice

1. [Visión general del motor](#1-visión-general-del-motor)
2. [Qué tenemos vs. qué necesita SISETAC](#2-qué-tenemos-vs-qué-necesita-sisetac)
3. [Modelo de parámetros del operador](#3-modelo-de-parámetros-del-operador)
4. [Motor de inferencias — de datos del cliente a datos técnicos](#4-motor-de-inferencias)
5. [Fórmulas completas con valores concretos](#5-fórmulas-completas)
6. [Modelo de tarifa sugerida (precio de venta)](#6-tarifa-sugerida)
7. [Contrato de la API](#7-contrato-de-la-api)
8. [Esquema de BD — tablas de parámetros](#8-esquema-de-bd)
9. [Parámetros de referencia precargados (MVP)](#9-parámetros-de-referencia-precargados)
10. [Roadmap de precisión por fases](#10-roadmap)

---

## 1. Visión general del motor

### El flujo de tres capas

```
CAPA 1 — DATOS DEL CLIENTE (wizard)
   origen, destino, distanciaKm, tipoCarga, pesoKg, fechaRequerida

         ↓  inferencia automática

CAPA 2 — MOTOR DE COSTO TÉCNICO (SISETAC)
   configVehiculo + tablas del operador → CF + CV + OC = PISO TÉCNICO

         ↓  política comercial del operador

CAPA 3 — TARIFA SUGERIDA
   PISO × (1 + margen) → PRECIO DE VENTA RECOMENDADO
```

### El resultado final

El engine produce **tres números clave** para el operador de transporte:

| # | Valor | Descripción | Para qué sirve |
|---|-------|-------------|----------------|
| 1 | `costoTecnicoBase` | Suma CF + CV puro (sin OC) | Punto de equilibrio operativo |
| 2 | `fleteReferencialSisetac` | Flete calculado con metodología SISETAC completa | Piso legal de referencia |
| 3 | `tarifaSugerida` | Flete referencial × factor comercial del operador | Precio que se le presenta al cliente |

> **Claridad conceptual:** el sistema NO fija tarifas obligatorias. Genera un **piso técnico** auditable (SISETAC) y sobre ese calcula una **sugerencia de venta** que el operador puede ajustar.

---

## 2. Qué tenemos vs. qué necesita SISETAC

### 2.1. Datos que YA captura el wizard

| Campo BD | Valor ejemplo | Uso en SISETAC |
|----------|---------------|----------------|
| `origen` | `"05001"` (Medellín) | Nudo vial origen |
| `destino` | `"11001"` (Bogotá) | Nudo vial destino |
| `distanciaKm` | `425` | Variable principal de CV y tiempo |
| `tramoDistancia` | `"LARGA"` | Referencia (se usa `distanciaKm` directamente) |
| `tipoServicio` | `"NACIONAL"` | Determina lógica de terreno |
| `tipoCarga` | `"CARGA_GENERAL"` | Mapeo directo a carrocería SISETAC ✅ |
| `pesoKg` | `8500` | **Inferencia de `configVehiculo`** |
| `dimLargoCm/AnchoCm/AltoCm` | `300/200/200` | Validación volumétrica (confirma vehículo) |
| `volumenM3` | `12.0` | Validación de capacidad del vehículo |
| `vehiculoSugeridoId` | `"NPR_LARGO"` | Mapeo inicial (se traduce a config SISETAC) |
| `fechaRequerida` | `"2026-03-15"` | Determina mes de ACPM y SMLMV |

### 2.2. Datos que SISETAC necesita pero NO están en el wizard

Estos vienen de las **tablas de parámetros del operador** (administradas en BD, no preguntadas al cliente):

| Dato SISETAC | Fuente | Cómo obtenerlo |
|--------------|--------|----------------|
| `configVehiculo` (C2/C3/C2S3/C3S3) | Inferido de `pesoKg` | Tabla de inferencia §4.1 |
| `valorVehiculoCop` | Parámetro del operador | Tabla `vehicle_params` por config |
| `kmPlano / kmOndulado / kmMontañoso` | Inferido por corredor | Tabla `route_terrain` o distribución por defecto |
| `acpmPriceCopGal` | Actualización mensual | Tabla `monthly_params` |
| `smlmv` | Actualización anual | Tabla `monthly_params` |
| `interesMensualBr` | Actualización mensual | Tabla `monthly_params` |
| `soatAnualCop` | Por config, anual | Tabla `vehicle_params` |
| `seguroTodoRiesgoCop` | Por config, anual | Tabla `vehicle_params` |
| `totalPeajesCop` | Por ruta / config | Tabla `tolls_routes` o estimación |
| Precios de llantas, lubricantes, filtros | Por config | Tabla `maintenance_params` |

### 2.3. Brecha de información — cómo se cierra

La brecha entre lo que el cliente aporta y lo que SISETAC requiere se cierra en **dos pasos**:

```
PASO A — Inferencia automática (el engine lo calcula sin intervención)
  pesoKg → configVehiculo (tabla fija)
  origen + destino → km por tipo de terreno (tabla de corredores o distribución default)
  fechaRequerida → periodo_yyyymm → buscar ACPM + SMLMV en tabla

PASO B — Tablas del operador (parámetros precargados por el administrador)
  configVehiculo + periodo → costos de capital, seguros, RTM, llantas, etc.
```

---

## 3. Modelo de parámetros del operador

El operador (empresa de transporte) carga y actualiza estas tablas. El sistema las consume automáticamente.

### 3.1. Parámetros mensuales (`monthly_params`)

```typescript
interface MonthlyParams {
  periodoYyyyMm: number;       // Ej: 202602
  acpmPriceCopGal: number;     // Precio ACPM en COP/galón (Bogotá referencia)
  smlmv: number;               // SMLMV COP/mes
  interesMensualBr: number;    // Tasa interés mensual Banco de la República (decimal, ej: 0.0104)
}
```

**Valores de referencia para MVP (Febrero 2026):**
- ACPM: `$10.850 COP/galón` (referencia MinMinas)
- SMLMV: `$1.423.500 COP/mes` (Decreto 2024)
- Tasa BR mensual: `~0.84% = 0.0084` (BR referencia dic-2025)

### 3.2. Parámetros por configuración vehicular (`vehicle_params`)

```typescript
interface VehicleParams {
  configId: 'C2' | 'C3' | 'C2S2' | 'C2S3' | 'C3S2' | 'C3S3';
  ano: number;
  // Capital
  valorVehiculoCop: number;         // Valor comercial de referencia
  mesesRecuperacion: number;        // 120 (C2) / 192 (C3+)
  // Seguros
  soatAnualCop: number;
  seguroTodoRiesgoAnualCop: number; // Típico: 2.5–4.5% del valor del vehículo
  // Operación
  rtmAnualCop: number;
  comunicacionesMesCop: number;     // GPS + telecom
  parqueaderoNocheCop: number;       // Por noche
  // Llantas (trackcion + direccional)
  precioLlantaTraccionCop: number;
  qtyLlantasTraccion: number;
  vidaUtilTraccionKm: number;
  precioLlantaDireccionalCop: number;
  qtyLlantasDireccional: number;
  vidaUtilDireccionalKm: number;
  // Lubricantes + filtros (COP/km compuesto)
  indicadorLubricantesCopKm: number;
  indicadorFiltrosCopKm: number;
  indicadorLavadoEngraseCopKm: number;
  mantenimientoCopKm: number;
}
```

### 3.3. Distribución de terreno por corredor (`route_terrain`)

```typescript
interface RouteTerrain {
  origenDane: string;    // código DANE origen (o región)
  destinoDane: string;   // código DANE destino (o región)
  kmPlanoPercent: number;     // % plano del total
  kmOnduladoPercent: number;  // % ondulado
  kmMontañosoPercent: number; // % montañoso
  totalPeajesC2Cop: number;   // Peajes totales para C2
  totalPeajesC3Cop: number;   // Peajes totales para C3+
}
```

### 3.4. Factor comercial del operador (`commercial_params`)

```typescript
interface CommercialParams {
  margenOperadorPercent: number;  // % sobre el flete técnico (ej: 25%)
  redondeoMilCop: number;          // Redondear al múltiplo de COP (ej: 50000)
  validezCotizacionHoras: number;  // (ej: 48h)
}
```

---

## 4. Motor de inferencias

### 4.1. `pesoKg` → `configVehiculo` (tabla de inferencia)

Esta es la inferencia más importante. El cliente nunca da la configuración vehicular — el engine la determina por peso:

| Rango pesoKg | configVehiculo asignada | Nombre el usuario conoce | Capacidad real carga |
|:------------:|:-----------------------:|--------------------------|:--------------------:|
| 1 – 1.500 kg | `C2` | Turbo / NHR | ~1.5 ton |
| 1.501 – 5.000 kg | `C2` (NPR sencillo) | Camión pequeño | ~5 ton |
| 5.001 – 8.000 kg | `C2` (NPR largo) | Camión mediano | ~8 ton |
| 8.001 – 17.000 kg | `C3` | Camión 3 ejes | ~17 ton |
| 17.001 – 25.000 kg | `C3S2` | Tractomula mediana | ~25 ton |
| 25.001 – 34.999 kg | `C3S3` | Tractomula / doble troque | ~32 ton |

**Regla adicional por tipo de carga:**
- `CONTENEDOR` → **mínimo** `C2S2` independiente del peso
- `GRANEL_LIQUIDO` → **mínimo** `C2S2` (cisterna)
- `REFRIGERADA` → puede ser `C2` si el peso lo permite (furgón frigorífico en NPR existe)

### 4.2. `origen + destino` → distribución de terreno

Si la ruta existe en `route_terrain`, se usa ese dato.  
Si no existe, se usa la **distribución por defecto según tramo**:

| `tramoDistancia` | % Plano | % Ondulado | % Montañoso | Justificación |
|:----------------:|:-------:|:----------:|:-----------:|---------------|
| `CORTA` (< 100 km) | 40% | 30% | 30% | Rutas cortas suelen ser más montañosas |
| `MEDIA` (100–400 km) | 45% | 35% | 20% | Distribución promedio corredores colombianos |
| `LARGA` (400–800 km) | 50% | 30% | 20% | Corredores nacionales principales |
| `MUY_LARGA` (> 800 km) | 55% | 30% | 15% | Llanos + costa incluidos |

### 4.3. `fechaRequerida` → `periodoYyyyMm` → parámetros del mes

```
periodoYyyyMm = año(fechaRequerida) × 100 + mes(fechaRequerida)
  Ej: "2026-03-15" → 202603

Buscar en monthly_params WHERE periodoYyyyMm = 202603
  Si no existe 202603, usar el más reciente disponible (fallback)
```

---

## 5. Fórmulas completas

Toda la lógica de cálculo en pseudocódigo ejecutable. Los valores de `params` vienen de las tablas §3.

### 5.1. Variables de entrada al motor

```typescript
// Del wizard (ya tenemos)
const distanciaKm = solicitud.distanciaKm        // ej: 425
const pesoKg = solicitud.pesoKg                  // ej: 8500
const tipoCarga = solicitud.tipoCarga            // ej: "CARGA_GENERAL"
const fechaRequerida = solicitud.fechaRequerida  // ej: 2026-03-15

// Inferidos
const configVehiculo = inferirConfig(pesoKg, tipoCarga)  // ej: "C3"
const kmPlano = distanciaKm × 0.45          // Si no hay tabla de corredor
const kmOndulado = distanciaKm × 0.35
const kmMontañoso = distanciaKm × 0.20

// Constantes SISETAC (Resolución — no cambian por ley)
const H_MES = 288                   // horas operativas al mes
const FP_SALARIO = 0.5568           // factor prestacional conductor
const JORNADA_FACTOR = 1.5          // 12h × 1 conductor + 0.5 suplente
const FACTOR_SUPLENTE = 0.5 / 12   // gasto suplente prorrateado
const TASA_IMPREVISTOS = 0.075      // 7.5% sobre variables (excl. combustible y peajes)
const TASA_IMPUESTO_VEHICULAR = 0.005  // 0.5% anual sobre valor vehículo
const F_ADMIN = 0.05                // 5% administración empresa
const F_COMISION = 0.08             // 8% comisión conductor
const FP_COMISION = 1.5569          // factor prestacional sobre comisión
const RETE_ICA = 0.03               // 3%
const RETE_FUENTE = 0.01            // 1%
const DENOMINADOR_OC = 0.755448     // 1 - 0.08 - 0.124552 - 0.03 - 0.01
```

### 5.2. Velocidades promedio por config y terreno (tabla fija)

```typescript
const VELOCIDADES_KMH = {
  C2:   { P: 53.00, O: 30.00, M: 15.00 },
  C3:   { P: 56.59, O: 32.94, M: 18.65 },
  C2S2: { P: 63.04, O: 32.95, M: 25.81 },
  C2S3: { P: 63.04, O: 32.95, M: 18.65 },
  C3S2: { P: 56.23, O: 33.13, M: 23.57 },
  C3S3: { P: 56.23, O: 33.13, M: 23.57 },
};

const RENDIMIENTO_KM_GAL = {
  C2:   { P: 12.70, O: 10.10, M: 7.81 },
  C3:   { P:  8.00, O:  6.22, M: 4.66 },
  C2S2: { P:  8.76, O:  6.76, M: 5.07 },
  C2S3: { P:  8.76, O:  6.76, M: 5.07 },
  C3S2: { P:  6.80, O:  5.04, M: 3.42 },
  C3S3: { P:  6.48, O:  4.80, M: 3.26 },
};
```

### 5.3. Paso 1 — Tiempo y número de viajes al mes

```
V_prom = (kmPlano × v.P + kmOndulado × v.O + kmMontañoso × v.M)
         / distanciaKm

// Para C3 en ruta LARGA (ejemplo):
// V_prom = (191.25 × 56.59 + 148.75 × 32.94 + 85 × 18.65) / 425
// V_prom = (10825 + 4900 + 1585) / 425 = 40.73 km/h

T_ida_h = distanciaKm / V_prom
// T_ida_h = 425 / 40.73 = 10.43 h

N_viajes_mes = floor( H_MES / (T_ida_h × 2) )
             = floor( 288 / 20.86 )
             = floor( 13.81 ) = 13 viajes/mes
```

### 5.4. Paso 2 — Costo Variable (CV)

```
// A) Combustible
IC_plano     = acpmPriceCopGal / rendimiento.P   // COP/km en terreno plano
IC_ondulado  = acpmPriceCopGal / rendimiento.O
IC_montañoso = acpmPriceCopGal / rendimiento.M

CV_combustible = (IC_plano × kmPlano) + (IC_ondulado × kmOndulado) + (IC_montañoso × kmMontañoso)

// Ejemplo C3, ACPM = $10.850/gal:
// IC_plano = 10850 / 8.00 = $1.356/km
// IC_ondulado = 10850 / 6.22 = $1.744/km
// IC_montañoso = 10850 / 4.66 = $2.328/km
// CV_combustible = (1356×191.25) + (1744×148.75) + (2328×85)
//               = 259.290 + 259.424 + 197.880 = $716.594

// B) Peajes
CV_peajes = totalPeajesRuta[configVehiculo]
// Si no hay datos, estimación por defecto:
//   C2: $15.000/100km, C3+: $20.000/100km
//   Ej: C3, 425km → $85.000 (estimado)

// C) Llantas
indicadorLlantasTraccion    = (precioLlantaTraccionCop × qtyTraccion) / vidaUtilTraccionKm
indicadorLlantasDireccional = (precioLlantaDireccionalCop × qtyDireccional) / vidaUtilDireccionalKm
CV_llantas = (indicadorLlantasTraccion + indicadorLlantasDireccional) × distanciaKm

// D) Lubricantes + Filtros + Lavado/engrase
CV_lubricantes    = indicadorLubricantesCopKm × distanciaKm
CV_filtros        = indicadorFiltrosCopKm × distanciaKm
CV_lavadoEngrase  = indicadorLavadoEngraseCopKm × distanciaKm

// E) Mantenimiento
CV_mantenimiento = mantenimientoCopKm × distanciaKm

// F) Imprevistos (7.5% — excluye combustible y peajes)
base_imprevistos = CV_llantas + CV_lubricantes + CV_filtros + CV_lavadoEngrase + CV_mantenimiento
CV_imprevistos = base_imprevistos × TASA_IMPREVISTOS

// G) TOTAL CV
CV_total = CV_combustible + CV_peajes + CV_llantas + CV_lubricantes
         + CV_filtros + CV_lavadoEngrase + CV_mantenimiento + CV_imprevistos
```

### 5.5. Paso 3 — Costo Fijo (CF)

```
// A) Capital — cuota PMT mensual
// i = interesMensualBr, n = mesesRecuperacion, f = 1 (recuperación 100%)
CF_capital_mes = (valorVehiculoCop × interesMensualBr)
                / (1 - (1 + interesMensualBr)^(-mesesRecuperacion))

// Ejemplo C3: valor=$350M, i=0.0084, n=192 meses
// CF_capital_mes = (350.000.000 × 0.0084) / (1 - (1.0084)^-192)
// CF_capital_mes = 2.940.000 / (1 - 0.2012) = 2.940.000 / 0.7988 ≈ $3.681.000/mes

// B) Salarios
CF_salarios_mes = (JORNADA_FACTOR × smlmv × (1 + FP_SALARIO))
                + (FACTOR_SUPLENTE × smlmv × (1 + FP_SALARIO))
// = (1.5 × 1.423.500 × 1.5568) + (0.5/12 × 1.423.500 × 1.5568)
// = (3.324.200) + (92.339) ≈ $3.416.539/mes

// C) Seguros
CF_seguros_mes = (soatAnualCop + seguroTodoRiesgoAnualCop) / 12

// D) Impuestos vehiculares
CF_impuestos_mes = (TASA_IMPUESTO_VEHICULAR × valorVehiculoCop) / 12
// = (0.005 × 350.000.000) / 12 = $145.833/mes

// E) Parqueadero
CF_parqueadero_mes = parqueaderoNocheCop × 30

// F) Comunicaciones (GPS/telecom)
CF_comunicaciones_mes = comunicacionesMesCop

// G) RTM
CF_rtm_mes = rtmAnualCop / 12

// H) Total CF mensual → por viaje
CF_total_mes = CF_capital_mes + CF_salarios_mes + CF_seguros_mes
             + CF_impuestos_mes + CF_parqueadero_mes
             + CF_comunicaciones_mes + CF_rtm_mes

CF_por_viaje = CF_total_mes / N_viajes_mes
```

### 5.6. Paso 4 — Flete bruto con Otros Costos (OC)

```
// El flete antes de OC (base técnica)
base_tecnica = CV_total + CF_por_viaje

// Flete bruto incluyendo administración y cargas tributarias / laborales
// Denominador = 1 - comisión conductor - prestaciones comisión - ICA - fuente
// = 1 - 0.08 - (0.08 × 0.5569) - 0.03 - 0.01
// = 1 - 0.08 - 0.04455 - 0.03 - 0.01 = 0.83545
// NOTA: el doc oficial usa 0.755448 (incluye factor prestacional completo 1.5569×0.08=0.124552)

FLETE_SISETAC = (1 + F_ADMIN) × base_tecnica / DENOMINADOR_OC
              = (1.05 × base_tecnica) / 0.755448
```

---

## 6. Tarifa sugerida

### 6.1. El modelo de precio de venta

El `FLETE_SISETAC` es el **piso técnico** — lo mínimo que un transportador eficiente debería cobrar para no perder dinero según la metodología oficial. Pero una empresa de transporte tiene:

- Costos no previstos por SISETAC (plataforma digital, equipo comercial, nómina back-office)
- Riesgo de viaje vacío (un viaje no siempre tiene carga de regreso)
- Fluctuaciones de combustible intra-mes
- Margen de negociación con el cliente

### 6.2. Fórmula de tarifa sugerida

```
TARIFA_SUGERIDA = FLETE_SISETAC × (1 + margenOperador)
                 → redondeada al múltiplo de $50.000 más cercano

Donde margenOperador es un % configurable por la empresa.
Rango típico: 15% – 40% sobre el piso SISETAC.
```

**Ejemplo de bandas de precio para presentar al cliente:**

| Banda | Cálculo | Descripción |
|-------|---------|-------------|
| `precioBase` | `FLETE_SISETAC × 1.0` | Piso técnico SISETAC (interno, no se muestra) |
| `precioSugerido` | `FLETE_SISETAC × (1 + margen)` | Precio que se presenta al cliente |
| `precioMaximo` | `FLETE_SISETAC × (1 + margen × 1.3)` | Techo si el cliente negocia mucho |

### 6.3. Factores de ajuste adicionales (opcionales, fase 2)

Estos son **multiplicadores** que ajustan la tarifa base según condiciones especiales:

| Factor | Condición | Multiplicador sugerido |
|--------|-----------|:---------------------:|
| Urgencia | `fechaRequerida` dentro de 48h | × 1.10 |
| Carga peligrosa | `cargaPeligrosa = true` | × 1.15 |
| Carga sobredimensionada | `cargaSobredimensionada = true` | × 1.20 |
| Carga refrigerada | `tipoCarga = REFRIGERADA` | × 1.12 |
| Escolta requerida | `requiereEscolta = true` | × 1.25 |
| Múltiples destinos | `multiplesDestinosEntrega = true` | × 1.08 por punto adicional |
| Ayudantes | `ayudanteCargue + ayudanteDescargue` | + $80.000 por ayudante |

```
TARIFA_FINAL = TARIFA_SUGERIDA
             × factor_urgencia
             × factor_carga_especial
             × factor_sobredimensionada
             + costo_ayudantes
             + costo_escolta_si_aplica
```

---

## 7. Contrato de la API

### 7.1. Endpoint

```
POST /api/solicitudes/:id/cotizar
GET  /api/cotizaciones/:cotizacionId
```

### 7.2. Request body (POST)

El engine lee casi todo de la solicitud ya guardada. Solo se pueden sobrescribir parámetros de cotización:

```typescript
interface CotizarRequest {
  // Opcionales — si no se envían, el engine usa los valores de la solicitud + tablas
  overrides?: {
    configVehiculo?: 'C2' | 'C3' | 'C2S2' | 'C2S3' | 'C3S2' | 'C3S3';
    kmPlano?: number;
    kmOndulado?: number;
    kmMontañoso?: number;
    margenOperadorPercent?: number;  // Override del margen comercial
  };
}
```

### 7.3. Response body (200 OK)

```typescript
interface CotizacionResponse {
  // Identificación
  cotizacionId: string;
  solicitudId: string;
  fechaGeneracion: string;   // ISO timestamp
  periodoParametros: number; // YYYYMM

  // Resultado principal
  resultado: {
    configVehiculo: string;          // "C3"
    distanciaKm: number;             // 425
    fleteReferencialSisetac: number; // 3.480.000 COP
    tarifaSugerida: number;          // 4.350.000 COP (redondeada)
    costoTecnicoBase: number;        // CV + CF (sin OC)
    fletePorKm: number;              // COP/km
    fletePorTon: number;             // COP/ton (si se capturó pesoKg)
    validezHoras: number;            // 48
  };

  // Desglose auditado
  desglose: {
    // Costo Variable
    cv: {
      combustible: number;
      peajes: number;
      llantas: number;
      lubricantes: number;
      filtros: number;
      lavadoEngrase: number;
      mantenimiento: number;
      imprevistos: number;
      total: number;
    };
    // Costo Fijo (por viaje)
    cf: {
      capital: number;
      salarios: number;
      seguros: number;
      impuestos: number;
      parqueadero: number;
      comunicaciones: number;
      rtm: number;
      totalMes: number;
      viajesMes: number;
      porViaje: number;
    };
    // Otros costos
    oc: {
      administracion: number;
      comisionConductor: number;
      reteIca: number;
      reteFuente: number;
    };
    // Ajustes comerciales
    ajustes: {
      margenOperadorPercent: number;
      factoresAplicados: string[];  // ["urgencia×1.10", "REFRIGERADA×1.12"]
    };
  };

  // Trazabilidad de parámetros usados
  parametrosUsados: {
    acpmCopGal: number;
    smlmv: number;
    interesMensualBr: number;
    valorVehiculoCop: number;
    viajesMesSimulados: number;
    velocidadPromKmH: number;
    distribucionTerreno: { plano: number; ondulado: number; montañoso: number };
    fuenteTerreno: 'tabla_corredor' | 'distribucion_default';
    fuentePeajes: 'tabla_ruta' | 'estimacion_default';
    metodologia: 'SICE-TAC Res. 20213040034405';
  };

  // Datos del cliente (para el documento imprimible)
  cliente: {
    empresa: string;
    contacto: string;
    origen: string;
    destino: string;
    tipoCarga: string;
    pesoKg: number;
    fechaServicio: string;
  };
}
```

### 7.4. Errores posibles

| HTTP | Código | Causa |
|------|--------|-------|
| 400 | `MISSING_ROUTE_DATA` | `distanciaKm` es null — no hay origen/destino completo |
| 400 | `MISSING_PESO` | `pesoKg` es null o 0 |
| 422 | `PARAMS_NOT_FOUND` | No hay `monthly_params` para el mes de la solicitud |
| 422 | `VEHICLE_PARAMS_NOT_FOUND` | No hay `vehicle_params` para el `configVehiculo` inferido |
| 409 | `SOLICITUD_NO_COMPLETA` | La solicitud no tiene suficientes datos para cotizar |

---

## 8. Esquema de BD

Tablas nuevas a crear en Prisma para soportar el engine:

### 8.1. `MonthlyParams` — parámetros mensuales

```prisma
model MonthlyParams {
  id              Int      @id @default(autoincrement())
  periodoYyyyMm   Int      @unique           // 202602
  acpmPriceCopGal Decimal  @db.Decimal(12,2) // 10850.00
  smlmv           Decimal  @db.Decimal(15,2) // 1423500.00
  interesMensualBr Decimal @db.Decimal(8,6)  // 0.008400
  notas           String?  @db.Text
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("monthly_params")
}
```

### 8.2. `VehicleParams` — parámetros por configuración y año

```prisma
model VehicleParams {
  id                          Int      @id @default(autoincrement())
  configId                    String   @db.VarChar(10)  // C2, C3, C3S3...
  ano                         Int
  // Capital
  valorVehiculoCop            Decimal  @db.Decimal(15,2)
  mesesRecuperacion           Int
  // Seguros
  soatAnualCop                Decimal  @db.Decimal(12,2)
  seguroTodoRiesgoAnualCop    Decimal  @db.Decimal(12,2)
  // Operación fija
  rtmAnualCop                 Decimal  @db.Decimal(12,2)
  comunicacionesMesCop        Decimal  @db.Decimal(12,2)
  parqueaderoNocheCop         Decimal  @db.Decimal(12,2)
  // Llantas
  precioLlantaTraccionCop     Decimal  @db.Decimal(12,2)
  qtyLlantasTraccion          Int
  vidaUtilTraccionKm          Int
  precioLlantaDireccionalCop  Decimal  @db.Decimal(12,2)
  qtyLlantasDireccional       Int
  vidaUtilDireccionalKm       Int
  // Mantenimiento (COP/km)
  indicadorLubricantesCopKm   Decimal  @db.Decimal(10,4)
  indicadorFiltrosCopKm       Decimal  @db.Decimal(10,4)
  indicadorLavadoEngraseCopKm Decimal  @db.Decimal(10,4)
  mantenimientoCopKm          Decimal  @db.Decimal(10,4)

  @@unique([configId, ano])
  @@map("vehicle_params")
}
```

### 8.3. `RouteTerrain` — distribución de terreno por corredor

```prisma
model RouteTerrain {
  id                  Int      @id @default(autoincrement())
  origenDane          String   @db.VarChar(10)
  destinoDane         String   @db.VarChar(10)
  kmPlanoPercent      Decimal  @db.Decimal(5,2)   // 0.45 = 45%
  kmOnduladoPercent   Decimal  @db.Decimal(5,2)
  kmMontañosoPercent  Decimal  @db.Decimal(5,2)
  totalPeajesC2Cop    Decimal  @db.Decimal(12,2)
  totalPeajesC3Cop    Decimal  @db.Decimal(12,2)
  fuente              String?  @db.VarChar(100)
  vigenciaDesde       DateTime @db.Date

  @@unique([origenDane, destinoDane])
  @@map("route_terrain")
}
```

### 8.4. `CommercialParams` — política comercial del operador

```prisma
model CommercialParams {
  id                      Int      @id @default(autoincrement())
  vigenciaDesde           DateTime @db.Date
  margenOperadorPercent   Decimal  @db.Decimal(5,2)  // 25.00 = 25%
  redondeoMilCop          Int      @default(50000)
  validezCotizacionHoras  Int      @default(48)
  activo                  Boolean  @default(true)
  notas                   String?

  @@map("commercial_params")
}
```

### 8.5. `Cotizacion` — registro de cada cotización generada

```prisma
model Cotizacion {
  id                      String   @id @default(cuid())
  solicitudId             String
  solicitud               Solicitud @relation(fields: [solicitudId], references: [id])
  periodoParametros       Int
  configVehiculo          String   @db.VarChar(10)
  distanciaKm             Float
  // Resultados
  fleteReferencialSisetac Decimal  @db.Decimal(15,2)
  tarifaSugerida          Decimal  @db.Decimal(15,2)
  costoTecnicoBase        Decimal  @db.Decimal(15,2)
  // Desglose JSON (para trazabilidad)
  desgloseCv              Json
  desgloseCf              Json
  parametrosUsados        Json
  factoresAjuste          Json
  // Estado
  estado                  String   @default("VIGENTE") @db.VarChar(20)
  validezHasta            DateTime
  createdAt               DateTime @default(now())

  @@index([solicitudId])
  @@map("cotizaciones")
}
```

---

## 9. Parámetros de referencia precargados (MVP)

Estos valores permiten que el engine funcione desde el primer día sin que el administrador tenga que configurar nada. Se precargán como seed en la BD.

### 9.1. `monthly_params` — Febrero 2026

| Campo | Valor | Fuente |
|-------|-------|--------|
| `periodoYyyyMm` | 202602 | — |
| `acpmPriceCopGal` | 10.850 | MinMinas referencia ene-2026 |
| `smlmv` | 1.423.500 | Decreto salarial 2025 |
| `interesMensualBr` | 0.0084 | Tasa BR 10.1% EA → mensual |

### 9.2. `vehicle_params` — C2 y C3 año 2026

**C2 (Camión rígido 2 ejes — NPR / NHR):**

| Parámetro | Valor COP | Fuente |
|-----------|----------:|--------|
| `valorVehiculoCop` | 180.000.000 | Referencia mercado 2026 |
| `mesesRecuperacion` | 120 | Resolución SISETAC |
| `soatAnualCop` | 1.800.000 | Referencia Fasecolda 2026 |
| `seguroTodoRiesgoAnualCop` | 4.500.000 | ~2.5% del valor |
| `rtmAnualCop` | 450.000 | Referencia CDA Bogotá |
| `comunicacionesMesCop` | 120.000 | GPS + celular |
| `parqueaderoNocheCop` | 20.000 | Parqueadero urbano Bogotá |
| `precioLlantaTraccionCop` | 950.000 | Referencia Goodyear/Bridgestone |
| `qtyLlantasTraccion` | 4 | C2: 4 traseras tracción |
| `vidaUtilTraccionKm` | 80.000 | SISETAC |
| `precioLlantaDireccionalCop` | 900.000 | Similar a tracción en C2 |
| `qtyLlantasDireccional` | 2 | C2 |
| `vidaUtilDireccionalKm` | 100.000 | SISETAC |
| `indicadorLubricantesCopKm` | 28.50 | Promedio mercado 2026 |
| `indicadorFiltrosCopKm` | 8.20 | Promedio mercado 2026 |
| `indicadorLavadoEngraseCopKm` | 5.10 | Promedio mercado 2026 |
| `mantenimientoCopKm` | 85.00 | SISETAC referencia C2 |

**C3 (Camión rígido 3 ejes):**

| Parámetro | Valor COP | Fuente |
|-----------|----------:|--------|
| `valorVehiculoCop` | 350.000.000 | Referencia mercado 2026 |
| `mesesRecuperacion` | 192 | Resolución SISETAC |
| `soatAnualCop` | 2.400.000 | Referencia Fasecolda 2026 |
| `seguroTodoRiesgoAnualCop` | 8.750.000 | ~2.5% del valor |
| `rtmAnualCop` | 600.000 | Referencia CDA Bogotá |
| `comunicacionesMesCop` | 120.000 | GPS + celular |
| `parqueaderoNocheCop` | 25.000 | Parqueadero mayor dimensión |
| `precioLlantaTraccionCop` | 1.200.000 | Referencia Michelin/Continental |
| `qtyLlantasTraccion` | 4 | C3 doble llanta trasera doble eje |
| `vidaUtilTraccionKm` | 80.000 | SISETAC |
| `precioLlantaDireccionalCop` | 1.100.000 | |
| `qtyLlantasDireccional` | 2 | |
| `vidaUtilDireccionalKm` | 100.000 | SISETAC |
| `indicadorLubricantesCopKm` | 42.00 | Mayor motor/diferencial |
| `indicadorFiltrosCopKm` | 12.50 | |
| `indicadorLavadoEngraseCopKm` | 7.80 | |
| `mantenimientoCopKm` | 128.00 | SISETAC referencia C3 |

**C2S2 (Tractomula cabeza 2 ejes + semirremolque 2 ejes — ~25 ton):**

> Ejes: 2 dirección (front cabeza) + 2 tracción (rear cabeza) + 2 tracción (semirremolque) = 14 llantas

| Parámetro | Valor COP | Fuente |
|-----------|----------:|--------|
| `valorVehiculoCop` | 500.000.000 | Cabeza tractora C2 + semirremolque 2 ejes |
| `mesesRecuperacion` | 192 | Resolución SISETAC |
| `soatAnualCop` | 3.200.000 | Categoría tracto 4+5 ejes — Fasecolda 2026 |
| `seguroTodoRiesgoAnualCop` | 12.500.000 | ~2.5% del valor |
| `rtmAnualCop` | 900.000 | Cabeza tractora + semirremolque |
| `comunicacionesMesCop` | 140.000 | GPS + celular |
| `parqueaderoNocheCop` | 35.000 | Mayor dimensión |
| `precioLlantaTraccionCop` | 1.250.000 | Radial 295/80R22.5 |
| `qtyLlantasTraccion` | 8 | 4 cabeza + 4 semirremolque |
| `vidaUtilTraccionKm` | 80.000 | SISETAC |
| `precioLlantaDireccionalCop` | 1.150.000 | Dirección 295/80R22.5 |
| `qtyLlantasDireccional` | 2 | Eje delantero cabeza |
| `vidaUtilDireccionalKm` | 100.000 | SISETAC |
| `indicadorLubricantesCopKm` | 55.00 | Motor 12L + diferencial |
| `indicadorFiltrosCopKm` | 15.00 | |
| `indicadorLavadoEngraseCopKm` | 9.50 | |
| `mantenimientoCopKm` | 162.00 | Referencia mercado 2026 |

**C2S3 (Tractomula cabeza 2 ejes + semirremolque 3 ejes — ~30 ton):**

> Ejes: 2 dir + 2 trac cabeza + 3 trac semirremolque = 18 llantas

| Parámetro | Valor COP | Fuente |
|-----------|----------:|--------|
| `valorVehiculoCop` | 580.000.000 | Cabeza tractora C2 + semirremolque 3 ejes |
| `mesesRecuperacion` | 192 | Resolución SISETAC |
| `soatAnualCop` | 3.500.000 | Categoría tracto 5 ejes — Fasecolda 2026 |
| `seguroTodoRiesgoAnualCop` | 14.500.000 | ~2.5% del valor |
| `rtmAnualCop` | 1.000.000 | |
| `comunicacionesMesCop` | 140.000 | GPS + celular |
| `parqueaderoNocheCop` | 38.000 | |
| `precioLlantaTraccionCop` | 1.250.000 | |
| `qtyLlantasTraccion` | 12 | 4 cabeza + 8 semirremolque |
| `vidaUtilTraccionKm` | 80.000 | SISETAC |
| `precioLlantaDireccionalCop` | 1.150.000 | |
| `qtyLlantasDireccional` | 2 | |
| `vidaUtilDireccionalKm` | 100.000 | SISETAC |
| `indicadorLubricantesCopKm` | 58.00 | |
| `indicadorFiltrosCopKm` | 16.00 | |
| `indicadorLavadoEngraseCopKm` | 10.00 | |
| `mantenimientoCopKm` | 172.00 | |

**C3S2 (Tractomula cabeza 3 ejes + semirremolque 2 ejes — ~28 ton):**

> Ejes: 2 dir + 3 trac cabeza + 2 trac semirremolque = 16 llantas

| Parámetro | Valor COP | Fuente |
|-----------|----------:|--------|
| `valorVehiculoCop` | 620.000.000 | Cabeza tractora C3 + semirremolque 2 ejes |
| `mesesRecuperacion` | 192 | Resolución SISETAC |
| `soatAnualCop` | 3.500.000 | Categoría tracto 5 ejes — Fasecolda 2026 |
| `seguroTodoRiesgoAnualCop` | 15.500.000 | ~2.5% del valor |
| `rtmAnualCop` | 1.100.000 | |
| `comunicacionesMesCop` | 140.000 | GPS + celular |
| `parqueaderoNocheCop` | 38.000 | |
| `precioLlantaTraccionCop` | 1.280.000 | Radial 295/80R22.5 |
| `qtyLlantasTraccion` | 10 | 6 cabeza C3 + 4 semirremolque |
| `vidaUtilTraccionKm` | 80.000 | SISETAC |
| `precioLlantaDireccionalCop` | 1.150.000 | |
| `qtyLlantasDireccional` | 2 | |
| `vidaUtilDireccionalKm` | 100.000 | SISETAC |
| `indicadorLubricantesCopKm` | 62.00 | Motor mayor + 3 ejes diferenciales |
| `indicadorFiltrosCopKm` | 16.50 | |
| `indicadorLavadoEngraseCopKm` | 10.50 | |
| `mantenimientoCopKm` | 182.00 | |

**C3S3 (Tractomula doble troque):**

> Ejes: 2 dir + 4 trac cabeza + 3 trac semirremolque = 22 llantas

| Parámetro | Valor COP | Fuente |
|-----------|----------:|--------|
| `valorVehiculoCop` | 750.000.000 | Tractocamión + semirremolque |
| `mesesRecuperacion` | 192 | Resolución SISETAC |
| `soatAnualCop` | 3.800.000 | Categoría tracto 6 ejes — Fasecolda 2026 |
| `seguroTodoRiesgoAnualCop` | 18.750.000 | ~2.5% del valor |
| `rtmAnualCop` | 1.200.000 | |
| `comunicacionesMesCop` | 150.000 | |
| `parqueaderoNocheCop` | 40.000 | |
| `precioLlantaTraccionCop` | 1.350.000 | |
| `qtyLlantasTraccion` | 12 | C3S3 |
| `vidaUtilTraccionKm` | 80.000 | |
| `precioLlantaDireccionalCop` | 1.200.000 | |
| `qtyLlantasDireccional` | 4 | 2 eje delantero cabeza + 2 eje delantero semirremolque |
| `vidaUtilDireccionalKm` | 100.000 | |
| `indicadorLubricantesCopKm` | 68.00 | |
| `indicadorFiltrosCopKm` | 18.00 | |
| `indicadorLavadoEngraseCopKm` | 12.00 | |
| `mantenimientoCopKm` | 195.00 | |

### 9.3. `commercial_params` — default inicial

| Parámetro | Valor default |
|-----------|:------------:|
| `margenOperadorPercent` | 30% |
| `redondeoMilCop` | 50.000 |
| `validezCotizacionHoras` | 48 |

### 9.4. Peajes por defecto (cuando no hay tabla de corredor)

Si no existe entrada en `route_terrain` para el par origen–destino, se estima con el factor por config:

```
// Factor COP/km por tipo de configuración (promedio INVIAS 2024)
total_peajes_estimados = distanciaKm × factorPeajes[configVehiculo]
```

| `configVehiculo` | Factor COP/km | Lógica |
|:---:|---:|---|
| `C2` | 175 | Categoría I (camión) |
| `C3` | 210 | Categoría II (camión pesado) |
| `C2S2` | 250 | Categoría III (tractomula liviana) |
| `C2S3` | 270 | Categoría III+ |
| `C3S2` | 270 | Categoría III+ |
| `C3S3` | 285 | Categoría IV (tracto máxima carga) |

> **Ejemplo:** C3, 425 km → 425 × 210 = **$89.250** estimado.

---

### 9.5. `route_terrain` — Corredores principales precargados

Estos 10 corredores cubren ~70% del tráfico de carga nacional. Las entradas son **bidireccionales** — el engine busca (origen→destino) y si no encuentra intenta (destino→origen).

| Corredor | Origen DANE | Destino DANE | % Plano | % Ondulado | % Montañoso | Peajes C2 | Peajes C3+ | Fuente |
|----------|:-----------:|:------------:|:-------:|:----------:|:-----------:|----------:|----------:|--------|
| Bogotá → Medellín | `11001` | `05001` | 30% | 40% | 30% | $75.000 | $110.000 | INVIAS 2024 |
| Bogotá → Cali | `11001` | `76001` | 40% | 30% | 30% | $80.000 | $115.000 | INVIAS 2024 |
| Bogotá → Barranquilla | `11001` | `08001` | 55% | 30% | 15% | $140.000 | $200.000 | INVIAS 2024 |
| Bogotá → Bucaramanga | `11001` | `68001` | 35% | 35% | 30% | $65.000 | $92.000 | INVIAS 2024 |
| Bogotá → Cartagena | `11001` | `13001` | 55% | 30% | 15% | $155.000 | $222.000 | INVIAS 2024 |
| Bogotá → Pereira | `11001` | `66001` | 35% | 35% | 30% | $50.000 | $70.000 | INVIAS 2024 |
| Bogotá → Manizales | `11001` | `17001` | 30% | 35% | 35% | $55.000 | $78.000 | INVIAS 2024 |
| Medellín → Cali | `05001` | `76001` | 35% | 35% | 30% | $70.000 | $98.000 | INVIAS 2024 |
| Medellín → Barranquilla | `05001` | `08001` | 55% | 30% | 15% | $130.000 | $185.000 | INVIAS 2024 |
| Cali → Buenaventura | `76001` | `76109` | 25% | 30% | 45% | $18.000 | $28.000 | INVIAS 2024 |

> **Nota sobre peajes:** Los valores `totalPeajesC2Cop` se aplican a configVehiculo `C2`. Los `totalPeajesC3Cop` se aplican a configs `C3`, `C2S2`, `C2S3`, `C3S2` y `C3S3`.

> **Rutas no cubiertas:** Si el par origen–destino no existe en esta tabla, el engine usa la estimación §9.4 con factor por config y marca la respuesta como `fuentePeajes: "estimacion_default"`.

---

## 10. Roadmap

### Fase 1 — MVP funcional (implementar ahora)

| # | Tarea | Descripción |
|---|-------|-------------|
| 1 | Crear tablas de parámetros | `MonthlyParams`, `VehicleParams`, `CommercialParams`, `Cotizacion` |
| 2 | Seed de parámetros de referencia | Cargar valores §9 en BD |
| 3 | Crear `lib/services/cotizadorEngine.ts` | Implementar toda la lógica §5 |
| 4 | Crear `app/api/solicitudes/[id]/cotizar/route.ts` | POST endpoint §7 |
| 5 | Validar con casos de prueba | 3 rutas × 3 config = 9 cotizaciones de referencia |

### Fase 2 — Precisión de parámetros

| # | Tarea | Descripción |
|---|-------|-------------|
| 6 | Admin panel de parámetros | UI para actualizar ACPM, SMLMV, seguros mensualmente |
| 7 | Ampliar tabla de corredores | `route_terrain` para top 20 rutas adicionales (ya hay 10 precargadas) |
| 8 | Peajes exactos por cabina | Integrar tabla de peajes ANI/INVIAS con valores por puesto exacto |

### Fase 3 — Experiencia de cotización

| # | Tarea | Descripción |
|---|-------|-------------|
| 10 | `PantallaCotizacion` | UI que muestra el desglose cotización al completar el wizard |
| 11 | PDF / email de cotización | Generar documento PDF con número de cotización |
| 12 | Ajuste manual del precio | Que el operador pueda editar el precio final antes de enviarlo |
| 13 | Historial de cotizaciones | Lista de cotizaciones por cliente / por solicitud |

---

## Ejemplo numérico completo — C3, Medellín → Bogotá, 425 km

> Todos los valores en COP. Parámetros: ACPM $10.850/gal, SMLMV $1.423.500, tasa BR 0.84%/mes.

### Distribución de terreno (corredor Medellín–Bogotá)
| Terreno | % | km |
|---------|:--:|---:|
| Plano | 30% | 127.5 km |
| Ondulado | 40% | 170.0 km |
| Montañoso | 30% | 127.5 km |

### Paso 1 — Velocidades y viajes/mes
```
V_prom = (127.5×56.59 + 170×32.94 + 127.5×18.65) / 425
       = (7215 + 5600 + 2378) / 425 = 35.75 km/h
T_ida  = 425 / 35.75 = 11.89 h
N_viajes_mes = floor(288 / 23.78) = floor(12.11) = 12 viajes/mes
```

### Paso 2 — Costo Variable
| Subcuenta | Cómputo | Valor COP |
|-----------|---------|----------:|
| Combustible plano | 127.5 × (10850/8.00) | $172.734 |
| Combustible ondulado | 170 × (10850/6.22) | $296.463 |
| Combustible montañoso | 127.5 × (10850/4.66) | $296.886 |
| **CV combustible** | | **$766.083** |
| **CV peajes** (estimado) | 425 × 200 | **$85.000** |
| **CV llantas** | [(1.200.000×4/80.000)+(1.100.000×2/100.000)] × 425 | **$185.050** |
| **CV lubricantes** | 42.00 × 425 | **$17.850** |
| **CV filtros** | 12.50 × 425 | **$5.313** |
| **CV lavado/engrase** | 7.80 × 425 | **$3.315** |
| **CV mantenimiento** | 128.00 × 425 | **$54.400** |
| **CV imprevistos** | (185.050+17.850+5.313+3.315+54.400) × 0.075 | **$19.945** |
| **CV TOTAL** | | **$1.136.956** |

### Paso 3 — Costo Fijo
| Subcuenta | Cómputo | Valor/mes COP |
|-----------|---------|----------:|
| Capital | PMT(350M, 0.0084, 192) | $3.681.000 |
| Salarios | 1.5×1.423.500×1.5568 + (0.5/12×1.423.500×1.5568) | $3.416.539 |
| Seguros | (2.400.000 + 8.750.000) / 12 | $929.167 |
| Impuestos | (0.005 × 350M) / 12 | $145.833 |
| Parqueadero | 25.000 × 30 | $750.000 |
| Comunicaciones | | $120.000 |
| RTM | 600.000 / 12 | $50.000 |
| **CF total/mes** | | **$9.092.539** |
| CF por viaje | 9.092.539 / 12 viajes | **$757.712** |

### Paso 4 — Flete SISETAC
```
base_tecnica = 1.136.956 + 757.712 = $1.894.668
FLETE_SISETAC = (1.05 × 1.894.668) / 0.755448
              = 1.989.401 / 0.755448
              = $2.632.971
```

### Paso 5 — Tarifa sugerida
```
TARIFA_SUGERIDA = 2.632.971 × 1.30 (margen 30%)
               = $3.422.862
               → redondeada a $3.450.000
```

### Resumen ejecutivo
| Indicador | Valor |
|-----------|------:|
| **Tarifa cotizando al cliente** | **$3.450.000** |
| Flete referencial SISETAC | $2.633.000 |
| CV total (costo del viaje) | $1.137.000 |
| CF por viaje (costo vehículo) | $758.000 |
| Costo/km resultante | $8.118 |
| Costo/ton (para 8.5 ton) | $406.000 |

---

*Documento de especificación para desarrollo interno. No sustituye la Resolución MinTransporte 20213040034405.*
