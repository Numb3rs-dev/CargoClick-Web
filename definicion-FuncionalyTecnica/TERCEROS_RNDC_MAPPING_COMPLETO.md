# Mapeo Completo — Terceros RNDC → CargoClick → XML RNDC

> **Última actualización:** 2026-03-03  
> **Fuente datos:** `Maestro_Tercero_RNDC.xls` (10,484 filas × 27 columnas)  
> **Importación:** `scripts/importar-terceros.js` — 2,263 conductores · 2,691 clientes · 7,502 sucursales

---

## Índice

1. [Tabla `conductores`](#1-tabla-conductores)
2. [Tabla `clientes`](#2-tabla-clientes)
3. [Tabla `sucursales_cliente`](#3-tabla-sucursales_cliente)
4. [Columnas del Maestro NO importadas](#4-columnas-del-maestro-no-importadas)
5. [Campos que faltan en la UI](#5-campos-que-faltan-en-la-ui)
6. [Flujo de datos Maestro → BD → XML](#6-flujo-de-datos)

---

## 1. Tabla `conductores`

**Model Prisma:** `Conductor` · **Tabla DB:** `conductores`  
**Criterio de clasificación:** `NUMLICENCIACONDUCCION > 0`  
**Registros importados:** 2,263

<table>
<thead>
<tr>
  <th>#</th>
  <th>Campo BD</th>
  <th>Tipo Prisma</th>
  <th>Columna Maestro RNDC</th>
  <th>Tag XML RNDC<br/><small>(procesoid 11)</small></th>
  <th>UI<br/>Existe</th>
  <th>Dónde</th>
</tr>
</thead>
<tbody>
<tr>
  <td>1</td>
  <td><code>cedula</code></td>
  <td><code>String @unique</code></td>
  <td><code>NUMIDTERCERO</code></td>
  <td><code>&lt;NUMIDCONDUCTOR&gt;</code></td>
  <td>✅</td>
  <td>Form · List · Detalle</td>
</tr>
<tr>
  <td>2</td>
  <td><code>nombres</code></td>
  <td><code>String</code></td>
  <td><code>NOMIDTERCERO</code></td>
  <td rowspan="2"><code>&lt;NOMBRECONDUCTOR&gt;</code><br/><small>(concatena nombres + apellidos)</small></td>
  <td>✅</td>
  <td>Form · List · Detalle</td>
</tr>
<tr>
  <td>3</td>
  <td><code>apellidos</code></td>
  <td><code>String</code></td>
  <td><code>PRIMERAPELLIDOIDTERCERO</code><br/>+ <code>SEGUNDOAPELLIDOIDTERCERO</code></td>
  <td>✅</td>
  <td>Form · List · Detalle</td>
</tr>
<tr>
  <td>4</td>
  <td><code>categoriaLicencia</code></td>
  <td><code>CategoriaLicencia</code></td>
  <td><code>CODCATEGORIALICENCIACONDUCCION</code></td>
  <td><code>&lt;CODCATEGORIACONDUCTOR&gt;</code></td>
  <td>✅</td>
  <td>Form (select) · List · Detalle</td>
</tr>
<tr>
  <td>5</td>
  <td><code>licenciaVigencia</code></td>
  <td><code>DateTime?</code></td>
  <td><code>FECHAVENCIMIENTOLICENCIA</code></td>
  <td>—</td>
  <td>✅</td>
  <td>Form · List · Detalle</td>
</tr>
<tr>
  <td>6</td>
  <td><code>telefono</code></td>
  <td><code>VarChar(30)</code></td>
  <td><code>NUMTELEFONOCONTACTO</code></td>
  <td>—</td>
  <td>✅</td>
  <td>Form · Detalle</td>
</tr>
<tr style="background:#fff3cd">
  <td>7</td>
  <td><code>celular</code></td>
  <td><code>VarChar(30)</code></td>
  <td><code>NUMCELULARPERSONA</code></td>
  <td>—</td>
  <td>❌</td>
  <td><strong>CREAR</strong> en Form · Detalle</td>
</tr>
<tr>
  <td>8</td>
  <td><code>email</code></td>
  <td><code>VarChar(200)</code></td>
  <td><code>EMAILTERCERO</code></td>
  <td>—</td>
  <td>✅</td>
  <td>Form · Detalle</td>
</tr>
<tr style="background:#fff3cd">
  <td>9</td>
  <td><code>municipio</code></td>
  <td><code>VarChar(100)</code></td>
  <td><code>MUNICIPIORNDC</code> <small>(1ra palabra)</small></td>
  <td>—</td>
  <td>❌</td>
  <td><strong>CREAR</strong> en Form · Detalle</td>
</tr>
<tr style="background:#fff3cd">
  <td>10</td>
  <td><code>daneMunicipio</code></td>
  <td><code>VarChar(5)</code></td>
  <td><code>CODMUNICIPIORNDC</code> <small>(÷1000)</small></td>
  <td>—</td>
  <td>❌</td>
  <td><strong>CREAR</strong> en Form (oculto/auto)</td>
</tr>
<tr style="background:#fff3cd">
  <td>11</td>
  <td><code>direccion</code></td>
  <td><code>VarChar(300)</code></td>
  <td><code>NOMENCLATURADIRECCION</code></td>
  <td>—</td>
  <td>❌</td>
  <td><strong>CREAR</strong> en Form · Detalle</td>
</tr>
<tr style="background:#fff3cd">
  <td>12</td>
  <td><code>latitud</code></td>
  <td><code>Decimal(10,7)</code></td>
  <td><code>LATITUD</code></td>
  <td>—</td>
  <td>❌</td>
  <td><strong>CREAR</strong> en Detalle (mapa)</td>
</tr>
<tr style="background:#fff3cd">
  <td>13</td>
  <td><code>longitud</code></td>
  <td><code>Decimal(10,7)</code></td>
  <td><code>LONGITUD</code></td>
  <td>—</td>
  <td>❌</td>
  <td><strong>CREAR</strong> en Detalle (mapa)</td>
</tr>
<tr>
  <td>14</td>
  <td><code>activo</code></td>
  <td><code>Boolean</code></td>
  <td>— <small>(calculado)</small></td>
  <td>—</td>
  <td>✅</td>
  <td>List (badge)</td>
</tr>
<tr>
  <td>15</td>
  <td><code>notas</code></td>
  <td><code>Text?</code></td>
  <td>—</td>
  <td>—</td>
  <td>✅</td>
  <td>Form · Detalle</td>
</tr>
<tr>
  <td>16</td>
  <td><code>ultimaConsultaRunt</code></td>
  <td><code>DateTime?</code></td>
  <td>—</td>
  <td>—</td>
  <td>✅</td>
  <td>Detalle (card RNDC)</td>
</tr>
<tr>
  <td>17</td>
  <td><code>snapshotRunt</code></td>
  <td><code>Json?</code></td>
  <td>—</td>
  <td>—</td>
  <td>—</td>
  <td><small>Interno (no UI)</small></td>
</tr>
</tbody>
</table>

---

## 2. Tabla `clientes`

**Model Prisma:** `Cliente` · **Tabla DB:** `clientes`  
**Criterio de clasificación:** `NUMLICENCIACONDUCCION == 0` (no es conductor)  
**Registros importados:** 2,691

<table>
<thead>
<tr>
  <th>#</th>
  <th>Campo BD</th>
  <th>Tipo Prisma</th>
  <th>Columna Maestro RNDC</th>
  <th>Tag XML RNDC<br/><small>(procesoid 3 — Remesa)</small></th>
  <th>UI<br/>Existe</th>
  <th>Dónde</th>
</tr>
</thead>
<tbody>
<tr>
  <td>1</td>
  <td><code>tipoId</code></td>
  <td><code>VarChar(1)</code></td>
  <td><code>CODTIPOIDTERCERO</code></td>
  <td><code>&lt;CODTIPOIDREMITENTE&gt;</code><br/><code>&lt;CODTIPOIDDESTINATARIO&gt;</code><br/><code>&lt;CODTIPOIDPROPIETARIO&gt;</code></td>
  <td>✅</td>
  <td>Form (select) · List</td>
</tr>
<tr>
  <td>2</td>
  <td><code>numeroId</code></td>
  <td><code>VarChar(20)</code></td>
  <td><code>NUMIDTERCERO</code></td>
  <td><code>&lt;NUMIDREMITENTE&gt;</code><br/><code>&lt;NUMIDDESTINATARIO&gt;</code><br/><code>&lt;NUMIDPROPIETARIO&gt;</code></td>
  <td>✅</td>
  <td>Form · List</td>
</tr>
<tr>
  <td>3</td>
  <td><code>razonSocial</code></td>
  <td><code>VarChar(200)</code></td>
  <td><strong>NIT:</strong> <code>NOMIDTERCERO</code><br/><strong>CC:</strong> <code>NOM</code> + <code>AP1</code> + <code>AP2</code></td>
  <td>— <small>(no va en XML)</small></td>
  <td>✅</td>
  <td>Form · List</td>
</tr>
<tr>
  <td>4</td>
  <td><code>email</code></td>
  <td><code>VarChar(200)</code></td>
  <td><code>EMAILTERCERO</code></td>
  <td>—</td>
  <td>✅</td>
  <td>Form · List</td>
</tr>
<tr>
  <td>5</td>
  <td><code>telefono</code></td>
  <td><code>VarChar(30)</code></td>
  <td><code>NUMTELEFONOCONTACTO</code></td>
  <td>—</td>
  <td>✅</td>
  <td>Form · List</td>
</tr>
<tr style="background:#fff3cd">
  <td>6</td>
  <td><code>regimenSimple</code></td>
  <td><code>Boolean</code></td>
  <td><code>REGIMENSIMPLE</code></td>
  <td>— <small>(no va en XML)</small></td>
  <td>❌</td>
  <td><strong>CREAR</strong> en Form (checkbox)</td>
</tr>
<tr>
  <td>7</td>
  <td><code>activo</code></td>
  <td><code>Boolean</code></td>
  <td>—</td>
  <td>—</td>
  <td>✅</td>
  <td>List (badge)</td>
</tr>
<tr>
  <td>8</td>
  <td><code>notas</code></td>
  <td><code>Text?</code></td>
  <td>—</td>
  <td>—</td>
  <td>✅</td>
  <td>Form (textarea)</td>
</tr>
</tbody>
</table>

**Clave de unicidad:** `@@unique([tipoId, numeroId])`

---

## 3. Tabla `sucursales_cliente`

**Model Prisma:** `SucursalCliente` · **Tabla DB:** `sucursales_cliente`  
**Registros importados:** 7,502 (2,691 sedes principales + 4,811 sedes adicionales)  
**Clave de unicidad:** `@@unique([clienteId, codSede])`

<table>
<thead>
<tr>
  <th>#</th>
  <th>Campo BD</th>
  <th>Tipo Prisma</th>
  <th>Columna Maestro RNDC</th>
  <th>Tag XML RNDC<br/><small>(procesoid 3 — Remesa)</small></th>
  <th>UI<br/>Existe</th>
  <th>Dónde</th>
</tr>
</thead>
<tbody>
<tr>
  <td>1</td>
  <td><code>clienteId</code></td>
  <td><code>String</code> (FK)</td>
  <td>— <small>(derivado de tipoId + numeroId)</small></td>
  <td>— <small>(implícito)</small></td>
  <td>✅</td>
  <td><small>Relación automática</small></td>
</tr>
<tr>
  <td>2</td>
  <td><code>codSede</code></td>
  <td><code>VarChar(6)</code></td>
  <td><code>CODSEDETERCERO</code></td>
  <td><code>&lt;CODSEDEREMITENTE&gt;</code><br/><code>&lt;CODSEDEDESTINATARIO&gt;</code><br/><code>&lt;CODSEDEPROPIETARIO&gt;</code></td>
  <td>✅</td>
  <td>ClienteForm (sedes)</td>
</tr>
<tr>
  <td>3</td>
  <td><code>nombre</code></td>
  <td><code>VarChar(100)</code></td>
  <td><code>NOMSEDETERCERO</code><br/><small>sede 0 → "Casa Matriz"</small></td>
  <td>—</td>
  <td>✅</td>
  <td>ClienteForm (sedes)</td>
</tr>
<tr>
  <td>4</td>
  <td><code>municipio</code></td>
  <td><code>VarChar(100)</code></td>
  <td><code>MUNICIPIORNDC</code> <small>(1ra palabra)</small></td>
  <td>— <small>(se envía el DANE)</small></td>
  <td>✅</td>
  <td>ClienteForm (sedes)</td>
</tr>
<tr>
  <td>5</td>
  <td><code>daneMunicipio</code></td>
  <td><code>VarChar(5)</code></td>
  <td><code>CODMUNICIPIORNDC</code> <small>(÷1000)</small></td>
  <td><code>&lt;CODMUNICIPIOORIGEN&gt;</code><br/><code>&lt;CODMUNICIPIODESTINO&gt;</code><br/><small>(se multiplica ×1000 → 8 dígitos)</small></td>
  <td>✅</td>
  <td>ClienteForm (sedes)</td>
</tr>
<tr>
  <td>6</td>
  <td><code>direccion</code></td>
  <td><code>VarChar(300)</code></td>
  <td><code>NOMENCLATURADIRECCION</code></td>
  <td><code>&lt;REMDIRREMITENTE&gt;</code></td>
  <td>✅</td>
  <td>ClienteForm (sedes)</td>
</tr>
<tr>
  <td>7</td>
  <td><code>telefono</code></td>
  <td><code>VarChar(30)</code></td>
  <td><code>NUMTELEFONOCONTACTO</code></td>
  <td>—</td>
  <td>✅</td>
  <td>ClienteForm (sedes)</td>
</tr>
<tr>
  <td>8</td>
  <td><code>email</code></td>
  <td><code>VarChar(200)</code></td>
  <td><code>EMAILTERCERO</code></td>
  <td>—</td>
  <td>✅</td>
  <td>ClienteForm (sedes)</td>
</tr>
<tr style="background:#fff3cd">
  <td>9</td>
  <td><code>contactoNombre</code></td>
  <td><code>VarChar(100)</code></td>
  <td><code>NOMSEDETERCERO</code><br/><small>(solo sedes adicionales)</small></td>
  <td>—</td>
  <td>❌</td>
  <td><strong>CREAR</strong> en ClienteForm (sedes)</td>
</tr>
<tr style="background:#fff3cd">
  <td>10</td>
  <td><code>celular</code></td>
  <td><code>VarChar(30)</code></td>
  <td><code>NUMCELULARPERSONA</code></td>
  <td>—</td>
  <td>❌</td>
  <td><strong>CREAR</strong> en ClienteForm (sedes)</td>
</tr>
<tr style="background:#fff3cd">
  <td>11</td>
  <td><code>latitud</code></td>
  <td><code>Decimal(10,7)</code></td>
  <td><code>LATITUD</code></td>
  <td><code>&lt;LATITUDCARGUE&gt;</code><br/><code>&lt;LATITUDDESCARGUE&gt;</code></td>
  <td>❌</td>
  <td><strong>CREAR</strong> en ClienteForm (sedes)</td>
</tr>
<tr style="background:#fff3cd">
  <td>12</td>
  <td><code>longitud</code></td>
  <td><code>Decimal(10,7)</code></td>
  <td><code>LONGITUD</code></td>
  <td><code>&lt;LONGITUDCARGUE&gt;</code><br/><code>&lt;LONGITUDDESCARGUE&gt;</code></td>
  <td>❌</td>
  <td><strong>CREAR</strong> en ClienteForm (sedes)</td>
</tr>
<tr>
  <td>13</td>
  <td><code>activo</code></td>
  <td><code>Boolean</code></td>
  <td>—</td>
  <td>—</td>
  <td>—</td>
  <td><small>Implícito (filtro)</small></td>
</tr>
</tbody>
</table>

---

## 4. Columnas del Maestro NO importadas

Estas columnas del XLS `Maestro_Tercero_RNDC.xls` **no se guardan** en nuestra BD porque son metadatos de la empresa de transporte o redundantes:

<table>
<thead>
<tr>
  <th>Columna Maestro</th>
  <th>Valor típico</th>
  <th>Razón de exclusión</th>
</tr>
</thead>
<tbody>
<tr>
  <td><code>FECHAINGRESO</code></td>
  <td><code>2024-01-15 08:30:00</code></td>
  <td>Fecha de registro del tercero en el RNDC. No es operacional para nosotros.</td>
</tr>
<tr>
  <td><code>USUARIOID</code></td>
  <td><code>12345</code></td>
  <td>ID del usuario RNDC que registró al tercero. No aplica.</td>
</tr>
<tr>
  <td><code>NUMNITEMPRESATRANSPORTE</code></td>
  <td><code>8001234567</code></td>
  <td>Siempre es el NIT de nuestra empresa. Redundante.</td>
</tr>
<tr>
  <td><code>CODIGOEMPRESA</code></td>
  <td><code>999</code></td>
  <td>Código interno RNDC de nuestra empresa. Redundante.</td>
</tr>
<tr>
  <td><code>TEREMPRESA</code></td>
  <td><code>CARGOCLICK SAS</code></td>
  <td>Nombre de nuestra empresa. Redundante.</td>
</tr>
<tr>
  <td><code>TIPOIDTERCERO</code></td>
  <td><code>NIT DE EMPRESA</code></td>
  <td>Texto legible del tipo. Ya usamos <code>CODTIPOIDTERCERO</code> (N/C/E/P).</td>
</tr>
<tr>
  <td><code>CODPAIS</code></td>
  <td><code>169</code></td>
  <td>Siempre "169" (Colombia). No aplica.</td>
</tr>
<tr>
  <td><code>NOMBREPAIS</code></td>
  <td><code>COLOMBIA</code></td>
  <td>Siempre "COLOMBIA". No aplica.</td>
</tr>
<tr>
  <td><code>NUMLICENCIACONDUCCION</code></td>
  <td><code>1234567890</code></td>
  <td>Número de la licencia. Solo se usa para clasificar (&gt;0 = conductor).</td>
</tr>
<tr>
  <td><code>NOMSEDETERCERO</code><br/><small>(para conductores)</small></td>
  <td><code>JUAN PEREZ</code></td>
  <td>Para conductores es redundante con <code>nombres</code> + <code>apellidos</code>.</td>
</tr>
<tr>
  <td><code>CODSEDETERCERO</code><br/><small>(para conductores)</small></td>
  <td><code>0</code></td>
  <td>Para conductores siempre es "0" (sede única).</td>
</tr>
</tbody>
</table>

---

## 5. Campos que faltan en la UI

Resumen de todos los campos que **ya existen en la BD** (importados del Maestro) pero que **aún no tienen componente en la UI**:

<table>
<thead>
<tr>
  <th>Modelo</th>
  <th>Campo</th>
  <th>Label sugerido UI</th>
  <th>Componente</th>
  <th>Agregar en</th>
  <th>Prioridad</th>
</tr>
</thead>
<tbody>
<tr style="background:#f8d7da">
  <td><strong>Conductor</strong></td>
  <td><code>celular</code></td>
  <td>Celular</td>
  <td>Input text</td>
  <td>ConductorForm · ConductorDetalle</td>
  <td>🔴 Alta</td>
</tr>
<tr style="background:#fff3cd">
  <td><strong>Conductor</strong></td>
  <td><code>municipio</code></td>
  <td>Municipio</td>
  <td>Autocomplete municipios</td>
  <td>ConductorForm · ConductorDetalle</td>
  <td>🟡 Media</td>
</tr>
<tr>
  <td><strong>Conductor</strong></td>
  <td><code>daneMunicipio</code></td>
  <td><small>(auto del municipio)</small></td>
  <td>Hidden / auto-fill</td>
  <td>ConductorForm</td>
  <td>⚪ Baja</td>
</tr>
<tr style="background:#fff3cd">
  <td><strong>Conductor</strong></td>
  <td><code>direccion</code></td>
  <td>Dirección</td>
  <td>Input text</td>
  <td>ConductorForm · ConductorDetalle</td>
  <td>🟡 Media</td>
</tr>
<tr>
  <td><strong>Conductor</strong></td>
  <td><code>latitud</code> / <code>longitud</code></td>
  <td>Ubicación GPS</td>
  <td>Mini-mapa / coords</td>
  <td>ConductorDetalle</td>
  <td>⚪ Baja</td>
</tr>
<tr style="background:#f8d7da">
  <td><strong>Cliente</strong></td>
  <td><code>regimenSimple</code></td>
  <td>Régimen Simple</td>
  <td>Checkbox / Switch</td>
  <td>ClienteForm</td>
  <td>🔴 Alta</td>
</tr>
<tr style="background:#f8d7da">
  <td><strong>Sucursal</strong></td>
  <td><code>contactoNombre</code></td>
  <td>Contacto</td>
  <td>Input text</td>
  <td>ClienteForm (sección sedes)</td>
  <td>🔴 Alta</td>
</tr>
<tr style="background:#f8d7da">
  <td><strong>Sucursal</strong></td>
  <td><code>celular</code></td>
  <td>Celular sede</td>
  <td>Input text</td>
  <td>ClienteForm (sección sedes)</td>
  <td>🔴 Alta</td>
</tr>
<tr style="background:#fff3cd">
  <td><strong>Sucursal</strong></td>
  <td><code>latitud</code> / <code>longitud</code></td>
  <td>Coordenadas GPS</td>
  <td>2 inputs decimales / mapa</td>
  <td>ClienteForm (sección sedes)</td>
  <td>🟡 Media</td>
</tr>
</tbody>
</table>

> **Nota:** Las coordenadas GPS de la sucursal (`latitud` / `longitud`) se usan al crear Remesas — se copian a `<LATITUDCARGUE>` / `<LONGITUDCARGUE>` y `<LATITUDDESCARGUE>` / `<LONGITUDDESCARGUE>` en el XML del procesoid 3.

---

## 6. Flujo de datos

### Maestro XLS → Base de datos CargoClick

```
┌─────────────────────────────────┐     ┌──────────────────────────┐
│  Maestro_Tercero_RNDC.xls       │     │  scripts/importar-       │
│  10,484 filas × 27 columnas     │────▶│  terceros.js             │
└─────────────────────────────────┘     └──────────┬───────────────┘
                                                   │
                    ┌──────────────────────────────┬┴──────────────────────┐
                    ▼                              ▼                      ▼
          ┌─────────────────┐          ┌──────────────────┐    ┌──────────────────┐
          │  conductores    │          │  clientes         │    │ sucursales_      │
          │  2,263 registros│          │  2,691 registros  │    │ cliente          │
          │                 │          │                   │    │ 7,502 registros  │
          │ NUMLICENCIA > 0 │          │ NUMLICENCIA == 0  │    │ (sede 0 + adic.) │
          └─────────────────┘          └──────────────────┘    └──────────────────┘
```

### Base de datos → XML RNDC (flujo operacional)

```
┌──────────────────────────┐          XML procesoid 11
│  conductor               │────────▶ <NUMIDCONDUCTOR>
│  .cedula                 │          <NOMBRECONDUCTOR> (nombres + apellidos)
│  .categoriaLicencia      │          <CODCATEGORIACONDUCTOR>
└──────────────────────────┘

┌──────────────────────────┐
│  cliente                 │          XML procesoid 3 (Remesa)
│  .tipoId                │────────▶ <CODTIPOIDREMITENTE> / <CODTIPOIDDESTINATARIO>
│  .numeroId              │────────▶ <NUMIDREMITENTE>    / <NUMIDDESTINATARIO>
└──────────────────────────┘

┌──────────────────────────┐
│  sucursal_cliente        │          XML procesoid 3 (Remesa)
│  .codSede               │────────▶ <CODSEDEREMITENTE>  / <CODSEDEDESTINATARIO>
│  .daneMunicipio + "000" │────────▶ <CODMUNICIPIOORIGEN>/ <CODMUNICIPIODESTINO>
│  .direccion             │────────▶ <REMDIRREMITENTE>
│  .latitud               │────────▶ <LATITUDCARGUE>     / <LATITUDDESCARGUE>
│  .longitud              │────────▶ <LONGITUDCARGUE>    / <LONGITUDDESCARGUE>
└──────────────────────────┘
```

### Conversión código municipio DANE ↔ RNDC

```
BD CargoClick          →  XML RNDC (8 dígitos)
daneMunicipio "41001"  →  "41001" + "000" = "41001000"  →  <CODMUNICIPIOORIGEN>

XLS Maestro RNDC       →  BD CargoClick (5 dígitos)
CODMUNICIPIORNDC        →  quitar trailing "000"
"41001000" (8 dígitos)  →  "41001"
"5212000"  (7 dígitos)  →  pad left → "05212"
```

---

## Notas técnicas

### Clasificación conductor vs cliente

```javascript
// En el XLS, conductores y clientes están mezclados en la misma tabla.
// Criterio: si tiene número de licencia > 0, es conductor.
const esConductor = (row) => Number(row['NUMLICENCIACONDUCCION']) > 0;
```

### Sedes: principal vs adicional

| `CODSEDETERCERO` | Tipo | Cómo se importa |
|---|---|---|
| `"0"` | Sede principal | Crea `Cliente` + `SucursalCliente` con `codSede="0"` y `nombre="Casa Matriz"` |
| Cualquier otro | Sede adicional | Crea solo `SucursalCliente` adicional vinculada al `clienteId` existente |

### Re-import (idempotencia)

El script usa **upsert** en todas las operaciones:
- **Conductor:** `WHERE cedula = X` → update o create
- **Cliente:** `WHERE tipoId + numeroId = X` → update o create  
- **Sucursal:** `WHERE clienteId + codSede = X` → update o create

Se puede re-ejecutar con un nuevo XLS del Ministerio sin crear duplicados.
