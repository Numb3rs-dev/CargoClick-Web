/**
 * importar-terceros.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Lee el Maestro_Tercero_RNDC.xls y lo importa a las tablas `clientes`,
 * `sucursales_cliente` y `conductores` de CargoClick.
 *
 * Regla de separación:
 *   - NUMLICENCIACONDUCCION > 0  →  Conductor
 *   - NUMLICENCIACONDUCCION == 0 →  Cliente  (remitente / destinatario)
 *
 * Para clientes con varias sedes:
 *   - CODSEDETERCERO == "0"  →  upsert Cliente + SucursalCliente principal
 *   - CODSEDETERCERO != "0"  →  upsert SucursalCliente adicional
 *
 * Uso: node scripts/importar-terceros.js [--dry-run]
 *
 * Flags:
 *   --dry-run   Solo lee el XLS y muestra estadísticas sin tocar la DB.
 */

'use strict';

const path   = require('path');
const XLSX   = require('xlsx');
const { PrismaClient } = require('@prisma/client');

// ─── Config ──────────────────────────────────────────────────────────────────

const XLS_PATH = path.join(
  __dirname, '..', '..', 'data',
  'maestros-rndc', 'Maestro_Tercero_RNDC.xls'
);

const DRY_RUN = process.argv.includes('--dry-run');
const LOTE    = 100; // filas por lote de upsert

// ─── Enum mapping CategoriaLicencia ──────────────────────────────────────────
// Los posibles valores del RNDC son iguales a nuestro enum (A1, A2, B1 … C3)
const LICENCIAS_VALIDAS = new Set(['A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3']);

function mapLicencia(codRndc) {
  const cod = String(codRndc || '').trim().toUpperCase();
  if (LICENCIAS_VALIDAS.has(cod)) return cod;
  // Valor por defecto para conductores sin categoría registrada en el XLS
  console.warn(`  [WARN] Categoría licencia desconocida: "${codRndc}" → usando C2`);
  return 'C2';
}

// ─── Parsers de fechas ────────────────────────────────────────────────────────
/**
 * Convierte la fecha de vencimiento del RNDC al formato "YYYY-MM-DDTHH:MM:SS"
 * El formato en el XLS es: "YYYY-MM-DD-HH:MM:SS"  (tercer guion en lugar de T)
 */
function parseFechaRndc(val) {
  if (!val || val === ' ' || val === '') return null;
  const s = String(val).trim();
  // Formato: "2027-04-29-00:00:00"
  const match = s.match(/^(\d{4}-\d{2}-\d{2})-(\d{2}:\d{2}:\d{2})$/);
  if (match) return new Date(`${match[1]}T${match[2]}`);
  // Intentar parseo directo como fallback
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

/**
 * Convierte serial de fecha de Excel al Date de JS.
 * XLSX ya suele devolver Date cuando se usa cellDates:true, pero por seguridad.
 */
function parseExcelDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === 'number') {
    // Excel serial: días desde 1900-01-01 (con bug de 1900 como bisiesto)
    return XLSX.SSF.parse_date_code(val);
  }
  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function str(val) {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  return s === '' ? null : s;
}

function strUpper(val) {
  const s = str(val);
  return s ? s.toUpperCase() : null;
}

function bool(val) {
  return String(val || '').trim().toUpperCase() === 'S';
}

function num(val) {
  const n = Number(val);
  return isNaN(n) ? null : n;
}

// CODSEDETERCERO llega como número 0 o string alfanumérico
function parseCodSede(val) {
  const s = String(val).trim();
  return s === '0' || s === '' ? '0' : s;
}

// Determina si la fila pertenece a un conductor
function esConductor(row) {
  const numLic = Number(row['NUMLICENCIACONDUCCION']);
  return !isNaN(numLic) && numLic > 0;
}

// ─── Lectura del XLS ─────────────────────────────────────────────────────────

function leerXLS() {
  console.log(`Leyendo: ${XLS_PATH}`);
  const wb = XLSX.readFile(XLS_PATH, { cellDates: false, raw: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: null });
  console.log(`  Filas leídas: ${rows.length}`);
  return rows;
}

// ─── Clasificación de filas ───────────────────────────────────────────────────

function clasificarFilas(rows) {
  const conductores       = [];
  const clientesPrincipal = []; // CODSEDETERCERO = "0"
  const sedesAdicionales  = []; // CODSEDETERCERO != "0"
  const omitidas          = [];

  for (const row of rows) {
    const numId = str(row['NUMIDTERCERO']);
    if (!numId) { omitidas.push(row); continue; }

    if (esConductor(row)) {
      // Solo importamos la fila de sede principal para el conductor
      const codSede = parseCodSede(row['CODSEDETERCERO']);
      if (codSede === '0') {
        conductores.push(row);
      }
      // Las sedes adicionales de conductores las ignoramos (no aplica al negocio)
    } else {
      const codSede = parseCodSede(row['CODSEDETERCERO']);
      if (codSede === '0') {
        clientesPrincipal.push(row);
      } else {
        sedesAdicionales.push(row);
      }
    }
  }

  return { conductores, clientesPrincipal, sedesAdicionales, omitidas };
}

// ─── Mapeo de filas a modelos Prisma ──────────────────────────────────────────

function rowToConductor(row) {
  const cedula   = String(row['NUMIDTERCERO']).trim();
  const nombres  = strUpper(row['NOMIDTERCERO']) || 'SIN NOMBRE';
  const apellido1 = strUpper(row['PRIMERAPELLIDOIDTERCERO']);
  const apellido2 = strUpper(row['SEGUNDOAPELLIDOIDTERCERO']);
  const apellidos = [apellido1, apellido2].filter(Boolean).join(' ') || 'SIN APELLIDO';

  // Ubicación del conductor (sede principal = su domicilio)
  const daneMunicipio = parseDane(row['CODMUNICIPIORNDC']);
  const municipioRaw  = strUpper(row['MUNICIPIORNDC']);
  const municipio     = municipioRaw ? municipioRaw.split(' ')[0] : null; // "NEIVA" sin dpto
  const celularRaw    = str(row['NUMCELULARPERSONA']);
  const celular       = celularRaw && celularRaw !== '0' ? celularRaw : null;

  return {
    cedula,
    codTipoId            : strUpper(row['CODTIPOIDTERCERO']) || 'C',
    tipoIdTexto          : str(row['TIPOIDTERCERO']),
    nombres,
    apellidos,
    categoriaLicencia    : mapLicencia(row['CODCATEGORIALICENCIACONDUCCION']),
    numLicencia          : str(row['NUMLICENCIACONDUCCION']),
    licenciaVigencia     : parseFechaRndc(row['FECHAVENCIMIENTOLICENCIA']),
    telefono             : str(row['NUMTELEFONOCONTACTO']) !== '0' ? str(row['NUMTELEFONOCONTACTO']) : null,
    celular,
    email                : str(row['EMAILTERCERO']),
    municipio,
    daneMunicipio,
    direccion            : str(row['NOMENCLATURADIRECCION']),
    latitud              : num(row['LATITUD'])  || null,
    longitud             : num(row['LONGITUD']) || null,
    codSede              : parseCodSede(row['CODSEDETERCERO']),
    nomSede              : strUpper(row['NOMSEDETERCERO']),
    regimenSimple        : bool(row['REGIMENSIMPLE']),
    codPais              : str(row['CODPAIS']),
    nombrePais           : str(row['NOMBREPAIS']),
    nitEmpresaTransporte : str(row['NUMNITEMPRESATRANSPORTE']),
    codigoEmpresaRndc    : str(row['CODIGOEMPRESA']),
    nombreEmpresaRndc    : str(row['TEREMPRESA']),
    fechaIngresoRndc     : parseFechaRndc(row['FECHAINGRESO']),
    usuarioRndc          : str(row['USUARIOID']),
    sincronizadoRndc     : true,
    activo               : true,
  };
}

function rowToCliente(row) {
  const tipoId   = strUpper(row['CODTIPOIDTERCERO']) || 'N';
  const numeroId = String(row['NUMIDTERCERO']).trim();

  // Campos de nombres desagregados (se guardan siempre)
  const nombres     = strUpper(row['NOMIDTERCERO']) || null;
  const apellido1   = strUpper(row['PRIMERAPELLIDOIDTERCERO']) || null;
  const apellido2   = strUpper(row['SEGUNDOAPELLIDOIDTERCERO']) || null;

  // razonSocial = nombre completo consolidado para display
  let razonSocial;
  if (tipoId === 'N') {
    razonSocial = nombres || numeroId;
  } else {
    const apellidos = [apellido1, apellido2].filter(Boolean).join(' ');
    razonSocial = [nombres, apellidos].filter(Boolean).join(' ').trim() || numeroId;
  }

  // Licencia (normalmente 0/vacío para clientes pero se guarda todo)
  const numLicRaw = str(row['NUMLICENCIACONDUCCION']);
  const numLicencia = numLicRaw && numLicRaw !== '0' ? numLicRaw : null;
  const categoriaLicencia = numLicencia ? mapLicencia(row['CODCATEGORIALICENCIACONDUCCION']) : null;
  const fechaVencLic = numLicencia ? parseFechaRndc(row['FECHAVENCIMIENTOLICENCIA']) : null;

  return {
    tipoId,
    tipoIdTexto          : str(row['TIPOIDTERCERO']),
    numeroId,
    razonSocial,
    nombres,
    primerApellido       : apellido1,
    segundoApellido      : apellido2,
    email                : str(row['EMAILTERCERO']),
    telefono             : str(row['NUMTELEFONOCONTACTO']) !== '0' ? str(row['NUMTELEFONOCONTACTO']) : null,
    regimenSimple        : bool(row['REGIMENSIMPLE']),
    categoriaLicencia,
    numLicencia,
    fechaVencimientoLicencia : fechaVencLic,
    codPais              : str(row['CODPAIS']),
    nombrePais           : str(row['NOMBREPAIS']),
    nitEmpresaTransporte : str(row['NUMNITEMPRESATRANSPORTE']),
    codigoEmpresaRndc    : str(row['CODIGOEMPRESA']),
    nombreEmpresaRndc    : str(row['TEREMPRESA']),
    fechaIngresoRndc     : parseFechaRndc(row['FECHAINGRESO']),
    usuarioRndc          : str(row['USUARIOID']),
    sincronizadoRndc     : true,
    activo               : true,
  };
}

function rowToSucursal(row, { codSede, esAdicional }) {

  // NOMSEDETERCERO:
  //  - sede "0" de empresa  = nombre genérico "PRINCIPAL" → lo normaliza el campo nombre
  //  - sede adicional        = nombre del contacto en ese punto de entrega
  const nomSede      = strUpper(row['NOMSEDETERCERO']);
  const nombre       = esAdicional ? (nomSede || 'SEDE') : 'Casa Matriz';
  const contactoNom  = esAdicional ? nomSede : null;

  // Municipio / DANE
  const daneMunicipio = parseDane(row['CODMUNICIPIORNDC']); // elimina trailing "000"
  const municipio     = strUpper(row['MUNICIPIORNDC']);     // "NEIVA HUILA" (solo referencial)

  // GPS
  const latRaw = num(row['LATITUD']);
  const lonRaw = num(row['LONGITUD']);

  // Celular: puede venir como número con muchos dígitos (NUMLICENCIACONDUCCION a veces es el número de lic.)
  const celularRaw = str(row['NUMCELULARPERSONA']);
  const celular    = celularRaw && celularRaw !== '0' ? celularRaw : null;

  return {
    codSede,
    nombre,
    contactoNombre : contactoNom,
    municipio      : municipio ? municipio.split(' ')[0] : null, // "NEIVA" sólo, sin dept
    daneMunicipio,
    direccion      : str(row['NOMENCLATURADIRECCION']),
    telefono       : str(row['NUMTELEFONOCONTACTO']) !== '0' ? str(row['NUMTELEFONOCONTACTO']) : null,
    celular,
    email          : str(row['EMAILTERCERO']),
    latitud        : latRaw,
    longitud       : lonRaw,
    activo         : true,
  };
}

/**
 * RNDC envía el código de municipio como DANE 5 dígitos + "000".
 * Ej: 41001000 → "41001"
 */
function parseDane(codMunRndc) {
  if (!codMunRndc) return null;
  const s = String(codMunRndc).trim();
  // RNDC envía DANE + "000". Puede ser 8 dígitos (05212000) o 7 (5212000) sin cero líder.
  if (s.endsWith('000') && s.length >= 7 && s.length <= 8) {
    const dane = s.slice(0, -3).padStart(5, '0'); // "5212" → "05212"
    return dane;
  }
  if (s.length === 5) return s;
  return s.length <= 5 ? s.padStart(5, '0') : null;
}

// ─── Importación en lotes ─────────────────────────────────────────────────────

async function importarConductores(prisma, rows) {
  console.log(`\n── Conductores: ${rows.length} filas principales`);
  let ok = 0, err = 0;

  for (let i = 0; i < rows.length; i += LOTE) {
    const lote = rows.slice(i, i + LOTE);
    await Promise.all(lote.map(async (row) => {
      const data = rowToConductor(row);
      try {
        await prisma.conductor.upsert({
          where  : { cedula: data.cedula },
          create : data,
          update : {
            codTipoId            : data.codTipoId,
            tipoIdTexto          : data.tipoIdTexto,
            nombres              : data.nombres,
            apellidos            : data.apellidos,
            categoriaLicencia    : data.categoriaLicencia,
            numLicencia          : data.numLicencia,
            licenciaVigencia     : data.licenciaVigencia,
            telefono             : data.telefono,
            celular              : data.celular,
            email                : data.email,
            municipio            : data.municipio,
            daneMunicipio        : data.daneMunicipio,
            direccion            : data.direccion,
            latitud              : data.latitud,
            longitud             : data.longitud,
            codSede              : data.codSede,
            nomSede              : data.nomSede,
            regimenSimple        : data.regimenSimple,
            codPais              : data.codPais,
            nombrePais           : data.nombrePais,
            nitEmpresaTransporte : data.nitEmpresaTransporte,
            codigoEmpresaRndc    : data.codigoEmpresaRndc,
            nombreEmpresaRndc    : data.nombreEmpresaRndc,
            fechaIngresoRndc     : data.fechaIngresoRndc,
            usuarioRndc          : data.usuarioRndc,
            sincronizadoRndc     : true,
          },
        });
        ok++;
      } catch (e) {
        console.error(`  [ERR conductor] ${data.cedula}: ${e.message}`);
        err++;
      }
    }));
    process.stdout.write(`\r  Procesado: ${Math.min(i + LOTE, rows.length)}/${rows.length}`);
  }

  console.log(`\n  ✓ Conductores: ${ok} ok, ${err} errores`);
  return { ok, err };
}

async function importarClientes(prisma, filasPrincipal, filasAdicionales) {
  console.log(`\n── Clientes principales: ${filasPrincipal.length} filas`);
  console.log(`── Sedes adicionales:    ${filasAdicionales.length} filas`);

  let okClientes = 0, okSucursales = 0, errClientes = 0, errSucursales = 0;

  // ── Paso 1: Upsert de Clientes + sucursal principal ──
  for (let i = 0; i < filasPrincipal.length; i += LOTE) {
    const lote = filasPrincipal.slice(i, i + LOTE);
    await Promise.all(lote.map(async (row) => {
      const clienteData = rowToCliente(row);
      const sucursalData = rowToSucursal(row, { codSede: '0', esAdicional: false });

      try {
        const cliente = await prisma.cliente.upsert({
          where  : { tipoId_numeroId: { tipoId: clienteData.tipoId, numeroId: clienteData.numeroId } },
          create : clienteData,
          update : {
            razonSocial              : clienteData.razonSocial,
            tipoIdTexto              : clienteData.tipoIdTexto,
            nombres                  : clienteData.nombres,
            primerApellido           : clienteData.primerApellido,
            segundoApellido          : clienteData.segundoApellido,
            email                    : clienteData.email,
            telefono                 : clienteData.telefono,
            regimenSimple            : clienteData.regimenSimple,
            categoriaLicencia        : clienteData.categoriaLicencia,
            numLicencia              : clienteData.numLicencia,
            fechaVencimientoLicencia : clienteData.fechaVencimientoLicencia,
            codPais                  : clienteData.codPais,
            nombrePais               : clienteData.nombrePais,
            nitEmpresaTransporte     : clienteData.nitEmpresaTransporte,
            codigoEmpresaRndc        : clienteData.codigoEmpresaRndc,
            nombreEmpresaRndc        : clienteData.nombreEmpresaRndc,
            fechaIngresoRndc         : clienteData.fechaIngresoRndc,
            usuarioRndc              : clienteData.usuarioRndc,
            sincronizadoRndc         : true,
          },
        });
        okClientes++;

        // Upsert SucursalCliente principal
        await prisma.sucursalCliente.upsert({
          where  : { clienteId_codSede: { clienteId: cliente.id, codSede: '0' } },
          create : { clienteId: cliente.id, ...sucursalData },
          update : {
            municipio      : sucursalData.municipio,
            daneMunicipio  : sucursalData.daneMunicipio,
            direccion      : sucursalData.direccion,
            telefono       : sucursalData.telefono,
            celular        : sucursalData.celular,
            email          : sucursalData.email,
            latitud        : sucursalData.latitud,
            longitud       : sucursalData.longitud,
          },
        });
        okSucursales++;
      } catch (e) {
        console.error(`  [ERR cliente] ${clienteData.tipoId}:${clienteData.numeroId}: ${e.message}`);
        errClientes++;
      }
    }));
    process.stdout.write(`\r  Clientes: ${Math.min(i + LOTE, filasPrincipal.length)}/${filasPrincipal.length}`);
  }
  console.log(`\n  ✓ Clientes: ${okClientes} ok, ${errClientes} errores`);

  // ── Paso 2: Sedes adicionales ──
  // Requiere que el Cliente ya exista (paso 1 garantiza esto)
  if (filasAdicionales.length === 0) return { okClientes, okSucursales, errClientes, errSucursales };

  console.log('  Procesando sedes adicionales...');

  // Construimos un mapa de (tipoId, numeroId) → clienteId para evitar N queries
  const idMap = new Map();
  const clientes = await prisma.cliente.findMany({ select: { id: true, tipoId: true, numeroId: true } });
  for (const c of clientes) idMap.set(`${c.tipoId}:${c.numeroId}`, c.id);

  for (let i = 0; i < filasAdicionales.length; i += LOTE) {
    const lote = filasAdicionales.slice(i, i + LOTE);
    await Promise.all(lote.map(async (row) => {
      const tipoId   = strUpper(row['CODTIPOIDTERCERO']) || 'N';
      const numeroId = String(row['NUMIDTERCERO']).trim();
      const clienteId = idMap.get(`${tipoId}:${numeroId}`);

      if (!clienteId) {
        console.warn(`  [SKIP] Sede adicional sin cliente previo: ${tipoId}:${numeroId} sede ${row['CODSEDETERCERO']}`);
        errSucursales++;
        return;
      }

      const codSede = parseCodSede(row['CODSEDETERCERO']);
      const sucursalData = rowToSucursal(row, { codSede, esAdicional: true });

      try {
        await prisma.sucursalCliente.upsert({
          where  : { clienteId_codSede: { clienteId, codSede } },
          create : { clienteId, ...sucursalData },
          update : {
            nombre         : sucursalData.nombre,
            contactoNombre : sucursalData.contactoNombre,
            municipio      : sucursalData.municipio,
            daneMunicipio  : sucursalData.daneMunicipio,
            direccion      : sucursalData.direccion,
            telefono       : sucursalData.telefono,
            celular        : sucursalData.celular,
            email          : sucursalData.email,
            latitud        : sucursalData.latitud,
            longitud       : sucursalData.longitud,
          },
        });
        okSucursales++;
      } catch (e) {
        console.error(`  [ERR sucursal] ${tipoId}:${numeroId} sede ${codSede}: ${e.message}`);
        errSucursales++;
      }
    }));
    process.stdout.write(`\r  Sedes: ${Math.min(i + LOTE, filasAdicionales.length)}/${filasAdicionales.length}`);
  }
  console.log(`\n  ✓ Sucursales totales: ${okSucursales} ok, ${errSucursales} errores`);

  return { okClientes, okSucursales, errClientes, errSucursales };
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  const rows = leerXLS();
  const { conductores, clientesPrincipal, sedesAdicionales, omitidas } = clasificarFilas(rows);

  console.log('\n─── Resumen de clasificación ──────────────────────────────');
  console.log(`  Total filas       : ${rows.length}`);
  console.log(`  Conductores       : ${conductores.length} (filas de sede principal)`);
  console.log(`  Clientes          : ${clientesPrincipal.length} (filas principales)`);
  console.log(`  Sedes adicionales : ${sedesAdicionales.length}`);
  console.log(`  Omitidas          : ${omitidas.length} (sin NUMIDTERCERO)`);

  if (DRY_RUN) {
    console.log('\n  [DRY RUN] No se realizaron cambios en la base de datos.');
    // Muestra una muestra
    console.log('\n  Muestra Conductores (3):');
    conductores.slice(0, 3).forEach(r => {
      const d = rowToConductor(r);
      console.log(`    ${d.cedula} | ${d.nombres} ${d.apellidos} | lic:${r['NUMLICENCIACONDUCCION']}`);
    });
    console.log('\n  Muestra Clientes (3):');
    clientesPrincipal.slice(0, 3).forEach(r => {
      const d = rowToCliente(r);
      console.log(`    ${d.tipoId}:${d.numeroId} | ${d.razonSocial}`);
    });
    console.log('\n  Muestra Sedes adicionales (3):');
    sedesAdicionales.slice(0, 3).forEach(r => {
      console.log(`    ${r['CODTIPOIDTERCERO']}:${r['NUMIDTERCERO']} | sede:${r['CODSEDETERCERO']} | ${r['NOMSEDETERCERO']}`);
    });
    return;
  }

  // Importación real
  const prisma = new PrismaClient();
  try {
    const t0 = Date.now();
    await importarConductores(prisma, conductores);
    await importarClientes(prisma, clientesPrincipal, sedesAdicionales);
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`\n✅ Importación completada en ${secs}s`);
  } catch (e) {
    console.error('\n❌ Error fatal:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(err => {
  console.error('Error no manejado:', err);
  process.exit(1);
});
