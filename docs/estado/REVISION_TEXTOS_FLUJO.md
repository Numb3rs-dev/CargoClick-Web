# Revisión de Textos — CargoClick

Documento para revisar todos los textos visibles al usuario, organizados por sección.
Marca con ✅ los que están bien o propón el cambio junto a cada uno.

---

## 1. HEADER Y NAVEGACIÓN

### Logotipo / Marca
| Elemento | Texto actual |
|---|---|
| Aria-label del logo | `CargoClick – Ir al inicio` |
| Alt del logo | `CargoClick` |

### Links de navegación (NavLinks)
| # | Texto | Destino |
|---|---|---|
| 1 | `Inicio` | `/home` |
| 2 | `Cotizaciones` | `/cotizaciones` |
| 3 | `Servicios` | `#servicios` |
| 4 | `Nosotros` | `#nosotros` |

### Botón CTA (desktop, cuando NO está logueado)
> **`Solicitar Cotización`** → `/cotizar`

### Botón hamburguesa mobile
> Aria-label: `Abrir menú de navegación`

### Drawer mobile
> Aria-label del dialog: `Menú de navegación`

---

## 2. HOME PAGE

### 2.1 Hero Section

| Elemento | Texto actual |
|---|---|
| Eyebrow | `Logística B2B` |
| Título línea 1 | `Soluciones Logísticas` |
| Título línea 2 | `con ` + **`Visión Digital`** (verde) |
| Subtítulo | `CargoClick integra experiencia operativa en transporte de carga con una gestión más organizada y eficiente.` |
| Botón CTA | `Solicitar Servicio` → `/cotizar` |
| Alt imagen camión | `Camión de carga CargoClick en operación logística` |

---

### 2.2 Respaldo Section

| Elemento | Texto actual |
|---|---|
| Eyebrow (con líneas laterales) | `Operación respaldada por` |
| Alt del logo | `Transportes Nuevo Mundo S.A.S.` |

---

### 2.3 Fortaleza Dual Section

| Elemento | Texto actual |
|---|---|
| Título parte 1 | `Nuestra ` |
| Título parte 2 (negrita) | `Fortaleza: Operación ` |
| Título parte 3 (verde) | `+ Tecnología` |

#### Bloque Operación (azul)
| Elemento | Texto actual |
|---|---|
| Título del bloque | `Transportes Nuevo Mundo` |
| Bullet 1 | `+20 años en transporte de carga` |
| Bullet 2 | `Flota confiable a nivel nacional` |
| Bullet 3 | `Experiencia en operación de carga` |

#### Bloque Digital (verde)
| Elemento | Texto actual |
|---|---|
| Título del bloque | `CargoClick` |
| Bullet 1 | `Organización digital de servicios` |
| Bullet 2 | `Comunicación centralizada` |
| Bullet 3 | `Seguimiento más organizado` |

---

### 2.4 Cómo Funciona Section

| Elemento | Texto actual |
|---|---|
| Título | `¿Cómo Funciona?` |

#### Paso 1
| Elemento | Texto actual |
|---|---|
| Número | `01` |
| Título | `Solicitas el servicio` |
| Descripción | `Completa el formulario con los datos de tu operación.` |

#### Paso 2
| Elemento | Texto actual |
|---|---|
| Número | `02` |
| Título | `Coordinamos la operación` |
| Descripción | `Asignamos flota y planificamos el servicio.` |

#### Paso 3
| Elemento | Texto actual |
|---|---|
| Número | `03` |
| Título | `Ejecutamos y supervisamos` |
| Descripción | `Monitoreamos el servicio hasta su finalización.` |

---

## 3. FOOTER

| Elemento | Texto actual |
|---|---|
| Email | `info@cargoclick.com` |
| Teléfono | `+57 300 000 0000` ⚠️ *placeholder* |
| Ubicación | `Bogotá, Colombia` |
| Copyright | `© 2026 CargoClick. Todos los derechos reservados.` |

---

## 4. FLUJO DE COTIZACIÓN (`/cotizar`)

### 4.1 Pantalla de Bienvenida (LandingPage)

| Elemento | Texto actual |
|---|---|
| Título | `Solicitar Cotización` |
| Descripción | `Cuéntanos los detalles de tu carga y te enviamos una cotización con respaldo operativo nacional.` |
| Botón principal | `Comenzar` |
| Tag 1 | `⏱ 2-3 minutos` |
| Tag 2 | `✓ Guardado automático` |
| Tag 3 | `✓ Sin compromiso` |

---

### 4.2 Paso 0 — Datos del contacto

**Pregunta:**
> `👋 ¡Hola! ¿Cómo te llamas y cuál es tu número de celular?`

| Campo | Label | Placeholder |
|---|---|---|
| Nombre | `Tu nombre completo` | `Ej: María González` |
| Selector de país | `País` | — |
| Celular | `Celular` | *(varía por país, ej: `300 123 4567` para Colombia)* |

**Validación de número:** *(se muestra si hay error de longitud)*
> `{País} usa {N} dígitos (ingresaste {X})`

---

### 4.3 Paso 1 — Datos de empresa (opcionales)

**Pregunta:**
> `¿Tu envío va a nombre de una empresa? Agrega sus datos si quieres — puedes saltarte esto sin problema.`

| Campo | Label | Placeholder |
|---|---|---|
| Banner informativo | `Todo aquí es opcional.` + descripción | — |
| Empresa | `Nombre de la empresa` | `Ej: Transportes Andinos S.A.S.` |
| Correo | `Correo electrónico` | `ejemplo@empresa.com` |
| Teléfono | `Teléfono de la empresa` | `Ej: 601 123 4567` |

**Texto del banner:**
> `Todo aquí es opcional. Si no representas una empresa o prefieres no agregar estos datos ahora, simplemente continúa sin llenar nada.`

---

### 4.4 Paso 2 — Ruta

**Pregunta:**
> `Perfecto. ¿Desde qué ciudad sale el envío y hacia dónde va?`

| Campo | Descripción |
|---|---|
| Origen | Autocomplete de municipios DANE (color azul `primary`) |
| Destino | Autocomplete de municipios DANE (color verde `success`) |

---

### 4.5 Paso 3 — Tipo de carga

**Pregunta:**
> `¿Qué tipo de carga vas a transportar?`

#### Opción 1: Mercancía general
| Elemento | Texto |
|---|---|
| Label | `Mercancía general` |
| Subtexto | `Cajas, pallets, bultos, maquinaria, muebles, repuestos...` |
| Descripción | `Es la opción más común. Aplica cuando tu carga va empacada, embalada o en estibas y no necesita frío ni es un líquido o polvo a granel.` |
| Ejemplos | `Cajas de electrodomésticos, costales de papa, sacos de café, muebles embalados, maquinaria en estiba, materiales de construcción empacados, repuestos industriales, medicamentos sin nevera, ropa y calzado.` |
| Checklist | `Tu carga va en cajas, sacos, bolsas, estibas o embalada` / `No necesita temperatura controlada durante el viaje` / `No viaja dentro de un contenedor marítimo sellado` / `No es arena, carbón o material que se descarga directamente al suelo` |

#### Opción 2: Carga refrigerada
| Elemento | Texto |
|---|---|
| Label | `Carga refrigerada` |
| Subtexto | `Alimentos frescos, medicamentos, flores — necesita frío` |
| Descripción | `Aplica cuando tu carga se daña si no se mantiene fría durante el trayecto. El vehículo asignado es un furgón frigorífico con sistema de refrigeración.` |
| Ejemplos | `Carnes, lácteos, frutas y verduras frescas, mariscos, flores para exportación, vacunas e insulinas, helados y congelados, jugos y bebidas que deben ir en frío.` |
| Checklist | `Tu producto tiene fecha de vencimiento corta y se deteriora sin frío` / `Necesitas cadena de frío durante todo el transporte` / `No aplica si el producto ya está enlatado, deshidratado o empacado al vacío sin requerir frío` |

#### Opción 3: Contenedor
| Elemento | Texto |
|---|---|
| Label | `Contenedor` |
| Subtexto | `Contenedor sellado de importación o exportación (20'  / 40')` |
| Descripción | `Aplica cuando tu mercancía viaja dentro de un contenedor metálico estándar, el tipo que se usa en barcos y puertos. El camión transporta el contenedor completo.` |
| Ejemplos | `Importaciones que llegan al puerto en contenedor y hay que llevarlas al almacén, exportaciones que se llevan al puerto, cargas consolidadas con varios clientes, contenedor propio de 20 o 40 pies.` |
| Checklist | `Tu carga llegó o va a un puerto marítimo en contenedor` / `Tienes un contenedor ya asignado con número de booking` / `No aplica si tu carga va en un camión corriente aunque sea para exportar (eso es Mercancía general)` |

#### Opción 4: Granel sólido
| Elemento | Texto |
|---|---|
| Label | `Granel sólido` |
| Subtexto | `Arena, carbón, granos, escombros — material suelto sin empacar` |
| Descripción | `Aplica cuando el material no va empacado — se carga directamente en el platón, volco o tolva del camión y se descarga volcando o con banda.` |
| Ejemplos | `Arena, gravilla, recebo, tierra, piedra triturada, carbón suelto, escombros, granos de maíz o soya sin ensacar, sal, cemento a granel, cal.` |
| Checklist | `Tu material se vierte directamente al camión sin bolsa ni caja` / `Se descarga volcando el camión o con cintas transportadoras` / `Ojo: si tus granos van en costales o sacos, eso es Mercancía general, no granel sólido` |

#### Opción 5: Granel líquido
| Elemento | Texto |
|---|---|
| Label | `Granel líquido` |
| Subtexto | `Aceites, combustibles, químicos o líquidos en cisterna` |
| Descripción | `Aplica cuando transportas líquidos a granel, sin botella ni envase, directamente en el tanque de un camión cisterna.` |
| Ejemplos | `Combustibles (ACPM, gasolina), aceite de palma, aceites industriales, ácidos, solventes, asfalto líquido, agua potable a granel, leche cruda, jugo de fruta sin envasar.` |
| Checklist | `Tu líquido va en cisterna (tanque del camión), no en botella, garrafón ni envase` / `El líquido se bombea para cargar y descargar` / `Ojo: si tu producto va en bidones, garrafas o cajas, eso es Mercancía general` |

---

### 4.6 Paso 4 — Peso y Dimensiones

**Pregunta:**
> `Cuéntame sobre el tamaño de tu carga: ¿cuánto pesa y cuáles son sus dimensiones?`

| Campo | Label | Placeholder |
|---|---|---|
| Peso | `Peso (kg)` | `Ej: 1500` |
| Largo | `Largo (cm)` | `Ej: 120` |
| Ancho | `Ancho (cm)` | `Ej: 80` |
| Alto | `Alto (cm)` | `Ej: 100` |

**Tooltip dimensiones:**
> `Mide el espacio total que ocupa la carga: largo (la dimensión más larga), ancho y alto en centímetros.`

**Etiquetas de resultado (autocalculadas):**
- `Volumen: {X.XXX} m³`
- `Vehículo sugerido` *(chip con nombre del vehículo)*
- `Peso: {X} kg / {capacidad} kg`
- `Volumen: {X} m³ / {capacidad} m³`
- Chip: `Mínimo`

---

### 4.7 Paso 5 — Fecha del servicio

**Pregunta:**
> `¿Para qué fecha necesitas el servicio?`

*(Campo de date picker — sin texto adicional)*

---

### 4.8 Paso 6 — Confirmación y extras (último paso)

**Pregunta:**
> `¡Ya casi! ¿Quieres agregar algo más a tu solicitud?`

**Encabezado de éxito (inline):**
> `¡Solicitud recibida!` + chip `#COT-XXXXXXXX`
> `Un asesor se contactará contigo con la cotización.`

#### Observaciones
| Elemento | Texto |
|---|---|
| Subtítulo | `¿Alguna instrucción especial?` |
| Label campo | `Observaciones (opcional)` |
| Placeholder | `Ej: recogida solo en la mañana, acceso restringido por peso, manejo delicado...` |

#### Checklist de condiciones
| Subtítulo | `¿Aplica alguna de estas condiciones?` |
|---|---|
| Descripción | `Marca todo lo que aplique — ayuda al comercial a cotizar mejor.` |

| # | Ícono | Label | Sublabel | Detalle (si aplica) |
|---|---|---|---|---|
| 1 | ☢️ | `Carga peligrosa (HAZMAT)` | `Sustancias inflamables, corrosivas, tóxicas o explosivas` | Placeholder: `¿Qué tipo de material? (clase HAZMAT, número ONU si lo conoces)` |
| 2 | 🧗 | `Ayudante en el cargue` | `Necesitas personal para subir o cargar la mercancía` | — |
| 3 | 🧗 | `Ayudante en el descargue` | `Necesitas personal para bajar o descargar la mercancía` | — |
| 4 | 🥚 | `Carga frágil` | `Vidrio, cerámica, electrónicos, objetos delicados` | — |
| 5 | 📦 | `Necesita embalaje` | `La carga llega sin empacar y hay que prepararla antes del viaje` | — |
| 6 | 🗺️ | `Entrega en más de un punto` | `El camión necesita hacer varias paradas de descargue en el mismo viaje` | Placeholder: `¿Cuántas paradas? Indica las ciudades o direcciones aproximadas` |
| 7 | 🛡️ | `Requiere escolta de seguridad` | `Carga de alto valor: efectivo, joyería, electrónicos de alto costo` | — |
| 8 | 🚧 | `Acceso difícil en origen o destino` | `Vía sin pavimento, puente con límite de peso, portería con altura máxima` | Placeholder: `Describe la restricción: puente límite 5t, calle sin pavimento, portería baja...` |
| 9 | 🏗️ | `Carga sobredimensionada` | `Longitud o altura fuera de límites legales — puede requerir permiso INVIAS` | Placeholder: `Dimensiones aproximadas que exceden lo normal (largo × ancho × alto)` |

#### Botones finales
| Botón | Texto |
|---|---|
| Principal | `Enviar detalles` *(o `Guardando...` mientras carga)* |
| Secundario (skip) | `Listo, gracias — no necesito agregar nada` |

---

### 4.9 Pantalla de Completado (PantallaCompletada)

*(Se muestra después de que el usuario completa el flujo)*

| Elemento | Texto actual |
|---|---|
| Título | `¡Solicitud recibida!` |
| Chip de referencia | `#COT-XXXXXXXX` |
| Subtítulo "¿Qué sigue?" | `¿Qué sigue?` |
| Línea 1 | 📋 `Nuestro equipo ya tiene tu solicitud y la revisará en los próximos minutos.` |
| Línea 2 | 👤 `Un asesor se contactará contigo para enviarte la cotización.` |
| Línea 3 (si hay email) | ✉ `Cotización al correo {email}` |
| Línea 4 | 💬 `También podemos contactarte por WhatsApp al número que nos diste.` |
| Texto de referencia | `Guarda tu número de referencia #COT-XXXXXXXX para hacer seguimiento.` |
| Botón | `Cotizar otro envío` |

---

## 5. MENSAJES DE ERROR / VALIDACIÓN

| Campo | Mensaje |
|---|---|
| Nombre | `Mínimo 2 caracteres` |
| Celular | `Celular inválido. Ej: +573001234567 o 3001234567` |
| Correo empresa | `Correo inválido` |
| Origen | `Selecciona la ciudad de origen` |
| Destino | `Selecciona la ciudad de destino` |
| Tipo de carga | `Selecciona un tipo de carga` |
| Peso | `Ingresa el peso` / `Sin decimales` / `Debe ser mayor a 0` / `Máximo 34.999 kg` |
| Dimensiones | `Ingresa el largo/ancho/alto` / `Debe ser mayor a 0` |
| Fecha | `Selecciona una fecha` |
| Error de submit | `Error al guardar. Intenta nuevamente.` |

---

## 6. METADATA (SEO)

| Página | Title | Description |
|---|---|---|
| `/cotizar` | `Solicitar Cotización \| CargoClick` | `Solicita tu servicio de cargue con respaldo operativo nacional. Proceso rápido, 2-3 minutos.` |

---

*Generado: 24/02/2026 — Código fuente: `app/cotizar/config/pasos.ts`, `components/home/*.tsx`, `components/layout/*.tsx`, `app/cotizar/components/*.tsx`*
