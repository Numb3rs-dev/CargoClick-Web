# Alineación de Campos — Remesa (procesoid 3)

> **Propósito:** tabla de trazabilidad completa de cada campo de la entidad Remesa
> a través de las cuatro fuentes del sistema: base de datos (Prisma), XML enviado al
> Ministerio de Transporte (RNDC procesoid 3), formulario de usuario (RemesaForm) y
> cuerpo del request a la API interna.
>
> **Regla de oro:** si un campo existe en **cualquiera** de las cuatro fuentes, aparece
> en todas las columnas — con `N/A` cuando no aplica en esa fuente.
>
> **Fuente autoritativa XML:** Guía Registro Remesa Revisión 01_12_25_GAADS V4.pdf
> (documento oficial Ministerio de Transporte, aprobado 2025).

---

## Simbología

| Símbolo | Significado |
|---------|------------|
| ✅ req | Obligatorio — el sistema o el RNDC rechazan si falta |
| opt | Opcional — se envía solo si tiene valor |
| cond | Condicional — obligatorio en ciertos casos (ver nota de la fila) |
| auto | Generado automáticamente por el sistema sin intervención del usuario |
| config | Viene de variables de entorno (`RNDC_NIT_EMPRESA`, etc.) |
| hardcoded | Valor fijo en código (no configurable por usuario) |
| read | Solo lectura — visible en modo "ver", no editable por el usuario |
| N/A | No aplica en esta fuente |
| @deprecated | Campo existente en Prisma pero marcado para eliminar |

---

## 1. Identificación y relaciones internas

| Campo Prisma | Tag XML RNDC | Campo UI (FormValues / InitialData) | Campo API body (POST /api/remesas) | Notas |
|---|---|---|---|---|
| `id` String PK | N/A | `id` (InitialData, read) | N/A | cuid generado por Prisma |
| `numeroRemesa` String UNIQUE | `CONSECUTIVOREMESA` ✅ req | `numeroRemesa` (InitialData, read) | N/A auto | Generado internamente: REM-YYYY-NNNN. Se usa como consecutivo RNDC |
| `nuevoNegocioId` String? FK | N/A | N/A | `nuevoNegocioId` opt cuid | FK al NuevoNegocio. Opcional — remesa puede existir sin negocio |
| `manifiestoOperativoId` String? FK | N/A | N/A | N/A | Se asigna cuando se arma el manifiesto, posterior a la remesa |
| `remitenteClienteId` String? FK | N/A | N/A (SucursalPicker resuelve) | N/A | FK al directorio de clientes. Se rellena al elegir desde el buscador |
| `destinatarioClienteId` String? FK | N/A | N/A (SucursalPicker resuelve) | N/A | FK al directorio de clientes |
| `createdAt` DateTime | N/A | `createdAt` (InitialData, read) | N/A auto | Timestamp de creación en DB |
| `updatedAt` DateTime | N/A | `updatedAt` (InitialData, read) | N/A auto | Timestamp de última actualización |

---

## 2. Descripción de la carga

| Campo Prisma | Tag XML RNDC | Campo UI (FormValues / InitialData) | Campo API body (POST /api/remesas) | Notas |
|---|---|---|---|---|
| `descripcionCarga` String | `DESCRIPCIONCORTAPRODUCTO` ✅ req | `descripcionCarga` ✅ req | `descripcionCarga` ✅ req | Máx 60 chars. **No se envía para mercancías peligrosas** (el RNDC usa CODIGOUN) |
| `codigoAranceladoCarga` String? | `MERCANCIAREMESA` ✅ req | `codigoAranceladoCarga` opt | `codigoAranceladoCarga` opt | 6 dígitos (ej: `009880` = Paquetes varios). Default `009880`. El XML hace `.padStart(6,'0')` |
| `mercanciaRemesaCod` Int? | N/A (duplicado) | `mercanciaRemesaCod` (InitialData read) | `mercanciaRemesaCod` opt | **Pendiente unificación:** representa el mismo concepto que `codigoAranceladoCarga`. Ver nota al pie |
| `pesoKg` Int | `CANTIDADCARGADA` ✅ req | `pesoKg` ✅ req | `pesoKg` ✅ req int positivo | Peso total de la mercancía en kilogramos |
| `volumenM3` Decimal? | N/A | N/A | `volumenM3` opt | Uso interno. El RNDC no recibe este campo en procesoid 3 |
| N/A (hardcoded) | `UNIDADMEDIDACAPACIDAD` ✅ req | N/A | N/A | **Siempre `1`** (= kilogramos). Hardcoded en rndcXmlBuilder. No requiere campo en DB |

> **Nota — mercanciaRemesaCod vs codigoAranceladoCarga:** El Prisma tiene ambos campos porque `mercanciaRemesaCod` fue importado del Excel RNDC (entero) y `codigoAranceladoCarga` es el campo de entrada del usuario (string 6 dígitos). Para el XML siempre se usa `codigoAranceladoCarga`. Pendiente: unificar en una sola columna en una próxima migración.

---

## 3. Clasificación RNDC

| Campo Prisma | Tag XML RNDC | Campo UI (FormValues / InitialData) | Campo API body (POST /api/remesas) | Notas |
|---|---|---|---|---|
| `codOperacionTransporte` String default `G` | `CODOPERACIONTRANSPORTE` ✅ req | `codOperacionTransporte` ✅ req | `codOperacionTransporte` opt | `G`=General, `P`=Paqueteo, `CC`=Contenedor cargado, `CV`=Contenedor vacío, `C`=Consolidada |
| `codNaturalezaCarga` String default `G` | `CODNATURALEZACARGA` ✅ req | `codNaturalezaCarga` ✅ req | `codNaturalezaCarga` opt | `G`=General, `2`=Peligrosa, `R`=Refrigerada, `S`=Sobredimensionada, `E`=Extrapesada, `5`=Alto valor |
| `naturalezaCarga` String? | N/A | N/A | N/A | Texto legible para display. Importado del Excel RNDC. No se envía al Ministerio |
| `codigoEmpaque` Int default `0` | `CODTIPOEMPAQUE` ✅ req | `codigoEmpaque` ✅ req | `codigoEmpaque` opt | `0`=Paquetes, `4`=Bulto, `6`=Granel líquido, `7/8/9`=Contenedores, `10`=Estiba, `12`=Cilindros, `15`=Granel sólido, `17`=Varios, `18`=N.A., `19`=Estibada |
| `tipoConsolidada` String? | `TIPOCONSOLIDADA` cond | `tipoConsolidada` cond | `tipoConsolidada` opt | Solo cuando `codOperacionTransporte = P` (Paqueteo). Valores: `N`, `P` |
| `unidadMedidaCapacidad` String? | N/A (hardcoded=`1`) | N/A | N/A | Campo Prisma reservado, en la práctica el XML envía `1` fijo. Pendiente deprecar |

---

## 4. Mercancía peligrosa (condicional)

> Todos los campos de esta sección son **obligatorios** cuando `codNaturalezaCarga = 2` (Mercancía Peligrosa).

| Campo Prisma | Tag XML RNDC | Campo UI (FormValues / InitialData) | Campo API body (POST /api/remesas) | Notas |
|---|---|---|---|---|
| `codigoUn` String? | `CODIGOUN` cond | `codigoUn` cond | `codigoUn` opt max 4 | Código ONU del Libro Naranja (ej: `1203` = gasolina). Obligatorio para peligrosas |
| `estadoMercancia` String? | `ESTADOMERCANCIA` cond | `estadoMercancia` cond | `estadoMercancia` opt | `S`=Sólido, `L`=Líquido, `G`=Gaseoso. Solo mercancías peligrosas |
| `grupoEmbalajeEnvase` String? | `GRUPOEMBALAJEENVASE` cond | `grupoEmbalajeEnvase` cond | `grupoEmbalajeEnvase` opt | `I`, `II`, `III`. Solo para peligrosas con varios grupos de embalaje |
| `codigoArancelCompleto` String? | `CODIGOARANCEL_CODE` cond | N/A | N/A | 2 dígitos — cuarto nivel codificación armonizada. Poblado desde importación RNDC. No editable en form aún |

---

## 5. Granel líquido y cantidad de producto (condicional)

> Solo cuando `codigoEmpaque = 6` (Granel líquido).

| Campo Prisma | Tag XML RNDC | Campo UI (FormValues / InitialData) | Campo API body (POST /api/remesas) | Notas |
|---|---|---|---|---|
| `unidadMedidaProducto` String default `KGM` | `UNIDADMEDIDAPRODUCTO` cond | `unidadMedidaProducto` cond | `unidadMedidaProducto` opt max 5 | Solo para granel líquido. Valores: `KGM`, `GLL`, `MTQ`, `LTR`, `BLL`, `MLT`, `CMQ`, `UN` |
| `cantidadProducto` Decimal? | `CANTIDADPRODUCTO` cond | `cantidadProducto` cond | `cantidadProducto` opt | Cantidad en la unidad comercial (galones, litros, etc.) |

---

## 6. Contenedor (condicional)

> Solo cuando `codOperacionTransporte = CC` o `CV`.

| Campo Prisma | Tag XML RNDC | Campo UI (FormValues / InitialData) | Campo API body (POST /api/remesas) | Notas |
|---|---|---|---|---|
| `pesoContenedorVacio` Decimal? | `PESOCONTENEDORVACIO` cond | `pesoContenedorVacio` cond | `pesoContenedorVacio` opt | Peso del contenedor vacío en kg. Solo operaciones de contenedor |
| `configResultante` String? | `CONFIGURACIONRESULTANTE` cond | N/A | N/A | Configuración resultante del vehículo. Importado del Excel RNDC, no editable en form |

---

## 7. Remitente (quien envía la carga)

| Campo Prisma | Tag XML RNDC | Campo UI (FormValues / InitialData) | Campo API body (POST /api/remesas) | Notas |
|---|---|---|---|---|
| `tipoIdRemitente` String default `N` | `CODTIPOIDREMITENTE` ✅ req | N/A (InitialData — viene del SucursalPicker) | `tipoIdRemitente` opt | `C`=Cédula, `N`=NIT, `E`=Extranjero |
| `nitRemitente` String | `NUMIDREMITENTE` ✅ req | N/A (InitialData — viene del SucursalPicker) | `nitRemitente` ✅ req | Documento de identificación del remitente |
| `codSedeRemitente` String default `1` | `CODSEDEREMITENTE` ✅ req | N/A (InitialData — viene del SucursalPicker) | `codSedeRemitente` opt | Código de sede registrada en el RNDC |
| `empresaRemitente` String? | N/A | N/A (InitialData read) | `empresaRemitente` opt | Nombre/razón social. Display interno. El RNDC no recibe este campo en p3 |
| `direccionRemitente` String? | `REMDIRREMITENTE` opt | `remDirRemitente` opt | `remDirRemitente` opt max 150 | **Alias UI:** `remDirRemitente` → Prisma: `direccionRemitente`. Dirección física del punto de cargue |

> **Nota alias:** El formulario y la API usan `remDirRemitente` (nombre alineado con el tag RNDC). El PATCH route convierte `remDirRemitente → direccionRemitente` antes de escribir en Prisma.

---

## 8. Destinatario (quien recibe la carga)

| Campo Prisma | Tag XML RNDC | Campo UI (FormValues / InitialData) | Campo API body (POST /api/remesas) | Notas |
|---|---|---|---|---|
| `tipoIdDestinatario` String default `N` | `CODTIPOIDDESTINATARIO` ✅ req | N/A (InitialData — viene del SucursalPicker) | `tipoIdDestinatario` opt | `C`=Cédula, `N`=NIT, `E`=Extranjero |
| `nitDestinatario` String | `NUMIDDESTINATARIO` ✅ req | N/A (InitialData — viene del SucursalPicker) | `nitDestinatario` ✅ req | Documento del destinatario |
| `codSedeDestinatario` String default `1` | `CODSEDEDESTINATARIO` ✅ req | N/A (InitialData — viene del SucursalPicker) | `codSedeDestinatario` opt | Sede del destinatario en RNDC |
| `empresaDestinataria` String? | N/A | N/A (InitialData read) | `empresaDestinataria` opt | Nombre/razón social. Display interno |

---

## 9. Propietario de la carga

| Campo Prisma | Tag XML RNDC | Campo UI (FormValues / InitialData) | Campo API body (POST /api/remesas) | Notas |
|---|---|---|---|---|
| `tipoIdPropietario` String default `N` | `CODTIPOIDPROPIETARIO` ✅ req | N/A (InitialData — PropietarioMode resuelve) | `tipoIdPropietario` opt | `C`=Cédula, `N`=NIT |
| `nitPropietario` String | `NUMIDPROPIETARIO` ✅ req | N/A (InitialData — PropietarioMode resuelve) | `nitPropietario` ✅ req | NIT de la empresa que posee la póliza de seguros. Usualmente mismo que empresa transportadora |
| `codSedePropietario` String? | `CODSEDEPROPIETARIO` ✅ req | `codSedePropietario` opt default `1` | `codSedePropietario` opt max 5 | Default `1`. **Crítico**: el RNDC lo requiere, el XML lo envía siempre (fallback `1`) |
| `nombrePropietario` String? | N/A | `nombrePropietario` (InitialData read) | N/A | Nombre del propietario. Display interno, importado del Excel RNDC |
| `municipioPropietario` String? | N/A | N/A | N/A | Importado del Excel RNDC (`REM_PROP`). No editable en form |

---

## 10. Seguro de la carga

| Campo Prisma | Tag XML RNDC | Campo UI (FormValues / InitialData) | Campo API body (POST /api/remesas) | Notas |
|---|---|---|---|---|
| `numPolizaTransporte` String? | `NUMPOLIZATRANSPORTE` opt | `numPolizaTransporte` opt | `numPolizaTransporte` opt max 30 | Número de póliza del seguro de la carga |
| `fechaVencimientoPoliza` DateTime? | `FECHAVENCIMIENTOPOLIZACARGA` opt | `fechaVencimientoPoliza` opt | `fechaVencimientoPoliza` opt string | Formato `DD/MM/AAAA` en el XML. API acepta ISO date string |
| `companiaSeguriNit` String? | `COMPANIASEGURO` opt | `companiaSeguriNit` (InitialData read) | N/A | NIT de la aseguradora. El XML lo envía si existe. No es editable en form (se llena desde importación o futuro picker) |
| `companiaSeguriNombre` String? | N/A | `companiaSeguriNombre` (InitialData read) | N/A | Nombre de la aseguradora. Display interno |
| `duenopoliza` String? | `DUENOPOLIZA` opt | `duenopoliza` (InitialData read) | N/A | Dueño de la póliza. Importado del Excel RNDC |
| `valorAsegurado` Decimal? | `VALORASEGURADO` opt | `valorAsegurado` opt | `valorAsegurado` opt number | Valor asegurado ante la aseguradora. Puede diferir del valor declarado |
| `valorDeclarado` Decimal? | N/A | N/A | `valorDeclarado` opt | Uso interno. El RNDC procesoid 3 no recibe este campo |

---

## 11. Puntos de origen y destino

| Campo Prisma | Tag XML RNDC | Campo UI (FormValues / InitialData) | Campo API body (POST /api/remesas) | Notas |
|---|---|---|---|---|
| `origenMunicipio` String | N/A (solo display) | `origenMunicipio` (InitialData read) | `origenMunicipio` ✅ req | Nombre legible del municipio. El RNDC solo recibe el código DANE |
| `origenDane` String | `CODMUNICIPIOORIGEN` ✅ req | `origenDane` ✅ req | `origenDane` ✅ req min 5 max 9 | Código DANE de 8 dígitos (ej: `76001000` = Cali) |
| `destinoMunicipio` String | N/A (solo display) | `destinoMunicipio` (InitialData read) | `destinoMunicipio` ✅ req | Nombre legible del municipio de destino |
| `destinoDane` String | `CODMUNICIPIODESTINO` ✅ req | `destinoDane` ✅ req | `destinoDane` ✅ req min 5 max 9 | Código DANE del municipio de destino |
| `direccionOrigen` String? @deprecated | N/A | N/A | N/A | **@deprecated** — reemplazado por `direccionRemitente` (REMDIRREMITENTE). Eliminar en próxima migración |
| `direccionDestino` String? @deprecated | N/A | N/A | N/A | **@deprecated** — sin equivalente RNDC. Usar `instruccionesEspeciales` para notas de descargue |

---

## 12. Coordenadas geográficas

> **No se envían en procesoid 3.** Existen en Prisma para uso interno (mapas, trazabilidad GPS) y en los reportes del Excel del Ministerio, pero el spec oficial del procesoid 3 no los incluye como campos enviables.

| Campo Prisma | Tag XML RNDC | Campo UI (FormValues / InitialData) | Campo API body (POST /api/remesas) | Notas |
|---|---|---|---|---|
| `latitudCargue` Decimal? | N/A — no enviar | N/A | N/A | Latitud del punto de cargue. Uso futuro (mapas). Se documenta en prisma como `LATITUDCARGUE` |
| `longitudCargue` Decimal? | N/A — no enviar | N/A | N/A | Longitud del punto de cargue |
| `latitudDescargue` Decimal? | N/A — no enviar | N/A | N/A | Latitud del punto de descargue |
| `longitudDescargue` Decimal? | N/A — no enviar | N/A | N/A | Longitud del punto de descargue |

---

## 13. Tiempos logísticos

> **Obligatorios en el RNDC desde noviembre 2025** (Decreto de tiempos de cargue y descargue).

| Campo Prisma | Tag XML RNDC | Campo UI (FormValues / InitialData) | Campo API body (POST /api/remesas) | Notas |
|---|---|---|---|---|
| `fechaHoraCitaCargue` DateTime? | `FECHACITAPACTADACARGUE` ✅ req + `HORACITAPACTADACARGUE` ✅ req | `fechaHoraCitaCargue` ✅ req | `fechaHoraCitaCargue` ✅ req | Un solo DateTime en Prisma. El XML builder separa fecha (`DD/MM/AAAA`) y hora (`HH:MM`) en dos tags |
| `fechaHoraCitaDescargue` DateTime? | `FECHACITAPACTADADESCARGUE` ✅ req + `HORACITAPACTADADESCARGUEREMESA` ✅ req | `fechaHoraCitaDescargue` ✅ req | `fechaHoraCitaDescargue` ✅ req | Igual que cargue — dos tags XML desde un solo DateTime |
| `horasPactoCarga` Int default 4 | `HORASPACTOCARGA` ✅ req | `horasPactoCarga` opt default `4` | `horasPactoCarga` opt int≥0 | Horas pactadas para el cargue (tiempos logísticos) |
| `minutosPactoCarga` Int default 0 | `MINUTOSPACTOCARGA` ✅ req | `minutosPactoCarga` opt default `0` | `minutosPactoCarga` opt int 0–59 | Minutos adicionales para cargue |
| `horasPactoDescargue` Int default 4 | `HORASPACTODESCARGUE` ✅ req | `horasPactoDescargue` opt default `4` | `horasPactoDescargue` opt int≥0 | Horas pactadas para el descargue |
| `minutosPactoDescargue` Int default 0 | `MINUTOSPACTODESCARGUE` ✅ req | `minutosPactoDescargue` opt default `0` | `minutosPactoDescargue` opt int 0–59 | Minutos adicionales para descargue |

---

## 14. Trasbordo

| Campo Prisma | Tag XML RNDC | Campo UI (FormValues / InitialData) | Campo API body (POST /api/remesas) | Notas |
|---|---|---|---|---|
| `codMunicipioTrasbordo` String? | `CODMUNICIPIOTRASBORDO` cond | N/A | N/A | Código DANE municipio de trasbordo. No editable en form actual — uso futuro |
| `municipioTrasbordo` String? | `NOMMUNICIPIOTRASBORDO` cond | N/A | N/A | Nombre del municipio de trasbordo. Display |
| `codMunicipioTrasbordo2` String? | `CODMUNICIPIOTRASBORDO2` cond | N/A | N/A | Segundo punto de trasbordo |
| `municipioTrasbordo2` String? | `NOMMUNICIPIOTRASBORDO2` cond | N/A | N/A | Nombre segundo municipio de trasbordo |

---

## 15. Valores, extras y referencias

| Campo Prisma | Tag XML RNDC | Campo UI (FormValues / InitialData) | Campo API body (POST /api/remesas) | Notas |
|---|---|---|---|---|
| `ordenServicioGenerador` String? | `ORDENSERVICIOGENERADOR` opt | `ordenServicioGenerador` opt | `ordenServicioGenerador` opt max 20 | Número de orden de compra del cliente generador de carga |
| `instruccionesEspeciales` String? Text | N/A | `instruccionesEspeciales` (InitialData read) | `instruccionesEspeciales` opt max 500 | Uso interno: refrigeración, escolta, manejo especial. No va al RNDC en procesoid 3 |
| `permisoCargaExtra` String? | `PERMISOCARGAEXTRA` cond | N/A | N/A | Número de permiso INVIAS. Solo carga extradimensionada. No editable en form actual |
| `numIdGps` String? | `NUMIDGPS` opt | N/A | N/A | ID del dispositivo GPS. Se envía al RNDC si existe. No editable en form actual |
| `numPlacaRndc` String? | N/A | N/A | N/A | Placa del vehículo importada del Excel RNDC (`NUMPLACA`). Solo lectura |
| `cantidadInformacionCarga` Int? | N/A | N/A | N/A | `CANTIDADINFORMACIONCARGA` del Excel importado. Solo lectura |

---

## 16. Estado RNDC y respuesta del Ministerio

| Campo Prisma | Tag XML RNDC | Campo UI (FormValues / InitialData) | Campo API body (POST /api/remesas) | Notas |
|---|---|---|---|---|
| `estadoRndc` EstadoRndcRemesa | N/A | `estadoRndc` (InitialData read) | N/A auto | `PENDIENTE` → `ENVIADA` → `REGISTRADA` / `ANULADA`. Gestionado por `remesaService.enviarRndc()` |
| `numeroRemesaRndc` String? | N/A (es la respuesta) | `numeroRemesaRndc` (InitialData read) | N/A auto | Valor de `<ingresoid>` en la respuesta RNDC. Asignado tras procesoid 3 exitoso |
| `fechaIngresoRndc` DateTime? | N/A (respuesta RNDC) | `fechaIngresoRndc` (InitialData read) | N/A auto | `FECHAINGRESO` del RNDC. Puede venir de la respuesta o del Excel importado |
| `respuestaRndcJson` Json? | N/A | N/A | N/A | XML completo de la respuesta SOAP parseado a JSON. Solo para auditoría interna |
| N/A | `NUMNITEMPRESATRANSPORTE` ✅ req | N/A | N/A config | NIT de la empresa transportadora. Viene de `RNDC_NIT_EMPRESA` env var. No almacenado en la remesa individual |

---

## 17. Metadatos importados del Excel del Ministerio

> Campos importados por el script `scripts/importar-rndc.js` desde los reportes históricos que descarga el operador del portal del Ministerio. **Solo lectura** — nunca los escribe la API interna.

| Campo Prisma | Tag XML RNDC | Campo UI | Campo API | Notas |
|---|---|---|---|---|
| `usuarioRndc` String? | N/A | N/A | N/A | `USUARIO` del Excel — usuario RNDC que registró la remesa |
| `interactivoRndc` String? | N/A | N/A | N/A | `INTERACTIVO` (S/N) — si fue ingresado por el portal web del Ministerio |
| `codigoEmpresaRndc` Int? | N/A | N/A | N/A | `CODIGOEMPRESA` del Excel |
| `nitEmpresaTransporte` String? | N/A | N/A | N/A | `NUMNITEMPRESATRANSPORTE` del Excel — verificación contra la empresa actual |
| `empresaTransporteRndc` String? | N/A | N/A | N/A | `REMEMPRESA` del Excel — nombre de la empresa en el RNDC |
| `usuarioIngresoRndc` Int? | N/A | N/A | N/A | `USUARIOINGR` del Excel — ID numérico del usuario que ingresó |
| `naturalezaCarga` String? | N/A | N/A | N/A | `NATURALEZACARGA` texto del Excel (ej: "Carga Normal") |

---

## 18. Estado operativo interno

| Campo Prisma | Tag XML RNDC | Campo UI | Campo API | Notas |
|---|---|---|---|---|
| `estado` EstadoOperativoRemesa | N/A | `estado` (InitialData read) | N/A auto | `PENDIENTE` → `ASIGNADA` → `EN_TRANSITO` → `ENTREGADA` / `NOVEDAD`. Flujo operativo interno, independiente del estado RNDC |

---

## 19. Flujo completo de una remesa nueva

```
1. Usuario completa RemesaForm (modo "crear")
        │  FormValues + SucursalPicker resolving remitente/destinatario/propietario
        ▼
2. POST /api/remesas  →  crearRemesaSchema.safeParse(body)
        │  Validación Zod
        ▼
3. remesaService.crear(nuevoNegocioId, data)
        │  Genera numeroRemesa: REM-YYYY-NNNN (transaction atómica)
        │  Escribe en tabla `remesas` con estadoRndc=PENDIENTE
        ▼
4. Usuario ve la remesa creada → EnviarRndcButton visible
        │  estadoRndc === 'PENDIENTE'
        ▼
5. Usuario hace clic "Registrar en RNDC"
        │
        ▼
6. POST /api/remesas/[id]/enviar-rndc (sin body)
        │
        ▼
7. remesaService.enviarRndc(id)
        │  ├─ Marca estadoRndc = ENVIADA  (antes del SOAP — anti doble-envío ante timeout)
        │  ├─ buildXmlRemesa({ ...remesa, consecutivo: remesa.numeroRemesa })
        │  ├─ llamarRndc(xml, { processId: 3, ... })
        │  │       ├─ buildSoapEnvelope(mensajeXml) — CDATA wrapper
        │  │       ├─ iconv.encode(soap, 'iso-8859-1')  ← CRÍTICO
        │  │       ├─ axios.post(RNDC_WS_URL, buffer, timeout: 30 000 ms)
        │  │       ├─ iconv.decode(response, 'iso-8859-1')
        │  │       ├─ extraerIngresoid(responseXml)   ← HTTP 200 no = éxito
        │  │       └─ syncRndcRepository.registrar(...)  ← append-only
        │  └─ Si exitoso: estadoRndc = REGISTRADA, numeroRemesaRndc = ingresoid
        │     Si error:   estadoRndc = PENDIENTE  (rollback para reintento)
        ▼
8. Respuesta al browser: { data: { numeroRemesaRndc, syncRndcId } }
        │  router.refresh() → Server Component recarga con nuevo estadoRndc
        ▼
9. La remesa queda REGISTRADA → puede asignarse a un ManifiestoOperativo (procesoid 4)
```

---

## 20. Reglas de negocio críticas

| Regla | Descripción |
|-------|-------------|
| **Idempotencia CONSECUTIVOREMESA** | Si el RNDC ya registró una remesa con ese consecutivo, rechazará duplicados. El sistema marca como `ENVIADA` antes del SOAP para que un timeout no cause doble envío |
| **ISO-8859-1 obligatorio** | Cualquier byte fuera de ISO causa rechazo silencioso del RNDC (no error HTTP) |
| **ingresoid=0 es error** | HTTP 200 del RNDC no garantiza éxito. Siempre verificar `<ingresoid>`. Si es `0` o `-1`, es error |
| **REGISTRADA antes de Manifiesto** | Solo remesas con `estadoRndc=REGISTRADA` pueden incluirse en un ManifiestoOperativo (procesoid 4) |
| **estadoRndc no editable por el usuario** | Solo `remesaService` escribe este campo. Las APIs PATCH lo ignoran |
| **Clave enmascarada en SyncRndc** | El campo `requestXml` de la tabla `sync_rndc` nunca contiene la contraseña real (`<clave>***</clave>`) |
| **CODSEDEPROPIETARIO required** | El RNDC rechaza la remesa si falta este campo. El sistema envía `1` como fallback si no se especifica |
| **MERCANCIAREMESA 6 dígitos con padding** | El código debe enviarse con padding de ceros a la izquierda: `9880` → `009880`. El XML builder aplica `.padStart(6,'0')` |
