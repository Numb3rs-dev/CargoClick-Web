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

async function main() {
  // ── 1. Leer y parsear distancias-tabla.ts ───────────────────────────────
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
      validado: parseInt(m[4], 10),
    });
  }

  console.log(`✅ Pares extraídos: ${pares.length.toLocaleString()}`);
  console.log(`   Muestra: ${JSON.stringify(pares[0])} … ${JSON.stringify(pares[pares.length - 1])}`);

  if (DRY_RUN) {
    console.log('\n🔍 Dry-run — sin cambios en BD');
    return;
  }

  // ── 2. Conectar a BD ────────────────────────────────────────────────────
  const prisma = new PrismaClient();

  try {
    if (TRUNCATE) {
      console.log('🗑  Truncando tabla distancias...');
      await prisma.$executeRawUnsafe('TRUNCATE TABLE distancias');
    }

    const existentes = await prisma.distancia.count();
    console.log(`   Registros actuales en BD: ${existentes.toLocaleString()}`);

    if (existentes >= pares.length * 0.9) {
      console.log('\u2705 Tabla ya poblada \u2014 nada que hacer.');
      return;
    }

    // ── 3. Insertar en batches ──────────────────────────────────────────
    let insertados = 0;
    const inicio = Date.now();

    for (let i = 0; i < pares.length; i += BATCH) {
      const batch  = pares.slice(i, i + BATCH);
      const values = batch
        .map(p => `('${p.origen}','${p.destino}',${p.km},${p.validado})`)
        .join(',');

      await prisma.$executeRawUnsafe(`
        INSERT INTO distancias (origen, destino, km, validado)
        VALUES ${values}
        ON CONFLICT (origen, destino) DO NOTHING
      `);

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
