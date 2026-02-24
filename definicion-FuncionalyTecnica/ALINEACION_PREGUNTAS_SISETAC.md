# Alineación de Preguntas del Wizard con Metodología SISETAC

**Fecha:** Febrero 2026  
**Versión:** 1.1  
**Propósito:** Auditar cada pregunta actual del wizard, identificar faltantes, sobrantes y definir las equivalencias directas con los códigos del SISETAC para no tener que homologar después.

> **Filosofía del cotizador v1:** El resultado es una **referencia práctica de costos**, no una tarifa oficial vinculante. SISETAC da el piso técnico; el operador agrega su margen. La experiencia del usuario no puede sacrificarse por precisión matemática — el cliente ni sabe ni le importa qué configuración vehicular tiene el camión.

---

## Índice

1. [Contexto: ¿quién aporta qué dato?](#1-contexto-quién-aporta-qué-dato)
2. [Auditoría de preguntas actuales](#2-auditoría-de-preguntas-actuales)
3. [Preguntas que faltan](#3-preguntas-que-faltan)
4. [Preguntas que sobran o no aportan al cálculo](#4-preguntas-que-sobran-o-no-aportan-al-cálculo)
5. [Tabla de equivalencias: lenguaje usuario → código SISETAC](#5-tabla-de-equivalencias-lenguaje-usuario--código-sisetac)
6. [Propuesta de reformulación conversacional](#6-propuesta-de-reformulación-conversacional)
7. [Cómo resolver la distancia entre ciudades](#7-cómo-resolver-la-distancia-entre-ciudades)
8. [Modelo de datos propuesto (campos nuevos + mappings)](#8-modelo-de-datos-propuesto-campos-nuevos--mappings)
9. [Flujo de inferencias automáticas](#9-flujo-de-inferencias-automáticas)
10. [Flujo de preguntas propuesto (nuevo orden)](#10-flujo-de-preguntas-propuesto-nuevo-orden)

---

## 1. Contexto: ¿quién aporta qué dato?

Antes de auditar, es fundamental entender que en el modelo SISETAC hay **dos tipos de actores**:

| Actor | Datos que aporta | Cuándo |
|-------|-----------------|--------|
| **Cliente** (empresa que pide el flete) | Origen, destino, tipo de carga, peso, fecha del servicio, datos de contacto | En el wizard |
| **Operador** (empresa de transporte) | Valor comercial del vehículo, configuración de flota, ACPM del mes, SMLMV vigente, tarifas de seguros, peajes por corredor | En tablas de parámetros pre-cargadas (administrador) |

> **Conclusión crítica:** el cliente **NUNCA** debería responder "¿cuánto vale el camión?" ni "¿qué tasa de interés aplica?". Esos son parámetros del operador. Lo que el cliente aporta es suficiente para que el sistema **infiera el vehículo recomendado** y luego aplique las tablas del operador.

---

## 2. Auditoría de preguntas actuales

| Paso | Pregunta actual | Campo en BD | ¿Aporta al cálculo SISETAC? | Bloque SISETAC que alimenta | Observación |
|------|----------------|-------------|:-----------------------------:|-----------------------------|-------------|
| 0 | Nombre de empresa | `empresa` | ❌ No | — | Dato de negocio. Necesario para cotización, no para el cálculo |
| 1 | Nombre de contacto | `contacto` | ❌ No | — | Dato de negocio |
| 2 | Email | `email` | ❌ No | — | Dato de negocio |
| 3 | Teléfono | `telefono` | ❌ No | — | Dato de negocio |
| 4 | Tipo de servicio (Urbano / Nacional) | `tipoServicio` | ⚠️ Parcial | Determina lógica de terreno y si hay destino distinto | Actualizar: "Urbano" debería guardar un terreno default diferente |
| 5 | Origen | `origen` | ✅ Sí | Nudo vial origen (ruta, peajes, distancia) | Debe ser ciudad/municipio validado contra nudos SISETAC |
| 6 | Destino | `destino` | ✅ Sí | Nudo vial destino | Idem origen |
| 7 | Tipo de carga | `tipoCarga` | ⚠️ Parcial | Carrocería SISETAC + inferencia de configuración vehicular | Los valores actuales (`MERCANCIA_EMPRESARIAL`, `MAQUINARIA`, `MUEBLES_EMBALADOS`) **no son códigos SISETAC** |
| 8 | Peso (kg) | `pesoKg` | ✅ Sí | Inferencia de `config_vehiculo` (C2/C3/C3S3) + cálculo de llantas y revisión especial | Bien capturado. Falta el **mapeo a config vehicular** |
| 9 | Dimensiones (L × H × W) | `dimLargoCm`, `dimAnchoCm`, `dimAltoCm` | ⚠️ Marginal | Apoyo para confirmar config vehicular (volumen físico) | Útil como validación sobredimensionada, pero no es variable directa de fórmula SISETAC |
| 10 | Valor asegurado | `valorAsegurado` | ⚠️ Parcial | Se relaciona con seguros de carga, pero SISETAC calcula seguro del **vehículo**, no de la carga | Aclarar en UX que es el valor de la mercancía (seguro de carga) |
| 11 | Condiciones de cargue | `condicionesCargue` | ❌ No directamente | — | Útil operativamente (logística), pero **no entra en ninguna fórmula SISETAC** |
| 12 | Fecha requerida | `fechaRequerida` | ✅ Sí | Determina mes de ACPM y SMLMV vigente a usar | Bien capturado |

### Resumen del estado actual

| Estado | Cantidad | Preguntas |
|--------|:--------:|-----------|
| ✅ Alineado con SISETAC | 3 | Origen, Destino, Fecha requerida |
| ⚠️ Parcialmente alineado (necesita ajuste) | 4 | Tipo servicio, Tipo carga, Peso, Valor asegurado |
| ❌ No aporta al cálculo (pero sí al negocio) | 5 | Empresa, Contacto, Email, Teléfono, Condiciones cargue |
| ❌ Marginal | 1 | Dimensiones |

---

## 3. Preguntas que faltan

Estas son las que SISETAC **requiere** y el wizard actual **NO captura** (ni directa ni indirectamente):

### 3.1. Tipo de carrocería SISETAC (crítico)

| Qué falta | Por qué importa | Cómo obtenerlo |
|-----------|----------------|----------------|
| `tipo_carroceria_sisetac` (CARGA_GENERAL / REFRIGERADA / CONTENEDOR / GRANEL_SOLIDO / GRANEL_LIQUIDO) | Determina el tipo de vehículo y la configuración de costos de llantas/lubricantes | **Reemplazar** los valores actuales de `tipoCarga` por los códigos SISETAC. Ver tabla de equivalencias §5. |

---

### 3.2. Configuración vehicular — 100% interna, invisible para el usuario

> **Decisión de diseño:** El cliente **nunca ve** términos como C2, C3, tractomula ni configuración vehicular. Eso es un detalle operativo interno. Lo que el cliente sí conoce es el peso y el tipo de carga — con esos dos datos el sistema infiere internamente qué configuración usar.

| Dato que aporta el cliente | Dato interno que se infiere | Cómo se mapea |
|---------------------------|----------------------------|---------------|
| Categoría de peso (rangos) | `configVehiculo` (C2/C3/C2S2/C2S3/C3S2/C3S3) | Tabla de inferencia (ver §9) |
| `tipoCarroceria` | Restricción de configs disponibles | Ej. `CONTENEDOR` solo puede ser C2S2+ |

Tabla de inferencia (uso interno del sistema):

| Rango de peso | Config SISETAC asignada | Lo que el usuario eligió |
|:-------------:|:-----------------------:|-------------------------|
| Hasta 3.5 ton | `C2` | "Carga pequeña" |
| 3.5 t – 10 t | `C3` | "Carga mediana" |
| 10 t – 20 t | `C2S3` | "Carga grande" |
| > 20 t | `C3S3` | "Carga pesada / voluminosa" |

---

### 3.3. Confirmación expresa de ruta de larga distancia vs. urbano

| Qué falta | Por qué importa |
|-----------|----------------|
| Si el servicio es Nacional, necesitamos saber si existeuna sola ciudad destino (carretera punto a punto) | El SISETAC solo calcula costos de carretera. Si es distribución urbana múltiple, la lógica cambia |

---

### 3.4. (Opcional, fase 2) Tipo de terreno si no existe la ruta en base de datos

| Qué falta | Por qué importa | Cuándo preguntar |
|-----------|----------------|-----------------|
| Distribución aproximada de terreno (% plano / % montañoso) | Afecta directamente el consumo de combustible y la velocidad de la ruta | Solo si la ruta Origen→Destino no existe en la tabla `tolls_routes` pre-cargada. Por defecto se infiere por corredor. |

---

## 4. Preguntas que sobran o no aportan al cálculo

Estas preguntas **no tienen lugar en las fórmulas SISETAC**, pero se justifican por razones de negocio. La recomendación es mantenerlas pero **sacarlas del flujo principal** y llevárlas a un paso "datos de contacto" agrupado.

| Pregunta | Campo | ¿Por qué no aporta al cálculo? | Recomendación |
|----------|-------|-------------------------------|---------------|
| Nombre de empresa | `empresa` | Dato de cliente, no de ruta ni vehículo | ✅ Mantener — es para la cotización y el contacto |
| Nombre de contacto | `contacto` | Ídem | ✅ Mantener |
| Email | `email` | Ídem | ✅ Mantener |
| Teléfono | `telefono` | Ídem | ✅ Mantener |
| Condiciones de cargue | `condicionesCargue` | No entra en ninguna fórmula SISETAC (ni CF ni CV ni OC) | ⚠️ Mover al final como dato operativo / "datos adicionales". No bloquear el flujo si no se responde |
| Dimensiones | `dimLargoCm`, `dimAnchoCm`, `dimAltoCm` | No es variable directa de SISETAC. Útil solo para validar si la carga cabe en el vehículo sugerido | ⚠️ Convertir en campo opcional de "confirmación volumétrica". No crítico para MVP |

> **Nota sobre Valor asegurado:** este campo sí tiene valor operativo (cotizar seguro de carga adicional), pero **no es el seguro del vehículo** que calcula SISETAC. Hay que aclararlo en la UX para que el cliente no confunda. Renombrar a `valor_mercancia_cop` para distinguirlo.

---

## 5. Tabla de equivalencias: lenguaje usuario → código SISETAC

### 5.1. Tipo de carga / carrocería

Esta es la equivalencia más importante porque el valor actual del enum en BD (`MERCANCIA_EMPRESARIAL`, `MAQUINARIA`, `MUEBLES_EMBALADOS`) **no existe en SISETAC**, lo que forzaría una homologación manual después.

El SISETAC define exactamente **5 categorías de carga**. Todo lo que puede pedir un cliente B2B cae en una de ellas.

---

#### Categoría 1 — `CARGA_GENERAL`

> La categoría "atrapa-todo" de SISETAC. Si no es refrigerado, no va en contenedor ni a granel, es carga general.

| Etiqueta sugerida en pantalla | Emoji | Ejemplos de mercancía real |
|-------------------------------|:-----:|---------------------------|
| Mercancía paletizada / cajas | 📦 | Electrodomésticos, ropa, calzado, papel, repuestos, ferretería, cosméticos |
| **Bultos sueltos / ensacados** | 🧺 | **Costales de papa, café, arroz, maíz, harina, azúcar — producto agrícola empacado en sacos o bolsas. Aunque parezca granel, si va ensacado es Carga General** |
| Maquinaria y equipo | ⚙️ | Maquinaria industrial, equipos de construcción, generadores, compresores |
| Muebles y enseres empresariales | 🪑 | Mobiliario de oficina, estanterías, archivadores — **embalados** |
| Materiales de construcción secos | 🧱 | Tejas, bloques en estiba, tubería PVC, baldosas, materiales empacados |
| Carga mixta / combinada | 📋 | Cuando el cliente mezcla tipos y ninguno es especial |
| Alimentos no perecederos | 🍃 | Granos empacados, enlatados, bebidas, aceites envasados, productos secos |
| Farmacéuticos sin cadena de frío | 💊 | Medicamentos no refrigerados, insumos médicos |
| Carga peligrosa clase I–IX (baja densidad) | ⚠️ | Pinturas, aerosoles, baterías, productos de aseo — *requiere nota en cotización* |

> **Regla clave — bultos vs granel:** Si el producto va en sacos, costales o bolsas (aunque sea papa, café o arroz), es `CARGA_GENERAL`. Solo es `GRANEL_SOLIDO` cuando el producto se descarga directamente a granel sin empaque: arena volcada, carbón suelto, maíz a granel sin ensacar.

**Restricciones para NO usar `CARGA_GENERAL`:**
- Si necesita temperatura controlada → `REFRIGERADA`
- Si va dentro de un contenedor ISO sellado → `CONTENEDOR`
- Si se vierte / descarga a granel sin empaque → `GRANEL_SOLIDO` o `GRANEL_LIQUIDO`

---

#### Categoría 2 — `REFRIGERADA`

> Cualquier carga que requiere temperatura controlada durante el trayecto. La carrocería es furgón frigorífico.

| Etiqueta sugerida en pantalla | Emoji | Ejemplos de mercancía real |
|-------------------------------|:-----:|---------------------------|
| Alimentos frescos / perecederos | 🥩 | Carnes, lácteos, frutas y verduras frescas, mariscos, huevos |
| Farmacéuticos refrigerados | 💉 | Vacunas, insulinas, biológicos — cadena de frío crítica |
| Flores y plantas | 🌹 | Exportación de flores, plantas ornamentales |
| Helados y congelados | 🧊 | Productos ultracongelados — requiere ≤ -18°C |
| Bebidas que requieren frío | 🍺 | Cervezas artesanales, vinos, lácteos listos para consumo |

**Rangos de temperatura típicos** (para la cotización interna):
- Refrigerado: 0°C a 8°C
- Congelado: -10°C a -18°C
- Ultracongelado: < -18°C

---

#### Categoría 3 — `CONTENEDOR`

> Carga que viaja dentro de un contenedor ISO estándar. Típicamente comercio exterior o consolidado.

| Etiqueta sugerida en pantalla | Emoji | Ejemplos de mercancía real |
|-------------------------------|:-----:|---------------------------|
| Importación / exportación | 🚢 | Mercancía que viene o va en barco y necesita cabestrante |
| Carga consolidada (LCL) | 📦🔒 | Varios clientes en el mismo contenedor |
| Carga completa (FCL) | 📦📦 | Contenedor 20' o 40' completo de un solo cliente |

**Tipos de contenedor más comunes:**
- Dry van 20': ~28 ton, ~33 m³
- Dry van 40': ~28 ton, ~67 m³
- Reefer (refrigerado en contenedor): misma medida, con unidad de frío

**Nota de implementación:** Esta categoría implica `C2S2` mínimo (portacontenedor). Un `C2` no puede llevar un contenedor ISO.

---

#### Categoría 4 — `GRANEL_SOLIDO`

> Material suelto, sin empacar, que se carga a granel en volco, tolva o plataforma.

| Etiqueta sugerida en pantalla | Emoji | Ejemplos de mercancía real |
|-------------------------------|:-----:|---------------------------|
| Materiales de construcción a granel | 🪨 | Arena, gravilla, recebo, tierra, piedra triturada |
| Agroindustriales a granel | 🌾 | Granos (maíz, soya, arroz, trigo) sin empacar |
| Minerales y carbón | ⛏️ | Carbón, sal, cal, minerales |
| Residuos industriales | ♻️ | Escombros, chatarra, desperdicios industriales |
| Cementos y polvos | 🏭 | Cemento a granel, cal hidratada, yeso |

**Nota:** La mayoría de este tipo va en C3, C3S2 o C3S3 (volco o tractomula tolva).

---

#### Categoría 5 — `GRANEL_LIQUIDO`

> Líquidos transportados en cisterna, sin empaque intermedio.

| Etiqueta sugerida en pantalla | Emoji | Ejemplos de mercancía real |
|-------------------------------|:-----:|---------------------------|
| Combustibles | ⛽ | ACPM, gasolina, jet fuel — *requiere habilitación especial* |
| Aceites industriales y vegetales | 🛢️ | Aceite de palma, aceites lubricantes, grasas industriales |
| Químicos líquidos | ⚗️ | Ácidos, solventes, aditivos, resinas — *requiere ficha de seguridad* |
| Asfalto y betunes | 🛣️ | Asfalto líquido, emulsiones asfálticas, brea |
| Agua y bebidas a granel | 💧 | Agua potable, jugos, vinagre, leche a granel |

**Nota:** Esta categoría siempre implica C2S2 o C3S3 (cisterna). Su cotización tiene sobrecosto por habilitación especial en muchos casos.

---

#### Tabla resumen de equivalencias (para la BD)

| Valor ACTUAL en BD | → Nuevo código SISETAC | Razonamiento |
|-------------------|:----------------------:|-------------|
| `MERCANCIA_EMPRESARIAL` | `CARGA_GENERAL` | Mercancía empresarial genérica = carga general |
| `MAQUINARIA` | `CARGA_GENERAL` | Maquinaria va en plataforma / furgón = carga general. Si pesa > 20 t o está sobredimensionada, la categoría de peso (`PESADA`) ya infiere C3S3 |
| `MUEBLES_EMBALADOS` | `CARGA_GENERAL` | Muebles embalados = carga general |

---

### 5.2. Tipo de servicio → tipo de ruta SISETAC

| Valor actual BD | Código lógico SISETAC | Implicación en el cálculo |
|----------------|----------------------|---------------------------|
| `URBANO` | Ruta urbana (terreno "mixto", distancia corta) | Aplicar factor de rendimiento urbano: `rendimiento_urbano = rendimiento_plano × 0.65`. N_viajes_mes alto. CF aplica de igual forma. |
| `NACIONAL` | Ruta interurbana (P/O/M según corredor) | Distribución de terreno por tabla de corredores. Velocidad promedio SISETAC aplica directamente. |

---

### 5.3. Configuración vehicular (inferida, no preguntada)

| Código SISETAC | Nombre técnico | Nombre para el usuario | Peso orientativo |
|---------------|----------------|------------------------|-----------------|
| `C2` | Camión rígido 2 ejes | Camión pequeño / NHR / NPR | Hasta ~3.5 ton de carga |
| `C3` | Camión rígido 3 ejes | Camión mediano | 3.5 t – 10 t |
| `C2S2` | Tractocamión + semirremolque 2 ejes | Tracto pequeño | 10 t – 17 t |
| `C2S3` | Tractocamión + semirremolque 3 ejes | Tracto mediano | 10 t – 20 t |
| `C3S2` | Tractocamión 3e + semirremolque 2e | Tractomula mediana | 17 t – 25 t |
| `C3S3` | Tractocamión 3e + semirremolque 3e | Tractomula / doble troque | Hasta 32 t (RNDC) |

---

### 5.4. Terreno → código SISETAC

| Descripción | Código interno | Cuándo aplica |
|-------------|:-------------:|---------------|
| Plano | `P` | Llanos, Costa Caribe, vías sin pendiente relevante |
| Ondulado | `O` | Piedemonte, transición montaña–llano |
| Montañoso | `M` | Eje Cafetero, cordilleras, tramos de alta altimetría |
| (Ninguno definido para urbano, se usa factor) | `U` | Distribución urbana dentro de ciudad |

---

## 6. Propuesta de reformulación conversacional

Para cada dato que SISETAC necesita y que proviene del cliente, aquí la pregunta en lenguaje natural:

### Datos del viaje

| Dato SISETAC | Pregunta propuesta (tono conversacional) | Tipo de input | Validación clave |
|-------------|------------------------------------------|:------------:|-----------------|
| `origen` (nudo vial) | _"¿Desde qué ciudad sale la carga?"_ | Autocomplete con lista de ciudades validadas | Ciudad en listado de nudos SISETAC |
| `destino` (nudo vial) | _"¿A qué ciudad va el envío?"_ | Autocomplete | Ciudad en listado de nudos SISETAC. Igual a origen → rechazar |
| `tipo_servicio` | _"¿El envío es dentro de la misma ciudad o entre ciudades?"_ | 2 botones: 🏙️ Dentro de la ciudad / 🌍 Entre ciudades | — |
| `fecha_requerida` | _"¿Para qué fecha necesitas el servicio?"_ | Date picker | ≥ hoy. Determina mes de ACPM. |

---

### Datos de la carga (reformulados y alineados a SISETAC)

#### Tipo de carga

| Dato SISETAC | Pregunta propuesta | Tipo de input | Notas |
|-------------|-------------------|:------------:|-------|
| `tipoCarroceria` | _"¿Qué tipo de carga vas a transportar?"_ | 5 tarjetas seleccionables, cada una con icono + nombre + subtexto + botón "¿Qué es esto?" que expande la explicación | Ver diseño detallado abajo |

---

##### Diseño de cada opción (tarjeta expandible)

Cada opción se muestra como una **tarjeta seleccionable**. Al hacer clic en "¿Qué incluye esto?" (o un ícono ⓘ), se expande una explicación en lenguaje llano. El usuario solo lee la explicación si tiene dudas — no bloquea el flujo.

---

###### 📦 Opción 1 — Mercancía general

| Elemento UI | Contenido |
|-------------|-----------|
| **Icono** | 📦 |
| **Nombre** | Mercancía general |
| **Subtexto (siempre visible)** | Cajas, pallets, bultos, maquinaria, muebles, repuestos, materiales |
| **Código BD** | `CARGA_GENERAL` |

**Explicación expandible ("¿Qué incluye esto?"):**

> Es la opción más común. Aplica cuando tu carga va empacada, embalada o en estibas y **no necesita frío** ni es un líquido o polvo a granel.
>
> **Ejemplos:** cajas de electrodomésticos, costales de papa, sacos de café, muebles embalados, maquinaria en estiba, materiales de construcción empacados, repuestos industriales, medicamentos sin nevera, ropa y calzado.
>
> **¿Cómo saber si esta es tu opción?**
> - Tu carga va en cajas, sacos, bolsas, estibas o embalada ✅
> - No necesita temperatura controlada durante el viaje ✅
> - No viaja dentro de un contenedor marítimo sellado ✅
> - No es arena, carbón o material que se descarga directamente al suelo ✅

---

###### ❄️ Opción 2 — Carga refrigerada

| Elemento UI | Contenido |
|-------------|-----------|
| **Icono** | ❄️ |
| **Nombre** | Carga refrigerada |
| **Subtexto (siempre visible)** | Alimentos frescos, medicamentos, flores — necesita frío |
| **Código BD** | `REFRIGERADA` |

**Explicación expandible ("¿Qué incluye esto?"):**

> Aplica cuando tu carga **se daña si no se mantiene fría** durante el trayecto. El vehículo que se asigna es un furgón frigorífico (con sistema de refrigeración).
>
> **Ejemplos:** carnes, lácteos, frutas y verduras frescas, mariscos, flores para exportación, vacunas e insulinas, helados y congelados, jugos y bebidas que deben ir en frío.
>
> **¿Cómo saber si esta es tu opción?**
> - Tu producto tiene fecha de vencimiento corta y se deteriora sin frío ✅
> - Necesitas cadena de frío durante todo el transporte ✅
> - No aplica si tu producto ya está enlatado, deshidratado o empacado al vacío sin requerir frío (esos van en Mercancía general)

---

###### 🚢 Opción 3 — Contenedor

| Elemento UI | Contenido |
|-------------|-----------|
| **Icono** | 🚢 |
| **Nombre** | Contenedor |
| **Subtexto (siempre visible)** | Contenedor sellado de importación o exportación (20' / 40') |
| **Código BD** | `CONTENEDOR` |

**Explicación expandible ("¿Qué incluye esto?"):**

> Aplica cuando tu mercancía viaja dentro de un **contenedor metálico estándar** (el tipo que ves en barcos y puertos). El camión transporta el contenedor completo, no la mercancía directamente.
>
> **Ejemplos:** importaciones que llegan al puerto en contenedor y hay que llevarlas al almacén, exportaciones que se llevan al puerto, cargas consolidadas (varios clientes en el mismo contenedor), contenedor propio de 20 o 40 pies.
>
> **¿Cómo saber si esta es tu opción?**
> - Tu carga llegó o va a un puerto marítimo en contenedor ✅
> - Tienes un contenedor ya asignado con number de booking ✅
> - No aplica si tu carga va en un camión corriente aunque sea para exportar (eso es Mercancía general)

---

###### 🪨 Opción 4 — Granel sólido

| Elemento UI | Contenido |
|-------------|-----------|
| **Icono** | 🪨 |
| **Nombre** | Granel sólido |
| **Subtexto (siempre visible)** | Arena, carbón, granos, escombros — material suelto sin empacar |
| **Código BD** | `GRANEL_SOLIDO` |

**Explicación expandible ("¿Qué incluye esto?"):**

> Aplica cuando el material **no va empacado** — se carga directamente en el platón, volco o tolva del camión y se descarga volcando o con banda.
>
> **Ejemplos:** arena, gravilla, recebo, tierra, piedra triturada, carbón suelto, escombros, granos de maíz o soya sin ensacar, sal, cemento a granel, cal.
>
> **¿Cómo saber si esta es tu opción?**
> - Tu material se vierte directamente al camión sin bolsa ni caja ✅
> - Se descarga volcando (el camión levanta la caja) o con cintas ✅
> - **Ojo:** si tu granos van en costales o sacos, eso es Mercancía general, no granel sólido

---

###### 🛢️ Opción 5 — Granel líquido

| Elemento UI | Contenido |
|-------------|-----------|
| **Icono** | 🛢️ |
| **Nombre** | Granel líquido |
| **Subtexto (siempre visible)** | Aceites, combustibles, químicos o líquidos en cisterna |
| **Código BD** | `GRANEL_LIQUIDO` |

**Explicación expandible ("¿Qué incluye esto?"):**

> Aplica cuando transportas **líquidos a granel** — sin botella ni envase, directamente en el tanque de un camión cisterna.
>
> **Ejemplos:** combustibles (ACPM, gasolina), aceite de palma, aceites industriales, ácidos, solventes, asfalto líquido, agua potable a granel, leche cruda, jugo de fruta sin envasar.
>
> **¿Cómo saber si esta es tu opción?**
> - Tu líquido va en cisterna (tanque del camión), no en botella, garrafón ni IBC ✅
> - El líquido se bombea para cargar y descargar ✅
> - **Ojo:** si tu producto va en bidones, garrafas o cajas de tetrapack, eso es Mercancía general

---

##### Resumen visual (tabla compacta para referencia rápida del desarrollador)

| Botón | Código BD | Nombre | Subtexto visible | ¿Cuándo elegirla? (en una línea) |
|:-----:|:---------:|--------|------------------|----------------------------------|
| 📦 | `CARGA_GENERAL` | **Mercancía general** | Cajas, pallets, bultos, maquinaria, muebles, repuestos, materiales | Carga empacada que no necesita frío ni cisterna |
| ❄️ | `REFRIGERADA` | **Carga refrigerada** | Alimentos frescos, medicamentos, flores — necesita frío | La carga se daña si no va en frío durante el viaje |
| 🚢 | `CONTENEDOR` | **Contenedor** | Contenedor sellado de importación o exportación (20' / 40') | La mercancía va dentro de un contenedor marítimo |
| 🪨 | `GRANEL_SOLIDO` | **Granel sólido** | Arena, carbón, granos, escombros — material suelto sin empacar | Material que se vierte al camión, sin empaque |
| 🛢️ | `GRANEL_LIQUIDO` | **Granel líquido** | Aceites, combustibles, químicos o líquidos en cisterna | Líquido que va en cisterna, no en botellas ni envases |

---

#### Peso → reemplazar input numérico libre por RANGOS con lenguaje natural

El cliente sabe cuánto pesa su carga en términos gruesos, pero no necesita ser exacto para el cotizador. Presentar rangos es:
- Más rápido de responder
- Menos intimidante
- Suficientemente preciso para elegir la configuración vehicular
- 100% alineado con SISETAC (que usa rangos de config, no kg exactos)

**Pregunta propuesta:** _"¿Cuánta carga vas a transportar aproximadamente?"_

| Botón para el usuario | Rango real | Config SISETAC (interno) | Campo guardado: `categoríaPeso` | `pesoKg` guardado |
|-----------------------|:-----------:|:------------------------:|:-------------------------------:|:------------------:|
| 🚐 **Carga pequeña** — "Cabe en una camioneta grande" | hasta 3.5 ton | C2 | `PEQUENA` | 3499 (valor tope del rango) |
| 🚛 **Carga mediana** — "Ocupa un camión" | 3.5 t – 10 t | C3 | `MEDIANA` | 9999 |
| 🚚 **Carga grande** — "Necesito un tracto" | 10 t – 20 t | C2S3 | `GRANDE` | 19999 |
| 🚜 **Carga pesada** — "Tractomula o más" | más de 20 t | C3S3 | `PESADA` | 20001 |

> **En BD:** Guardar tanto `categoriaPeso` (enum: PEQUENA/MEDIANA/GRANDE/PESADA) como `pesoKg` (valor representativo del rango). `configVehiculo` se infiere automáticamente y el usuario **nunca la ve**.

> **Si el usuario necesita ser exacto** (por ej. porque tiene múltiples viajes o quiere optimizar): ofrecer un link "ingresar peso exacto" como opción avanzada opcional.

---

#### Dimensiones y valor

| Dato SISETAC | Pregunta propuesta | Tipo de input | Notas |
|-------------|-------------------|:------------:|-------|
| `dimLargoCm`, etc. | _"¿Conoces las dimensiones del bulto más grande?"_ (opcional) | 3 campos numéricos L × A × H en cm | Campo opcional. Solo útil si hay duda sobre si la carga cabe. |
| `valorMercancia` | _"¿Cuál es el valor aproximado de la mercancía?"_ | Numérico COP | Para cotizar seguro de carga. Aclarar: "No es el valor del flete." |

---

### Datos del cliente (reagrupados en un bloque, no dispersos en 4 pasos)

| Dato | Pregunta propuesta | Sugerencia UX |
|------|--------------------|---------------|
| `empresa` | _"¿A nombre de qué empresa hacemos la cotización?"_ | Primer campo del bloque de contacto |
| `contacto` | _"¿Cuál es tu nombre?"_ | — |
| `email` | _"¿A qué correo te enviamos la cotización?"_ | Validar formato |
| `telefono` | _"¿Un número de WhatsApp o teléfono donde contactarte?"_ | Validar formato colombiano/internacional |

> **Sugerencia de UX:** Agrupar empresa + contacto + email + teléfono en **un solo paso** al final del wizard (tipo "datos de envío"), no 4 pasos separados. Esto reduce percepción de formulario largo sin perder datos.

---

### Dato operativo (mantener, mover al final)

| Dato | Pregunta propuesta | Tipo | Por qué al final |
|------|--------------------|:----:|-----------------|
| `condicionesCargue` | _"¿Con qué facilidades cuentas para el cargue?"_ (opcional) | Checkboxes: Muelle / Montacargas / Manual / No sé | No bloquea el cálculo. Es útil para que el operador planifique. Se puede saltar. |

---

## 7. Cómo resolver la distancia entre ciudades

Este es el dato más técnico que SISETAC necesita y que el usuario **nunca puede ingresar directamente**: la distancia en km entre el origen y el destino, y su distribución por tipo de terreno. Hay varias opciones:

---

### Opción A — Tabla de corredores pre-cargada (recomendada para MVP)

El mismo SISETAC trabaja con **nudos viales**: un listado cerrado de ciudades/municipios que el Ministerio define como puntos de referencia. Para cada par de nudos existe (o se puede calcular) una distancia oficial y una distribución de terreno.

**Cómo implementarlo:**
1. Cargar una tabla `corredores` con los pares origen–destino más frecuentes (los 30–50 corredores que cubren el 80% del tráfico de la empresa).
2. Cada corredor tiene: `distancia_km`, `km_plano`, `km_ondulado`, `km_montañoso`, `peajes_c2`, `peajes_c3s3`.
3. Cuando el usuario selecciona Origen y Destino, el sistema busca ese corredor en la tabla.
4. Si no existe el corredor → fallback a la Opción B.

**Fuente de datos inicial para la tabla:**
- El SISETAC publica en su portal los corredores con distancias y distribución de terreno.
- Se puede complementar con Google Maps para validar distancias.
- La empresa operadora ya conoce sus rutas más comunes y puede cargarlas manualmente al inicio.

| Ventaja | Desventaja |
|---------|------------|
| Sin costo de API | Hay que cargar los datos inicialmente |
| Sin dependencia externa | No cubre rutas poco frecuentes |
| Totalmente alineado con SISETAC | Requiere mantenimiento cuando INVIAS actualiza corredores |
| Funciona offline | — |

---

### Opción B — Google Maps Distance Matrix API (fallback o fase 2)

Cuando el corredor no está en la tabla pre-cargada, llamar a la API de Google Maps para obtener la distancia.

```
GET https://maps.googleapis.com/maps/api/distancematrix/json
  ?origins=Bogotá,Colombia
  &destinations=Cali,Colombia
  &mode=driving
  &key=API_KEY
```

**Retorna:** distancia en km y tiempo estimado en carretera.

**Lo que NO retorna:** distribución por tipo de terreno (plano/ondulado/montañoso). Para eso, usar una distribución por defecto según el corredor o la región:

| Corredor tipo | Distribución default |
|---------------|--------------------|
| Bogotá ↔ Costa Caribe (Barranquilla/Cartagena) | 60% plano / 30% ondulado / 10% montañoso |
| Bogotá ↔ Eje Cafetero (Manizales/Armenia/Pereira) | 10% plano / 30% ondulado / 60% montañoso |
| Bogotá ↔ Cali / Medellín | 20% plano / 30% ondulado / 50% montañoso |
| Bogotá ↔ Llanos (Villavicencio+) | 30% plano / 20% ondulado / 50% montañoso |
| Costa ↔ Costa (rutas planas) | 70% plano / 20% ondulado / 10% montañoso |

| Ventaja | Desventaja |
|---------|------------|
| Cubre cualquier ruta | Costo por llamada ($5 USD / 1000 requests) |
| Siempre actualizado | Requiere clave de API |
| Fácil de integrar | No da distribución de terreno |

---

### Opción C — OSRM (Open Source Routing Machine)

Alternativa gratuita a Google Maps. Se puede usar la instancia pública de OSRM o montar una propia.

```
GET http://router.project-osrm.org/route/v1/driving/
  -74.0817,-4.1429;-76.5225,3.4516
  ?overview=false
```

Menos popular pero sin costo y con datos OpenStreetMap.

---

### Estrategia recomendada para el MVP

```
1. Usuario selecciona Origen y Destino (lista de nudos SISETAC)
2. Sistema busca el corredor en tabla pre-cargada
   → Encontrado: usar km y terreno de la tabla ✅
   → No encontrado: llamar a Google Maps para distancia total
                    + aplicar distribución de terreno por región
                    + guardar el resultado para no volver a llamar
```

**Tabla de nudos SISETAC a pre-cargar (ciudades principales):**
Bogotá D.C., Medellín, Cali, Barranquilla, Cartagena, Bucaramanga, Cúcuta, Pereira, Manizales, Armenia, Ibagué, Villavicencio, Santa Marta, Montería, Valledupar, Neiva, Popayán, Pasto, Tunja, Florencia *(y sus respectivos municipios aledaños mapeados al nudo más cercano)*.

---

### Origen/Destino en la BD: cómo alinear con el Ministerio sin dañar la UX

**Lo que el usuario ve:** autocomplete de ciudad con nombre natural ("Bogotá", "Cali", etc.)  
**Lo que se guarda en BD:** el código del nudo vial SISETAC que corresponde a esa ciudad.

| Campo visible en UI | Campo guardado en BD | Ejemplo |
|--------------------|---------------------|--------|
| Input: "Bogotá" | `origen` = "Bogotá D.C." | Nudo SISETAC |
| Input: "Cali" | `destino` = "Cali" | Nudo SISETAC |
| (invisible) | `distanciaKm` = 461 | Calculado después |
| (invisible) | `kmPlano` = 92, `kmOndulado` = 138, `kmMontañoso` = 231 | De tabla de corredor |

> No hay que tradeoff entre UX y alineación con el Ministerio: el usuario elige ciudad con nombre normal, y la BD guarda el código correcto. Son la misma ciudad — solo hay que mapear la lista de ciudades a los nudos del SISETAC al momento de construir el autocomplete.

---

## 8. Modelo de datos propuesto (campos nuevos + mappings)

### 8.1. Cambios en el modelo `Solicitud`

#### Campos a MODIFICAR

| Campo actual | Tipo actual | Propuesta | Justificación |
|-------------|-------------|-----------|---------------|
| `tipoCarga` (enum: MERCANCIA_EMPRESARIAL, MAQUINARIA, MUEBLES_EMBALADOS) | `TipoCarga` | Cambiar enum a: `CARGA_GENERAL`, `REFRIGERADA`, `CONTENEDOR`, `GRANEL_SOLIDO`, `GRANEL_LIQUIDO` | Alinear directamente con SISETAC. No hay homologación posterior. |
| `valorAsegurado` | `Decimal` | Renombrar a `valorMercancia` | Claridad: este es el valor de la carga (seguro de carga), no el seguro del vehículo |

#### Campos a AGREGAR

| Campo nuevo | Tipo | Nullable | Descripción | Fuente |
|------------|------|:--------:|-------------|--------|
| `categoriaPeso` | Enum: PEQUENA, MEDIANA, GRANDE, PESADA | No | Categoría del peso elegida por el usuario en el wizard | Usuario |
| `configVehiculo` | Enum: C2, C3, C2S2, C2S3, C3S2, C3S3 | ✅ (invisible para usuario) | Configuración vehicular SISETAC inferida automáticamente | Sistema — no se pregunta al usuario |
| `distanciaKm` | Decimal | ✅ | Distancia real de la ruta en km | Tabla corredores o API |
| `kmPlano` | Decimal | ✅ | Kilómetros en terreno plano | Tabla corredores o distribución por región |
| `kmOndulado` | Decimal | ✅ | Kilómetros en terreno ondulado | Ídem |
| `kmMontañoso` | Decimal | ✅ | Kilómetros en terreno montañoso | Ídem |

#### Campos a MANTENER sin cambios

`empresa`, `contacto`, `email`, `telefono`, `pesoKg`, `dimLargoCm`, `dimAnchoCm`, `dimAltoCm`, `condicionesCargue`, `fechaRequerida`, `estado`, `revisionEspecial`

---

### 8.2. Nuevo enum `TipoCarroceria` (reemplaza `TipoCarga`) (reemplaza `TipoCarga`)

```prisma
enum TipoCarroceria {
  CARGA_GENERAL   @map("carga_general")   // Mercancía, maquinaria, muebles embalados, materiales secos → C2/C3
  REFRIGERADA     @map("refrigerada")     // Cadena de frío (alimentos, farma, flores) → C2/C3/C2S2
  CONTENEDOR      @map("contenedor")      // Contenedor ISO 20'/40' — siempre C2S2 o mayor
  GRANEL_SOLIDO   @map("granel_solido")   // Arena, carbón, granos, escombros → C3/C3S2/C3S3
  GRANEL_LIQUIDO  @map("granel_liquido")  // Combustibles, aceites, químicos, asfalto → C2S2/C3S3
}
```

```prisma
enum ConfigVehiculo {
  C2    @map("c2")
  C3    @map("c3")
  C2S2  @map("c2s2")
  C2S3  @map("c2s3")
  C3S2  @map("c3s2")
  C3S3  @map("c3s3")
}
```

---

### 8.3. Nuevo enum `CategoriaPeso` (nuevo campo)

```prisma
enum CategoriaPeso {
  PEQUENA  @map("pequena")   // hasta 3.5 ton → C2
  MEDIANA  @map("mediana")  // 3.5 t – 10 t → C3
  GRANDE   @map("grande")   // 10 t – 20 t → C2S3
  PESADA   @map("pesada")   // > 20 t → C3S3
}
```

---

### 8.4. Script de migración de datos existentes

```sql
-- Migración de tipoCarga al nuevo enum tipoCarroceria
UPDATE solicitudes SET tipo_carroceria = 'carga_general'
WHERE tipo_carga IN ('mercancia_empresarial', 'maquinaria', 'muebles_embalados');
```

---

## 9. Flujo de inferencias automáticas

Estos valores **NO se preguntan al usuario**. El sistema los calcula o deduce:

| Dato SISETAC | Cómo se infiere | Fuente de datos |
|-------------|----------------|----------------|
| `configVehiculo` | `categoriaPeso` → lookup: PEQUENA=C2, MEDIANA=C3, GRANDE=C2S3, PESADA=C3S3 | Regla interna — **nunca se muestra al usuario** |
| `distanciaKm` | 1º: tabla `corredores` por origen+destino. 2º: Google Maps API | Ver §7 |
| `kmPlano`, `kmOndulado`, `kmMontañoso` | Tabla `corredores` pre-cargada. Si no existe: distribución por región | Ver §7 |
| `acpm_price` del mes | Tabla `monthly_params` por mes de `fechaRequerida` | Admin actualiza mensualmente |
| `smlmv` vigente | Tabla `annual_params` por año de `fechaRequerida` | Admin actualiza anualmente |
| `N_viajes_mes` | `288 / (distancia_km / velocidad_promedio × 2)` | Calculado en motor |
| Velocidad promedio | Tabla SISETAC por `configVehiculo` × terreno dominante | Tabla §4.1 de DEFINICION_COTIZADOR_SISETAC.md |

---

## 10. Flujo de preguntas propuesto (nuevo orden)

Con base en el análisis, el flujo optimizado quedaría así. **Menos pasos, experiencia fluida, datos alineados con SISETAC sin que el usuario lo sepa:**

| Paso | Pregunta al usuario | Campo(s) guardado(s) | Código SISETAC (interno) | Obligatorio |
|:----:|---------------------|---------------------|:------------------------:|:-----------:|
| 1 | _"¿El envío es dentro de la ciudad o entre ciudades?"_ — 2 botones: 🏙️ En la ciudad / 🌍 Entre ciudades | `tipoServicio` | `URBANA` / `NACIONAL` | ✅ |
| 2 | _"¿Desde qué ciudad sale la carga?"_ — autocomplete lista nudos | `origen` | Nudo vial SISETAC | ✅ |
| 3 | _"¿A qué ciudad va?"_ — autocomplete (solo si entre ciudades) | `destino` | Nudo vial SISETAC | Condicional |
| 4 | _"¿Qué tipo de carga es?"_ — 5 botones con icono | `tipoCarroceria` | `CARGA_GENERAL` / `REFRIGERADA` / `CONTENEDOR` / `GRANEL_SOLIDO` / `GRANEL_LIQUIDO` | ✅ |
| 5 | _"¿Cuánta carga vas a mover?"_ — 4 botones: 🚐 Pequeña / 🚛 Mediana / 🚚 Grande / 🚜 Pesada | `categoriaPeso` + `pesoKg` (valor tope rango) | → infiere `configVehiculo` (C2/C3/C2S3/C3S3) | ✅ |
| 6 | _"¿Para qué fecha necesitas el servicio?"_ — date picker | `fechaRequerida` | Mes para ACPM / SMLMV | ✅ |
| 7 | _"¿Cuál es el valor de la mercancía?"_ (para el seguro) | `valorMercancia` | — | ✅ |
| 8 | _"¿Con qué facilidades de cargue cuentas?"_ *(opcional, puedes saltar)* | `condicionesCargue` | — | ❌ Opcional |
| 9 | _"¿Conoces las dimensiones del bulto más grande?"_ *(opcional)* | `dimLargoCm`, `dimAnchoCm`, `dimAltoCm` | Validación volumétrica | ❌ Opcional |
| 10 | Bloque de contacto: Empresa / Nombre / Email / WhatsApp — UN solo paso | `empresa`, `contacto`, `email`, `telefono` | — | ✅ |

**Resultado: 10 pasos (6 obligatorios sobre la carga/ruta + 1 de fecha + 1 de valor + 2 opcionales + 1 bloque de contacto)**

### Lo que ocurre automáticamente (invisible para el usuario)

```
Paso 2+3 completados → Sistema resuelve distanciaKm, kmPlano/Ondulado/Montañoso
                        [tabla corredores → fallback API Google Maps]

Paso 4+5 completados → Sistema asigna configVehiculo
                        [tipoCarroceria + categoriaPeso → lookup C2/C3/C2S3/C3S3]

Paso 6 completado    → Sistema carga acpm_price y smlmv del mes/año
                        [tabla monthly_params + annual_params]

Formulario enviado   → Motor calcula CF + CV + OC = Flete referencia
                        [resultado va al operador, no se muestra automáticamente al usuario en v1]
```

---

## Resumen ejecutivo de cambios requeridos

| Área | Acción | Prioridad |
|------|--------|:---------:|
| **Enum `TipoCarga`** | Reemplazar por `TipoCarroceria` con valores SISETAC (CARGA_GENERAL / REFRIGERADA / CONTENEDOR / GRANEL_SOLIDO / GRANEL_LIQUIDO) | 🔴 Alta |
| **Peso: de input libre a categorías** | Reemplazar campo numérico libre por 4 botones de rango. Guardar `categoriaPeso` + `pesoKg` (valor representativo). Inferir `configVehiculo` internamente. | 🔴 Alta — impacta UX y cálculo |
| **Eliminar paso de confirmación de vehículo** | El usuario NUNCA ve ni confirma C2/C3/etc. Es dato interno. | 🔴 Alta — simplifica el flujo |
| **Resolver distancia automáticamente** | Tabla de corredores pre-cargada + fallback Google Maps API. Ver §7. | 🔴 Alta — sin distancia no hay cálculo |
| **Origen/Destino: alinear con nudos SISETAC** | Autocomplete que muestra nombres naturales pero guarda código de nudo SISETAC | 🔴 Alta — evita homologación futura |
| **Agregar `categoriaPeso`** | Nuevo campo enum en BD | 🟡 Media |
| **Agregar `configVehiculo`** | Nullable, lo infiere el sistema. Nunca se muestra al usuario. | 🟡 Media |
| **Agregar campos de ruta** | `distanciaKm`, `kmPlano`, `kmOndulado`, `kmMontañoso` (nullable) | 🟡 Media |
| **Renombrar `valorAsegurado`** | → `valorMercancia` (claridad: es el valor de la mercancía, no el seguro vehicular) | 🟡 Media |
| **Agrupar bloque de contacto** | Empresa + Contacto + Email + Teléfono en UN solo paso al final | 🟢 Baja — mejora UX |
| **Condiciones de cargue** | Mover al final, marcar opcional | 🟢 Baja |
| **Dimensiones** | Marcar opcional, sacar del flujo obligatorio | 🟢 Baja |

---

*Documento parte de la carpeta `definicion-FuncionalyTecnica/`. Complementa [DEFINICION_COTIZADOR_SISETAC.md](DEFINICION_COTIZADOR_SISETAC.md) y [DEFINICION_FUNCIONAL.md](DEFINICION_FUNCIONAL.md).*
