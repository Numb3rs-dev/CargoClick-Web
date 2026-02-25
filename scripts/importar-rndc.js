/**
 * Script de importación: Lee el Excel RNDC y carga los manifiestos en PostgreSQL.
 * Uso: node scripts/importar-rndc.js [ruta-excel]
 *
 * - Hace upsert por NUMMANIFIESTOCARGA → no duplica si se corre dos veces
 * - Normaliza MANORIGEN / MANDESTINO → ciudad + departamento separados
 */

const path = require('path');
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ── Departamentos colombianos con nombres multi-palabra (por longitud desc para
//    que el match greedy funcione correctamente)
const DEPTS_MULTIWORD = [
  'SAN ANDRES PROVIDENCIA Y SANTA CATALINA',
  'ARCHIPIELAGO DE SAN ANDRES',
  'SAN ANDRES Y PROVIDENCIA',
  'NORTE DE SANTANDER',
  'VALLE DEL CAUCA',
  'BOGOTA D. C.',
  'BOGOTA D.C.',
  'LA GUAJIRA',
  'BOGOTA DC',
].sort((a, b) => b.length - a.length); // más largo primero

/**
 * Separa un string "CIUDAD DEPARTAMENTO" en sus partes.
 * Ej: "BOGOTA BOGOTA D. C."  → { ciudad: 'BOGOTA', dept: 'BOGOTA D. C.' }
 *     "MEDELLIN ANTIOQUIA"   → { ciudad: 'MEDELLIN', dept: 'ANTIOQUIA' }
 *     "SANTA MARTA MAGDALENA"→ { ciudad: 'SANTA MARTA', dept: 'MAGDALENA' }
 */
function parseCiudadDept(str) {
  if (!str || typeof str !== 'string') return { ciudad: 'DESCONOCIDO', dept: 'DESCONOCIDO' };
  const s = str.trim().toUpperCase();

  // Intentar match con departamentos multi-palabra
  for (const dept of DEPTS_MULTIWORD) {
    if (s.endsWith(dept)) {
      const ciudad = s.slice(0, s.length - dept.length).trim();
      return { ciudad: ciudad || s, dept };
    }
  }

  // Caso general: CIUDAD DEPARTAMENTO (ambos single-word o ciudad multi-word)
  // Las ciudades colombianas multi-palabra más comunes que aparecen en RNDC:
  const CIUDADES_MULTIWORD = [
    'SANTA MARTA',
    'SAN JOSE DEL GUAVIARE',
    'SAN ANDRES DE TUMACO',
    'PUERTO CARRENO',
    'PUERTO ASIS',
    'PUERTO INIRIDA',
    'VILLA DEL ROSARIO',
    'LA VIRGINIA',
    'EL BANCO',
    'EL COPEY',
    'FUNDACION',
    'SAN CARLOS',
    'SAN GIL',
  ];

  for (const ciudad of CIUDADES_MULTIWORD) {
    if (s.startsWith(ciudad + ' ')) {
      const dept = s.slice(ciudad.length).trim();
      return { ciudad, dept: dept || 'DESCONOCIDO' };
    }
  }

  // Default: primer token = ciudad, resto = departamento
  const spaceIdx = s.indexOf(' ');
  if (spaceIdx === -1) return { ciudad: s, dept: 'DESCONOCIDO' };
  return { ciudad: s.slice(0, spaceIdx), dept: s.slice(spaceIdx + 1) };
}

/**
 * Convierte "DD/MM/YYYY" o "DD/MM/YYYY HH:mm" a objeto Date
 */
function parseDate(str) {
  if (!str) return new Date();
  const dateStr = String(str).split(' ')[0]; // tomar solo la parte de fecha
  const parts = dateStr.split('/');
  if (parts.length !== 3) return new Date();
  const [d, m, y] = parts.map(Number);
  return new Date(y, m - 1, d);
}

async function main() {
  // ── Early-exit si la tabla ya tiene datos
  const existentes = await prisma.manifiestoRndc.count();
  if (existentes > 0) {
    console.log(`\u26a1 Tabla RNDC ya poblada (${existentes.toLocaleString()} manifiestos). Importaci\u00f3n omitida.`);
    return;
  }

  const excelPath = process.argv[2]
    || path.join(__dirname, '..', 'definicion-FuncionalyTecnica', 'Documento_RNDC (2).xls');

  console.log('\n🚚 Importador RNDC — Manifiestos de Carga');
  console.log('=========================================');
  console.log('Archivo:', excelPath);

  // ── Leer Excel
  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets['Sheet1'];
  if (!sheet) {
    console.error('❌ No se encontró la hoja "Sheet1" en el archivo.');
    process.exit(1);
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
  console.log(`Filas leídas: ${rows.length}`);

  // ── Transformar rows → registros Prisma
  const registros = rows.map((row) => {
    const origen = parseCiudadDept(row.MANORIGEN);
    const destino = parseCiudadDept(row.MANDESTINO);

    return {
      manifiesto:      String(row.NUMMANIFIESTOCARGA ?? '').trim(),
      fechaExpedicion: parseDate(row.FECHAEXPEDICIONMANIFIESTO),
      origen:          origen.ciudad,
      origenDept:      origen.dept,
      destino:         destino.ciudad,
      destinoDept:     destino.dept,
      pesoKg:          Math.round(Number(row.MANKILOGRAMOSREMESAS) || 0),
      fletePactado:    Number(row.VALORFLETEPACTADOVIAJE) || 0,
      fleteNeto:       Number(row.MANVLRTOTFLETE) || 0,
      retencionIca:    Number(row.RETENCIONICAMANIFIESTOCARGA) || 0,
      placa:           row.NUMPLACA ? String(row.NUMPLACA).trim() : null,
      conductorId:     row.NUMIDCONDUCTOR ? String(row.NUMIDCONDUCTOR).trim() : null,
    };
  }).filter(r => r.manifiesto && r.pesoKg > 0 && r.fletePactado > 0);

  console.log(`Registros a importar: ${registros.length}`);

  // ── Mostrar muestra
  console.log('\nMuestra (3 registros):');
  registros.slice(0, 3).forEach((r, i) => {
    console.log(`  [${i + 1}] ${r.manifiesto} | ${r.origen} (${r.origenDept}) → ${r.destino} (${r.destinoDept}) | ${r.pesoKg}kg | $${r.fletePactado.toLocaleString()}`);
  });

  // ── Upsert por lotes de 100
  const BATCH = 100;
  let insertados = 0;
  let actualizados = 0;
  let errores = 0;

  console.log('\n⏳ Importando...');
  for (let i = 0; i < registros.length; i += BATCH) {
    const lote = registros.slice(i, i + BATCH);

    for (const rec of lote) {
      try {
        const result = await prisma.manifiestoRndc.upsert({
          where: { manifiesto: rec.manifiesto },
          update: {
            fechaExpedicion: rec.fechaExpedicion,
            origen:          rec.origen,
            origenDept:      rec.origenDept,
            destino:         rec.destino,
            destinoDept:     rec.destinoDept,
            pesoKg:          rec.pesoKg,
            fletePactado:    rec.fletePactado,
            fleteNeto:       rec.fleteNeto,
            retencionIca:    rec.retencionIca,
            placa:           rec.placa,
            conductorId:     rec.conductorId,
          },
          create: rec,
        });
        // Detectar si fue insert o update por createdAt ≈ now
        const isNew = Math.abs(new Date(result.createdAt).getTime() - Date.now()) < 3000;
        if (isNew) insertados++; else actualizados++;
      } catch (err) {
        errores++;
        if (errores <= 3) console.error(`  ⚠️  Error en ${rec.manifiesto}:`, err.message);
      }
    }

    const pct = Math.round(((i + lote.length) / registros.length) * 100);
    process.stdout.write(`\r  Progreso: ${pct}%  (${i + lote.length}/${registros.length})`);
  }

  console.log('\n');
  console.log('✅ Importación completada');
  console.log(`   Insertados:   ${insertados}`);
  console.log(`   Actualizados: ${actualizados}`);
  console.log(`   Errores:      ${errores}`);

  // ── Stats finales
  const total = await prisma.manifiestoRndc.count();
  const rutasUnicas = await prisma.manifiestoRndc.groupBy({
    by: ['origen', 'destino'],
    _count: true,
  });
  console.log(`\n📊 Total en DB: ${total} manifiestos`);
  console.log(`   Rutas únicas: ${rutasUnicas.length}`);
}

main()
  .catch((e) => { console.error('Error fatal:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
