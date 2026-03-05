/**
 * Completa la tabla de distancias viales para todos los municipios de
 * colombia-dane.ts que aún no tienen entradas en distancias-tabla.ts.
 *
 * FLUJO:
 *   1. Carga coordenadas desde scripts/coordenadas-colombia.json
 *      (generado por scripts/geocodificar-municipios.js)
 *   2. Lee distancias-tabla.ts para determinar qué pares ya existen.
 *   3. Identifica municipios "nuevos" (sin ningún par en la tabla).
 *   4. Para cada chunk de municipios nuevos, consulta OSRM /table
 *      contra todos los municipios con coordenadas.
 *   5. Inserta los nuevos pares directamente en distancias-tabla.ts
 *      antes del cierre `};`, guardando progresivamente cada lote.
 *
 * OSRM servidor público: http://router.project-osrm.org
 *   - Gratis, sin API key
 *   - Límite práctico: ≈ 100 coordenadas por request (fuentes + destinos)
 *
 * USO:
 *   node scripts/completar-distancias-osrm.js
 *
 * Es seguro reejecutar — omite pares ya existentes automáticamente.
 * Para solo generar sin modificar la tabla, añadir flag --dry-run.
 */

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

// ── Configuración ─────────────────────────────────────────────────────────────
const COORDS_JSON    = path.join(__dirname, 'coordenadas-colombia.json');
const TABLA_TS       = path.join(__dirname, '..', 'lib', 'utils', 'distancias-tabla.ts');
const CHUNK_SRC      = 25;  // municipios fuente por lote (fuentes × destinos ≤ 100 coords)
const CHUNK_DST      = 70;  // municipios destino por lote
const DELAY_MS       = 350; // ms entre requests OSRM
const DRY_RUN        = process.argv.includes('--dry-run');

// ── Cargar datos ──────────────────────────────────────────────────────────────
function cargarCoordenadas() {
  if (!fs.existsSync(COORDS_JSON)) {
    console.error('❌ No se encontró scripts/coordenadas-colombia.json');
    console.error('   Ejecuta primero: node scripts/geocodificar-municipios.js');
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(COORDS_JSON, 'utf8'));
  // Retorna array [ [codigo, lat, lon], ... ] — solo entradas con coordenadas válidas
  return Object.entries(raw)
    .filter(([, v]) => v && typeof v.lat === 'number' && typeof v.lon === 'number')
    .map(([codigo, v]) => [codigo, v.lat, v.lon]);
}

function cargarParesExistentes() {
  const src  = fs.readFileSync(TABLA_TS, 'utf8');
  const keys = new Set();
  for (const m of src.matchAll(/'(\d{5}:\d{5})'/g)) {
    keys.add(m[1]);
  }
  return keys;
}

function claveCanonica(a, b) {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

// ── OSRM ──────────────────────────────────────────────────────────────────────
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout: 90000 }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
        } else {
          try { resolve(JSON.parse(data)); }
          catch (e) { reject(new Error('JSON parse error: ' + data.slice(0, 100))); }
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * Consulta OSRM /table para srcList × dstList.
 * Retorna matriz de distancias en metros (null si no hay ruta).
 */
async function osrmTable(srcList, dstList) {
  const allCoords = [...srcList, ...dstList];
  const coordStr  = allCoords.map(([, lat, lon]) => `${lon},${lat}`).join(';');
  const srcIdx    = srcList.map((_, i) => i).join(';');
  const dstIdx    = dstList.map((_, i) => srcList.length + i).join(';');

  const url = `http://router.project-osrm.org/table/v1/driving/${coordStr}` +
    `?sources=${srcIdx}&destinations=${dstIdx}&annotations=distance`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await httpGet(url);
      if (res.code === 'Ok') return res.distances;
      throw new Error(`OSRM: ${res.code} ${res.message}`);
    } catch (e) {
      if (attempt === 3) throw e;
      process.stdout.write(` [retry ${attempt}]`);
      await sleep(2000 * attempt);
    }
  }
}

// ── Escritura en distancias-tabla.ts ─────────────────────────────────────────
function insertarNuevosParesEnTabla(nuevasPairs) {
  if (nuevasPairs.length === 0) return;
  if (DRY_RUN) {
    console.log(`   [dry-run] Se insertarían ${nuevasPairs.length} pares nuevos.`);
    return;
  }

  let src = fs.readFileSync(TABLA_TS, 'utf8');

  // Buscar la posición del cierre del objeto: `\n};`
  const cierreIdx = src.lastIndexOf('\n};');
  if (cierreIdx === -1) {
    console.error('❌ No se encontró el cierre `};` en distancias-tabla.ts');
    return;
  }

  const lineasNuevas = nuevasPairs
    .map(([key, km]) => `  '${key}': [${km}, 0],`)
    .join('\n');

  src = src.slice(0, cierreIdx) + '\n' + lineasNuevas + src.slice(cierreIdx);
  fs.writeFileSync(TABLA_TS, src, 'utf8');
}

/** Actualiza el comentario de cabecera con el nuevo total de pares */
function actualizarCabecera(totalNuevosPares) {
  if (DRY_RUN) return;
  let src = fs.readFileSync(TABLA_TS, 'utf8');
  // Actualizar la línea "Total pares:"
  src = src.replace(/Total pares:\s*\d+/, `Total pares: ${totalNuevosPares}`);
  // Actualizar fecha
  src = src.replace(/Última actualización:.*/, `Última actualización: ${new Date().toISOString().slice(0, 10)}`);
  fs.writeFileSync(TABLA_TS, src, 'utf8');
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🗺  Completando tabla de distancias OSRM\n');
  if (DRY_RUN) console.log('   ⚠️  Modo dry-run: no se modificará distancias-tabla.ts\n');

  const todasCoords   = cargarCoordenadas();
  const paresExist    = cargarParesExistentes();

  console.log(`   Municipios con coords: ${todasCoords.length}`);
  console.log(`   Pares ya en tabla:     ${paresExist.size}\n`);

  // Determinar qué municipios son "nuevos" (ningún par suyo está en la tabla)
  const codigosEnTabla = new Set();
  for (const key of paresExist) {
    const [a, b] = key.split(':');
    codigosEnTabla.add(a);
    codigosEnTabla.add(b);
  }

  const munsNuevos   = todasCoords.filter(([c]) => !codigosEnTabla.has(c));
  const munsExist    = todasCoords.filter(([c]) =>  codigosEnTabla.has(c));
  const todosMuns    = todasCoords; // fuente de destinos = todos

  console.log(`   Municipios en tabla actual: ${munsExist.length}`);
  console.log(`   Municipios nuevos:          ${munsNuevos.length}`);

  if (munsNuevos.length === 0) {
    console.log('\n✅ No hay municipios nuevos para procesar.');
    return;
  }

  // Calcular total de pares a generar
  const totalNuevos = munsNuevos.length;
  const totalParesPotenciales = totalNuevos * (todosMuns.length - 1); // aprox
  console.log(`\n   Pares potenciales a consultar: ~${totalParesPotenciales.toLocaleString()}`);
  console.log(`   Chunks fuente (${CHUNK_SRC} muns): ${Math.ceil(totalNuevos / CHUNK_SRC)}`);
  console.log(`   Chunks destino (${CHUNK_DST} muns): ${Math.ceil(todosMuns.length / CHUNK_DST)}\n`);

  // Dividir en chunks
  const chunksSrc = [];
  for (let i = 0; i < munsNuevos.length; i += CHUNK_SRC) {
    chunksSrc.push(munsNuevos.slice(i, i + CHUNK_SRC));
  }
  const chunksDst = [];
  for (let i = 0; i < todosMuns.length; i += CHUNK_DST) {
    chunksDst.push(todosMuns.slice(i, i + CHUNK_DST));
  }

  let requestNum = 0;
  const totalRequests = chunksSrc.length * chunksDst.length;
  let totalNuevosInsertados = 0;
  let bufferPares = []; // acumular pares antes de escribir

  for (let si = 0; si < chunksSrc.length; si++) {
    const srcChunk = chunksSrc[si];

    for (let di = 0; di < chunksDst.length; di++) {
      const dstChunk = chunksDst[di];
      requestNum++;

      const srcCodes = srcChunk.map(([c]) => c);
      const dstCodes = dstChunk.map(([c]) => c);

      process.stdout.write(
        `   [${requestNum.toString().padStart(4)}/${totalRequests}] ` +
        `src(${srcCodes[0]}…) × dst(${dstCodes[0]}…) `
      );

      let matrix;
      try {
        matrix = await osrmTable(srcChunk, dstChunk);
      } catch (e) {
        process.stdout.write(`✗ ERROR: ${e.message}\n`);
        await sleep(3000);
        continue;
      }

      let nuevosEnLote = 0;
      for (let r = 0; r < srcChunk.length; r++) {
        for (let c = 0; c < dstChunk.length; c++) {
          const codSrc = srcCodes[r];
          const codDst = dstCodes[c];
          if (codSrc === codDst) continue;

          const key = claveCanonica(codSrc, codDst);
          if (paresExist.has(key)) continue; // ya existe

          const meters = matrix[r]?.[c];
          if (meters != null && meters > 0) {
            const km = Math.round(meters / 1000);
            bufferPares.push([key, km]);
            paresExist.add(key); // evitar duplicados en memoria
            nuevosEnLote++;
          }
        }
      }

      process.stdout.write(`✓ (+${nuevosEnLote})\n`);
      totalNuevosInsertados += nuevosEnLote;

      // Escribir a disco cada 50 requests o cuando el buffer supera 2000 pares
      if (bufferPares.length >= 2000 || requestNum % 50 === 0) {
        if (bufferPares.length > 0) {
          process.stdout.write(`   💾 Guardando ${bufferPares.length} pares... `);
          insertarNuevosParesEnTabla(bufferPares);
          bufferPares = [];
          process.stdout.write('✓\n');
        }
      }

      await sleep(DELAY_MS);
    }

    // Guardar al final de cada chunk source
    if (bufferPares.length > 0) {
      process.stdout.write(`   💾 Guardando ${bufferPares.length} pares... `);
      insertarNuevosParesEnTabla(bufferPares);
      bufferPares = [];
      process.stdout.write('✓\n');
    }
  }

  // Guardar lo que reste en el buffer
  if (bufferPares.length > 0) {
    process.stdout.write(`   💾 Guardando ${bufferPares.length} pares finales... `);
    insertarNuevosParesEnTabla(bufferPares);
    process.stdout.write('✓\n');
  }

  // Actualizar cabecera
  const totalFinal = paresExist.size;
  actualizarCabecera(totalFinal);

  console.log(`\n✅ Completado`);
  console.log(`   Pares nuevos insertados: ${totalNuevosInsertados.toLocaleString()}`);
  console.log(`   Total pares en tabla:    ${totalFinal.toLocaleString()}`);
  if (DRY_RUN) console.log('\n   (dry-run: ningún cambio guardado)');
}

main().catch(err => {
  console.error('\n❌ Error fatal:', err.message);
  console.error(err.stack);
  process.exit(1);
});
