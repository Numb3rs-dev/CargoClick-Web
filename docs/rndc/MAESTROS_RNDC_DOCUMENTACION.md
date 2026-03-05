# Maestros RNDC — Documentación Completa

> Análisis de los 23 archivos XLS del Ministerio de Transporte descargados del RNDC.
> Ruta: `data/maestros-rndc/`

---

## 1. Inventario de Maestros

| # | Archivo | Filas | Cols | Descripción | Relevancia CargoClick |
|---|---------|------:|-----:|-------------|----------------------|
| 1 | Capítulos Codificación Productos | 110 | 6 | Capítulos de productos (naturaleza: sólidos, líquidos, peligrosos, etc.) | **ALTA** — clasifica mercancía en Remesa |
| 2 | Codificación de Productos | 3,759 | 16 | Catálogo completo de mercancías RNDC (código 6 dígitos) | **ALTA** — campo `MERCANCIAREMESA` en Remesa |
| 3 | Códigos de Arancel | 18 | 11 | Subpartidas arancelarias para mercancías que lo requieren | MEDIA — solo cuando `NECESITASUBPARTIDA=S` |
| 4 | Combinación de Configuraciones | 66 | 15 | Vehículo + semiremolque → peso máximo/mínimo permitido | **ALTA** — validar peso vs config |
| 5 | Configuración Vehículos | 44 | 7 | Catálogo de configuraciones (camión 2 ejes, tractocamión 3 ejes, etc.) | **ALTA** — campo `CODCONFIGURACIONUNIDADCARGA` en Vehículo |
| 6 | Diccionario de Datos | 358 | 13 | Cada variable de cada procesoid, con tipo, tamaño, si es requerido, validación | **CRÍTICO** — valida XMLs antes de enviar |
| 7 | Diccionario de Errores | 1,294 | 8 | Código de error → mensaje → solución | **ALTA** — mapear errores SOAP a mensajes UX |
| 8 | División Política Administrativa | 9,487 | 14 | Municipios + zonas + departamentos + coordenadas | **ALTA** — campo `CODMUNICIPIORNDC` (8 dígitos) |
| 9 | Empaques | 32 | 13 | Tipos de empaque RNDC (paquetes, granel, contenedor, etc.) | **ALTA** — campo `CODTIPOEMPAQUE` en Remesa |
| 10 | Empresa Transportadora | 2 | 43 | Datos de Transportes Nuevo Mundo LTDA (NIT 8300685069, código 471) | REFERENCIA — datos propios |
| 11 | Empresas Aseguradoras | 58 | 3 | Catálogo de aseguradoras (NIT + nombre) | **ALTA** — campos de póliza en Remesa y Vehículo |
| 12 | Empresas Autorizadas por Generadores | 5 | 7 | Generadores que autorizaron a Nuevo Mundo | MEDIA — validar generador en Remesa |
| 13 | Generador | 6,808 | 18 | Directorio de generadores de carga registrados | **ALTA** — fuente de clientes potenciales |
| 14 | Líneas de Vehículos | 18,623 | 6 | Marca → Línea → Peso bruto | **ALTA** — campo `CODLINEAVEHICULOCARGA` |
| 15 | Marcas Semiremolques | 1,001 | 3 | Catálogo de marcas de semiremolques | MEDIA — solo tracto+semi |
| 16 | Marcas Vehículos | 1,026 | 3 | Catálogo de marcas de vehículos | **ALTA** — campo `CODMARCAVEHICULOCARGA` |
| 17 | Puesto de Control | 226 | 21 | Básculas y puestos de control en la red vial | BAJA — operativo carretero |
| 18 | ReteICA | 34 | 7 | Factores de retención ICA por municipio | MEDIA — cálculo de retención en manifiesto |
| 19 | SiceTAC Intervenido | 36 | 13 | Rutas con SICETAC intervenido (valor mínimo obligado) | MEDIA — validar tarifa manifiesto |
| 20 | Tercero | 10,485 | 27 | Directorio de terceros+sedes (remitentes, destinatarios, propietarios) | **CRÍTICO** — mapea a Cliente + SucursalCliente |
| 21 | Tipos de Carrocerías | 92 | 3 | Catálogo de tipos de carrocería (furgón, estacas, cisterna, etc.) | **ALTA** — campo `CODTIPOCARROCERIA` |
| 22 | Vehículo | 2,953 | 33 | Flota de vehículos asignada a Nuevo Mundo | **CRÍTICO** — mapea a modelo Vehiculo |

> **Nota:** `Maestro_Diccionario de Datos_RNDC (1).xls` es duplicado de `Maestro_Diccionario de Datos_RNDC.xls` (mismo contenido).
> `Maestro_RNA` (Registro Nacional Automotor, 50K filas) fue excluido — no necesario para operación.

---

## 2. Clasificación por Uso

### 2.1 CATÁLOGOS DE DICCIONARIO (tablas lookup — importar tal cual)

Datos estáticos que raramente cambian. Se usan para validar y poblar dropdowns.

| Maestro | Clave primaria | Campos clave | Uso en sistema |
|---------|---------------|-------------|---------------|
| **Configuración Vehículos** | `CODIGO` (int) | NOMBRE, DESCRIPCION, TIPO, PESOVACIOMINIMO, PESOVACIOMAXIMO | Dropdown selección config vehículo |
| **Combinación de Configuraciones** | `CODIGO + CODIGOSEMIR` | PESOMAXIMO, PESOMINIMO, NOMBRECORTOCONFIGURACION | Validar peso total vs config+semi |
| **Marcas Vehículos** | `CODIGO` (int) | DESCRIPCION | Dropdown marca vehículo |
| **Líneas de Vehículos** | `CODIGOMARCA + CODIGOLINEA` | DESCRIPCIONMARCA, DESCRIPCIONLINEA, PESOBRUTO | Dropdown línea (filtrado por marca) |
| **Marcas Semiremolques** | `CODIGO` (int) | DESCRIPCION | Dropdown marca semi |
| **Tipos de Carrocerías** | `CODIGOCARROCERIA` (int) | CARROCERIADESCRIPCION | Dropdown carrocería |
| **Empaques** | `CODIGO` (varchar) | DESCRIPCION, MERCANCIAPELIGROSA, TIPOEMPAQUE | Dropdown empaque en Remesa |
| **Codificación de Productos** | `CODIGO` (int) | CAPITULO, NOMBREYDESCRIPCION, MERCANCIAPELIGROSA, CLASEDIVISION | Buscador de mercancía en Remesa |
| **Capítulos Codificación** | `CODIGO` (varchar) | NATURALEZA, DESCRIPCION, CARGAEXTRAPESADA | Agrupar productos por capítulo |
| **Códigos de Arancel** | `CODIGOARANCEL` (int) | DESCRIPCION, MERCANCIAPELIGROSA | Subpartida cuando aplica |
| **Empresas Aseguradoras** | `NITASEGURADORA` | NOMBREASEGURADORA | Dropdown aseguradora en Remesa/Vehículo |
| **División Política Administrativa** | `CODIGODIVISION` (8 dígitos) | NOMBREMUNICIPIO, NOMBREDEPTO, LATITUD, LONGITUD | Resolver código municipio ↔ nombre |
| **ReteICA** | `CODIGOMUNICIPIO` | FACTORICA, VALORBASEMINIMO, FECHAS | Calcular retención ICA en manifiesto |
| **SiceTAC Intervenido** | `ORIGEN + DESTINO` | VALORTONELADASICETAC, FECHAS | Validar tarifa mínima |
| **Diccionario de Errores** | `DDECODIGOERROR` | DDEMENSAJEERROR, DDESOLUCION | Traducir errores SOAP a UX |

### 2.2 DATOS OPERATIVOS (entidades de negocio — importar y sincronizar)

Datos que cambian con operación diaria. Mapean directamente a modelos Prisma.

| Maestro | Filas | Modelo Prisma actual | Notas |
|---------|------:|---------------------|-------|
| **Tercero** | 10,485 | `Cliente` + `SucursalCliente` | Un NIT puede tener N sedes. Incluye conductores. |
| **Vehículo** | 2,953 | `Vehiculo` | Incluye propietario, tenedor, SOAT, config |
| **Generador** | 6,808 | *(no existe)* | Dueño de la carga. Ver sección 4. |
| **Empresa Transportadora** | 2 | *(hardcoded .env)* | Solo Nuevo Mundo LTDA |
| **Empresas Autorizadas** | 5 | *(no existe)* | Generadores que autorizaron a NM |

### 2.3 DICCIONARIO DE DATOS (metadato del protocolo RNDC)

| Maestro | Filas | Uso |
|---------|------:|-----|
| **Diccionario de Datos** | 358 | Cada variable de cada procesoid: tamaño, tipo, si es requerido, validación |

---

## 3. Estructura de Cada Maestro (Detalle de Campos)

### 3.1 Tercero (10,485 filas × 27 cols)

```
FECHAINGRESO                      -- Fecha registro en RNDC
USUARIOID                         -- ID usuario RNDC (int)
NUMNITEMPRESATRANSPORTE           -- NIT de la empresa de transporte (8300685069)
TIPOIDTERCERO                     -- "Cédula Ciudadanía" | "Nit" (texto largo)
CODTIPOIDTERCERO                  -- C | N | P (1 char)
CODIGOEMPRESA                     -- 471 (código interno RNDC de la empresa)
NOMSEDETERCERO                    -- Nombre de la sede: "PRINCIPAL", "Sede Guacheta", "BBVA CALLE 72"
NUMIDTERCERO                      -- NIT o cédula (varchar 20)
TEREMPRESA                        -- Nombre de la empresa de transporte (siempre NM)
CODSEDETERCERO                    -- "0" = principal | alfanumérico 6 chars para sedes adicionales
NOMIDTERCERO                      -- Nombre o Razón social (según tipo)
PRIMERAPELLIDOIDTERCERO           -- (vacío si NIT)
SEGUNDOAPELLIDOIDTERCERO          -- (vacío si NIT)
NUMTELEFONOCONTACTO               -- Teléfono fijo
NUMCELULARPERSONA                 -- Celular
NOMENCLATURADIRECCION             -- Dirección completa de la sede
MUNICIPIORNDC                     -- "NEIVA HUILA", "BOGOTA BOGOTA D. C." (texto)
CODMUNICIPIORNDC                  -- 41001000, 11001000 (8 dígitos)
CODCATEGORIALICENCIACONDUCCION    -- C2, C3 (solo para conductores)
NUMLICENCIACONDUCCION             -- Número de licencia
FECHAVENCIMIENTOLICENCIA          -- Fecha vencimiento licencia
EMAILTERCERO                      -- Email
LATITUD                           -- Latitud de la sede (decimal con formato regional)
LONGITUD                          -- Longitud de la sede (decimal negativo)
REGIMENSIMPLE                     -- N | S (régimen tributario simple)
CODPAIS                           -- 169 = Colombia
NOMBREPAIS                        -- COLOMBIA
```

**Observaciones clave:**
- Un mismo `NUMIDTERCERO` aparece N veces → una por sede
- `CODSEDETERCERO = "0"` siempre es la sede PRINCIPAL
- Sedes adicionales tienen código alfanumérico de 6 chars (ej: `CPO3D4`, `EGLM5B`)
- Conductores también están como terceros (tienen `CODCATEGORIALICENCIACONDUCCION`)
- Para NITs: `NOMIDTERCERO` = razón social, apellidos vacíos
- Para cédulas: `NOMIDTERCERO` = nombre, `PRIMERAPELLIDOIDTERCERO` + `SEGUNDOAPELLIDOIDTERCERO`

### 3.2 Vehículo (2,953 filas × 33 cols)

```
FECHAINGRESO                      -- Fecha registro
USUARIOID                         -- 1779
VEHEMPRESA                        -- "TRANSPORTES NUEVO MUNDO LTDA"
NUMNITEMPRESATRANSPORTE           -- 8300685069
NUMPLACA                          -- Placa (ABC123 o ABC12D)
CODMARCAVEHICULOCARGA             -- Código marca (int)
CONFIGURACIONUNIDADCARGA          -- "CA - Camioneta de 2 ejes" (texto)
CODCONFIGURACIONUNIDADCARGA       -- Código config (int, ej: 45)
CODLINEAVEHICULOCARGA             -- Código línea (int)
LINEAVEHICULOCARGA                -- Nombre línea (texto)
ANOFABRICACIONVEHICULOCARGA       -- Año (int)
CODTIPOCARROCERIA                 -- Código carrocería (int)
PESOVEHICULOVACIO                 -- Peso vacío en kg
NUMSEGUROSOAT                     -- Póliza SOAT
FECHAVENCIMIENTOSOAT              -- Vencimiento SOAT
ASEGURADORASOAT                   -- Nombre aseguradora
NUMNITASEGURADORASOAT             -- NIT aseguradora
TIPOIDPROPIETARIO                 -- Texto tipo ID propietario
CODTIPOIDPROPIETARIO              -- C | N
NUMIDPROPIETARIO                  -- Cédula/NIT propietario
VEHNOMBREPROP                     -- Nombre propietario
TIPOIDTENEDOR                     -- Texto tipo ID tenedor
CODTIPOIDTENEDOR                  -- C | N
NUMIDTENEDOR                      -- Cédula/NIT tenedor
VEHNOMBRETENENC                   -- Nombre tenedor
MARCAVEHICULOCARGA                -- "CHEVROLET" (texto)
TIPOCOMBUSTIBLE                   -- "Diesel o ACPM" (texto)
CODCOLORVEHICULOCARGA             -- Código color (int)
TIPOCARROCERIA                    -- "FURGON" (texto)
CODTIPOCOMBUSTIBLE                -- Código combustible (int)
NUMEJES                           -- Número de ejes
VEHDIFERENCIAS                    -- Diferencias registradas
CODIGOEMPRESA                     -- 471
```

### 3.3 Generador (6,808 filas × 18 cols)

```
FECHAINGRESO                      -- Fecha registro
NUMIDGENERADOR                    -- NIT del generador
CODIDGENERADOR                    -- N | C
NOMBRE                            -- Razón social
TELEFONO                          -- Teléfono
DIRECCION                         -- Dirección
CIUDADCODIGO                      -- Código municipio (8 dígitos)
CIUDAD                            -- "BOGOTA BOGOTA D. C." (texto)
EMAIL                             -- Email
REPRESENTANTELEGAL                -- Nombre rep. legal
ENCARGADO                         -- Nombre encargado
REPRESENTANTELEGALID              -- Cédula rep. legal
ENCARGADOID                       -- C | N
OBSERVACIONES                     -- Notas
CONTROLEMPRESAS                   -- Flag control
NITGREMIOAFILIADO                 -- NIT gremio
GREMIOAFILIADO                    -- Nombre gremio
TIPOGENERADOR                     -- "GENERADOR"
```

### 3.4 División Política Administrativa (9,487 filas × 14 cols)

```
FECHAINGRESO                      -- Fecha
CODIGODIVISION                    -- 8 dígitos + sufijo zona (ej: 8832012)
NOMBREDIVISION                    -- "VILAS DEL PALMARITO TUBARA ATLANTICO"
CODIGOZONA                        -- Zona (int)
CARRETERA                         -- Código carretera (vacío si no aplica)
NOMBREZONA                        -- Nombre zona
CODIGOMUNICIPIO                   -- Código municipio 4 dígitos (ej: 8832)
NOMBREMUNICIPIO                   -- "TUBARA" (solo municipio)
CODIGODEPTO                       -- Código depto (int, ej: 8)
NOMBREDEPTO                       -- "ATLANTICO"
CODIGODIVISIONMETROPOLITANA       -- 0 si no aplica
LONGITUD                          -- Longitud
LATITUD                           -- Latitud
DISTANCIAGEOCERCA                 -- Distancia geocerca (0 si no aplica)
```

**NOTA IMPORTANTE:** El código de 8 dígitos que usa el RNDC (`CODMUNICIPIORNDC` ej: `41001000`) NO es `CODIGODIVISION`. Se compone de: `CODIGODEPTO(2) + CODIGOMUNICIPIO(3) + 000`.
Ejemplo: Bogotá = depto `11` + municipio `001` + `000` = `11001000`.

### 3.5 Diccionario de Datos (358 filas × 13 cols)

```
FECHAINGRESO
DDDPROCESOID        -- 3=Remesa, 4=Manifiesto, 5=CumplirRemesa, 11=Tercero, 12=Vehículo, etc.
DDDPROCESO          -- "Remesa de Carga", "Manifiesto de Carga", etc.
DDDVARIABLE         -- Nombre del campo XML (ej: CANTIDADCARGADA)
DDDTAMANO           -- Tamaño máximo del campo
DDDTIPODATO         -- Varchar | Numeric | Date
DDDREQUERIDO        -- S | N
DDDDESCRIPCIONVARIABLE -- Descripción completa del campo
DDDVALIDACION       -- Regla de validación
DDDETIQUETA         -- Etiqueta amigable del campo
DDDCONSECUTIVO      -- Orden del campo
DDDWEBSERVICE       -- S = Se envía por webservice
DDDWEBINTERACTIVO   -- S = Se puede ingresar por portal web
```

**Este es el maestro más valioso para validación.** Cada fila describe un campo de un procesoid: tamaño, tipo, si es obligatorio, y la regla de validación exacta.

### 3.6 Codificación de Productos (3,759 filas × 16 cols)

```
FECHAINGRESO
TIPO                -- CP (clase peligrosa) u otro
CODIGO              -- Código 4-6 dígitos
CAPITULO            -- "CLASE 3 - LÍQUIDOS INFLAMABLES"
PARTIDA             -- Partida arancelaria
APLICASICETAC       -- Si aplica SICETAC
NECESITASUBPARTIDA  -- Si necesita subpartida
HIDROCARBURO        -- SI | NO
UNIDADGALONES       -- Si se mide en galones
IMPOCONSUMO         -- Impuesto al consumo
MERCANCIAPELIGROSA  -- SI | NO
CLASEDIVISION       -- Clase/división de peligrosidad
PELIGROSECUNDARIO   -- Peligro secundario
GRUPOEMBALAJEENVASE -- Grupo de embalaje
NOMBREYDESCRIPCION  -- Nombre legible del producto
ALERTA              -- Alertas especiales
```

### 3.7 Diccionario de Errores (1,294 filas × 8 cols)

```
FECHAINGRESO
DDEPROCESOID        -- procesoid
DDECODIGOERROR      -- Código (ej: RMM055, REM001)
DDEMENSAJEERROR     -- Mensaje descriptivo
DDEVARIABLE         -- Campo que causa el error
DDETIPOERROR        -- E=Error, W=Warning
DDEPROCESO          -- "Remesa de Carga", etc.
DDESOLUCION         -- Explicación de cómo resolver
```

---

## 4. Mapa de Relaciones entre Maestros

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EMPRESA TRANSPORTADORA                          │
│          NIT: 8300685069 | CÓDIGO: 471                             │
│          TRANSPORTES NUEVO MUNDO LTDA                              │
└────────┬──────────────┬──────────────┬──────────────┬──────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
┌──────────────┐ ┌───────────┐ ┌────────────┐ ┌──────────────────┐
│   TERCERO    │ │ VEHÍCULO  │ │ GENERADOR  │ │ AUTORIZACIONES   │
│  10,485 reg  │ │ 2,953 reg │ │ 6,808 reg  │ │   GENERADORES    │
│              │ │           │ │            │ │    5 reg          │
│ Tipos:       │ │ Config ◄──┼─┤ Propietario│ │ Quién puede      │
│ • Cliente    │ │ Marca  ◄──┼─┤ de carga   │ │ despachar para   │
│ • Conductor  │ │ Línea  ◄──┼─┤            │ │ el generador     │
│ • Propietario│ │ Carrocería│ │            │ └──────────────────┘
│ • Tenedor    │ │ SOAT      │ │            │
│              │ │ Propietario│ └───────────┘
│ Sedes:       │ │ Tenedor   │
│ • PRINCIPAL  │ └─────┬─────┘
│ • Sede 1..N  │       │
└──────┬───────┘       │
       │               │
       ▼               ▼
┌─────────────────────────────────────────────────────┐
│                     REMESA (procesoid 3)            │
│                                                     │
│  REMITENTE (Tercero + Sede) ──────► NUMIDREMITENTE  │
│                                     CODSEDEREMITENTE│
│                                                     │
│  DESTINATARIO (Tercero + Sede) ──► NUMIDDESTINATARIO│
│                                    CODSEDEDESTINATARIO│
│                                                     │
│  PROPIETARIO (Tercero + Sede) ──► NUMIDPROPIETARIO  │
│                                    CODSEDEPROPIETARIO│
│                                                     │
│  MERCANCÍA ◄── Codificación de Productos            │
│  EMPAQUE ◄── Empaques                               │
│  ASEGURADORA ◄── Empresas Aseguradoras              │
│  MUNICIPIOS ◄── División Política Administrativa    │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│               MANIFIESTO (procesoid 4)              │
│                                                     │
│  CONDUCTOR (Tercero tipo conductor)                 │
│  VEHÍCULO (Maestro Vehículo)                        │
│  REMESAS[] (1..N remesas asignadas)                 │
│  MUNICIPIOS ORIGEN/DESTINO ◄── Div. Política        │
│  SICETAC ◄── SiceTAC Intervenido                    │
│  RETEICA ◄── ReteICA                                │
└─────────────────────────────────────────────────────┘
```

### Dependencias entre catálogos

```
Marcas Vehículos ──1:N──► Líneas de Vehículos (CODIGOMARCA)
Configuración Vehículos ──N:M──► Combinación Configuraciones (CODIGO+CODIGOSEMIR)
Capítulos Codificación ──1:N──► Codificación de Productos (CAPITULO)
División Política ──contexto──► ReteICA (CODIGOMUNICIPIO)
División Política ──contexto──► SiceTAC (ORIGEN, DESTINO)
División Política ──contexto──► Puesto de Control (CODMUNICIPIOORIGEN)
```

---

## 5. Mapeo Maestros → Schema Prisma Actual

### 5.1 Maestros con modelo Prisma existente

| Maestro RNDC | Modelo Prisma | Estado | Gaps |
|---|---|---|---|
| **Tercero** | `Cliente` + `SucursalCliente` | ⚠️ Parcial | `codSede` VarChar(5)→debe ser 6. Falta `LATITUD`, `LONGITUD`, `REGIMENSIMPLE`, `CODMUNICIPIORNDC` (8 dig). Conductores mezclados con clientes. |
| **Vehículo** | `Vehiculo` | ✅ Completo | Todos los 33 campos del maestro ya están mapeados |
| **Empresa Transportadora** | Hardcoded `.env` | ✅ OK | Solo 1 empresa, no necesita modelo |

### 5.2 Maestros sin modelo Prisma (necesitan tablas nuevas)

| Maestro RNDC | Tipo | Acción recomendada |
|---|---|---|
| **Configuración Vehículos** | Catálogo | Tabla `rndc_configuracion_vehiculo` |
| **Combinación Configuraciones** | Catálogo | Tabla `rndc_combinacion_configuracion` |
| **Marcas Vehículos** | Catálogo | Tabla `rndc_marca_vehiculo` |
| **Líneas de Vehículos** | Catálogo | Tabla `rndc_linea_vehiculo` |
| **Marcas Semiremolques** | Catálogo | Tabla `rndc_marca_semiremolque` |
| **Tipos de Carrocerías** | Catálogo | Tabla `rndc_tipo_carroceria` |
| **Empaques** | Catálogo | Tabla `rndc_empaque` |
| **Codificación de Productos** | Catálogo | Tabla `rndc_producto` |
| **Capítulos Codificación** | Catálogo | Tabla `rndc_capitulo_producto` |
| **Códigos de Arancel** | Catálogo | Tabla `rndc_arancel` |
| **Empresas Aseguradoras** | Catálogo | Tabla `rndc_aseguradora` |
| **División Política Administrativa** | Catálogo | Tabla `rndc_division_politica` |
| **ReteICA** | Catálogo | Tabla `rndc_reteica` |
| **SiceTAC Intervenido** | Catálogo | Tabla `rndc_sicetac_intervenido` |
| **Diccionario de Datos** | Metadato | Tabla `rndc_diccionario_datos` |
| **Diccionario de Errores** | Metadato | Tabla `rndc_diccionario_errores` |
| **Generador** | Operativo | Tabla `rndc_generador` |
| **Empresas Autorizadas** | Operativo | Tabla `rndc_empresa_autorizada_generador` |
| **Puesto de Control** | Operativo | Tabla `rndc_puesto_control` |

### 5.3 Gaps en `Cliente` + `SucursalCliente`

| Campo RNDC | Campo Prisma actual | Gap |
|---|---|---|
| `CODSEDETERCERO` (alfanumérico 6) | `SucursalCliente.codSede` VarChar(5) | ❌ Corto — acción: ampliar a VarChar(10) |
| `CODMUNICIPIORNDC` (8 dígitos) | `SucursalCliente.daneMunicipio` VarChar(5) | ❌ Diferente — acción: agregar `codMunicipioRndc` VarChar(8) |
| `LATITUD` | *(no existe)* | ❌ Agregar `latitud` Decimal(10,7) |
| `LONGITUD` | *(no existe)* | ❌ Agregar `longitud` Decimal(10,7) |
| `REGIMENSIMPLE` | *(no existe)* | ❌ Agregar en `Cliente`: `regimenSimple` Boolean |
| `CODCATEGORIALICENCIACONDUCCION` | *(en modelo Conductor)* | ℹ️ Conductor es un Tercero especial |
| `NUMTELEFONOCONTACTO` vs `NUMCELULARPERSONA` | `SucursalCliente.telefono` (uno solo) | ⚠️ Evaluar: RNDC distingue fijo vs celular |
| `EMAILTERCERO` | `SucursalCliente.email` | ✅ OK |
| `CODPAIS` / `NOMBREPAIS` | *(no existe)* | ℹ️ Siempre 169/COLOMBIA — opcional |

---

## 6. Relación Tercero ↔ Conductor

El maestro de Terceros confirma que los **conductores son un tipo especial de tercero** en el RNDC:

```
Tercero con CODCATEGORIALICENCIACONDUCCION != vacío  →  Es conductor
Tercero con CODCATEGORIALICENCIACONDUCCION = vacío   →  Es cliente/remitente/destinatario
```

En nuestro sistema tenemos `Conductor` como modelo separado de `Cliente`. Esto es **correcto** porque:
1. Un conductor tiene campos específicos (licencia, categoría, vigencia)
2. Un cliente tiene sedes (direcciones de cargue/descargue)
3. En RNDC ambos son "terceros" pero en nuestro dominio son entidades distintas

**El conductor NO necesita sedes** — por eso `Conductor` es flat y `Cliente` tiene `SucursalCliente`.

---

## 7. Relación Generador ↔ CargoClick

El **Generador** en RNDC es el dueño/propietario de la carga (ej: MELOS Y MELOS, BANCOLOMBIA). Es quien:
- Registra la carga a transportar
- Autoriza a la empresa de transporte
- Tiene un plazo de facturación (30 días típico)

En CargoClick esto corresponde a:
- `Remesa.nitPropietario` + `Remesa.codSedePropietario` → identifica al generador
- El generador debe existir como **Tercero** en RNDC
- La autorización Generador → Empresa Transportadora es prerrequisito RNDC

**No confundir:** El Generador NO es necesariamente el Remitente ni el Destinatario. Son 3 roles distintos que puede cumplir el mismo o diferente NIT.

---

## 8. Estrategia de Importación

### Principio: Mismos nombres RNDC

Todas las tablas de catálogo mantendrán los **nombres de campo exactos del RNDC** (en SCREAMING_CASE) para que la importación sea un simple INSERT directo desde el XLS sin transformación de columnas.

### Script de importación (diseño)

```
1. Leer XLS con streaming (no cargar todo en memoria)
2. Para cada fila: INSERT en tabla rndc_* con ON CONFLICT UPDATE
3. Marcar registros inactivos que ya no existen en el maestro nuevo
4. Log de cambios detectados (nuevos, modificados, eliminados)
```

### Performance y memoria

- **Catálogos pequeños** (< 1,000 filas): Import directo, cache en memoria de la app
- **Catálogos medianos** (1,000 - 10,000 filas): Import batch, query con índice
- **Catálogos grandes** (> 10,000 filas): Import streaming, paginación

| Tabla | Filas | Estrategia |
|-------|------:|-----------|
| rndc_division_politica | 9,487 | Batch 500, índice por CODIGOMUNICIPIO |
| rndc_tercero | 10,485 | Batch 500, índice por NUMIDTERCERO + CODSEDETERCERO |
| rndc_generador | 6,808 | Batch 500, índice por NUMIDGENERADOR |
| rndc_linea_vehiculo | 18,623 | Batch 500, índice por CODIGOMARCA + CODIGOLINEA |
| rndc_producto | 3,759 | Batch 500, índice por CODIGO |
| rndc_vehiculo | 2,953 | Batch 500, índice por NUMPLACA |
| Resto (< 1,000) | variable | Insert directo |

---

## 9. Prioridad de Implementación

### Fase 1 — Críticos para Remesa (procesoid 3)
1. `rndc_division_politica` — resolver municipios
2. `rndc_producto` + `rndc_capitulo_producto` — seleccionar mercancía
3. `rndc_empaque` — seleccionar empaque
4. `rndc_aseguradora` — seleccionar aseguradora
5. `rndc_diccionario_datos` (filtrar procesoid=3) — validar campos antes de enviar
6. `rndc_diccionario_errores` (filtrar procesoid=3) — mostrar errores amigables
7. Fix gaps en `Cliente` + `SucursalCliente` — codSede, latitud, longitud, codMunicipioRndc

### Fase 2 — Para Manifiesto (procesoid 4)
8. `rndc_configuracion_vehiculo` + `rndc_combinacion_configuracion` — validar peso
9. `rndc_marca_vehiculo` + `rndc_linea_vehiculo` — enriquecer vehículo
10. `rndc_tipo_carroceria` — carrocería
11. `rndc_sicetac_intervenido` — validar tarifa mínima
12. `rndc_reteica` — calcular retención

### Fase 3 — Complementarios
13. `rndc_generador` — directorio de generadores
14. `rndc_empresa_autorizada_generador` — autorizaciones
15. `rndc_puesto_control` — informacional
16. `rndc_marca_semiremolque` — solo para tracto+semi
17. `rndc_arancel` — solo mercancías especiales
