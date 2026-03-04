/**
 * Poblar fechaIngresoRndc en remesas desde Remesas_RNDC (4).xls
 * 
 * Lee CONSECUTIVOREMESA → FECHAINGRESO del Excel RNDC
 * y actualiza remesas.fechaIngresoRndc donde numeroRemesa coincide.
 * 
 * Uso: node scripts/poblar-fecha-ingreso-rndc.js
 */

const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

const BASE = path.join(__dirname, '..', 'definicion-FuncionalyTecnica', 'Ministerio de transporte');
const FILE = path.join(BASE, 'Remesas_RNDC (4).xls');

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

(async () => {
  console.log('📖 Leyendo Excel RNDC...');
  const wb = XLSX.readFile(FILE);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { defval: null });
  console.log(`   ${data.length} filas en el Excel`);

  // Construir mapa: CONSECUTIVOREMESA → FECHAINGRESO (Date)
  const dateMap = new Map();
  for (const r of data) {
    const consec = r.CONSECUTIVOREMESA ? String(r.CONSECUTIVOREMESA).trim() : null;
    if (consec && r.FECHAINGRESO) {
      const fecha = excelDateToJs(r.FECHAINGRESO);
      if (fecha) dateMap.set(consec, fecha);
    }
  }
  console.log(`   ${dateMap.size} remesas con FECHAINGRESO en el Excel`);

  // Leer todas las remesas de la BD que aún no tienen fechaIngresoRndc
  const remesas = await prisma.remesa.findMany({
    where: { fechaIngresoRndc: null },
    select: { id: true, numeroRemesa: true }
  });
  console.log(`   ${remesas.length} remesas sin fechaIngresoRndc en la BD`);

  // Actualizar en lotes de 500
  const BATCH = 500;
  let updated = 0, notFound = 0;
  const updates = [];

  for (const rem of remesas) {
    const fecha = dateMap.get(rem.numeroRemesa);
    if (fecha) {
      updates.push(
        prisma.remesa.update({
          where: { id: rem.id },
          data: { fechaIngresoRndc: fecha }
        })
      );
    } else {
      notFound++;
    }

    if (updates.length >= BATCH) {
      await prisma.$transaction(updates);
      updated += updates.length;
      process.stdout.write(`\r   ✅ ${updated} actualizadas...`);
      updates.length = 0;
    }
  }

  // Flush remaining
  if (updates.length > 0) {
    await prisma.$transaction(updates);
    updated += updates.length;
  }

  console.log(`\n\n📊 Resultado:`);
  console.log(`   ✅ Actualizadas: ${updated}`);
  console.log(`   ⚠️ Sin match en Excel: ${notFound}`);
  console.log(`   📦 Total en BD: ${remesas.length}`);

  await prisma.$disconnect();
})();
