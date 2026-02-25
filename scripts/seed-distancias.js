/**
 * seed-distancias.js
 *
 * Carga la tabla de distancias OSRM a PostgreSQL en batches de 5,000 filas.
 * Lee lib/utils/distancias-tabla.ts con regex (evita ts-node para fuente de 45+ MB).
 *
 * Uso:
 *   node scripts/seed-distancias.js             # carga completa
 *   node scripts/seed-distancias.js --dry-run   # solo muestra estadísticas
 *   node scripts/seed-distancias.js --truncate  # borra y recarga todo
 */

const { PrismaClient } = require('@prisma/client');
const fs   = require('fs');
const path = require('path');

const DRY_RUN  = process.argv.includes('--dry-run');
const TRUNCATE = process.argv.includes('--truncate');
const BATCH    = 5000;

// Mínimo de filas para considerar la tabla ya poblada (evita re-seed)
const MINIMO_FILAS = 600_000;

async function main() {
  if (DRY_RUN) {
    console.log('🔍 Dry-run — sin cambios en BD');
    return;
  }

  // ── 1. Conectar a BD y chequear ANTES de leer el archivo de 45 MB ───────
  const prisma = new PrismaClient();

  try {
    if (TRUNCATE) {
      console.log('🗑  Truncando tabla distancias...');
      await prisma.$executeRaw`TRUNCATE TABLE distancias`;
    } else {
      const existentes = await prisma.distancia.count();
      console.log(`   Registros actuales en BD: ${existentes.toLocaleString()}`);
      if (existentes >= MINIMO_FILAS) {
        console.log('⚡ Tabla ya poblada — saltando seed.');
        return;
      }
    }

    // ── 2. Leer y parsear distancias-tabla.ts ────────────────────────────
    const tablaPath = path.join(__dirname, '..', 'lib', 'utils', 'distancias-tabla.ts');
    console.log('📖 Leyendo', tablaPath);
    const text = fs.readFileSync(tablaPath, 'utf8');

    const regex = /'(\d{5}):(\d{5})':\s*\[(\d+),\s*([01])\]/g;
    const pares = [];
    let m;
    while ((m = regex.exec(text)) !== null) {
      pares.push({
        origen:   m[1],
        destino:  m[2],
        km:       parseInt(m[3], 10),
        validado: m[4] === '1',
      });
    }

    console.log(`✅ Pares extraídos: ${pares.length.toLocaleString()}`);
    console.log(`   Muestra: ${JSON.stringify(pares[0])} … ${JSON.stringify(pares[pares.length - 1])}`);

    // ── 3. Insertar en batches con createMany (evita $executeRawUnsafe) ──
    let insertados = 0;
    const inicio = Date.now();

    for (let i = 0; i < pares.length; i += BATCH) {
      const batch = pares.slice(i, i + BATCH);

      await prisma.distancia.createMany({
        data: batch,
        skipDuplicates: true,
      });

      insertados += batch.length;
      const pct     = Math.round((insertados / pares.length) * 100);
      const elapsed = ((Date.now() - inicio) / 1000).toFixed(1);
      process.stdout.write(
        `\r  [${insertados.toLocaleString()}/${pares.length.toLocaleString()}] ${pct}%  ${elapsed}s`
      );
    }

    // ── 4. Reporte final ────────────────────────────────────────────────
    const total   = await prisma.distancia.count();
    const elapsed = ((Date.now() - inicio) / 1000).toFixed(1);
    console.log(`\n\n✅ Completado en ${elapsed}s`);
    console.log(`   Total en BD: ${total.toLocaleString()} pares`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
