# Definición Funcional — Cotizador de Flete SISETAC

**Fecha:** Febrero 2026  
**Versión:** 1.0  
**Base normativa:** Resolución MinTransporte 20213040034405 (06-08-2021) · Protocolo SICE-TAC  
**Estado:** Definición completa con tasas y fórmulas

---

## Índice

1. [¿Qué calcula este sistema?](#1-qué-calcula-este-sistema)
2. [Arquitectura del modelo de costos](#2-arquitectura-del-modelo-de-costos)
3. [DATOS DE ENTRADA — Inputs del usuario](#3-datos-de-entrada--inputs-del-usuario)
4. [TABLAS DE PARÁMETROS — Tasas y valores fijos](#4-tablas-de-parámetros--tasas-y-valores-fijos)
5. [TABLAS DE PARÁMETROS — Valores que se actualizan periódicamente](#5-tablas-de-parámetros--valores-que-se-actualizan-periódicamente)
6. [FÓRMULAS DE CÁLCULO — Motor del cotizador](#6-fórmulas-de-cálculo--motor-del-cotizador)
7. [DATOS DE SALIDA — Output de la cotización](#7-datos-de-salida--output-de-la-cotización)
8. [Reglas de negocio y validaciones](#8-reglas-de-negocio-y-validaciones)
9. [Glosario técnico](#9-glosario-técnico)

---

## 1. ¿Qué calcula este sistema?

El cotizador estima el **costo eficiente de transporte de carga por carretera** siguiendo la metodología oficial del SICE-TAC (Sistema de Información de Costos Eficientes para el Transporte Automotor de Carga por Carretera) del Ministerio de Transporte de Colombia.

El resultado final es un **valor de referencia del flete** (COP) descompuesto en sus componentes auditables.

### Lo que produce el cotizador

> **Flete estimado = Costo Fijo prorrateado (CF) + Costo Variable (CV) + Otros Costos (OC)**

El valor NO es un precio de venta obligatorio. Es un **piso técnico** calculado con metodología oficial.

---

## 2. Arquitectura del modelo de costos

```
FLETE TOTAL
├── A) COSTO FIJO (CF) — "el costo de tener el camión disponible"
│   ├── Capital (recuperación del vehículo)
│   ├── Salarios + factor prestacional (conductor)
│   ├── Seguros (SOAT + todo riesgo)
│   ├── Impuestos vehiculares
│   ├── Parqueadero
│   ├── Comunicaciones (GPS/telecom)
│   └── RTM (Revisión técnico-mecánica)
│
├── B) COSTO VARIABLE (CV) — "el costo de hacer el viaje"
│   ├── Combustible (ACPM)
│   ├── Peajes
│   ├── Llantas
│   ├── Lubricantes
│   ├── Filtros
│   ├── Lavado y engrase
│   ├── Mantenimiento y reparaciones
│   └── Imprevistos (7.5% de sub-rubros variables)
│
└── C) OTROS COSTOS (OC) — "factores comerciales/tributarios"
    ├── Factor de administración (5%)
    ├── Comisión del conductor (8%)
    ├── Factor prestacional sobre comisión (×1.5569)
    ├── Retención ICA (3%)
    └── Retención en la fuente (1%)
```

---

## 3. DATOS DE ENTRADA — Inputs del usuario

Estos son los campos que el sistema debe **solicitar al usuario** para poder calcular el flete.

### 3.1. Datos del viaje (obligatorios)

| # | Campo | Etiqueta al usuario | Tipo | Valores válidos | Notas |
|---|-------|---------------------|------|-----------------|-------|
| 1 | `ciudad_origen` | Ciudad de origen | Selector / texto | Ciudades Colombia | Nudo vial SISETAC |
| 2 | `ciudad_destino` | Ciudad de destino | Selector / texto | Ciudades Colombia | Nudo vial SISETAC |
| 3 | `distancia_total_km` | Distancia de la ruta (km) | Numérico | > 0 | Puede auto-calcularse |
| 4 | `km_plano` | Kilómetros en terreno plano | Numérico | ≥ 0 | Suma: km_P + km_O + km_M = distancia_total |
| 5 | `km_ondulado` | Kilómetros en terreno ondulado | Numérico | ≥ 0 | Ver nota de terreno |
| 6 | `km_montañoso` | Kilómetros en terreno montañoso | Numérico | ≥ 0 | Ver nota de terreno |
| 7 | `fecha_cotizacion` | Fecha de cotización | Fecha | YYYY-MM-DD | Define qué mes de ACPM usar |

> **Nota de terreno:** Si el backend puede inferir la distribución de terreno por ruta (API Google Maps + modelo), no se le pregunta al usuario. Si no, se ofrece como selector avanzado con valores por defecto (ej. ruta Bogotá–Cali ≈ 30% plano / 20% ondulado / 50% montañoso).

---

### 3.2. Datos del vehículo (obligatorios)

| # | Campo | Etiqueta al usuario | Tipo | Valores válidos | Notas |
|---|-------|---------------------|------|-----------------|-------|
| 8 | `config_vehiculo` | Tipo de vehículo | Selector | C2, C3, C2S2, C2S3, C3S2, C3S3 | Ver tabla de configuraciones |
| 9 | `valor_vehiculo_cop` | Valor comercial del vehículo (COP) | Numérico | > 0 | Necesario para cálculo de capital e impuestos |
| 10 | `tipo_carroceria` | Tipo de carrocería / carga | Selector | Ver tabla 3.3 | Para identificar tipo de llanta / capacidad |

---

### 3.3. Tabla de tipos de carrocería disponibles

| Código | Descripción | Tipo SISETAC |
|--------|-------------|--------------|
| `CARGA_GENERAL` | Furgón, caja seca, estacas | Carga general |
| `REFRIGERADA` | Furgón refrigerado | Carga refrigerada |
| `CONTENEDOR` | Portacontenedor | Carga en conteneder |
| `GRANEL_SOLIDO` | Volco, tolva | Carga en granel sólido |
| `GRANEL_LIQUIDO` | Cisterna | Carga en granel líquido |

---

### 3.4. Datos operativos (avanzados / con valores por defecto)

| # | Campo | Descripción | Tipo | Valor por defecto | Fuente |
|---|-------|-------------|------|-------------------|--------|
| 11 | `n_viajes_mes` | Número de viajes que hace el vehículo al mes | Numérico entero | Calculado: H_mes / (distancia / velocidad_promedio × 2) | Afecta CF por viaje |
| 12 | `ciudad_parqueadero` | Ciudad donde se parquea el vehículo | Selector | Bogotá | Afecta costo de parqueadero |

---

### 3.5. Tabla de configuraciones vehiculares (SISETAC)

| config_id | Ejes | Descripción típica | Años recuperación | Meses recuperación |
|-----------|------|--------------------|-------------------|-------------------|
| `C2` | 2 | Camión rígido 2 ejes (NHR, NPR, Atego ≤16t) | 10 años | 120 meses |
| `C3` | 3 | Camión rígido 3 ejes | 16 años | 192 meses |
| `C2S2` | 4 (2+2) | Tractocamión + semirremolque 2 ejes | 16 años | 192 meses |
| `C2S3` | 5 (2+3) | Tractocamión + semirremolque 3 ejes | 16 años | 192 meses |
| `C3S2` | 5 (3+2) | Tractocamión 3 ejes + semirremolque 2 ejes | 16 años | 192 meses |
| `C3S3` | 6 (3+3) | Tractomula doble troque | 16 años | 192 meses |

---

## 4. TABLAS DE PARÁMETROS — Tasas y valores fijos

Estos valores están **definidos en la Resolución 20213040034405** y no cambian hasta nueva norma.

### 4.1. Velocidades promedio por configuración y terreno (km/h)

*Fuente: Protocolo SICE-TAC, Anexo técnico. Se usan para calcular tiempo de viaje → N_viajes_mes.*

| config_id | Plano (P) km/h | Ondulado (O) km/h | Montañoso (M) km/h |
|-----------|:--------------:|:-----------------:|:------------------:|
| C2 | 53.00 | 30.00 | 15.00 |
| C3 | 56.59 | 32.94 | 18.65 |
| C2S2 | 63.04 | 32.95 | 25.81 |
| C2S3 | 63.04 | 32.95 | 18.65 |
| C3S2 | 56.23 | 33.13 | 23.57 |
| C3S3 | 56.23 | 33.13 | 23.57 |

---

### 4.2. Rendimiento de combustible por configuración y terreno (km/galón ACPM)

*Fuente: Protocolo SICE-TAC, Anexo técnico. Valores de referencia para ACPM en vía pavimentada.*

| config_id | Plano (P) km/gal | Ondulado (O) km/gal | Montañoso (M) km/gal |
|-----------|:----------------:|:-------------------:|:--------------------:|
| C2 | 12.70 | 10.10 | 7.81 |
| C3 | 8.00 | 6.22 | 4.66 |
| C2S2 | 8.76 | 6.76 | 5.07 |
| C2S3 | 8.76 | 6.76 | 5.07 |
| C3S2 | 6.80 | 5.04 | 3.42 |
| C3S3 | 6.48 | 4.80 | 3.26 |

---

### 4.3. Tiempo de recuperación del capital

| config_id | Período (meses) |
|-----------|:---------------:|
| C2 | 120 (10 años) |
| C3 | 192 (16 años) |
| C2S2 | 192 (16 años) |
| C2S3 | 192 (16 años) |
| C3S2 | 192 (16 años) |
| C3S3 | 192 (16 años) |

---

### 4.4. Factores fijos — Costos laborales

| Parámetro | Variable | Valor | Fuente |
|-----------|----------|:-----:|--------|
| Factor prestacional sobre salario base | `fp_salario` | **0.5568** (55.68%) | SICE-TAC Protocolo |
| Jornada diaria (turno principal conductor) | `jornada_factor` | **1.5** (=12h/día en 2 turnos: 1 + 0.5) | SICE-TAC Protocolo |
| Gasto conductor suplente (prorrateo mensual) | `factor_suplente` | **0.5 / 12** | SICE-TAC Protocolo |
| Horas hábiles de operación al mes | `H_mes` | **288 h** (24 días × 12 h/día) | SICE-TAC Protocolo |

---

### 4.5. Factores fijos — Costos fiscales y tributarios

| Parámetro | Variable | Valor | Aplicación |
|-----------|----------|:-----:|------------|
| Tasa de impuesto vehicular anual | `tasa_impuesto` | **0.5%** (0.005) | Sobre valor comercial del vehículo |
| Factor administración empresa | `f_admin` | **5%** (0.05) | Sobre (CV + CF) |
| Comisión del conductor | `f_comision` | **8%** (0.08) | Sobre producido |
| Factor prestacional sobre comisión conductor | `fp_comision` | **×1.5569** | 8% × 1.5569 = 12.4552% |
| Retención ICA | `rete_ica` | **3%** (0.03) | Descuento del flete bruto |
| Retención en la fuente | `rete_fuente` | **1%** (0.01) | Descuento del flete bruto |

> **Denominador OC = 1 − 0.08 − 0.124552 − 0.03 − 0.01 = `0.755448`**

---

### 4.6. Factores fijos — Costos variables complementarios

| Parámetro | Variable | Valor | Base de aplicación |
|-----------|----------|:-----:|--------------------|
| Tasa de imprevistos | `tasa_imprevistos` | **7.5%** (0.075) | Sobre (llantas + lubricantes + filtros + mantenimiento + lavado/engrase), **excluye** combustible y peajes |

---

## 5. TABLAS DE PARÁMETROS — Valores que se actualizan periódicamente

Estos valores cambian y deben **versionarse por mes o por año**. Son datos que el administrador del sistema actualiza periódicamente.

### 5.1. Parámetros de actualización mensual (tabla `monthly_params`)

| Campo (columna) | Descripción | Fuente oficial | Unidad |
|-----------------|-------------|----------------|--------|
| `periodo_yyyymm` | Mes de vigencia (ej. 202602) | — | YYYYMM |
| `acpm_price_cop_gal` | Precio ACPM en Bogotá | MinMinas / ACPM oficial | COP/galón |
| `smlmv` | Salario Mínimo Legal Mensual Vigente | Decreto SMLMV anual | COP |
| `interes_mensual_br` | Tasa de interés mensual (Banco de la República) | BR oficial | % decimal |

---

### 5.2. Parámetros de actualización anual (tabla `annual_params`)

| Campo (columna) | Descripción | Unidad | Ejemplo referencia |
|-----------------|-------------|--------|--------------------|
| `ano` | Año de vigencia | YYYY | 2026 |
| `soat_c2_cop` | Costo SOAT anual — C2 | COP | — |
| `soat_c3_cop` | Costo SOAT anual — C3 | COP | — |
| `soat_c2s2_cop` | Costo SOAT anual — C2S2 | COP | — |
| `soat_c3s3_cop` | Costo SOAT anual — C3S3 | COP | — |
| `seguro_todo_riesgo_c2_cop` | Seguro todo riesgo anual — C2 | COP | ~ 4.5% del valor del vehículo |
| `seguro_todo_riesgo_c3_cop` | Seguro todo riesgo anual — C3 | COP | — |
| `rtm_c2_cop` | RTM (revisión técnica) anual — C2 | COP | — |
| `rtm_c3_cop` | RTM anual — C3 | COP | — |
| `comunicaciones_mes_cop` | GPS / telecom mensual | COP | — |
| `parqueadero_noche_bogota_cop` | Tarifa parqueadero nocturno Bogotá | COP/noche | — |

---

### 5.3. Parámetros de llantas por configuración (tabla `tire_params`)

*Actualizan anualmente o cuando cambian precios de mercado.*

| config_id | `precio_llanta_traccion_cop` | `qty_llantas_traccion` | `vida_util_traccion_km` | `precio_llanta_direccional_cop` | `qty_llantas_direccional` | `vida_util_direccional_km` |
|-----------|-----------------------------:|:----------------------:|:-----------------------:|--------------------------------:|:-------------------------:|:--------------------------:|
| C2 | — | 4 | 80.000 km | — | 2 | 100.000 km |
| C3 | — | 4 | 80.000 km | — | 2 | 100.000 km |
| C2S2 | — | 8 | 80.000 km | — | 2 | 100.000 km |
| C2S3 | — | 8 | 80.000 km | — | 2 | 100.000 km |
| C3S2 | — | 8 | 80.000 km | — | 4 | 100.000 km |
| C3S3 | — | 12 | 80.000 km | — | 4 | 100.000 km |

> Los precios de las llantas (—) se cargan como dato del mercado en cada actualización anual.

---

### 5.4. Parámetros de lubricantes, filtros y lavado (tabla `maintenance_params`)

*Por configuración vehicular. Actualización anual.*

| Rubro | Campo costo unitario | Campo cantidad/frecuencia | Campo vida útil (km) |
|-------|---------------------|--------------------------|----------------------|
| Aceite motor | `aceite_motor_cop_lt` | `aceite_motor_litros` | `aceite_motor_km` |
| Aceite caja | `aceite_caja_cop_lt` | `aceite_caja_litros` | `aceite_caja_km` |
| Aceite diferencial | `aceite_diferencial_cop_lt` | `aceite_diferencial_litros` | `aceite_diferencial_km` |
| Filtro aceite | `filtro_aceite_cop` | `filtro_aceite_qty` | `filtro_aceite_km` |
| Filtro aire | `filtro_aire_cop` | `filtro_aire_qty` | `filtro_aire_km` |
| Filtro combustible | `filtro_combustible_cop` | `filtro_combustible_qty` | `filtro_combustible_km` |
| Lavado y engrase | `lavado_engrase_cop` | — | `lavado_engrase_km` |
| Mantenimiento/reparaciones | `mantenimiento_cop_km` | — | — (ya es COP/km) |

---

### 5.5. Tabla de peajes por corredor (tabla `tolls_routes`)

| Campo | Descripcion | Tipo |
|-------|-------------|------|
| `origen_nudo` | Ciudad o nudo vial de origen | texto |
| `destino_nudo` | Ciudad o nudo vial de destino | texto |
| `total_peajes_c2_cop` | Suma peajes ruta para C2 | COP |
| `total_peajes_c3_cop` | Suma peajes ruta para C3+ | COP |
| `fuente` | INVIAS / ANI / manual | texto |
| `vigencia_desde` | Desde cuándo aplica | fecha |

---

## 6. FÓRMULAS DE CÁLCULO — Motor del cotizador

El cálculo se ejecuta en este orden exacto:

---

### 6.1. Paso previo: Tiempo de viaje y número de viajes al mes

```
// Velocidad promedio ponderada de la ruta
V_prom = (km_plano × v_plano + km_ondulado × v_ondulado + km_montañoso × v_montañoso)
         / distancia_total_km

// Tiempo de viaje ida (horas)
T_ida_h = distancia_total_km / V_prom

// Viajes por mes (ida y vuelta)
N_viajes_mes = H_mes / (T_ida_h × 2)
             = 288 / (T_ida_h × 2)
```

---

### 6.2. Costo Variable (CV)

#### A) Combustible

```
// Indicador de consumo por tipo de terreno (COP/km)
IC_plano      = acpm_price_cop_gal / km_per_gal_plano[config]
IC_ondulado   = acpm_price_cop_gal / km_per_gal_ondulado[config]
IC_montañoso  = acpm_price_cop_gal / km_per_gal_montañoso[config]

// Costo total de combustible
CV_combustible = (IC_plano × km_plano)
               + (IC_ondulado × km_ondulado)
               + (IC_montañoso × km_montañoso)
```

#### B) Peajes

```
CV_peajes = total_peajes_ruta[config][origen][destino]   // de tabla tolls_routes
```

#### C) Llantas

```
// Por cada tipo de llanta (tracción, direccional, remolque si aplica):
indicador_llanta_i = (precio_llanta_i × qty_llanta_i) / vida_util_llanta_i_km

CV_llantas = Σ(indicador_llanta_i) × distancia_total_km
```

#### D) Lubricantes

```
// Por cada lubricante (aceite motor, caja, diferencial):
indicador_lubricante_j = (costo_lubricante_j_por_cambio) / vida_util_lubricante_j_km

CV_lubricantes = Σ(indicador_lubricante_j) × distancia_total_km
```

#### E) Filtros

```
// Por cada filtro (aceite, aire, combustible):
indicador_filtro_k = (precio_filtro_k × qty_filtro_k) / vida_util_filtro_k_km

CV_filtros = Σ(indicador_filtro_k) × distancia_total_km
```

#### F) Lavado y engrase

```
indicador_lavadoengrase = lavado_engrase_cop / lavado_engrase_km[config]

CV_lavado_engrase = indicador_lavadoengrase × distancia_total_km
```

#### G) Mantenimiento y reparaciones

```
CV_mantenimiento = mantenimiento_cop_km[config] × distancia_total_km
```

#### H) Imprevistos

```
// Base: todos los variables EXCEPTO combustible y peajes
base_imprevistos = CV_llantas + CV_lubricantes + CV_filtros
                 + CV_lavado_engrase + CV_mantenimiento

CV_imprevistos = tasa_imprevistos × base_imprevistos
               = 0.075 × base_imprevistos
```

#### I) Total Costo Variable

```
CV_total = CV_combustible + CV_peajes + CV_llantas + CV_lubricantes
         + CV_filtros + CV_lavado_engrase + CV_mantenimiento + CV_imprevistos
```

---

### 6.3. Costo Fijo (CF)

#### A) Capital (recuperación del vehículo)

```
// f = factor sobre el valor del vehículo a recuperar (parámetro configurable)
// i = tasa de interés mensual (Banco de la República)
// n = meses de recuperación (120 para C2, 192 para C3+)

// Cuota mensual tipo PMT:
CF_capital_mes = (valor_vehiculo_cop × f × i) / (1 - (1 + i)^(-n))
```

#### B) Salarios

```
CF_salarios_mes = (jornada_factor × smlmv × (1 + fp_salario))
                + (0.5 × smlmv × (1 + fp_salario) / 12)
                = (1.5 × smlmv × 1.5568)
                + (0.5 × smlmv × 1.5568 / 12)
```

#### C) Seguros

```
CF_seguros_mes = (soat_anual[config] + seguro_todo_riesgo[config]) / 12
```

#### D) Impuestos vehiculares

```
CF_impuestos_mes = (tasa_impuesto × valor_vehiculo_cop) / 12
                 = (0.005 × valor_vehiculo_cop) / 12
```

#### E) Parqueadero

```
CF_parqueadero_mes = parqueadero_noche_cop × 30
```

#### F) Comunicaciones

```
CF_comunicaciones_mes = comunicaciones_mes_cop    // GPS/telecom mensual
```

#### G) RTM (Revisión Técnico-Mecánica)

```
CF_rtm_mes = rtm_anual[config] / 12
```

#### H) Total Costo Fijo mensual y por viaje

```
CF_total_mes = CF_capital_mes + CF_salarios_mes + CF_seguros_mes
             + CF_impuestos_mes + CF_parqueadero_mes
             + CF_comunicaciones_mes + CF_rtm_mes

CF_por_viaje = CF_total_mes / N_viajes_mes
```

---

### 6.4. Otros Costos (OC) — Flete bruto final

```
// Denominador (factores tributarios y comisión conductor)
denominador_OC = 1 - f_comision - (f_comision × (fp_comision - 1))
               - rete_ica - rete_fuente
             = 1 - 0.08 - 0.124552 - 0.03 - 0.01
             = 0.755448

// Flete bruto
OC = ((1 + f_admin) × (CV_total + CF_por_viaje)) / denominador_OC
   = (1.05 × (CV_total + CF_por_viaje)) / 0.755448
```

---

### 6.5. Flete total estimado

```
FLETE_TOTAL = OC

// Desglose para mostrar al usuario:
FLETE_TOTAL = CF_por_viaje + CV_total + margen_administracion + descuentos_tributarios
```

---

## 7. DATOS DE SALIDA — Output de la cotización

### 7.1. Resumen ejecutivo (vista principal)

| Campo | Descripción | Tipo | Ejemplo |
|-------|-------------|------|---------|
| `flete_total_cop` | Flete total estimado | COP | $2.450.000 |
| `flete_por_km_cop` | Flete por kilómetro | COP/km | $2.450 |
| `flete_por_ton_cop` | Flete por tonelada (si se capturó peso) | COP/ton | — |
| `distancia_total_km` | Distancia total de la ruta | km | 500 km |
| `config_vehiculo` | Configuración fijada | texto | C2 |
| `fecha_parametros` | Mes de parámetros utilizado | YYYYMM | 202602 |
| `metodologia` | Referencia normativa | texto | "SICE-TAC Res. 20213040034405" |

---

### 7.2. Desglose por componente (vista detallada)

| Componente | Subcuenta | Valor COP | % del total |
|------------|-----------|----------:|:-----------:|
| **Costo Fijo por viaje** | Capital | CF_capital_por_viaje | — |
| | Salarios | CF_salarios_por_viaje | — |
| | Seguros | CF_seguros_por_viaje | — |
| | Impuestos | CF_impuestos_por_viaje | — |
| | Parqueadero | CF_parqueadero_por_viaje | — |
| | Comunicaciones | CF_comunicaciones_por_viaje | — |
| | RTM | CF_rtm_por_viaje | — |
| **Subtotal CF** | | **CF_por_viaje** | — |
| **Costo Variable** | Combustible | CV_combustible | — |
| | Peajes | CV_peajes | — |
| | Llantas | CV_llantas | — |
| | Lubricantes | CV_lubricantes | — |
| | Filtros | CV_filtros | — |
| | Lavado y engrase | CV_lavado_engrase | — |
| | Mantenimiento | CV_mantenimiento | — |
| | Imprevistos (7.5%) | CV_imprevistos | — |
| **Subtotal CV** | | **CV_total** | — |
| **Otros costos** | Administración (5%) | margen_admin | — |
| | Comisión conductor (8% × 1.5569) | costo_comision | — |
| | Rete ICA (3%) | rete_ica_cop | — |
| | Rete fuente (1%) | rete_fuente_cop | — |
| **FLETE TOTAL** | | **FLETE_TOTAL** | **100%** |

---

### 7.3. Parámetros usados (trazabilidad / auditoría)

| Parámetro | Valor usado | Vigencia |
|-----------|-------------|----------|
| Precio ACPM | `acpm_price_cop_gal` COP/gal | Mes YYYYMM |
| SMLMV | `smlmv` COP | Año YYYY |
| Tasa de interés mensual | `interes_mensual_br` % | Mes YYYYMM |
| Velocidad promedio ponderada | `V_prom` km/h | Protocolo SICE-TAC |
| Rendimiento C2/plano | 12.70 km/gal | Protocolo SICE-TAC |
| N viajes simulados al mes | `N_viajes_mes` | Calculado |

> Esta sección garantiza **trazabilidad** de cada cotización para reclamos futuros.

---

### 7.4. Cotización como documento (para envío)

| Campo | Descripción |
|-------|-------------|
| `numero_cotizacion` | ID único (ej. COT-2026-0001) |
| `fecha_generacion` | Timestamp de generación |
| `empresa_cliente` | Nombre empresa solicitante |
| `origen_destino` | "Bogotá → Cali" |
| `flete_total_cop` | Valor principal |
| `validez_cotizacion` | "Esta cotización es válida por 48 horas" |
| `aviso_legal` | "Estimación basada en metodología SICE-TAC (MinTransporte). No constituye una tarifa fijada. Paramétros actualizados a: [mes/año]." |

---

## 8. Reglas de negocio y validaciones

### 8.1. Validaciones de entrada

| Regla | Descripción |
|-------|-------------|
| `km_plano + km_ondulado + km_montañoso = distancia_total_km` | Obligatorio. Si no se ingresan por separado, usar distribución por defecto. |
| `valor_vehiculo_cop > 0` | Requerido para calcular capital e impuestos. |
| `fecha_cotizacion` | Debe tener parámetros mensuales cargados para ese mes. |
| `config_vehiculo` en \[C2, C3, C2S2, C2S3, C3S2, C3S3\] | Solo configuraciones soportadas. |
| `N_viajes_mes ≥ 1` | Mínimo 1 viaje al mes. Si da fracción, redondear hacia abajo. |

### 8.2. Alertas al administrador

| Alerta | Condición |
|--------|-----------|
| Parámetros ACPM vencidos | `acpm_price_cop_gal` del mes solicitado no cargado |
| SMLMV sin actualizar | `smlmv` del año actual no cargado |
| Peajes sin ruta | No existe entrada en `tolls_routes` para origen–destino |
| Valor vehículo atípico | `valor_vehiculo_cop` fuera de rango histórico del config |

### 8.3. Periodicidad de actualización de parámetros

| Parámetro | Frecuencia | Ventana | Fuente |
|-----------|-----------|---------|--------|
| Precio ACPM | Mensual | Primeros 5 días hábiles | MinMinas |
| SMLMV | Anual (enero) | Decreto previo a enero | DANE / Gobierno |
| SOAT / Seguros | Anual | Según circular aseguradoras | Fasecolda |
| Llantas / Mantenimiento | Anual o si cambian ≥5% | — | Proveedores |
| Peajes | Cuando INVIAS/ANI actualice | Resolución de peajes | INVIAS / ANI |
| Tasa BR | Mensual | Con publicación BR | Banco de la República |

---

## 9. Glosario técnico

| Término | Definición |
|---------|------------|
| **SICE-TAC** | Sistema de Información de Costos Eficientes para el Transporte Automotor de Carga por Carretera (MinTransporte) |
| **Nudo vial** | Ciudad o punto de referencia definido por el SICE-TAC como origen o destino de ruta |
| **Flete** | Precio pactado por el transporte de carga en una ruta origen–destino |
| **CF** | Costo Fijo — costos de poseer y mantener disponible el vehículo, prorrateados por viaje |
| **CV** | Costo Variable — costos que genera el viaje en sí (combustible, peajes, desgastes) |
| **OC** | Otros Costos — factores comerciales y tributarios que ajustan el flete bruto |
| **ACPM** | Aceite Combustible Para Motor — nombre colombiano del diésel para transporte |
| **SMLMV** | Salario Mínimo Legal Mensual Vigente |
| **RTM** | Revisión Técnico-Mecánica — revisión obligatoria periódica del vehículo |
| **C2** | Camión rígido 2 ejes (ej. NHR, NPR, camión mediano) |
| **C3S3** | Tractomula o "doble troque" — 6 ejes en total |
| **PMT** | Función de cuota de crédito: (P × i) / (1 − (1+i)^-n) |
| **ICTC** | Índice de Costos del Transporte de Carga por Carretera |
| **fp_salario** | Factor prestacional sobre el salario base (55.68%) — incluye cesantías, primas, vacaciones, EPS, pensión, ARL |
| **fp_comision** | Factor prestacional aplicado sobre la comisión del conductor (×1.5569) |

---

*Documento generado con base en: Resolución MinTransporte 20213040034405 del 06-08-2021 y su Anexo Técnico (Protocolo SICE-TAC). Para uso interno de desarrollo del cotizador.*
