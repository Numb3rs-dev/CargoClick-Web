/**
 * Geocodifica todos los municipios de colombia-dane.ts que no están en el
 * catálogo de coordenadas existente (colombia-coordenadas.ts).
 *
 * Fuente geocoding: Nominatim / OpenStreetMap (libre, sin API key)
 *   Rate limit: max 1 req/seg (respetamos con sleep 1100ms)
 *
 * Salida: scripts/coordenadas-colombia.json
 *   { "XXXXX": { "lat": X, "lon": Y, "nombre": "...", "depto": "..." }, ... }
 *
 * Uso:
 *   node scripts/geocodificar-municipios.js
 *
 * Es seguro reejecutar — retoma desde donde quedó si el JSON ya existe.
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

// ── Rutas ────────────────────────────────────────────────────────────────────
const DANE_TS      = path.join(__dirname, '..', 'app', 'cotizar', 'config', 'colombia-dane.ts');
const COORDS_TS    = path.join(__dirname, '..', 'app', 'cotizar', 'config', 'colombia-coordenadas.ts');
const OUTPUT_JSON  = path.join(__dirname, 'coordenadas-colombia.json');

// ── Parsear colombia-dane.ts ─────────────────────────────────────────────────
function parseMunicipiosDane() {
  const src = fs.readFileSync(DANE_TS, 'utf8');
  const result = [];
  let currentDepto = null;

  for (const line of src.split('\n')) {
    // Detectar nombre de departamento: nombre: 'XYZ',
    const deptoMatch = line.match(/nombre:\s*'([^']+)'(?=\s*,?\s*$)/);
    const codigoDeptoMatch = line.match(/codigo:\s*'(\d{2})'/);
    if (codigoDeptoMatch) {
      // Próximas líneas serán de este departamento
      const pendingCodigo = codigoDeptoMatch[1];
      if (deptoMatch) {
        currentDepto = { codigo: pendingCodigo, nombre: deptoMatch[1] };
      }
    }
    if (line.includes("codigo: '") && line.includes("nombre: '") && !line.includes("codigo: '0'")) {
      const m = line.match(/codigo:\s*'(\d{5})'.*nombre:\s*'([^']+)'/);
      if (m) {
        result.push({ codigo: m[1], nombre: m[2], depto: currentDepto?.nombre ?? '' });
      }
    }
  }
  return result;
}

// ── Parsear coordenadas existentes (colombia-coordenadas.ts) ─────────────────
function parseCoordenadasExistentes() {
  const src = fs.readFileSync(COORDS_TS, 'utf8');
  const existing = new Set();
  for (const m of src.matchAll(/'(\d{5})':\s*\{/g)) {
    existing.add(m[1]);
  }
  return existing;
}

// ── Nominatim geocoding ───────────────────────────────────────────────────────
function nominatimGeocode(nombre, depto) {
  return new Promise((resolve) => {
    const query = encodeURIComponent(`${nombre}, ${depto}, Colombia`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=co`;
    const options = {
      headers: { 'User-Agent': 'CargoClick-Geocoder/1.0 (contact@cargoclick.co)' }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const arr = JSON.parse(data);
          if (arr.length > 0) {
            resolve({ lat: parseFloat(arr[0].lat), lon: parseFloat(arr[0].lon) });
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🗺  Geocodificador de municipios — Nominatim/OSM\n');

  const municipios      = parseMunicipiosDane();
  const existentes      = parseCoordenadasExistentes();

  // Cargar JSON existente para reanudar
  let coordenadas = {};
  if (fs.existsSync(OUTPUT_JSON)) {
    coordenadas = JSON.parse(fs.readFileSync(OUTPUT_JSON, 'utf8'));
    console.log(`   Reanudando: ${Object.keys(coordenadas).length} coordenadas ya en caché\n`);
  }

  // Fusionar coordenadas del .ts existente al JSON si no están
  const srcCoords = fs.readFileSync(COORDS_TS, 'utf8');
  for (const m of srcCoords.matchAll(/'(\d{5})':\s*\{\s*lat:\s*([-\d.]+),\s*lon:\s*([-\d.]+)\s*\}/g)) {
    if (!coordenadas[m[1]]) {
      coordenadas[m[1]] = { lat: parseFloat(m[2]), lon: parseFloat(m[3]) };
    }
  }

  const pendientes = municipios.filter(m => !coordenadas[m.codigo]);
  console.log(`   Total municipios: ${municipios.length}`);
  console.log(`   Con coordenadas:  ${municipios.length - pendientes.length}`);
  console.log(`   A geocodificar:   ${pendientes.length}\n`);

  if (pendientes.length === 0) {
    console.log('✅ Todos los municipios ya tienen coordenadas.');
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(coordenadas, null, 2));
    return;
  }

  let geocodificados = 0;
  let fallidos = [];

  for (const mun of pendientes) {
    process.stdout.write(`   [${geocodificados + 1}/${pendientes.length}] ${mun.codigo} ${mun.nombre} (${mun.depto})... `);
    const coords = await nominatimGeocode(mun.nombre, mun.depto);
    if (coords) {
      coordenadas[mun.codigo] = { lat: coords.lat, lon: coords.lon, nombre: mun.nombre, depto: mun.depto };
      process.stdout.write(`✓ (${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)})\n`);
      geocodificados++;
    } else {
      // Retry con solo el nombre
      await sleep(500);
      const retry = await nominatimGeocode(mun.nombre, 'Colombia');
      if (retry) {
        coordenadas[mun.codigo] = { lat: retry.lat, lon: retry.lon, nombre: mun.nombre, depto: mun.depto };
        process.stdout.write(`✓ (retry: ${retry.lat.toFixed(4)}, ${retry.lon.toFixed(4)})\n`);
        geocodificados++;
      } else {
        process.stdout.write(`✗ NO ENCONTRADO\n`);
        fallidos.push(mun);
      }
    }

    // Guardar progresivamente cada 10 resultados
    if ((geocodificados + fallidos.length) % 10 === 0) {
      fs.writeFileSync(OUTPUT_JSON, JSON.stringify(coordenadas, null, 2));
    }

    // Rate limit Nominatim: 1 req/seg
    await sleep(1100);
  }

  // Guardar resultado final
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(coordenadas, null, 2));

  console.log(`\n✅ Geocodificación completa`);
  console.log(`   Encontrados:  ${geocodificados}`);
  console.log(`   No encontrados: ${fallidos.length}`);
  if (fallidos.length > 0) {
    console.log('\n   ⚠️  Municipios sin coordenadas:');
    fallidos.forEach(m => console.log(`      ${m.codigo} ${m.nombre} (${m.depto})`));
  }
  console.log(`\n   Coordenadas guardadas en: scripts/coordenadas-colombia.json`);
  console.log(`   Total en JSON: ${Object.keys(coordenadas).length} municipios`);
  console.log('\n   ▶  Siguiente paso:');
  console.log('      node scripts/completar-distancias-osrm.js\n');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
