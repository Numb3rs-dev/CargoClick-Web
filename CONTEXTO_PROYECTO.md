# CONTEXTO COMPLETO DEL PROYECTO — CargoClick Web

> **Documento generado:** 4 de marzo de 2026
> **Propósito:** Dar contexto completo a un nuevo chat/sesión de desarrollo para continuar el trabajo.

---

## 1. ¿Qué es CargoClick?

**CargoClick** es una plataforma web B2B de transporte de carga terrestre en Colombia. Es el sistema operativo de **Nuevo Mundo Logística**, una empresa de transporte real que necesita:

1. **Cotizar** fletes de carga terrestre (urbano y nacional)
2. **Gestionar** toda la operación logística (remesas, manifiestos, conductores, vehículos, clientes)
3. **Reportar al RNDC** — el sistema obligatorio del Ministerio de Transporte de Colombia donde TODA operación de carga debe quedar registrada

La empresa ya tiene datos históricos reales en el RNDC y archivos Excel del Ministerio con su información maestra (vehículos, conductores, terceros/clientes).

---

## 2. Stack Técnico

| Componente | Tecnología |
|---|---|
| **Framework** | Next.js 15 (App Router) + React 19 |
| **Lenguaje** | TypeScript |
| **ORM** | Prisma 5 |
| **Base de datos** | PostgreSQL 16 (Docker local) |
| **Auth** | Clerk |
| **UI** | Tailwind CSS 4 + Radix UI + MUI (algunos componentes) |
| **Email** | Resend |
| **Deploy** | Railway (producción) |
| **Arquitectura** | Clean Architecture: Repositories → Services → API Routes → UI Components |

### Conexión a BD local
```
Host: localhost
Puerto: 5432
Usuario: postgres
Contraseña: postgres
Base de datos: cargoclick_web_db
Container Docker: cargoclick-postgres (postgres:16-alpine)
```

---

## 3. Estructura del Proyecto

```
CargoClick-Web/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (REST endpoints)
│   │   ├── conductores/          # CRUD + sync RNDC
│   │   ├── vehiculos/            # CRUD + sync RNDC
│   │   ├── clientes/             # CRUD + export CSV
│   │   ├── remesas/              # CRUD + envío RNDC
│   │   ├── manifiestos/          # CRUD + envío RNDC
│   │   ├── negocios/             # Gestión negocio operacional
│   │   ├── ordenes-cargue/       # Órdenes de cargue
│   │   ├── rndc/                 # Endpoints directos RNDC
│   │   ├── cotizar/              # Motor de cotización
│   │   ├── solicitudes/          # Solicitudes de transporte
│   │   └── ...
│   ├── operacional/              # UI módulo operacional (server components)
│   │   ├── conductores/          # Lista y detalle conductores
│   │   ├── vehiculos/            # Lista y detalle vehículos
│   │   ├── clientes/             # Lista y detalle clientes
│   │   ├── remesas/              # Gestión remesas
│   │   ├── manifiestos/          # Gestión manifiestos
│   │   ├── negocios/             # Gestión negocios
│   │   └── ordenes-cargue/       # Órdenes de cargue
│   ├── cotizar/                  # Wizard conversacional de cotización
│   ├── home/                     # Landing pública
│   ├── brochure/                 # Brochure descargable
│   └── ...
├── components/
│   ├── operacional/              # Componentes del módulo operacional
│   │   ├── directorio/           # ConductorList, VehiculoList, Cards, Detalles
│   │   ├── clientes/             # ClienteList, ClienteForm
│   │   ├── remesas/              # Componentes de remesas
│   │   ├── manifiestos/          # Componentes de manifiestos
│   │   ├── negocios/             # Componentes de negocios
│   │   └── shared/               # ListUtils, Btn, Pagination (reutilizables)
│   ├── home/                     # Secciones del landing
│   ├── layout/                   # Header, Footer, Nav
│   └── ui/                       # Primitivos UI (Badge, Button, etc.)
├── lib/
│   ├── db/prisma.ts              # Singleton Prisma Client
│   ├── repositories/             # Capa de acceso a datos (findAll, findById, create, update)
│   ├── services/                 # Lógica de negocio
│   │   ├── rndcClient.ts         # Cliente SOAP para el RNDC (ISO-8859-1)
│   │   ├── rndcXmlBuilder.ts     # Constructores XML por procesoid
│   │   ├── rndcEngine.ts         # Motor cotización histórico con datos RNDC
│   │   ├── cotizadorEngine.ts    # Motor principal de cotización (SISETAC + RNDC)
│   │   ├── remesaService.ts      # Lógica de remesas
│   │   ├── manifiestoService.ts  # Lógica de manifiestos
│   │   └── ...
│   ├── utils/
│   │   └── serialize.ts          # Convierte Prisma Decimal→number para Server→Client Components
│   ├── validations/              # Schemas Zod
│   └── theme/colors.ts           # Tokens de colores del diseño
├── prisma/
│   ├── schema.prisma             # 1370 líneas, 21 modelos
│   ├── seed.ts                   # Seed de datos base
│   └── migrations/               # Migraciones (actualmente se usa db push)
├── scripts/                      # Scripts organizados por propósito
│   ├── importar/                 # Scripts de importación de datos
│   │   ├── importar-terceros.js  # Conductores + Clientes + Sucursales desde XLS
│   │   ├── importar-rndc-completo.js # Manifiestos + Remesas + Vehículos históricos
│   │   ├── importar-rndc.js      # Importación de datos RNDC
│   │   ├── backfill-campos-rndc.js   # Backfill de campos RNDC faltantes
│   │   └── poblar-fecha-ingreso-rndc.js # Poblar fechas de ingreso
│   ├── geo/                      # Geocodificación y distancias
│   │   ├── geocodificar-municipios.js  # Geocodifica municipios con Nominatim
│   │   └── calcular-distancias-osrm.js # Distancias OSRM
│   ├── utilidades/               # Scripts de utilidad general
│   │   ├── extract-ministerio-pdfs.js  # Extrae texto de PDFs del Ministerio
│   │   ├── extract-ministerio-excel.js # Extrae datos de Excel del Ministerio
│   │   └── ...
│   └── _temp/                    # Scripts temporales de un solo uso
├── docs/                         # Toda la documentación del proyecto
│   ├── proyecto/                 # Definiciones funcionales y técnicas
│   │   ├── DEFINICION_FUNCIONAL.md
│   │   ├── DEFINICION_TECNICA.md
│   │   └── ...
│   ├── cotizador/                # Especificaciones del motor de cotización
│   ├── rndc/                     # Documentación RNDC
│   │   ├── mapping/              # CSVs de mapping campo a campo (formato unificado)
│   │   │   ├── mapping-conductores.csv   # 31 campos: XLS→BD→XML→UI
│   │   │   ├── mapping-clientes.csv      # 36 campos: clientes + sucursales
│   │   │   └── mapping-remesas.csv       # 90 campos: remesa completa
│   │   ├── CONEXION_MINISTERIO_TRANSPORTE.md
│   │   └── ...
│   ├── seo/                      # Estrategia SEO
│   ├── estado/                   # Documentos de estado de implementación
│   ├── prompts/                  # Prompts de desarrollo (backend, frontend, home, operacional)
│   ├── ai-modes/                 # Modos de personalidad para IA
│   └── postman/                  # Colección + guías de testing API
├── data/                         # Datos fuente del Ministerio de Transporte
│   ├── maestros-rndc/            # 24+ archivos XLS maestros (Tercero, Vehículo, etc.)
│   ├── historicos-rndc/          # Datos históricos (Manifiestos, Remesas)
│   ├── ministerio/               # Guías, manuales y formatos oficiales
│   │   ├── guias/                # Guías de uso del web service (PDF + TXT)
│   │   ├── manuales/             # Manuales SICETAC y otros
│   │   └── formatos/             # Formatos oficiales (XLSX)
│   └── referencias/              # Documentos de referencia RNDC
├── public/assets/                # Imágenes del proyecto
└── docker-compose.yml            # PostgreSQL 16
```

---

## 4. Modelo de Datos (21 modelos Prisma)

### Entidades principales y sus relaciones:

```
Solicitud → Cotizacion → NuevoNegocio → Remesa(s) → ManifiestoOperativo
                                              ↕              ↕
                                        Cliente          Conductor
                                    SucursalCliente      Vehiculo
                                                        OrdenCargue
```

### Modelos completos:

| Modelo | Tabla | Descripción |
|---|---|---|
| `Solicitud` | solicitudes | Solicitud de transporte del cliente (formulario web) |
| `Cotizacion` | cotizaciones | Resultado del motor de cotización |
| `AjusteComercial` | ajustes_comerciales | Ajustes manuales sobre cotización |
| `NuevoNegocio` | negocios | Negocio cerrado, agrupa remesas |
| `Remesa` | remesas | Documento de carga (se envía al RNDC procesoid 3) |
| `ManifiestoOperativo` | manifiestos_operativos | Manifiesto de carga (se envía al RNDC procesoid 4) |
| `ManifiestoRndc` | manifiestos_rndc | Datos históricos de manifiestos importados |
| `Conductor` | conductores | Conductor de vehículo (procesoid 11 en RNDC) |
| `Vehiculo` | vehiculos | Vehículo de carga (procesoid 12 en RNDC) |
| `Cliente` | clientes | Remitente/destinatario (procesoid 11 en RNDC) |
| `SucursalCliente` | sucursales_clientes | Sedes/sucursales de un cliente |
| `OrdenCargue` | ordenes_cargue | Orden de cargue pre-despacho |
| `Distancia` | distancias | Distancias entre municipios (OSRM) |
| `MonthlyParams` | monthly_params | Parámetros mensuales cotizador |
| `VehicleParams` | vehicle_params | Parámetros por tipo vehículo |
| `RouteTerrain` | route_terrains | Terreno por ruta para cotización |
| `CommercialParams` | commercial_params | Parámetros comerciales |
| `ConsultaRunt` | consultas_runt | Cache de consultas al RUNT |
| `SeguimientoCliente` | seguimientos_cliente | Hitos de seguimiento (notificaciones) |
| `EncuestaPostEntrega` | encuestas_post_entrega | Encuesta NPS post-entrega |
| `SyncRndc` | sync_rndc | **Audit log inmutable** de cada llamada SOAP al RNDC |

### Enums importantes:
- `EstadoRndcRemesa`: PENDIENTE → ENVIADA → REGISTRADA → ANULADA
- `EstadoManifiesto`: BORRADOR → ENVIADO → REGISTRADO → ACEPTADO_CONDUCTOR → CULMINADO → ANULADO
- `EstadoNegocio`: CONFIRMADO → EN_PREPARACION → EN_TRANSITO → COMPLETADO → CANCELADO
- `CategoriaLicencia`: A1, A2, B1, B2, B3, C1, C2, C3
- `TipoCarga`: CARGA_GENERAL, REFRIGERADA, CONTENEDOR, GRANEL_SOLIDO, GRANEL_LIQUIDO

---

## 5. El RNDC — Registro Nacional Despachos de Carga

El RNDC es el sistema del **Ministerio de Transporte de Colombia** donde TODA operación de transporte de carga debe reportarse. Es un webservice SOAP con XML en codificación **ISO-8859-1**.

### Procesoids del RNDC (los que maneja CargoClick):
| procesoid | Operación | Estado |
|---|---|---|
| 3 | Registrar Remesa | Implementado |
| 4 | Registrar Manifiesto | Implementado |
| 5 | Cumplir Remesa | Implementado |
| 6 | Cumplir Manifiesto | Implementado |
| 11 | Registrar Tercero (Conductor/Cliente) | Implementado |
| 12 | Registrar Vehículo | Implementado |
| 32 | Anular Manifiesto | Implementado |

### Archivos del Ministerio disponibles (carpeta `data/`):
- **`data/maestros-rndc/`** — 24+ archivos XLS maestros: `Maestro_Tercero_RNDC.xls`, `Maestro_Vehículo_RNDC.xls`, etc.
- **`data/historicos-rndc/`** — Datos históricos: `Manifiestos_RNDC (5).xls`, `Remesas_RNDC (4).xls`, `ManifiestosSiceTac_RNDC.xls`
- **`data/ministerio/guias/`** — Guías oficiales: Uso del Web Service, SICETAC, Remesas, Manifiestos, etc. (PDF + TXT)
- **`data/ministerio/manuales/`** — Manuales SICETAC y otros
- **`data/ministerio/formatos/`** — FORMATO REMESA, FORMATO MANIFIESTO DE CARGA (XLSX)
- **`data/referencias/`** — Documentos de referencia RNDC

### Integración SOAP implementada:
- `lib/services/rndcClient.ts` — Cliente SOAP con encoding ISO-8859-1, retry, audit log en SyncRndc
- `lib/services/rndcXmlBuilder.ts` — Constructores XML con sanitización para cada procesoid
- `app/api/conductores/[id]/sync-rndc/` — Endpoint para sincronizar conductor con RNDC
- `app/api/vehiculos/[id]/sync-rndc/` — Endpoint para sincronizar vehículo con RNDC
- `components/operacional/directorio/SyncRndcButton.tsx` — Botón de sincronización con feedback

---

## 6. Datos Importados del Ministerio

### Importación de Terceros (script: `scripts/importar/importar-terceros.js`)
Se importaron TODOS los campos del Maestro_Tercero_RNDC.xls:
- **Regla de separación**: `NUMLICENCIACONDUCCION > 0` → Conductor, `== 0` → Cliente
- **Conductores**: 2,071 registros (sede principal, codSede="0")
- **Clientes**: 2,692 registros
- **Sucursales**: 7,519 registros (768 errores = sedes de conductores, ignoradas por diseño)
- **sincronizadoRndc**: `true` en todos los importados (la data viene del RNDC)

### Importación de Vehículos (script: `scripts/importar/importar-rndc-completo.js`)
Se importaron vehículos del Maestro_Vehículo_RNDC.xls con todos los campos RNDC.

### Importación de Manifiestos/Remesas históricas
Se importaron manifiestos y remesas históricas para alimentar el motor de cotización RNDC.

### Filosofía de importación
> **"Migrar todo y ya después vemos si aplica o no"**
> No se descarta ningún campo del maestro. Todo se almacena en BD. Las decisiones de qué mostrar en UI se toman después.

---

## 7. Mapping de Campos (CSVs de Referencia)

Existen dos CSVs maestros con el mapeo completo campo a campo:

**Formato unificado (8 columnas)**: `Seccion;Dato;Fuente RNDC (XLS);Sistema (BD campo);XML RNDC (tag);UI (componente);Estado;Notas`

- `docs/rndc/mapping/mapping-conductores.csv` — 31 campos mapeados
- `docs/rndc/mapping/mapping-clientes.csv` — 36 campos (clientes + sucursales)
- `docs/rndc/mapping/mapping-remesas.csv` — 90 campos (remesa completa procesoid 3)

### Campos nuevos agregados a Conductor (12 campos):
`codTipoId`, `tipoIdTexto`, `numLicencia`, `codSede`, `nomSede`, `regimenSimple`, `codPais`, `nombrePais`, `nitEmpresaTransporte`, `codigoEmpresaRndc`, `nombreEmpresaRndc`, `fechaIngresoRndc`, `usuarioRndc`, `sincronizadoRndc`

### Campos nuevos agregados a Cliente (15 campos):
`tipoIdTexto`, `nombres`, `primerApellido`, `segundoApellido`, `categoriaLicencia`, `numLicencia`, `fechaVencimientoLicencia`, `codPais`, `nombrePais`, `nitEmpresaTransporte`, `codigoEmpresaRndc`, `nombreEmpresaRndc`, `fechaIngresoRndc`, `usuarioRndc`, `sincronizadoRndc`

---

## 8. Estados RNDC en la UI

Los registros en el sistema muestran su estado de sincronización con el RNDC:

| Estado | Badge | Color | Significado |
|---|---|---|---|
| **Borrador** | `✏️ Borrador` | Amber (#FEF3C7 / #92400E) | Creado localmente, NO enviado al RNDC |
| **Registrado** | `✅ Registrado` | Verde | Confirmado en RNDC (importado del maestro o API exitosa) |
| **Error RNDC** | `❌ Error RNDC` | Rojo | Se intentó enviar pero el RNDC rechazó |

### Lógica de resolución del estado:
1. Si existe un registro en `SyncRndc` (audit log) → usa `exitoso` de ese registro
2. Si NO hay SyncRndc pero `sincronizadoRndc: true` → "Registrado" (dato importado del maestro)
3. Si NO hay nada → "Borrador"

### Componentes que usan este patrón:
- `ConductorList.tsx`, `ConductorCard.tsx`, `ConductorDetalle.tsx`
- `VehiculoList.tsx`, `VehiculoCard.tsx`, `VehiculoDetalle.tsx`
- `SyncRndcButton.tsx`

---

## 9. Motor de Cotización

El sistema tiene un motor dual de cotización:

### Motor SISETAC
Basado en parámetros del Sistema de Información del Servicio de Transporte Automotor de Carga. Usa tablas de parámetros (`MonthlyParams`, `VehicleParams`, `RouteTerrain`, `CommercialParams`) y la tabla `Distancia` con distancias OSRM entre municipios.

### Motor Histórico RNDC (`rndcEngine.ts`)
Consulta manifiestos históricos reales (`ManifiestoRndc`) para encontrar viajes similares en la misma ruta, con estadísticas (mediana, promedio, percentiles, confianza).

### Flujo:
`Solicitud` → Motor de cotización (SISETAC + RNDC) → `Cotización` → Ajuste comercial opcional → `NuevoNegocio`

---

## 10. Issues Conocidos / Deuda Técnica

### Pendiente de resolver:
1. **Conductor `apellidos` concatenado** — El modelo Conductor tiene un solo campo `apellidos` que concatena primer + segundo apellido. Esto impide reconstruir los campos XML `<PRIMERAPELLIDOIDTERCERO>` y `<SEGUNDOAPELLIDOIDTERCERO>` por separado. Se necesita separar en `primerApellido` + `segundoApellido` como ya se hizo en Cliente.

2. **Personas con doble rol** — Una persona puede ser conductor Y remitente/destinatario al tiempo. Actualmente se importan como entidades separadas (una en `conductores`, otra en `clientes`).

3. **Migraciones formales** — Se ha usado `prisma db push` para todos los cambios de schema. No hay migraciones Prisma formales (`prisma migrate dev`).

4. **Campos FALTA UI** — Varios campos importados aún no tienen componente de UI (ver columna Estado en los CSVs de mapping).

---

## 11. Git & Branches

| Branch | Descripción |
|---|---|
| `main` | Producción (Railway) |
| `develop` | Desarrollo principal |
| `conexion-ministerio-de-transporte` | **Branch actual** — trabajo de importación de maestros RNDC, mapping de campos, integración SOAP |

### Commits recientes (branch actual):
```
f4cc9d7 wip: modulo operacional en progreso - conexion ministerio transporte
943feaf feat: modulo operacional - docs, modo AI, deps RNDC y setup de ambientes
f4ff3f3 feat: carrusel linkedin 01 - quienes somos alianza cargoclick
```

---

## 12. Cómo Levantar el Proyecto

```bash
# 1. Base de datos
docker-compose up -d

# 2. Instalar deps
npm install

# 3. Generar Prisma Client
npx prisma generate

# 4. Sincronizar schema con BD
npx prisma db push

# 5. Importar datos del Ministerio (si la BD está vacía)
node scripts/importar/importar-terceros.js          # Conductores + Clientes + Sucursales
node scripts/importar/importar-rndc-completo.js     # Vehículos + Manifiestos + Remesas históricas

# 6. Dev server
npm run dev                                # http://localhost:3000
```

---

## 13. Variables de Entorno Clave

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cargoclick_web_db"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
RNDC_WSDL_URL=...          # URL del webservice RNDC
RNDC_USUARIO=...            # Usuario asignado por el Ministerio
RNDC_CLAVE=...              # Contraseña RNDC (NUNCA se loguea)
RNDC_NIT_EMPRESA=...        # NIT de Nuevo Mundo Logística
```

---

## 14. Tabla `SyncRndc` — Audit Log RNDC

Es una tabla **append-only** (nunca UPDATE ni DELETE) que registra cada llamada SOAP al RNDC:

```
SyncRndc:
  id, sessionId, processId, tipoSolicitud, entidadTipo, entidadId,
  requestXml (contraseña enmascarada), responseXml, httpStatus,
  exitoso, ingresoidRespuesta, errorMensaje, duracionMs, createdAt
```

---

## 15. Próximos Pasos Sugeridos

- Separar `apellidos` del Conductor en `primerApellido` + `segundoApellido`
- Completar los campos "FALTA UI" en los formularios de conductor y cliente
- Crear migraciones Prisma formales
- Implementar el flujo completo: Negocio → Remesa → Manifiesto con envío al RNDC
- Testing de integración con el webservice RNDC en ambiente de pruebas del Ministerio
