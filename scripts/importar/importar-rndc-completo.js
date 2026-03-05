/**
 * Script de importación RNDC → Base de datos CargoClick
 * 
 * Importa datos desde los Excel del RNDC (Ministerio de Transporte):
 * - Maestro_Vehículo_RNDC.xls → vehiculos
 * - Manifiestos_RNDC (5).xls  → conductores + manifiestos_operativos
 * - Remesas_RNDC (4).xls      → remesas
 * 
 * Orden de importación: Vehiculos → Conductores → Manifiestos → Remesas
 * 
 * Uso: node scripts/importar-rndc-completo.js [--full]
 *   Sin flags: prueba parcial (100 registros por tabla)
 *   --full: importación completa
 */

const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

// ============================================
// CONFIGURACIÓN
// ============================================
const FULL_MODE = process.argv.includes('--full');
const TEST_LIMIT = FULL_MODE ? Infinity : 100;

const DATA = path.join(__dirname, '..', '..', 'data');
const FILE_VEHICULOS = path.join(DATA, 'maestros-rndc', 'Maestro_Vehículo_RNDC.xls');
const FILE_MANIFIESTOS = path.join(DATA, 'historicos-rndc', 'Manifiestos_RNDC (5).xls');
const FILE_REMESAS = path.join(DATA, 'historicos-rndc', 'Remesas_RNDC (4).xls');

// ============================================
// UTILIDADES
// ============================================

/** Normalizar texto: mayúscula, quitar acentos, trim */
function norm(s) {
  if (!s || typeof s !== 'string') return '';
  return s.toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Convertir serial Excel a Date JS */
function excelDateToJs(serial) {
  if (!serial) return null;
  if (typeof serial === 'number') {
    // Excel epoch: 1899-12-30
    const epoch = new Date(1899, 11, 30);
    const ms = serial * 86400000;
    return new Date(epoch.getTime() + ms);
  }
  // Manejar fechas como string (ej: "2019/01/01 12:43:08")
  if (typeof serial === 'string') {
    const d = new Date(serial.replace(/\//g, '-'));
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/** Convertir serial Excel a Date solo (sin hora) para @db.Date */
function excelDateOnly(serial) {
  const d = excelDateToJs(serial);
  if (!d || isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Parsear fecha string RNDC: "2026-07-22-00:00:00" → Date */
function parseRndcDateStr(s) {
  if (!s || typeof s !== 'string' || s.trim() === '' || s.trim() === ' ') return null;
  // Format: YYYY-MM-DD-HH:MM:SS
  const parts = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!parts) return null;
  return new Date(parseInt(parts[1]), parseInt(parts[2]) - 1, parseInt(parts[3]));
}

/** Limpiar string RNDC (espacios en blanco = null) */
function clean(val) {
  if (val === undefined || val === null) return null;
  const s = String(val).trim();
  return s === '' || s === ' ' || s === '0' ? null : s;
}

/** Convertir a int seguro */
function toInt(val) {
  if (val === undefined || val === null) return null;
  const n = parseInt(val);
  return isNaN(n) ? null : n;
}

/** Convertir a float seguro  */
function toFloat(val) {
  if (val === undefined || val === null) return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

/** Pad DANE code a 8 dígitos */
function padDane(code) {
  if (!code) return null;
  return String(code).padStart(8, '0');
}

/** Dividir nombre completo en nombres y apellidos (heurística: últimas 2 palabras son apellidos) */
function splitName(fullName) {
  if (!fullName) return { nombres: 'DESCONOCIDO', apellidos: 'DESCONOCIDO' };
  const parts = fullName.trim().split(/\s+/).filter(p => p.length > 0);
  if (parts.length <= 1) return { nombres: parts[0] || 'DESCONOCIDO', apellidos: 'DESCONOCIDO' };
  if (parts.length === 2) return { nombres: parts[0], apellidos: parts[1] };
  if (parts.length === 3) return { nombres: parts[0], apellidos: parts.slice(1).join(' ') };
  // 4+ partes: primeros N-2 son nombres, últimos 2 son apellidos
  const apellidos = parts.slice(-2).join(' ');
  const nombres = parts.slice(0, -2).join(' ');
  return { nombres, apellidos };
}

// ============================================
// DIVIPOLA (tabla DANE oficial de municipios)
// ============================================

async function downloadDivipola() {
  console.log('📥 Descargando DIVIPOLA desde datos.gov.co...');
  const url = 'https://www.datos.gov.co/resource/gdxc-w37w.json?$limit=1200';
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Error descargando DIVIPOLA: ${resp.status}`);
  const data = await resp.json();
  console.log(`   → ${data.length} municipios descargados`);
  return data;
}

/**
 * Construir lookup de DANE codes combinando:
 * 1. Datos de manifiestos (texto→DANE, la fuente más confiable)
 * 2. DIVIPOLA oficial (cubre municipios no presentes en manifiestos)
 */
function buildDaneLookup(manifiestos, divipolaData) {
  const lookup = new Map(); // norm("MUNICIPIO DEPARTAMENTO") → DANE 8 dígitos

  // 1) Desde manifiestos: la fuente primaria (ya tiene el formato exacto del RNDC)
  manifiestos.forEach(m => {
    const orTxt = norm(m.MANORIGEN);
    const deTxt = norm(m.MANDESTINO);
    const orDane = padDane(m.CODMUNICIPIOORIGENMANIFIESTO);
    const deDane = padDane(m.CODMUNICIPIODESTINOMANIFIESTO);
    if (orTxt && orDane) lookup.set(orTxt, orDane);
    if (deTxt && deDane) lookup.set(deTxt, deDane);
  });

  const fromManifiestos = lookup.size;

  // 2) Desde DIVIPOLA: para municipios no cubiertos por manifiestos
  divipolaData.forEach(d => {
    const munName = norm(d.nom_mpio);
    const depName = norm(d.nom_depto);
    const code = d.cod_mpio; // "05001" → "05001000"
    const dane8 = code + '000';
    
    // Probar variaciones del formato RNDC: "MUNICIPIO DEPARTAMENTO"
    const key1 = `${munName} ${depName}`;
    if (!lookup.has(key1)) lookup.set(key1, dane8);

    // Formato sin "D.C." para Bogotá
    if (depName.includes('BOGOTA')) {
      const key2 = `BOGOTA BOGOTA D. C.`;
      if (!lookup.has(norm(key2))) lookup.set(norm(key2), dane8);
    }

    // Solo nombre del municipio (fallback)
    if (!lookup.has(munName)) lookup.set(munName, dane8);
  });

  console.log(`   → Lookup DANE: ${fromManifiestos} de manifiestos + ${lookup.size - fromManifiestos} de DIVIPOLA = ${lookup.size} total`);
  return lookup;
}

/** Resolver DANE code para un texto de municipio */
function resolveDane(text, daneLookup) {
  if (!text) return '00000000';
  const key = norm(text);
  if (daneLookup.has(key)) return daneLookup.get(key);
  
  // Intentar sin la parte después de la última coma
  const parts = key.split(',');
  if (parts.length > 1 && daneLookup.has(parts[0].trim())) {
    return daneLookup.get(parts[0].trim());
  }
  
  return '00000000'; // No resuelto
}

// ============================================
// CARGA DE DATOS EXCEL
// ============================================

function loadExcel(filePath) {
  console.log(`📂 Cargando ${path.basename(filePath)}...`);
  const wb = XLSX.readFile(filePath);
  const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  console.log(`   → ${data.length} filas`);
  return data;
}

// ============================================
// IMPORTACIÓN: VEHÍCULOS
// ============================================

async function importVehiculos(vehiculosData, limit) {
  console.log(`\n🚛 Importando Vehículos (límite: ${limit === Infinity ? 'TODOS' : limit})...`);
  const toImport = vehiculosData.slice(0, limit);
  let created = 0, errors = 0;

  for (const v of toImport) {
    try {
      const placa = clean(v.NUMPLACA);
      if (!placa) { errors++; continue; }

      await prisma.vehiculo.upsert({
        where: { placa },
        create: {
          placa,
          codMarcaVehiculo: toInt(v.CODMARCAVEHICULOCARGA),
          marcaVehiculo: clean(v.MARCAVEHICULOCARGA),
          codLineaVehiculo: toInt(v.CODLINEAVEHICULOCARGA),
          lineaVehiculo: clean(v.LINEAVEHICULOCARGA),
          anioVehiculo: toInt(v.ANOFABRICACIONVEHICULOCARGA),
          configVehiculo: null, // no viene en maestro, se setea en el manifiesto
          codConfiguracionUnidad: toInt(v.CODCONFIGURACIONUNIDADCARGA),
          configuracionUnidad: clean(v.CONFIGURACIONUNIDADCARGA),
          codTipoCarroceria: toInt(v.CODTIPOCARROCERIA),
          tipoCarroceria: clean(v.TIPOCARROCERIA),
          pesoVehiculoVacio: toInt(v.PESOVEHICULOVACIO),
          numEjes: toInt(v.NUMEJES),
          codTipoCombustible: toInt(v.CODTIPOCOMBUSTIBLE),
          tipoCombustible: clean(v.TIPOCOMBUSTIBLE),
          codColorVehiculo: toInt(v.CODCOLORVEHICULOCARGA),
          numSoat: clean(v.NUMSEGUROSOAT),
          soatVigencia: parseRndcDateStr(v.FECHAVENCIMIENTOSOAT),
          aseguradoraSoat: clean(v.ASEGURADORASOAT),
          nitAseguradoraSoat: clean(v.NUMNITASEGURADORASOAT),
          capacidadTon: toFloat(v.CAPACIDADTONELADASVEHICULO),
          codTipoIdPropietario: toInt(v.CODTIPOIDPROPIETARIO), // puede ser null si es string "C"
          tipoIdPropietario: clean(v.TIPOIDPROPIETARIO),
          propietarioId: clean(v.NUMIDPROPIETARIO),
          propietarioNombre: clean(v.VEHNOMBREPROP),
          codTipoIdTenedor: toInt(v.CODTIPOIDTENEDOR),
          tipoIdTenedor: clean(v.TIPOIDTENEDOR),
          numIdTenedor: clean(v.NUMIDTENEDOR),
          nombreTenedor: clean(v.VEHNOMBRETENENC),
          rtmVigencia: parseRndcDateStr(v.FECHAULTIMAREVASAT),
          // Metadatos RNDC
          fechaIngresoRndc: excelDateToJs(v.FECHAINGRESO),
          usuarioIdRndc: toInt(v.USUARIOID),
          empresaTransporteRndc: clean(v.VEHEMPRESA),
          nitEmpresaTransporte: clean(v.NUMNITEMPRESATRANSPORTE),
          diferenciasRndc: clean(v.VEHDIFERENCIAS),
          codigoEmpresaRndc: toInt(v.CODIGOEMPRESA),
          activo: true,
        },
        update: {} // si ya existe, no sobreescribir
      });
      created++;
    } catch (e) {
      errors++;
      if (errors <= 3) console.error(`   ⚠️ Error vehículo ${v.NUMPLACA}:`, e.message);
    }
  }

  console.log(`   ✅ Vehículos: ${created} creados, ${errors} errores`);
  return created;
}

// ============================================
// IMPORTACIÓN: CONDUCTORES (extraídos de manifiestos)
// ============================================

async function importConductores(manifiestos, limit) {
  console.log(`\n👤 Importando Conductores (límite: ${limit === Infinity ? 'TODOS' : limit})...`);
  
  // Extraer conductores únicos
  const conductoresMap = new Map();
  manifiestos.forEach(m => {
    const cedula = clean(m.NUMIDCONDUCTOR);
    if (!cedula) return;
    if (!conductoresMap.has(cedula)) {
      conductoresMap.set(cedula, m.MANNOMBRECONDUCTOR || 'DESCONOCIDO');
    }
  });

  const conductores = [...conductoresMap.entries()].slice(0, limit);
  let created = 0, errors = 0;

  for (const [cedula, nombreCompleto] of conductores) {
    try {
      const { nombres, apellidos } = splitName(nombreCompleto);
      await prisma.conductor.upsert({
        where: { cedula },
        create: {
          cedula,
          nombres,
          apellidos,
          categoriaLicencia: 'C3', // default — no tenemos maestro de conductores
          activo: true,
        },
        update: {} // no sobreescribir si ya existe
      });
      created++;
    } catch (e) {
      errors++;
      if (errors <= 3) console.error(`   ⚠️ Error conductor ${cedula}:`, e.message);
    }
  }

  console.log(`   ✅ Conductores: ${created} creados, ${errors} errores (total únicos: ${conductoresMap.size})`);
  return created;
}

// ============================================
// IMPORTACIÓN: MANIFIESTOS
// ============================================

async function importManifiestos(manifiestos, limit) {
  console.log(`\n📋 Importando Manifiestos (límite: ${limit === Infinity ? 'TODOS' : limit})...`);
  const toImport = manifiestos.slice(0, limit);
  let created = 0, errors = 0, skipped = 0;

  // Pre-check: obtener sets de conductores y vehículos existentes
  const conductoresExist = new Set((await prisma.conductor.findMany({ select: { cedula: true } })).map(c => c.cedula));
  const vehiculosExist = new Set((await prisma.vehiculo.findMany({ select: { placa: true } })).map(v => v.placa));

  for (const m of toImport) {
    try {
      const numManifiesto = String(m.NUMMANIFIESTOCARGA);
      const conductorCedula = clean(m.NUMIDCONDUCTOR);
      const vehiculoPlaca = clean(m.NUMPLACA);

      if (!conductorCedula || !vehiculoPlaca) { skipped++; continue; }

      // Verificar que conductor y vehículo existen
      if (!conductoresExist.has(conductorCedula)) {
        // Crear conductor minimal
        const { nombres, apellidos } = splitName(m.MANNOMBRECONDUCTOR);
        await prisma.conductor.create({
          data: { cedula: conductorCedula, nombres, apellidos, categoriaLicencia: 'C3' }
        });
        conductoresExist.add(conductorCedula);
      }

      if (!vehiculosExist.has(vehiculoPlaca)) {
        // Crear vehículo minimal (96 placas de manifiestos no están en maestro)
        await prisma.vehiculo.create({
          data: { placa: vehiculoPlaca }
        });
        vehiculosExist.add(vehiculoPlaca);
      }

      // Determinar estado del manifiesto
      let estadoManifiesto = 'BORRADOR';
      const estado = clean(m.ESTADO);
      if (estado === 'CE') estadoManifiesto = 'CULMINADO';
      else if (estado === 'AC') estadoManifiesto = 'REGISTRADO';

      const fechaExp = excelDateOnly(m.FECHAEXPEDICIONMANIFIESTO);
      if (!fechaExp) { skipped++; continue; }

      // Guardar NUMMANIFIESTOCARGA tal cual viene del ministerio
      const codigoInterno = numManifiesto;

      await prisma.manifiestoOperativo.upsert({
        where: { codigoInterno },
        create: {
          codigoInterno,
          numeroManifiesto: clean(m.INGRESOID),
          conductorCedula,
          vehiculoPlaca,
          placaRemolque: clean(m.NUMPLACAREMOLQUE),
          placaRemolque2: clean(m.NUMPLACAREMOLQUE2),
          conductor2TipoId: clean(m.CODIDCONDUCTOR2),
          conductor2Cedula: clean(m.NUMIDCONDUCTOR2),
          origenMunicipio: m.MANORIGEN || 'DESCONOCIDO',
          origenDane: padDane(m.CODMUNICIPIOORIGENMANIFIESTO) || '00000000',
          destinoMunicipio: m.MANDESTINO || 'DESCONOCIDO',
          destinoDane: padDane(m.CODMUNICIPIODESTINOMANIFIESTO) || '00000000',
          municipioIntermedioDane: toInt(m.CODMUNICIPIOINTERMEDIO) > 0 ? padDane(m.CODMUNICIPIOINTERMEDIO) : null,
          municipioIntermedio: clean(m.MANINTERMEDIO),
          codOperacionTransporte: clean(m.CODOPERACIONTRANSPORTE),
          codNaturalezaCarga: clean(m.CODNATURALEZACARGA),
          mercanciaRemesaCod: toInt(m.MERCANCIAREMESA),
          descripcionCortaProducto: clean(m.DESCRIPCIONCORTAPRODUCTO),
          configResultante: clean(m.MANCONFIGURACIONRESULTANTE),
          pesoTotalKg: toInt(m.MANKILOGRAMOSREMESAS) || 0,
          galonesRemesas: toFloat(m.MANGALONESREMESAS),
          kilometros: toFloat(m.KILOMETROS),
          fechaExpedicion: fechaExp,
          fechaDespacho: fechaExp, // usamos misma fecha
          fletePactado: toFloat(m.VALORFLETEPACTADOVIAJE) || 0,
          tipoValorPactado: clean(m.TIPOVALORPACTADO),
          retencionIca: toInt(m.PORCENTAJERETENCION) || 4,
          valorAnticipo: toFloat(m.VALORANTICIPOMANIFIESTO) || 0,
          valorSicetac: toFloat(m.VALORSICETAC),
          valorToneladaSicetac: toFloat(m.VALORTONELADASICETAC),
          nitMonitoreoFlota: clean(m.NITMONITOREOFLOTA),
          viajesDia: toInt(m.VIAJESDIA),
          trasbordoManifiestoId: toInt(m.MANIFIESTOTRASBORDOID) > 0 ? String(m.MANIFIESTOTRASBORDOID) : null,
          aceptacionElectronica: m.ACEPTACIONELECTRONICA === 'SI',
          responsablePagoCargue: 'E',
          responsablePagoDescargue: 'E',
          // Metadatos RNDC
          fechaIngresoRndc: excelDateToJs(m.FECHAINGRESO),
          usuarioRndc: clean(m.USUARIO),
          interactivoRndc: clean(m.INTERACTIVO),
          codigoEmpresaRndc: toInt(m.CODIGOEMPRESA),
          nitEmpresaTransporte: clean(m.NUMNITEMPRESATRANSPORTE),
          anoMesRndc: toInt(m.ANOMES),
          usuarioIngresoRndc: toInt(m.USUARIOINGR),
          estadoManifiesto,
        },
        update: {}
      });
      created++;
    } catch (e) {
      errors++;
      if (errors <= 5) console.error(`   ⚠️ Error manifiesto ${m.NUMMANIFIESTOCARGA}:`, e.message);
    }
  }

  console.log(`   ✅ Manifiestos: ${created} creados, ${skipped} saltados, ${errors} errores`);
  return created;
}

// ============================================
// IMPORTACIÓN: REMESAS
// ============================================

async function importRemesas(remesas, manifiestos, daneLookup, limit) {
  console.log(`\n📦 Importando Remesas (límite: ${limit === Infinity ? 'TODOS' : limit})...`);
  const toImport = remesas.slice(0, limit);
  let created = 0, errors = 0, skipped = 0;
  let daneResolved = 0, daneUnresolved = 0;

  // Build manifiesto number → prisma ID map 
  // El codigoInterno en la DB es "RNDC-{numManifiesto}"
  const manMap = new Map();
  manifiestos.forEach(m => {
    manMap.set(String(m.NUMMANIFIESTOCARGA), String(m.NUMMANIFIESTOCARGA));
  });

  // Pre-load manifiesto IDs from DB
  const manifDB = await prisma.manifiestoOperativo.findMany({
    select: { id: true, codigoInterno: true }
  });
  const manifIdMap = new Map(); // codigoInterno → id
  manifDB.forEach(m => manifIdMap.set(m.codigoInterno, m.id));

  // Build manifiesto DANE lookup: NUMMANIFIESTOCARGA → { origenDane, destinoDane }
  const manDaneMap = new Map();
  manifiestos.forEach(m => {
    manDaneMap.set(String(m.NUMMANIFIESTOCARGA), {
      origenDane: padDane(m.CODMUNICIPIOORIGENMANIFIESTO),
      destinoDane: padDane(m.CODMUNICIPIODESTINOMANIFIESTO),
    });
  });

  let counter = 0;
  for (const r of toImport) {
    try {
      counter++;
      // Usar CONSECUTIVOREMESA como ID principal, fallback a INGRESOID
      const consecutivo = clean(r.CONSECUTIVOREMESA);
      const numRemesa = consecutivo || `RNDC-REM-${r.INGRESOID || counter}`;
      
      // Resolver manifiesto FK
      const numManCarga = r.NUMMANIFIESTOCARGA ? String(r.NUMMANIFIESTOCARGA).trim() : null;
      let manifiestoOperativoId = null;
      if (numManCarga) {
        const codInterno = manMap.get(numManCarga);
        if (codInterno) {
          manifiestoOperativoId = manifIdMap.get(codInterno) || null;
        }
      }

      // Resolver DANE para origen y destino — 3 estrategias en cascada:
      let origenDane = '00000000';
      let destinoDane = '00000000';

      // Estrategia 1: DANE directo de la remesa (REMDANEORIGENREMESA/REMDANEDESTINOREMESA)
      const remOrDane = r.REMDANEORIGENREMESA ? padDane(r.REMDANEORIGENREMESA) : null;
      const remDeDane = r.REMDANEDESTINOREMESA ? padDane(r.REMDANEDESTINOREMESA) : null;
      if (remOrDane && remDeDane && remOrDane !== '00000000' && remDeDane !== '00000000') {
        origenDane = remOrDane;
        destinoDane = remDeDane;
        daneResolved++;
      }
      // Estrategia 2: DANE del manifiesto asociado
      else if (numManCarga && manDaneMap.has(numManCarga)) {
        const manDane = manDaneMap.get(numManCarga);
        origenDane = manDane.origenDane;
        destinoDane = manDane.destinoDane;
        daneResolved++;
      } else {
        // Estrategia 3: Lookup por texto de municipio (manifiestos + DIVIPOLA)
        origenDane = resolveDane(r.REM_ORIG, daneLookup);
        destinoDane = resolveDane(r.REM_DESTI, daneLookup);
        if (origenDane !== '00000000' || destinoDane !== '00000000') {
          daneResolved++;
        } else {
          daneUnresolved++;
        }
      }

      // Parsear fechas (combinando fecha + hora cuando ambas existen)
      let fechaCitaCargue = excelDateToJs(r.FECHACITAPACTADACARGUE);
      if (fechaCitaCargue && r.HORACITAPACTADACARGUE && typeof r.HORACITAPACTADACARGUE === 'string') {
        const [hh, mm] = r.HORACITAPACTADACARGUE.split(':').map(Number);
        if (!isNaN(hh)) { fechaCitaCargue.setHours(hh, mm || 0, 0, 0); }
      }
      let fechaCitaDescargue = excelDateToJs(r.FECHACITAPACTADADESCARGUE);
      if (fechaCitaDescargue && r.HORACITAPACTADADESCARGUEREMESA && typeof r.HORACITAPACTADADESCARGUEREMESA === 'string') {
        const [hh, mm] = r.HORACITAPACTADADESCARGUEREMESA.split(':').map(Number);
        if (!isNaN(hh)) { fechaCitaDescargue.setHours(hh, mm || 0, 0, 0); }
      }

      // Determinar estado RNDC
      let estadoRndc = 'REGISTRADA';
      const estado = clean(r.ESTADO);
      if (estado === 'AN') estadoRndc = 'ANULADA';

      // Determinar estado operativo
      let estadoOp = 'ASIGNADA';
      if (!manifiestoOperativoId) estadoOp = 'PENDIENTE';
      if (estado === 'CE') estadoOp = 'ENTREGADA';

      await prisma.remesa.create({
        data: {
          numeroRemesa: numRemesa,
          manifiestoOperativoId,
          descripcionCarga: clean(r.DESCRIPCIONCORTAPRODUCTO) || 'SIN DESCRIPCION',
          codigoAranceladoCarga: clean(r.SUBPARTIDA_CODE),
          pesoKg: toInt(r.CANTIDADCARGADA) || 0,
          unidadMedidaProducto: clean(r.UNIDADMEDIDAPRODUCTO) || 'KGM',
          cantidadProducto: toFloat(r.CANTIDADPRODUCTO),
          codOperacionTransporte: clean(r.CODOPERACIONTRANSPORTE) || 'G',
          codNaturalezaCarga: clean(r.CODNATURALEZACARGA) || '1',
          naturalezaCarga: clean(r.NATURALEZACARGA),
          mercanciaRemesaCod: toInt(r.MERCANCIAREMESA),
          codigoEmpaque: toInt(r.CODTIPOEMPAQUE) || 10,
          estadoMercancia: clean(r.ESTADOMERCANCIA),
          unidadMedidaCapacidad: clean(r.UNIDADMEDIDACAPACIDAD),
          codigoUn: clean(r.CODIGOUN),
          tipoIdRemitente: clean(r.CODTIPOIDREMITENTE) || 'N',
          nitRemitente: clean(r.NUMIDREMITENTE) || '0',
          codSedeRemitente: clean(r.CODSEDEREMITENTE) || '1',
          empresaRemitente: clean(r.REMREMITENTE),
          direccionRemitente: clean(r.REMDIRREMITENTE),
          tipoIdDestinatario: clean(r.CODTIPOIDDESTINATARIO) || 'N',
          nitDestinatario: clean(r.NUMIDDESTINATARIO) || '0',
          codSedeDestinatario: clean(r.CODSEDEDESTINATARIO) || '1',
          empresaDestinataria: clean(r.REMDESTINATARIO),
          tipoIdPropietario: clean(r.CODTIPOIDPROPIETARIO) || 'N',
          nitPropietario: clean(r.NUMIDPROPIETARIO) || '0',
          codSedePropietario: clean(r.CODSEDEPROPIETARIO),
          nombrePropietario: clean(r.REMPROPIETARIO),
          companiaSeguriNit: clean(r.COMPANIASEGURO),
          companiaSeguriNombre: clean(r.NOMCOMPANIASEGURO),
          duenopoliza: clean(r.DUENOPOLIZA),
          origenMunicipio: clean(r.REM_ORIG) || 'DESCONOCIDO',
          origenDane,
          destinoMunicipio: clean(r.REM_DESTI) || 'DESCONOCIDO',
          destinoDane,
          latitudCargue: toFloat(r.LATITUDCARGUE),
          longitudCargue: toFloat(r.LONGITUDCARGUE),
          latitudDescargue: toFloat(r.LATITUDDESCARGUE),
          longitudDescargue: toFloat(r.LONGITUDDESCARGUE),
          codMunicipioTrasbordo: toInt(r.CODMUNICIPIOTRASBORDO) > 0 ? padDane(r.CODMUNICIPIOTRASBORDO) : null,
          municipioTrasbordo: clean(r.NOMMUNICIPIOTRASBORDO),
          tipoConsolidada: clean(r.TIPOCONSOLIDADA),
          fechaHoraCitaCargue: fechaCitaCargue,
          fechaHoraCitaDescargue: fechaCitaDescargue,
          horasPactoCarga: toInt(r.HORASPACTOCARGA) || 4,
          minutosPactoCarga: toInt(r.MINUTOSPACTOCARGA) || 0,
          horasPactoDescargue: toInt(r.HORASPACTODESCARGUE) || 4,
          minutosPactoDescargue: toInt(r.MINUTOSPACTODESCARGUE) || 0,
          pesoContenedorVacio: toFloat(r.PESOCONTENEDORVACIO),
          permisoCargaExtra: clean(r.PERMISOCARGAEXTRA),
          configResultante: clean(r.CONFIGURACIONRESULTANTE),
          valorDeclarado: toFloat(r.VALORDECLARADO),
          valorAsegurado: toFloat(r.VALORASEGURADO),
          ordenServicioGenerador: clean(r.ORDENSERVICIOGENERADOR),
          numeroRemesaRndc: clean(r.NUMREMESA) || clean(r.INGRESOID),
          fechaIngresoRndc: excelDateToJs(r.FECHAINGRESO),
          estadoRndc,
          // Extras RNDC
          cantidadInformacionCarga: toInt(r.CANTIDADINFORMACIONCARGA),
          numIdGps: clean(r.NUMIDGPS),
          numPlacaRndc: clean(r.NUMPLACA),
          municipioPropietario: clean(r.REM_PROP),
          grupoEmbalajeEnvase: clean(r.GRUPOEMBALAJEENVASE),
          codigoArancelCompleto: clean(r.CODIGOARANCEL_CODE),
          codMunicipioTrasbordo2: toInt(r.CODMUNICIPIOTRASBORDO2) > 0 ? padDane(r.CODMUNICIPIOTRASBORDO2) : null,
          municipioTrasbordo2: toInt(r.NOMMUNICIPIOTRASBORDO2) > 0 ? String(r.NOMMUNICIPIOTRASBORDO2) : null,
          // Metadatos RNDC
          usuarioRndc: clean(r.USUARIO),
          interactivoRndc: clean(r.INTERACTIVO),
          codigoEmpresaRndc: toInt(r.CODIGOEMPRESA),
          nitEmpresaTransporte: clean(r.NUMNITEMPRESATRANSPORTE),
          empresaTransporteRndc: clean(r.REMEMPRESA),
          usuarioIngresoRndc: toInt(r.USUARIOINGR),
          estado: estadoOp,
        }
      });
      created++;
    } catch (e) {
      errors++;
      if (errors <= 5) console.error(`   ⚠️ Error remesa ${r.INGRESOID}:`, e.message);
    }
  }

  console.log(`   ✅ Remesas: ${created} creadas, ${skipped} saltadas, ${errors} errores`);
  console.log(`   📊 DANE: ${daneResolved} resueltos, ${daneUnresolved} sin resolver (= '00000000')`);
  return created;
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log(`🚀 Importación RNDC → CargoClick [${FULL_MODE ? 'COMPLETA' : 'PRUEBA ' + TEST_LIMIT + ' registros'}]`);
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // 1. Cargar datos Excel
    const vehiculosData = loadExcel(FILE_VEHICULOS);
    const manifestoData = loadExcel(FILE_MANIFIESTOS);
    const remesasData = loadExcel(FILE_REMESAS);

    // 2. Descargar DIVIPOLA
    let divipolaData = [];
    try {
      divipolaData = await downloadDivipola();
    } catch (e) {
      console.warn('⚠️ No se pudo descargar DIVIPOLA, continuando solo con datos de manifiestos:', e.message);
    }

    // 3. Construir lookup DANE
    console.log('\n🗺️ Construyendo lookup DANE...');
    const daneLookup = buildDaneLookup(manifestoData, divipolaData);

    // 4. Importar en orden de dependencias
    await importVehiculos(vehiculosData, TEST_LIMIT);
    await importConductores(manifestoData, TEST_LIMIT);
    await importManifiestos(manifestoData, TEST_LIMIT);
    await importRemesas(remesasData, manifestoData, daneLookup, TEST_LIMIT);

    // 5. Resumen final
    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 RESUMEN FINAL');
    console.log('═══════════════════════════════════════════════════');
    const counts = {
      vehiculos: await prisma.vehiculo.count(),
      conductores: await prisma.conductor.count(),
      manifiestos: await prisma.manifiestoOperativo.count(),
      remesas: await prisma.remesa.count(),
    };
    console.log(`   Vehículos:    ${counts.vehiculos}`);
    console.log(`   Conductores:  ${counts.conductores}`);
    console.log(`   Manifiestos:  ${counts.manifiestos}`);
    console.log(`   Remesas:      ${counts.remesas}`);
    console.log('═══════════════════════════════════════════════════\n');

  } catch (e) {
    console.error('❌ Error fatal:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
