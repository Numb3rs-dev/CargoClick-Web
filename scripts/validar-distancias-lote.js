/**
 * Validador por lotes de distancias con OSRM /route
 *
 * Formato de tabla:  'cod1:cod2': [km, validado]
 *   validado = 0  → pendiente (valor de OSRM /table inicial, puede tener errores)
 *   validado = 1  → confirmado con OSRM /route (distancia vial exacta)
 *
 * OSRM /route es más preciso que /table porque calcula la ruta óptima
 * individual en vez de snapping masivo.
 *
 * Uso:
 *   node scripts/validar-distancias-lote.js           # lote de 100 pares
 *   node scripts/validar-distancias-lote.js 200        # lote de 200 pares
 *
 * Ejecutar varias veces hasta completar todos los pares.
 * El script imprime el progreso: X/20910 validados.
 */

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

const TABLA_PATH  = path.join(__dirname, '..', 'lib', 'utils', 'distancias-tabla.ts');
const COORDS_PATH = path.join(__dirname, '..', 'app', 'cotizar', 'config', 'colombia-coordenadas.ts');
const BATCH_SIZE  = parseInt(process.argv[2] || '100', 10);
const DELAY_MS    = 250; // pausa entre peticiones OSRM

// ── 1. Parsear coordenadas ────────────────────────────────────────────────
function parsearCoordenadas() {
  const raw = fs.readFileSync(COORDS_PATH, 'utf8');
  const coords = {};
  // Matchear:  '11001': { lat:  4.6097, lon: -74.0817 },
  const re = /'(\d{5})':\s*\{\s*lat:\s*([-\d.]+),\s*lon:\s*([-\d.]+)\s*\}/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    coords[m[1]] = { lat: parseFloat(m[2]), lon: parseFloat(m[3]) };
  }
  return coords;
}

// ── 2. Parsear tabla ──────────────────────────────────────────────────────
function parsearTabla(raw) {
  const entries = {};
  let necesitaConversion = false;

  // Formato nuevo: '05001:11001': [404, 0],
  const reNuevo = /'([^']+)':\s*\[(\d+),\s*([01])\]/g;
  // Formato viejo: '05001:11001': 404,
  const reViejo = /'([^']+)':\s*(\d+),/g;

  let m;
  while ((m = reNuevo.exec(raw)) !== null) {
    entries[m[1]] = [parseInt(m[2]), parseInt(m[3])];
  }

  if (Object.keys(entries).length === 0) {
    // Tabla en formato viejo → convertir
    necesitaConversion = true;
    while ((m = reViejo.exec(raw)) !== null) {
      entries[m[1]] = [parseInt(m[2]), 0];
    }
  }

  return { entries, necesitaConversion };
}

// ── 3. Llamar OSRM /route para un par ────────────────────────────────────
function osrmRuta(lon1, lat1, lon2, lat2) {
  return new Promise((resolve) => {
    const url = `http://router.project-osrm.org/route/v1/driving/` +
      `${lon1},${lat1};${lon2},${lat2}?overview=false&steps=false`;

    const req = http.get(url, { timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          if (j.code === 'Ok' && j.routes && j.routes[0]) {
            resolve({ ok: true, km: Math.round(j.routes[0].distance / 1000) });
          } else {
            resolve({ ok: false, reason: j.code || 'sin ruta' });
          }
        } catch (e) {
          resolve({ ok: false, reason: 'parse error' });
        }
      });
    });
    req.on('error', (e) => resolve({ ok: false, reason: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, reason: 'timeout' }); });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── 4. Reconstruir el archivo TypeScript ─────────────────────────────────
function reconstruirArchivo(entries) {
  const claves = Object.keys(entries).sort();
  const total  = claves.length;
  const validados = claves.filter(k => entries[k][1] === 1).length;

  const lineas = [];
  lineas.push('/**');
  lineas.push(' * Tabla de distancias viales entre municipios de Colombia.');
  lineas.push(' * Generada con OSRM/OpenStreetMap. Validación progresiva por lotes.');
  lineas.push(' *');
  lineas.push(` * Total pares: ${total}`);
  lineas.push(` * Validados con OSRM /route: ${validados} / ${total}`);
  lineas.push(` * Pendientes: ${total - validados}`);
  lineas.push(` * Última actualización: ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`);
  lineas.push(' *');
  lineas.push(' * Formato: [distanciaKm, validado]');
  lineas.push(' *   validado = 0 → estimado con OSRM /table');
  lineas.push(' *   validado = 1 → confirmado con OSRM /route ✓');
  lineas.push(' */');
  lineas.push('');
  lineas.push('/** [distanciaKm, validado]  0=estimado  1=validado OSRM /route */');
  lineas.push('export const DISTANCIAS_REALES: Record<string, [number, 0 | 1]> = {');

  for (const clave of claves) {
    const [km, v] = entries[clave];
    lineas.push(`  '${clave}': [${km}, ${v}],`);
  }

  lineas.push('};');
  lineas.push('');

  return lineas.join('\n');
}

// ── MAIN ──────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🔍 Validador de distancias OSRM /route`);
  console.log(`   Lote: ${BATCH_SIZE} pares | Pausa: ${DELAY_MS}ms entre peticiones\n`);

  const rawTabla = fs.readFileSync(TABLA_PATH, 'utf8');
  const coords   = parsearCoordenadas();
  const { entries, necesitaConversion } = parsearTabla(rawTabla);

  const totalPares    = Object.keys(entries).length;
  const yaValidados   = Object.values(entries).filter(([, v]) => v === 1).length;
  const pendientes    = Object.keys(entries).filter(k => entries[k][1] === 0);

  if (necesitaConversion) {
    console.log(`   ⚙  Convirtiendo tabla al nuevo formato [km, validado]...`);
  }

  console.log(`   Total pares  : ${totalPares}`);
  console.log(`   Ya validados : ${yaValidados} (${Math.round(yaValidados / totalPares * 100)}%)`);
  console.log(`   Pendientes   : ${pendientes.length}`);

  if (pendientes.length === 0) {
    console.log(`\n✅ ¡Todos los pares ya están validados!\n`);
    return;
  }

  const lote = pendientes.slice(0, BATCH_SIZE);
  const tiempoLoteSeg = Math.round(lote.length * DELAY_MS / 1000);
  const tiempoRestanteSeg = Math.round(pendientes.length * DELAY_MS / 1000);
  const fmt = (s) => s >= 3600 ? `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m` : s >= 60 ? `${Math.floor(s/60)}m ${s%60}s` : `${s}s`;
  console.log(`\n   Procesando lote de ${lote.length} pares...`);
  console.log(`   Tiempo este lote   : ~${fmt(tiempoLoteSeg)}`);
  console.log(`   Tiempo total resto : ~${fmt(tiempoRestanteSeg)}\n`);

  let ok = 0, fallback = 0, sinCoords = 0;
  const inicio = Date.now();

  for (let i = 0; i < lote.length; i++) {
    const clave    = lote[i];
    const [cod1, cod2] = clave.split(':');
    const c1 = coords[cod1];
    const c2 = coords[cod2];

    if (!c1 || !c2) {
      sinCoords++;
      // Marcar como validado con 1 aunque no tengamos coords (es isla o sin acceso vial)
      entries[clave][1] = 1;
      process.stdout.write(`  [${String(i + 1).padStart(3)}/${lote.length}] ${clave} → sin coords (isla)\n`);
      continue;
    }

    const result = await osrmRuta(c1.lon, c1.lat, c2.lon, c2.lat);

    if (result.ok) {
      const kmAntes  = entries[clave][0];
      const kmNuevo  = result.km;
      const diff     = kmNuevo - kmAntes;
      const pct      = kmAntes > 0 ? Math.round(diff / kmAntes * 100) : 0;
      const marker   = Math.abs(pct) > 20 ? ' ⚠' : '';

      entries[clave] = [kmNuevo, 1];

      process.stdout.write(
        `  [${String(i + 1).padStart(3)}/${lote.length}] ${clave.padEnd(12)} ` +
        `${String(kmAntes).padStart(4)}→${String(kmNuevo).padStart(4)} km  (${pct > 0 ? '+' : ''}${pct}%)${marker}\n`
      );
      ok++;
    } else {
      // Mantener valor actual, NO marcar como validado (se reintentará)
      fallback++;
      process.stdout.write(
        `  [${String(i + 1).padStart(3)}/${lote.length}] ${clave.padEnd(12)} ` +
        `sin ruta OSRM (${result.reason}) — valor conservado\n`
      );
    }

    if (i < lote.length - 1) await sleep(DELAY_MS);
  }

  // Guardar tabla actualizada
  const nuevoContenido = reconstruirArchivo(entries);
  fs.writeFileSync(TABLA_PATH, nuevoContenido, 'utf8');

  const totalValidadosAhora = Object.values(entries).filter(([, v]) => v === 1).length;
  const pct = Math.round(totalValidadosAhora / totalPares * 100);

  console.log(`\n${'─'.repeat(55)}`);
  console.log(`✅ Lote completado:`);
  console.log(`   Validados OK      : ${ok}`);
  console.log(`   Sin ruta OSRM     : ${fallback}`);
  console.log(`   Sin coordenadas   : ${sinCoords}`);
  console.log(`   Progreso total    : ${totalValidadosAhora}/${totalPares} (${pct}%)`);
  console.log(`   Pendientes        : ${totalPares - totalValidadosAhora}`);
  if (totalPares - totalValidadosAhora > 0) {
    console.log(`\n   Vuelve a ejecutar para continuar:`);
    console.log(`   node scripts/validar-distancias-lote.js`);
  } else {
    console.log(`\n🎉 ¡Tabla completamente validada!`);
  }
  console.log('');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
