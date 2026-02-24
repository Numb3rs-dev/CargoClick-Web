/**
 * Genera la tabla completa de distancias viales reales entre los 207 municipios
 * del catálogo logístico, usando la API pública de OSRM (OpenStreetMap routing).
 *
 * OSRM table endpoint: /table/v1/driving/{coords}?annotations=distance
 *   - Gratis, sin API key
 *   - Devuelve matriz N×N de distancias en metros
 *   - Para 207 municipios = 42,849 pares en una sola llamada
 *
 * Salida: lib/utils/distancias-tabla.ts
 * Uso:    node scripts/generar-distancias-osrm.js
 */

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// DATOS: 207 municipios [codigo_DANE, lon, lat]
// (lon primero porque OSRM usa lon,lat)
// ═══════════════════════════════════════════════════════════════════════════
const MUNICIPIOS = [
  // Bogotá
  ['11001', -74.0817,  4.6097],
  // Antioquia
  ['05001', -75.5812,  6.2442], ['05088', -75.5571,  6.3356], ['05237', -75.5939,  6.1752],
  ['05360', -75.6061,  6.1845], ['05615', -75.6156,  6.1505], ['05607', -75.3736,  6.1546],
  ['05045', -76.6271,  7.8833], ['05748', -76.7278,  8.0961], ['05154', -75.1975,  7.9818],
  ['05579', -74.4033,  6.4932], ['05380', -75.6443,  6.1576], ['05440', -75.3367,  6.1777],
  ['05659', -75.8273,  6.5581],
  // Atlántico
  ['08001', -74.7964, 10.9639], ['08758', -74.7687, 10.9178], ['08433', -74.7742, 10.8597],
  ['08573', -74.9558, 10.9917], ['08638', -74.9206, 10.6269], ['08296', -74.8847, 10.8961],
  ['08634', -74.7528, 10.7972],
  // Bolívar
  ['13001', -75.4794, 10.3910], ['13430', -74.7539,  9.2394], ['13836', -75.4186, 10.3339],
  ['13244', -75.1216,  9.7159], ['13052', -75.3569, 10.2569], ['13473', -74.4264,  9.2447],
  ['13442', -75.3219, 10.0003],
  // Boyacá
  ['15001', -73.3678,  5.5353], ['15759', -72.9303,  5.7160], ['15176', -73.8197,  5.6194],
  ['15491', -73.1139,  5.7769], ['15690', -72.9979,  5.8808], ['15238', -73.0289,  5.8271],
  // Caldas
  ['17001', -75.5138,  5.0703], ['17380', -74.6700,  5.4567], ['17174', -75.6067,  5.0025],
  ['17524', -75.6600,  5.0639], ['17433', -75.1534,  5.2431], ['17442', -75.5972,  5.4747],
  ['17867', -75.8833,  5.0694],
  // Caquetá
  ['18001', -75.6062,  1.6144], ['18094', -75.8772,  1.4261], ['18460', -75.4608,  1.4758],
  ['18479', -75.6956,  1.4879], ['18756', -74.7703,  2.1113],
  // Cauca
  ['19001', -76.6063,  2.4419], ['19698', -76.4819,  3.0122], ['19142', -76.3972,  3.0439],
  ['19460', -76.2342,  3.2425], ['19573', -76.4133,  3.2294], ['19532', -76.9289,  2.0628],
  // Cesar
  ['20001', -73.2532, 10.4631], ['20400', -73.3308,  9.5519], ['20443', -73.1856, 10.3908],
  ['20621', -73.3914,  8.0297], ['20710', -73.8133,  8.8683],
  // Córdoba
  ['23001', -75.8814,  8.7578], ['23189', -75.7942,  8.8836], ['23162', -76.0300,  8.7800],
  ['23466', -75.4328,  7.9853], ['23417', -75.8189,  9.2303], ['23555', -75.5831,  8.4053],
  ['23672', -75.4467,  8.9508],
  // Cundinamarca
  ['25754', -74.2175,  4.5789], ['25175', -74.0592,  4.8594], ['25430', -74.2297,  4.7067],
  ['25473', -74.3567,  4.8153], ['25899', -74.0044,  5.0228], ['25658', -74.2006,  4.7156],
  ['25307', -74.8027,  4.3039], ['25369', -74.4625,  4.6325], ['25513', -74.6358,  4.3033],
  ['25290', -74.3639,  4.3442],
  // Chocó
  ['27001', -76.6578,  5.6944], ['27361', -76.6847,  5.1597], ['27413', -76.5378,  5.5158],
  ['27086', -76.9853,  6.9906],
  // Huila
  ['41001', -75.2819,  2.9273], ['41006', -75.8989,  1.8272], ['41132', -75.3217,  2.6864],
  ['41206', -75.6297,  2.1981], ['41791', -76.0519,  1.8833], ['41524', -75.4297,  2.9017],
  ['41615', -75.2344,  2.7828],
  // La Guajira
  ['44001', -72.9072, 11.5444], ['44430', -72.2478, 11.3756], ['44035', -72.4864, 11.2233],
  ['44420', -72.4536, 11.7797], ['44847', -72.2722, 11.7131], ['44560', -73.0050, 10.7678],
  // Magdalena
  ['47001', -74.1990, 11.2408], ['47189', -74.2525, 11.0058], ['47570', -74.7831,  9.7922],
  ['47660', -74.5561,  9.4733], ['47551', -74.6178, 10.4633], ['47675', -74.5753,  9.3278],
  // Meta
  ['50001', -73.6350,  4.1533], ['50006', -73.7578,  3.9886], ['50124', -73.6731,  3.8625],
  ['50313', -73.7200,  3.5364], ['50325', -73.7686,  3.8819], ['50400', -73.9742,  3.5269],
  ['50683', -73.6989,  3.6958],
  // Nariño
  ['52001', -77.2811,  1.2136], ['52356', -77.6442,  0.8313], ['52110', -77.1561,  1.3914],
  ['52835', -78.7994,  1.7961], ['52520', -77.5167,  0.8958], ['52540', -77.5869,  1.3375],
  // Norte de Santander
  ['54001', -72.5078,  7.8939], ['54518', -72.6497,  7.3769], ['54174', -72.6150,  7.6086],
  ['54206', -73.3411,  8.4689], ['54344', -72.4039,  7.4992], ['54720', -72.7289,  8.6589],
  ['54871', -72.4728,  7.8372],
  // Quindío
  ['63001', -75.6811,  4.5339], ['63130', -75.6444,  4.5331], ['63190', -75.6411,  4.6175],
  ['63212', -75.6797,  4.4089], ['63401', -75.7958,  4.4464], ['63548', -75.7636,  4.6214],
  // Risaralda
  ['66001', -75.6961,  4.8133], ['66045', -75.9728,  5.1025], ['66075', -75.9617,  5.0481],
  ['66170', -75.6622,  4.8478], ['66318', -75.8031,  5.2386], ['66400', -75.9856,  4.9906],
  ['66440', -75.8781,  4.9003], ['66456', -75.7433,  4.9439], ['66572', -75.6247,  4.8681],
  // Santander
  ['68001', -73.1227,  7.1198], ['68081', -73.8542,  7.0647], ['68276', -73.0892,  7.0642],
  ['68307', -73.1689,  7.0714], ['68547', -73.0525,  6.9878], ['68615', -73.6872,  5.8758],
  ['68655', -73.1333,  6.5561], ['68679', -73.6183,  5.9411], ['68720', -73.2644,  6.4706],
  ['68855', -73.6778,  6.0100],
  // Sucre
  ['70001', -75.3978,  9.3047], ['70215', -75.2917,  9.3192], ['70110', -75.7033,  9.4006],
  ['70400', -75.3717,  9.2622], ['70508', -75.2297,  9.5289], ['70702', -75.1244,  8.6633],
  ['70771', -75.5783,  9.5197],
  // Tolima
  ['73001', -75.2322,  4.4389], ['73024', -74.9536,  3.4008], ['73148', -74.7292,  4.1578],
  ['73168', -75.4897,  3.7233], ['73349', -74.7406,  5.2094], ['73408', -74.9283,  4.8625],
  ['73411', -75.0628,  4.9256], ['73443', -74.8875,  5.1994], ['73449', -74.6467,  4.2075],
  ['73624', -74.9322,  3.8597], ['73854', -75.1469,  4.8619], ['73861', -75.2019,  3.6039],
  // Valle del Cauca
  ['76001', -76.5319,  3.4516], ['76892', -76.4961,  3.5858], ['76520', -76.3033,  3.5394],
  ['76111', -76.2994,  3.9003], ['76823', -76.1961,  4.0842], ['76109', -77.0325,  3.8814],
  ['76147', -75.9119,  4.7467], ['76364', -76.5369,  3.2606], ['76306', -76.2817,  3.7433],
  ['76736', -75.9325,  4.2694], ['76670', -76.3839,  4.0222], ['76400', -76.2294,  3.3272],
  ['76563', -76.2494,  3.4269],
  // Arauca
  ['81001', -70.7617,  7.0897], ['81065', -71.4267,  7.0264], ['81220', -70.2203,  6.3094],
  ['81300', -71.7581,  6.8417], ['81591', -71.1022,  6.2908], ['81736', -71.8681,  6.9494],
  ['81794', -71.7297,  6.4608],
  // Casanare
  ['85001', -72.3956,  5.3378], ['85010', -72.5494,  5.1706], ['85015', -72.7017,  4.9972],
  ['85125', -71.7628,  6.1539], ['85136', -72.3006,  5.9158], ['85139', -72.2878,  4.8167],
  ['85162', -72.8992,  4.8831], ['85225', -72.2008,  5.6417], ['85400', -71.8908,  5.8761],
  ['85410', -71.9967,  5.7167], ['85430', -72.6906,  5.0567], ['85440', -72.5281,  4.8600],
  ['85507', -71.7286,  5.4628], ['85325', -72.7417,  5.0181], ['85450', -71.6528,  5.4156],
  ['85460', -72.9394,  4.6211],
  // Putumayo
  ['86001', -76.6483,  1.1522], ['86320', -76.9028,  0.4564], ['86569', -76.5014,  0.5031],
  ['86573', -76.5922,  0.7017], ['86749', -76.8700,  1.1214], ['86755', -76.9019,  0.3228],
  ['86757', -76.8925,  1.1369], ['86865', -76.6194,  1.0261],
  // San Andrés (isla - sin conexión vial con el continente, omitir de routing)
  // ['88001', -81.7185, 12.5567], ['88564', -81.3756, 13.3475],
];

// ═══════════════════════════════════════════════════════════════════════════
// OSRM: solicitar matriz completa en sub-matrices de CHUNK×CHUNK
// El servidor público de OSRM limita a ~50 coordenadas en la URL.
// Estrategia: dividir municipios en chunks de 40, enviar sub-matrices 40×40.
// Para 205 municipios → 6 chunks → ~21 solicitudes en total.
// ═══════════════════════════════════════════════════════════════════════════
const CHUNK = 30; // coordenadas por grupo — 30+30=60 coords por request, dentro del límite OSRM

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout: 60000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 300)}`));
        } else {
          resolve(JSON.parse(data));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function osrmSubMatrix(srcList, dstList, sameChunk = false) {
  let coordStr, srcIdx, dstIdx;

  if (sameChunk) {
    // Mismo chunk: coords solo una vez, sources y destinations = todos los índices
    coordStr = srcList.map(([, lon, lat]) => `${lon},${lat}`).join(';');
    const allIdx = srcList.map((_, i) => i).join(';');
    srcIdx = allIdx;
    dstIdx = allIdx;
  } else {
    // Chunks distintos: concatenar ambos grupos
    const allCoords = [...srcList, ...dstList];
    coordStr = allCoords.map(([, lon, lat]) => `${lon},${lat}`).join(';');
    srcIdx   = srcList.map((_, i) => i).join(';');
    dstIdx   = dstList.map((_, i) => srcList.length + i).join(';');
  }

  const url = `http://router.project-osrm.org/table/v1/driving/${coordStr}` +
    `?sources=${srcIdx}&destinations=${dstIdx}&annotations=distance`;

  let result;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      result = await httpGet(url);
      if (result.code === 'Ok') return result.distances;
      throw new Error(`OSRM: ${result.code} ${result.message}`);
    } catch (e) {
      if (attempt === 3) throw e;
      process.stdout.write(` [retry ${attempt}]`);
      await sleep(2000 * attempt);
    }
  }
}

async function main() {
  const n = MUNICIPIOS.length;
  console.log(`\n🗺  Calculando distancias OSRM para ${n} municipios...`);
  console.log(`   Total pares únicos: ${n * (n - 1) / 2}\n`);

  // Resultado: matrix[i][j] = km  (null si no hay ruta vial)
  const matrix = Array.from({ length: n }, () => new Array(n).fill(null));

  // Dividir en chunks
  const chunks = [];
  for (let s = 0; s < n; s += CHUNK) {
    chunks.push({ start: s, end: Math.min(s + CHUNK, n) });
  }

  let totalRequests = 0;
  // Para cada par de chunks (i ≤ j) cubrimos la mitad superior + diagonal
  for (let ci = 0; ci < chunks.length; ci++) {
    for (let cj = ci; cj < chunks.length; cj++) {
      const { start: si, end: ei } = chunks[ci];
      const { start: sj, end: ej } = chunks[cj];

      const srcList = MUNICIPIOS.slice(si, ei);
      const dstList = MUNICIPIOS.slice(sj, ej);

      totalRequests++;
      process.stdout.write(`   [${totalRequests.toString().padStart(2)}] chunk(${si}-${ei-1}) × chunk(${sj}-${ej-1})... `);

      const subMatrix = await osrmSubMatrix(srcList, dstList, ci === cj);

      // Llenar matrix[i][j] y matrix[j][i] con resultado
      for (let r = 0; r < srcList.length; r++) {
        for (let c = 0; c < dstList.length; c++) {
          const meters = subMatrix[r][c];
          if (meters != null && meters > 0) {
            const gi = si + r;
            const gj = sj + c;
            const km = Math.round(meters / 1000);
            matrix[gi][gj] = km;
            matrix[gj][gi] = km; // simetría
          }
        }
      }
      console.log(`✓`);
      await sleep(300);
    }
  }

  // ── Generar archivo TypeScript ──────────────────────────────────────────
  console.log('\n📝 Generando archivo TypeScript...');

  const lines = [];
  lines.push('/**');
  lines.push(' * Tabla de distancias viales reales entre municipios de Colombia.');
  lines.push(' * Generada automáticamente con OSRM/OpenStreetMap.');
  lines.push(` * Fecha: ${new Date().toISOString().slice(0, 10)}`);
  lines.push(` * Municipios: ${n}`);
  lines.push(` * Pares con ruta: (ver conteo al final)`);
  lines.push(' *');
  lines.push(' * Uso interno — importar desde lib/utils/distancias.ts');
  lines.push(' */');
  lines.push('');
  lines.push('/** Mapa de "DANE_origen:DANE_destino" (orden canónico, menor primero) → km */');
  lines.push('export const DISTANCIAS_REALES: Record<string, number> = {');

  let count = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const km = matrix[i][j];
      if (km != null && km > 0) {
        const [codA] = MUNICIPIOS[i];
        const [codB] = MUNICIPIOS[j];
        const [keyA, keyB] = [codA, codB].sort();
        lines.push(`  '${keyA}:${keyB}': ${km},`);
        count++;
      }
    }
  }

  lines.push('};');
  lines.push('');
  lines.push(`// Total pares con ruta vial: ${count}`);

  const outPath = path.join(__dirname, '..', 'lib', 'utils', 'distancias-tabla.ts');
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');

  console.log(`\n✅ Generado: ${outPath}`);
  console.log(`   Pares con ruta real: ${count}`);
  console.log(`   Pares sin ruta (islas/inaccesibles): ${n * (n - 1) / 2 - count}`);
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
