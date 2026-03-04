/**
 * Backfill: Poblar todos los campos RNDC faltantes en las 3 tablas
 * desde los Excel del Ministerio de Transporte.
 *
 * - Vehículos: FECHAINGRESO, USUARIOID, VEHEMPRESA, NUMNITEMPRESATRANSPORTE, VEHDIFERENCIAS, CODIGOEMPRESA
 * - Manifiestos: FECHAINGRESO, USUARIO, INTERACTIVO, CODIGOEMPRESA, NUMNITEMPRESATRANSPORTE, ANOMES, USUARIOINGR
 * - Remesas: USUARIO, INTERACTIVO, CODIGOEMPRESA, NUMNITEMPRESATRANSPORTE, REMEMPRESA, USUARIOINGR,
 *            CANTIDADINFORMACIONCARGA, NUMIDGPS, REM_PROP, NUMPLACA, CODMUNICIPIOTRASBORDO2,
 *            NOMMUNICIPIOTRASBORDO2, GRUPOEMBALAJEENVASE, CODIGOARANCEL_CODE, HORACITA (fix hours)
 *
 * Uso: node scripts/backfill-campos-rndc.js
 */

const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

const BASE = path.join(__dirname, '..', 'definicion-FuncionalyTecnica', 'Ministerio de transporte');

function clean(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' || s === ' ' ? null : s;
}
function toInt(v) {
  if (v === undefined || v === null) return null;
  const n = parseInt(v);
  return isNaN(n) ? null : n;
}
function toFloat(v) {
  if (v === undefined || v === null) return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}
function padDane(code) {
  if (!code) return null;
  return String(code).padStart(8, '0');
}
function excelDateToJs(serial) {
  if (!serial) return null;
  if (typeof serial === 'number') {
    const epoch = new Date(1899, 11, 30);
    return new Date(epoch.getTime() + serial * 86400000);
  }
  // Manejar fechas como string (ej: "2019/01/01 12:43:08")
  if (typeof serial === 'string') {
    const d = new Date(serial.replace(/\//g, '-'));
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function loadExcel(file) {
  const fp = path.join(BASE, file);
  console.log(`  📂 Cargando ${file}...`);
  const wb = XLSX.readFile(fp);
  const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: null });
  console.log(`     ${data.length} filas`);
  return data;
}

const BATCH = 500;

// ============================================
// VEHÍCULOS
// ============================================
async function backfillVehiculos() {
  console.log('\n🚛 VEHÍCULOS — backfill metadatos RNDC...');
  const xlsData = loadExcel('Maestro_Vehículo_RNDC.xls');

  // Mapa: placa → datos Excel
  const xlsMap = new Map();
  for (const v of xlsData) {
    const placa = clean(v.NUMPLACA);
    if (placa) xlsMap.set(placa, v);
  }

  // Leer vehículos que necesitan backfill (los que no tienen fechaIngresoRndc)
  const vehiculos = await prisma.vehiculo.findMany({
    where: { fechaIngresoRndc: null },
    select: { id: true, placa: true }
  });
  console.log(`  ${vehiculos.length} vehículos sin metadatos RNDC`);

  let updated = 0;
  const ops = [];
  for (const veh of vehiculos) {
    const xls = xlsMap.get(veh.placa);
    if (!xls) continue;

    ops.push(prisma.vehiculo.update({
      where: { id: veh.id },
      data: {
        fechaIngresoRndc: excelDateToJs(xls.FECHAINGRESO),
        usuarioIdRndc: toInt(xls.USUARIOID),
        empresaTransporteRndc: clean(xls.VEHEMPRESA),
        nitEmpresaTransporte: clean(xls.NUMNITEMPRESATRANSPORTE),
        diferenciasRndc: clean(xls.VEHDIFERENCIAS),
        codigoEmpresaRndc: toInt(xls.CODIGOEMPRESA),
      }
    }));

    if (ops.length >= BATCH) {
      await prisma.$transaction(ops);
      updated += ops.length;
      process.stdout.write(`\r  ✅ ${updated} actualizados...`);
      ops.length = 0;
    }
  }
  if (ops.length) {
    await prisma.$transaction(ops);
    updated += ops.length;
  }
  console.log(`\n  ✅ Vehículos: ${updated} actualizados`);
}

// ============================================
// MANIFIESTOS
// ============================================
async function backfillManifiestos() {
  console.log('\n📋 MANIFIESTOS — backfill metadatos RNDC...');
  const xlsData = loadExcel('Manifiestos_RNDC (5).xls');

  // Mapa: NUMMANIFIESTOCARGA → datos Excel
  const xlsMap = new Map();
  for (const m of xlsData) {
    const num = String(m.NUMMANIFIESTOCARGA).trim();
    if (num) xlsMap.set(num, m);
  }

  // Leer manifiestos sin fechaIngresoRndc
  const manifiestos = await prisma.manifiestoOperativo.findMany({
    where: { fechaIngresoRndc: null },
    select: { id: true, codigoInterno: true }
  });
  console.log(`  ${manifiestos.length} manifiestos sin metadatos RNDC`);

  let updated = 0;
  const ops = [];
  for (const man of manifiestos) {
    const xls = xlsMap.get(man.codigoInterno);
    if (!xls) continue;

    ops.push(prisma.manifiestoOperativo.update({
      where: { id: man.id },
      data: {
        fechaIngresoRndc: excelDateToJs(xls.FECHAINGRESO),
        usuarioRndc: clean(xls.USUARIO),
        interactivoRndc: clean(xls.INTERACTIVO),
        codigoEmpresaRndc: toInt(xls.CODIGOEMPRESA),
        nitEmpresaTransporte: clean(xls.NUMNITEMPRESATRANSPORTE),
        anoMesRndc: toInt(xls.ANOMES),
        usuarioIngresoRndc: toInt(xls.USUARIOINGR),
      }
    }));

    if (ops.length >= BATCH) {
      await prisma.$transaction(ops);
      updated += ops.length;
      process.stdout.write(`\r  ✅ ${updated} actualizados...`);
      ops.length = 0;
    }
  }
  if (ops.length) {
    await prisma.$transaction(ops);
    updated += ops.length;
  }
  console.log(`\n  ✅ Manifiestos: ${updated} actualizados`);
}

// ============================================
// REMESAS
// ============================================
async function backfillRemesas() {
  console.log('\n📦 REMESAS — backfill metadatos + extras RNDC...');
  const xlsData = loadExcel('Remesas_RNDC (4).xls');

  // Mapa: CONSECUTIVOREMESA → datos Excel
  const xlsMap = new Map();
  for (const r of xlsData) {
    const consec = clean(r.CONSECUTIVOREMESA);
    if (consec) xlsMap.set(consec, r);
  }

  // Leer remesas que necesitan backfill — las que no tienen usuarioRndc aún
  const remesas = await prisma.remesa.findMany({
    where: { usuarioRndc: null },
    select: { id: true, numeroRemesa: true }
  });
  console.log(`  ${remesas.length} remesas sin metadatos RNDC extras`);

  let updated = 0;
  const ops = [];
  for (const rem of remesas) {
    const xls = xlsMap.get(rem.numeroRemesa);
    if (!xls) continue;

    // Corregir horas de cita (combinando fecha + hora)
    let fechaCitaCargue = excelDateToJs(xls.FECHACITAPACTADACARGUE);
    if (fechaCitaCargue && xls.HORACITAPACTADACARGUE && typeof xls.HORACITAPACTADACARGUE === 'string') {
      const [hh, mm] = xls.HORACITAPACTADACARGUE.split(':').map(Number);
      if (!isNaN(hh)) fechaCitaCargue.setHours(hh, mm || 0, 0, 0);
    }
    let fechaCitaDescargue = excelDateToJs(xls.FECHACITAPACTADADESCARGUE);
    if (fechaCitaDescargue && xls.HORACITAPACTADADESCARGUEREMESA && typeof xls.HORACITAPACTADADESCARGUEREMESA === 'string') {
      const [hh, mm] = xls.HORACITAPACTADADESCARGUEREMESA.split(':').map(Number);
      if (!isNaN(hh)) fechaCitaDescargue.setHours(hh, mm || 0, 0, 0);
    }

    ops.push(prisma.remesa.update({
      where: { id: rem.id },
      data: {
        // Metadatos RNDC
        usuarioRndc: clean(xls.USUARIO),
        interactivoRndc: clean(xls.INTERACTIVO),
        codigoEmpresaRndc: toInt(xls.CODIGOEMPRESA),
        nitEmpresaTransporte: clean(xls.NUMNITEMPRESATRANSPORTE),
        empresaTransporteRndc: clean(xls.REMEMPRESA),
        usuarioIngresoRndc: toInt(xls.USUARIOINGR),
        fechaIngresoRndc: excelDateToJs(xls.FECHAINGRESO),
        // Extras RNDC
        cantidadInformacionCarga: toInt(xls.CANTIDADINFORMACIONCARGA),
        numIdGps: clean(xls.NUMIDGPS),
        numPlacaRndc: clean(xls.NUMPLACA),
        municipioPropietario: clean(xls.REM_PROP),
        grupoEmbalajeEnvase: clean(xls.GRUPOEMBALAJEENVASE),
        codigoArancelCompleto: clean(xls.CODIGOARANCEL_CODE),
        codMunicipioTrasbordo2: toInt(xls.CODMUNICIPIOTRASBORDO2) > 0 ? padDane(xls.CODMUNICIPIOTRASBORDO2) : null,
        municipioTrasbordo2: toInt(xls.NOMMUNICIPIOTRASBORDO2) > 0 ? String(xls.NOMMUNICIPIOTRASBORDO2) : null,
        // Corregir horas en las fechas de cita
        fechaHoraCitaCargue: fechaCitaCargue,
        fechaHoraCitaDescargue: fechaCitaDescargue,
      }
    }));

    if (ops.length >= BATCH) {
      await prisma.$transaction(ops);
      updated += ops.length;
      process.stdout.write(`\r  ✅ ${updated} actualizados...`);
      ops.length = 0;
    }
  }
  if (ops.length) {
    await prisma.$transaction(ops);
    updated += ops.length;
  }
  console.log(`\n  ✅ Remesas: ${updated} actualizados`);
}

// ============================================
// MAIN
// ============================================
(async () => {
  console.log('🔄 Backfill de campos RNDC faltantes\n');
  const t0 = Date.now();

  await backfillVehiculos();
  await backfillManifiestos();
  await backfillRemesas();

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n✨ Backfill completado en ${elapsed}s`);
  await prisma.$disconnect();
})();
