# Cotizador Histórico RNDC — Propuesta Funcional y Técnica

> **Fecha:** Febrero 2026  
> **Empresa:** Transportes Nuevo Mundo Ltda.  
> **Fuente de datos:** Manifiestos RNDC registrados ante el Ministerio de Transporte (1.156 viajes, marzo–diciembre 2025)

---

## 1. El Problema que Resuelve

Hoy el sistema tiene un cotizador basado en la **regulación SISETAC** del Ministerio: toma costos técnicos de operar un camión (combustible, llantas, seguro, depreciación, etc.) y calcula el flete mínimo legal.

Ese motor es preciso para **camiones completos de 8 a 35 toneladas**, y representa el **piso regulatorio**: lo mínimo que la ley permite cobrar.

Pero para tomar decisiones comerciales necesitas una segunda referencia: **¿cuánto cobra realmente el mercado de transporte por un viaje de estas características?**

El RNDC responde exactamente eso. Cada manifiesto de carga registrado ante el Ministerio contiene el **flete pactado con el transportador** — lo que el carro efectivamente cobró por el viaje. Con 1.156 manifiestos propios, tenemos un historial real del precio de mercado por ruta y peso.

**El Cotizador RNDC responde: _¿Cuánto cobra realmente un transportador por un viaje como este?_**

### Las dos bases de cotización

```
SISETAC  →  "Esto no puede costar menos de $X"   (piso legal — basado en costos técnicos del vehículo)
RNDC     →  "El mercado real paga entre $Y y $Z"  (referencia de mercado — basado en viajes reales)
```

Tener ambas bases permite al comercial:
- Saber si el precio que le pide el transportador está dentro del mercado
- Estimar cuánto espacio de margen hay entre lo que cobra el carro y lo que se le puede cobrar al cliente
- Identificar rutas donde el mercado paga muy por encima o muy por debajo del SISETAC

---

## 2. La Fuente de Datos

El archivo Excel del Ministerio (`Documento_RNDC`) contiene el **registro oficial de cada manifiesto de carga** expedido por la empresa. Es el historial real de operaciones.

### Campos disponibles (los relevantes)

| Campo RNDC | Significado | Ejemplo |
|---|---|---|
| `MANORIGEN` | Ciudad + Departamento de origen | `BOGOTA BOGOTA D. C.` |
| `MANDESTINO` | Ciudad + Departamento de destino | `MEDELLIN ANTIOQUIA` |
| `MANKILOGRAMOSREMESAS` | Peso total de la carga en kg | `850` |
| `VALORFLETEPACTADOVIAJE` | **Lo que cobró el transportador (flete pactado con el carro)** | `450.000` |
| `MANVLRTOTFLETE` | Flete neto pagado a la planilla (after retención ICA ~4%) | `443.100` |
| `FECHAEXPEDICIONMANIFIESTO` | Cuándo se hizo el viaje | `15/09/2025` |
| `NUMMANIFIESTOCARGA` | ID del manifiesto | `M001874` |
| `NUMPLACA` | Placa del vehículo | `TZT074` |

### Estadísticas del dataset actual

| Métrica | Valor |
|---|---|
| Total manifiestos | **1.156 viajes** |
| Período | Marzo – Diciembre 2025 |
| Ciudades de origen únicas | 69 |
| Ciudades de destino únicas | 127 |
| Peso mínimo registrado | 20 kg |
| Peso máximo registrado | 6.560 kg |
| Flete mínimo cobrado | $30.000 |
| Flete máximo cobrado | $3.700.000 |

### Rutas con más viajes (muestra de las 10 más frecuentes)

| Ruta | N° viajes |
|---|---|
| Cota → Medellín | 58 |
| Cota → Barranquilla | 41 |
| Bogotá → Cali | 39 |
| Cota → Bucaramanga | 34 |
| Cali → Bogotá | 27 |
| Cota → Cali | 23 |
| Bucaramanga → Bogotá | 23 |
| Cota → Cúcuta | 22 |
| Bogotá → Villavicencio | 21 |
| Barranquilla → Bogotá | 21 |

---

## 3. Cómo Funciona el Motor

### 3.1 El Flujo de Consulta

```
Usuario ingresa:
  - Ciudad origen       → "Bogotá"
  - Ciudad destino      → "Medellín"
  - Peso de la carga    → 600 kg

    ┌─────────────────────────────────────────┐
    │  PASO 1: Buscar viajes en esa ruta      │
    │  Bogotá → Medellín: encontrados 39      │
    └────────────────┬────────────────────────┘
                     │
    ┌────────────────▼────────────────────────┐
    │  PASO 2: Filtrar por peso similar       │
    │  Banda: 300 kg – 1.200 kg (±100%)       │
    │  Viajes resultantes: 22                 │
    └────────────────┬────────────────────────┘
                     │
    ┌────────────────▼────────────────────────┐
    │  PASO 3: Calcular estadísticas          │
    │  Promedio:  $520.000                    │
    │  Mediana:   $480.000  ← sugerido        │
    │  Mínimo:    $300.000                    │
    │  Máximo:    $900.000                    │
    │  COP/kg:    $800                        │
    └────────────────┬────────────────────────┘
                     │
    ┌────────────────▼────────────────────────┐
    │  RESULTADO                              │
    │  Estimado sugerido: $480.000            │
    │  Confianza: ALTA (22 viajes similares)  │
    └─────────────────────────────────────────┘
```

### 3.2 Lógica de Fallback (cuando hay pocos datos)

Si la búsqueda principal tiene menos de 3 viajes:

```
Nivel 1: Ruta exacta + peso en banda ±100%
    ↓ (si < 3 resultados)
Nivel 2: Mismo departamento origen+destino + peso en banda
    ↓ (si < 3 resultados)
Nivel 3: Solo por banda de peso (toda Colombia)
    → Confianza baja, se indica al usuario
```

### 3.3 Niveles de Confianza

| N° viajes similares | Nivel | Qué ve el usuario |
|---|---|---|
| ≥ 10 | 🟢 Alta | "Basado en X viajes reales en esta ruta" |
| 3 – 9 | 🟡 Media | "Pocos viajes en esta ruta, estimado orientativo" |
| < 3 (fallback) | 🔴 Baja | "Sin datos directos. Promedio nacional por peso" |

---

## 4. Pricing por Peso (Referencia Nacional)

El análisis del dataset muestra un patrón claro de pricing por kg:

| Banda de peso | Viajes | Flete promedio | Flete mediana | **COP/kg** |
|---|---|---|---|---|
| < 100 kg | 136 | $142.000 | $120.000 | **1.885** |
| 100 – 250 kg | 231 | $231.000 | $150.000 | **1.323** |
| 250 – 500 kg | 252 | $334.000 | $250.000 | **860** |
| 500 kg – 1 ton | 278 | $453.000 | $400.000 | **627** |
| 1 – 2 ton | 158 | $679.000 | $600.000 | **493** |
| 2 – 4 ton | 77 | $1.123.000 | $1.000.000 | **414** |
| 4 ton + | 24 | $1.496.000 | $1.500.000 | **285** |

> El precio por kg baja a medida que aumenta el volumen — característica típica del transporte de carga consolidada.

---

## 5. Diferencia vs. SISETAC

| | Cotizador SISETAC (actual) | Cotizador RNDC (nuevo) |
|---|---|---|
| **¿Qué mide?** | Costo técnico de operar el vehículo | Lo que cobró el transportador en viajes reales |
| **Base** | Fórmula regulatoria del Ministerio | Manifiestos RNDC — contratos reales |
| **Tipo de carga** | Camión completo (8 – 35 toneladas) | Cualquier peso (20 kg – 7 ton) |
| **Resultado** | Piso legal mínimo por distancia y vehículo | Rango de mercado real por ruta y peso |
| **Actualización** | Mensual con parámetros SISETAC | Cada nuevo reporte RNDC cargado |
| **Confianza** | Alta — modelo matemático determinista | Depende del volumen de viajes en la ruta |
| **Uso ideal** | Base legal — lo mínimo que puede costar el flete | Base de mercado — lo que realmente pagan |

**Los dos motores son complementarios y se usan en paralelo:**

```
Cotización completa para un viaje:

  SISETAC  →  Piso: $1.800.000  (mínimo legal — no se puede cobrar menos)
  RNDC     →  Mercado: $1.400.000 – $1.900.000  (lo que pagan viajes similares)

  → El carro en el mercado cobra alrededor del SISETAC en esta ruta
  → Margen disponible para el operador: la diferencia entre lo cobrado al cliente y lo pagado al carro
```

---

## 6. Lo que se Construye

### 6.1 Datos — Tabla `manifiestos_rndc`

Importar los 1.156 registros actuales a PostgreSQL. Estructura simplificada:

```sql
CREATE TABLE manifiestos_rndc (
  id              SERIAL PRIMARY KEY,
  manifiesto      VARCHAR(20),       -- M001874
  fecha           DATE,
  origen          VARCHAR(100),      -- normalizado: "BOGOTA"
  origen_dept     VARCHAR(60),       -- "BOGOTA D. C."
  destino         VARCHAR(100),      -- normalizado: "MEDELLIN"
  destino_dept    VARCHAR(60),
  peso_kg         INTEGER,
  flete_pactado   DECIMAL(15,2),     -- lo cobrado al cliente
  flete_neto      DECIMAL(15,2),     -- lo pagado a la planilla
  retencion_ica   DECIMAL(15,2),
  placa           VARCHAR(10),
  conductor_id    VARCHAR(20)
);
```

**Script de importación:** lee el Excel y carga los datos automáticamente. Cada vez que se suba un nuevo reporte RNDC, se pueden importar los registros nuevos.

### 6.2 API — `POST /api/cotizar/historico`

**Entrada:**
```json
{
  "origen": "Bogotá",
  "destino": "Medellín",
  "pesoKg": 600
}
```

**Salida:**
```json
{
  "encontrado": true,
  "confianza": "ALTA",
  "viajesSimilares": 22,
  "estimado": 480000,
  "promedio": 520000,
  "mediana": 480000,
  "minimo": 300000,
  "maximo": 900000,
  "copPorKg": 800,
  "rangoIntercuartil": { "q1": 380000, "q3": 650000 },
  "viajes": [
    { "manifiesto": "M001874", "fecha": "2025-09-15", "pesoKg": 620, "flete": 470000 },
    ...
  ],
  "nivelFallback": 0
}
```

### 6.3 UI — Página de cotización histórica

Nueva ruta `/cotizar/historico` con:

**Formulario:**
- Campo origen (autocomplete con ciudades del historial)
- Campo destino (autocomplete)
- Campo peso en kg
- Botón "Consultar historial"

**Resultado:**
- Tarjeta principal con el **estimado sugerido** (la mediana)
- Gráfico de dispersión: puntos = viajes reales, eje X = peso, eje Y = precio
- Tabla con los viajes similares encontrados (fecha, peso, precio, ruta)
- Indicador de confianza con explicación
- Comparación side-by-side con SISETAC si aplica

**Integración en el cotizador B2B:**
- En la solicitud de cotización, al final se puede agregar "Ver referencia histórica" que muestra el panel RNDC para el mismo origen/destino/peso

---

## 7. Casos de Uso

### Caso 1: Estimar el costo del flete antes de llamar al transportador
Un cliente pide un viaje de 400 kg de Cota a Bucaramanga.
→ El comercial consulta el RNDC → 34 manifiestos similares → los carros cobran entre $280.000 y $380.000 en esa ruta → sabe exactamente cuánto espacio tiene para su margen antes de siquiera hablar con el transportador.

### Caso 2: Negociar con un transportador que pide más de lo normal
Un conductor cotiza $700.000 por ir de Bogotá a Cali con 1.2 ton.
→ El RNDC muestra que el promedio por esa ruta y peso es $540.000, máximo registrado $650.000.
→ El comercial tiene datos reales para negociar: "Mira, el mercado paga máximo $650k en esa ruta."

### Caso 3: Construir el precio al cliente con margen claro
Costo del carro (RNDC): $450.000 por la ruta  
Piso legal (SISETAC): $480.000 mínimo  
→ El precio al cliente debe ser al menos $480.000 (legal) y el margen es lo que se negocia encima.
→ Con ambas referencias, el comercial estructura la oferta con total claridad.

### Caso 4: Detectar rutas donde el mercado está por encima del SISETAC
En Bogotá → Villavicencio, el SISETAC calcula $320.000 pero el RNDC muestra que los carros cobran en promedio $500.000.
→ Señal de que hay escasez de oferta de vehículos en esa ruta — el mercado paga prima sobre el piso legal.
→ Información valiosa para ajustar precios y anticipar dificultad para conseguir carro.

---

## 8. Plan de Implementación

| Fase | Alcance | Tiempo estimado |
|---|---|---|
| **1 — Datos** | Schema Prisma + script importación Excel → DB | 2–3 horas |
| **2 — API** | Endpoint `/cotizar/historico` con lógica de búsqueda y fallback | 2–3 horas |
| **3 — UI básica** | Formulario + resultado textual con viajes similares | 2–3 horas |
| **4 — UI avanzada** | Gráfico de dispersión, integración en solicitudes | 3–4 horas |
| **5 — Actualización** | Flujo para subir nuevos reportes RNDC desde el admin | 2 horas |

Total estimado: **~12 horas de desarrollo**

---

## 9. Limitaciones y Consideraciones

1. **Tamaño del dataset:** 1.156 viajes es suficiente para las rutas principales, pero rutas poco frecuentes tendrán confianza baja. Mejora con cada nuevo reporte RNDC cargado.

2. **Sesgo de empresa:** Los manifiestos son de Nuevo Mundo — el tipo de carga, las rutas y los transportadores habituales pueden no ser representativos del mercado general. Para rutas sin datos propios, el fallback es el promedio por banda de peso.

3. **Inflación/estacionalidad:** Los fletes de 2025 son la referencia, pero el precio del ACPM y la oferta de vehículos los afecta. Se puede agregar un ajuste por inflación o filtrar solo los últimos N meses.

4. **Sin tipo de vehículo explícito:** El RNDC no registra si el carro fue C2 o C3S3. Se puede inferir aproximadamente por el peso transportado (< 1.5 ton → camión pequeño, 1.5–6.5 ton → camión mediano), pero no es exacto.

5. **RNDC ≠ tarifa al cliente:** `VALORFLETEPACTADOVIAJE` es lo que se le pagó al transportador. El precio al cliente es esto más el margen del operador. El sistema nunca debe confundir ambos valores.

6. **No reemplaza SISETAC:** Para contratos formales o licitaciones, el piso regulatorio SISETAC es la referencia legal obligatoria. El RNDC es complementario, no sustituto.
