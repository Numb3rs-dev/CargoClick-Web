/**
 * Motor de Cotización SISETAC
 * Base normativa: Resolución MinTransporte 20213040034405 · Protocolo SICE-TAC
 *
 * Flujo: datos de la solicitud → inferencias → CF + CV → flete SISETAC → tarifa sugerida
 */

import { prisma } from '@/lib/db/prisma'

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────

export type ConfigVehiculo = 'C2' | 'C3' | 'C2S2' | 'C2S3' | 'C3S2' | 'C3S3'

export interface DesgloseCv {
  combustible: number
  peajes: number
  llantas: number
  lubricantes: number
  filtros: number
  lavadoEngrase: number
  mantenimiento: number
  imprevistos: number
  total: number
}

export interface DesgloseCf {
  capital: number
  salarios: number
  seguros: number
  impuestos: number
  parqueadero: number
  comunicaciones: number
  rtm: number
  totalMes: number
  viajesMes: number
  porViaje: number
}

export interface ParametrosUsados {
  periodoParams: number
  acpmCopGal: number
  smlmv: number
  interesMensualBr: number
  valorVehiculoCop: number
  viajesMesSimulados: number
  velocidadPromKmH: number
  distribucionTerreno: { plano: number; ondulado: number; montanoso: number }
  fuenteTerreno: 'tabla_corredor' | 'distribucion_default'
  fuentePeajes: 'tabla_ruta' | 'estimacion_default'
  metodologia: string
}

export interface ResultadoCotizacion {
  configVehiculo: ConfigVehiculo
  distanciaKm: number
  desgloseCv: DesgloseCv
  desgloseCf: DesgloseCf
  cvTotal: number
  cfPorViaje: number
  costoTecnicoBase: number          // CV + CF (sin OC)
  fleteReferencialSisetac: number   // piso legal
  tarifaSugerida: number            // piso × (1 + margen), redondeada
  margenAplicado: number            // % efectivo
  parametrosUsados: ParametrosUsados
}

// ─────────────────────────────────────────────────────────────
// CONSTANTES SISETAC — FIJAS POR RESOLUCIÓN (no cambiar)
// ─────────────────────────────────────────────────────────────

const H_MES               = 288      // horas operativas/mes
const FP_SALARIO          = 0.5568   // factor prestacional conductor
const JORNADA_FACTOR      = 1.5      // 12h × conductor + factor suplente
const FACTOR_SUPLENTE     = 0.5 / 12
const TASA_IMPREVISTOS    = 0.075    // 7.5% excl. combustible y peajes
const TASA_IMPUESTO_VEH   = 0.005   // 0.5% anual sobre valor vehículo
const F_ADMIN             = 0.05    // 5% administración
const DENOMINADOR_OC      = 0.755448 // 1 – comisión – prestaciones – ICA – fuente

// Velocidades km/h por config y terreno (P=plano, O=ondulado, M=montañoso)
const VELOCIDADES: Record<ConfigVehiculo, { P: number; O: number; M: number }> = {
  C2:   { P: 53.00, O: 30.00, M: 15.00 },
  C3:   { P: 56.59, O: 32.94, M: 18.65 },
  C2S2: { P: 63.04, O: 32.95, M: 25.81 },
  C2S3: { P: 63.04, O: 32.95, M: 18.65 },
  C3S2: { P: 56.23, O: 33.13, M: 23.57 },
  C3S3: { P: 56.23, O: 33.13, M: 23.57 },
}

// Rendimiento km/galón por config y terreno (fijados por ley)
const RENDIMIENTO: Record<ConfigVehiculo, { P: number; O: number; M: number }> = {
  C2:   { P: 12.70, O: 10.10, M:  7.81 },
  C3:   { P:  8.00, O:  6.22, M:  4.66 },
  C2S2: { P:  8.76, O:  6.76, M:  5.07 },
  C2S3: { P:  8.76, O:  6.76, M:  5.07 },
  C3S2: { P:  6.80, O:  5.04, M:  3.42 },
  C3S3: { P:  6.48, O:  4.80, M:  3.26 },
}

// Factor de peajes COP/km para rutas sin corredor definido
const FACTOR_PEAJES_KM: Record<ConfigVehiculo, number> = {
  C2:   175,
  C3:   210,
  C2S2: 250,
  C2S3: 270,
  C3S2: 270,
  C3S3: 285,
}

// ─────────────────────────────────────────────────────────────
// INFERENCIA: pesoKg + tipoCarga → configVehiculo
// ─────────────────────────────────────────────────────────────

export function inferirConfigVehiculo(pesoKg: number, tipoCarga: string): ConfigVehiculo {
  // Tipos que requieren carrocería especial mínima C2S2
  const requiereTracto = ['CONTENEDOR', 'GRANEL_LIQUIDO']
  if (requiereTracto.some(t => tipoCarga.toUpperCase().includes(t))) {
    if (pesoKg <= 25000) return 'C2S2'
    if (pesoKg <= 30000) return 'C2S3'
    return 'C3S3'
  }

  if (pesoKg <= 8000)  return 'C2'
  if (pesoKg <= 17000) return 'C3'
  if (pesoKg <= 25000) return 'C3S2'
  return 'C3S3'
}

// ─────────────────────────────────────────────────────────────
// INFERENCIA: origen + destino → distribución de terreno
// ─────────────────────────────────────────────────────────────

interface TerrainResult {
  plano: number
  ondulado: number
  montanoso: number
  peajesC2: number
  peajesC3plus: number
  fuente: 'tabla_corredor' | 'distribucion_default'
}

async function inferirTerreno(
  origen: string,
  destino: string,
  distanciaKm: number,
  config: ConfigVehiculo,
): Promise<TerrainResult> {
  // Buscar en tabla de corredores (bidireccional)
  const corredor = await prisma.routeTerrain.findFirst({
    where: {
      OR: [
        { origenDane: origen,  destinoDane: destino },
        { origenDane: destino, destinoDane: origen  },
      ],
    },
  })

  if (corredor) {
    return {
      plano:     Number(corredor.kmPlanoPercent),
      ondulado:  Number(corredor.kmOnduladoPercent),
      montanoso: Number(corredor.kmMontanosoPercent),
      peajesC2:  Number(corredor.totalPeajesC2Cop),
      peajesC3plus: Number(corredor.totalPeajesC3Cop),
      fuente: 'tabla_corredor',
    }
  }

  // Fallback: distribución por tramo de distancia
  let plano = 0.45, ondulado = 0.35, montanoso = 0.20
  if      (distanciaKm <  100) { plano = 0.40; ondulado = 0.30; montanoso = 0.30 }
  else if (distanciaKm <  400) { plano = 0.45; ondulado = 0.35; montanoso = 0.20 }
  else if (distanciaKm <  800) { plano = 0.50; ondulado = 0.30; montanoso = 0.20 }
  else                          { plano = 0.55; ondulado = 0.30; montanoso = 0.15 }

  const factorKm = FACTOR_PEAJES_KM[config]
  const peajEstimado = distanciaKm * factorKm

  return {
    plano, ondulado, montanoso,
    peajesC2:     peajEstimado,
    peajesC3plus: peajEstimado,
    fuente: 'distribucion_default',
  }
}

// ─────────────────────────────────────────────────────────────
// FUNCIÓN PRINCIPAL DEL ENGINE
// ─────────────────────────────────────────────────────────────

export interface EntradaEngine {
  distanciaKm: number
  pesoKg: number
  tipoCarga: string
  fechaRequerida: Date
  origen: string
  destino: string
  // Overrides opcionales
  configVehiculoOverride?: ConfigVehiculo
  margenOverride?: number
}

export async function calcularCotizacion(entrada: EntradaEngine): Promise<ResultadoCotizacion> {
  const { distanciaKm, pesoKg, tipoCarga, fechaRequerida, origen, destino } = entrada

  // ── 1. Inferir config vehicular ──────────────────────────
  const configVehiculo: ConfigVehiculo =
    entrada.configVehiculoOverride ?? inferirConfigVehiculo(pesoKg, tipoCarga)

  // ── 2. Obtener parámetros mensuales ──────────────────────
  const periodoYyyyMm =
    fechaRequerida.getFullYear() * 100 + (fechaRequerida.getMonth() + 1)

  let monthly = await prisma.monthlyParams.findUnique({ where: { periodoYyyyMm } })
  if (!monthly) {
    monthly = await prisma.monthlyParams.findFirst({ orderBy: { periodoYyyyMm: 'desc' } })
  }
  if (!monthly) throw new Error('PARAMS_NOT_FOUND: No hay monthly_params en la base de datos')

  // ── 3. Obtener parámetros vehiculares ────────────────────
  let vehicleP = await prisma.vehicleParams.findUnique({
    where: { configId_ano: { configId: configVehiculo, ano: fechaRequerida.getFullYear() } },
  })
  if (!vehicleP) {
    // Fallback al año más reciente disponible para esa config
    vehicleP = await prisma.vehicleParams.findFirst({
      where: { configId: configVehiculo },
      orderBy: { ano: 'desc' },
    })
  }
  if (!vehicleP) throw new Error(`VEHICLE_PARAMS_NOT_FOUND: No hay parámetros para ${configVehiculo}`)

  // ── 4. Obtener parámetros comerciales ────────────────────
  const commercial = await prisma.commercialParams.findFirst({ where: { activo: true }, orderBy: { vigenciaDesde: 'desc' } })
  const margenPct  = entrada.margenOverride ?? (commercial ? Number(commercial.margenOperadorPercent) : 20)
  const redondeo   = commercial?.redondeoMilCop ?? 50000
  const validezH   = commercial?.validezCotizacionHoras ?? 48

  // ── 5. Distribución de terreno y peajes ──────────────────
  const terreno = await inferirTerreno(origen, destino, distanciaKm, configVehiculo)

  const kmPlano    = distanciaKm * terreno.plano
  const kmOndulado = distanciaKm * terreno.ondulado
  const kmMontanoso = distanciaKm * terreno.montanoso

  // ── 6. Velocidad promedio y viajes/mes ───────────────────
  const v = VELOCIDADES[configVehiculo]
  const vProm = (kmPlano * v.P + kmOndulado * v.O + kmMontanoso * v.M) / distanciaKm
  const tIdaH = distanciaKm / vProm
  const nViajesMes = Math.floor(H_MES / (tIdaH * 2))

  if (nViajesMes < 1) throw new Error('CALC_ERROR: El trayecto es demasiado largo para completar al menos 1 viaje/mes')

  // ── 7. COSTO VARIABLE ────────────────────────────────────
  const acpm = Number(monthly.acpmPriceCopGal)
  const rend = RENDIMIENTO[configVehiculo]

  const cvCombustible =
    (acpm / rend.P) * kmPlano +
    (acpm / rend.O) * kmOndulado +
    (acpm / rend.M) * kmMontanoso

  // Peajes: C2 usa tabla C2, los demás la columna C3+
  const cvPeajes = configVehiculo === 'C2'
    ? terreno.peajesC2
    : terreno.peajesC3plus

  const indLlantasTrac = (Number(vehicleP.precioLlantaTraccionCop) * vehicleP.qtyLlantasTraccion) / vehicleP.vidaUtilTraccionKm
  const indLlantasDir  = (Number(vehicleP.precioLlantaDireccionalCop) * vehicleP.qtyLlantasDireccional) / vehicleP.vidaUtilDireccionalKm
  const cvLlantas      = (indLlantasTrac + indLlantasDir) * distanciaKm

  const cvLubricantes   = Number(vehicleP.indicadorLubricantesCopKm) * distanciaKm
  const cvFiltros       = Number(vehicleP.indicadorFiltrosCopKm) * distanciaKm
  const cvLavadoEngrase = Number(vehicleP.indicadorLavadoEngraseCopKm) * distanciaKm
  const cvMantenimiento = Number(vehicleP.mantenimientoCopKm) * distanciaKm

  const baseImprevistos = cvLlantas + cvLubricantes + cvFiltros + cvLavadoEngrase + cvMantenimiento
  const cvImprevistos   = baseImprevistos * TASA_IMPREVISTOS

  const cvTotal = cvCombustible + cvPeajes + cvLlantas + cvLubricantes +
                  cvFiltros + cvLavadoEngrase + cvMantenimiento + cvImprevistos

  // ── 8. COSTO FIJO ─────────────────────────────────────────
  const smlmv = Number(monthly.smlmv)
  const i     = Number(monthly.interesMensualBr)
  const n     = vehicleP.mesesRecuperacion
  const valor = Number(vehicleP.valorVehiculoCop)

  // PMT = (valor × i) / (1 - (1+i)^-n)
  const cfCapital     = (valor * i) / (1 - Math.pow(1 + i, -n))
  const cfSalarios    = (JORNADA_FACTOR * smlmv * (1 + FP_SALARIO)) +
                        (FACTOR_SUPLENTE * smlmv * (1 + FP_SALARIO))
  const cfSeguros     = (Number(vehicleP.soatAnualCop) + Number(vehicleP.seguroTodoRiesgoAnualCop)) / 12
  const cfImpuestos   = (TASA_IMPUESTO_VEH * valor) / 12
  const cfParqueadero = Number(vehicleP.parqueaderoNocheCop) * 30
  const cfComunicaciones = Number(vehicleP.comunicacionesMesCop)
  const cfRtm         = Number(vehicleP.rtmAnualCop) / 12

  const cfTotalMes = cfCapital + cfSalarios + cfSeguros + cfImpuestos +
                     cfParqueadero + cfComunicaciones + cfRtm
  const cfPorViaje = cfTotalMes / nViajesMes

  // ── 9. FLETE SISETAC ──────────────────────────────────────
  const costoTecnicoBase        = cvTotal + cfPorViaje
  const fleteReferencialSisetac = (1 + F_ADMIN) * costoTecnicoBase / DENOMINADOR_OC

  // ── 10. TARIFA SUGERIDA ───────────────────────────────────
  const tarifaBruta    = fleteReferencialSisetac * (1 + margenPct / 100)
  const tarifaSugerida = Math.round(tarifaBruta / redondeo) * redondeo

  // ── Armar resultado ───────────────────────────────────────
  const desgloseCv: DesgloseCv = {
    combustible:  Math.round(cvCombustible),
    peajes:       Math.round(cvPeajes),
    llantas:      Math.round(cvLlantas),
    lubricantes:  Math.round(cvLubricantes),
    filtros:      Math.round(cvFiltros),
    lavadoEngrase: Math.round(cvLavadoEngrase),
    mantenimiento: Math.round(cvMantenimiento),
    imprevistos:  Math.round(cvImprevistos),
    total:        Math.round(cvTotal),
  }

  const desgloseCf: DesgloseCf = {
    capital:       Math.round(cfCapital),
    salarios:      Math.round(cfSalarios),
    seguros:       Math.round(cfSeguros),
    impuestos:     Math.round(cfImpuestos),
    parqueadero:   Math.round(cfParqueadero),
    comunicaciones: Math.round(cfComunicaciones),
    rtm:           Math.round(cfRtm),
    totalMes:      Math.round(cfTotalMes),
    viajesMes:     nViajesMes,
    porViaje:      Math.round(cfPorViaje),
  }

  const parametrosUsados: ParametrosUsados = {
    periodoParams:       Number(monthly.periodoYyyyMm),
    acpmCopGal:          acpm,
    smlmv,
    interesMensualBr:    i,
    valorVehiculoCop:    valor,
    viajesMesSimulados:  nViajesMes,
    velocidadPromKmH:    Math.round(vProm * 100) / 100,
    distribucionTerreno: {
      plano:    terreno.plano,
      ondulado: terreno.ondulado,
      montanoso: terreno.montanoso,
    },
    fuenteTerreno: terreno.fuente,
    fuentePeajes: terreno.fuente === 'tabla_corredor' ? 'tabla_ruta' : 'estimacion_default',
    metodologia: 'SICE-TAC Res. 20213040034405',
  }

  return {
    configVehiculo,
    distanciaKm,
    desgloseCv,
    desgloseCf,
    cvTotal:               Math.round(cvTotal),
    cfPorViaje:            Math.round(cfPorViaje),
    costoTecnicoBase:      Math.round(costoTecnicoBase),
    fleteReferencialSisetac: Math.round(fleteReferencialSisetac),
    tarifaSugerida,
    margenAplicado:        margenPct,
    parametrosUsados,
  }
}
