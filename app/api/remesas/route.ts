/**
 * GET  /api/remesas — Lista remesas con filtros y paginación.
 * POST /api/remesas — Crea una remesa asociada a un NuevoNegocio.
 *
 * Las remesas son la unidad mínima de carga del módulo operacional.
 * Solo remesas con estadoRndc=REGISTRADA pueden asignarse a un ManifiestoOperativo.
 * Después de crear la remesa, usar POST /api/remesas/[id]/enviar-rndc para registrarla en el RNDC.
 *
 * @module RemesasRoute
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { remesaService } from '@/lib/services/remesaService';
import { prisma } from '@/lib/db/prisma';
import { paginacion } from '@/lib/validations/queryParams';
import { requireAuth, ok, handleError } from '@/lib/utils/apiHelpers';

/**
 * Schema de validación para creación de remesa.
 * Todos los campos obligatorios según RNDC (incluyendo tiempos logísticos nov 2025).
 */
const crearRemesaSchema = z.object({
  /** ID del negocio. Opcional cuando se crea en modo standalone. */
  nuevoNegocioId: z.string().cuid().optional(),

  // Descripción de la carga
  descripcionCarga:        z.string().min(3).max(60),
  pesoKg:                  z.number().int().positive(),
  volumenM3:               z.number().positive().optional(),
  unidadMedidaProducto:    z.string().max(5).optional(),
  cantidadProducto:        z.number().positive().optional(),

  // Clasificación RNDC
  codOperacionTransporte: z.string().max(2).optional(),
  codNaturalezaCarga:     z.string().max(2).optional(),
  codigoEmpaque:          z.number().int().optional(),
  mercanciaRemesaCod:     z.number().int().optional(),

  // Cod. arancelado (MERCANCIAREMESA) — 6 dígitos, ej: 009880 = Paquetes varios
  codigoAranceladoCarga:   z.string().max(6).optional(),
  // Condicionales por naturaleza/operación
  tipoConsolidada:         z.string().max(1).optional(),
  codigoUn:                z.string().max(4).optional(),
  estadoMercancia:     z.string().max(1).optional(),
  grupoEmbalajeEnvase: z.string().max(3).optional(),
  pesoContenedorVacio: z.number().nonnegative().optional(),

  // Remitente
  tipoIdRemitente:  z.string().max(2).optional(),
  nitRemitente:     z.string().min(5).max(20),
  codSedeRemitente: z.string().optional(),
  empresaRemitente: z.string().optional(),

  // Destinatario
  tipoIdDestinatario:  z.string().max(2).optional(),
  nitDestinatario:     z.string().min(5).max(20),
  codSedeDestinatario: z.string().optional(),
  empresaDestinataria: z.string().optional(),

  // Propietario
  tipoIdPropietario:  z.string().max(2).optional(),
  nitPropietario:     z.string().min(5).max(20),
  codSedePropietario: z.string().max(5).optional(),

  // Puntos origen-destino
  origenMunicipio: z.string().min(3),
  origenDane:      z.string().min(5).max(9),
  destinoMunicipio: z.string().min(3),
  destinoDane:     z.string().min(5).max(9),
  /** REMDIRREMITENTE — dirección física del punto de cargue */
  remDirRemitente:  z.string().max(150).optional(),

  // Tiempos logísticos (obligatorio RNDC desde nov 2025)
  fechaHoraCitaCargue:    z.string().min(10),
  fechaHoraCitaDescargue: z.string().min(10),
  horasPactoCarga:        z.number().int().min(0).optional(),
  minutosPactoCarga:      z.number().int().min(0).max(59).optional(),
  horasPactoDescargue:    z.number().int().min(0).optional(),
  minutosPactoDescargue:  z.number().int().min(0).max(59).optional(),

  // Valores opcionales
  valorDeclarado:          z.number().nonnegative().optional(),
  valorAsegurado:          z.number().nonnegative().optional(),
  ordenServicioGenerador:  z.string().max(20).optional(),
  instruccionesEspeciales: z.string().max(500).optional(),

  // Seguro
  numPolizaTransporte:     z.string().max(30).optional(),
  fechaVencimientoPoliza:  z.string().optional(),
});

/**
 * Lista remesas con paginación. Soporta filtro por negocio y estado RNDC.
 *
 * @requires Auth Clerk
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  const params = paginacion.extend({
    nuevoNegocioId: z.string().optional(),
    estadoRndc:     z.string().optional(),
  }).safeParse(Object.fromEntries(req.nextUrl.searchParams));

  if (!params.success) return handleError(params.error);

  try {
    const { page, pageSize, nuevoNegocioId, estadoRndc } = params.data;
    const where: Record<string, unknown> = {};
    if (nuevoNegocioId) where.nuevoNegocioId = nuevoNegocioId;
    if (estadoRndc) where.estadoRndc = estadoRndc;

    const [remesas, total] = await Promise.all([
      prisma.remesa.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.remesa.count({ where }),
    ]);

    return ok(remesas, { total, page, pageSize });
  } catch (e) {
    return handleError(e);
  }
}

/**
 * Crea una remesa y la asocia a un NuevoNegocio.
 * La remesa queda en estadoRndc=PENDIENTE tras la creación.
 * Para registrarla en el RNDC: POST /api/remesas/[id]/enviar-rndc
 *
 * @requires Auth Clerk
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  const body = await req.json().catch(() => null);
  if (!body) return handleError(new Error('Body inválido'));

  const parsed = crearRemesaSchema.safeParse(body);
  if (!parsed.success) return handleError(parsed.error);

  const { nuevoNegocioId, ...data } = parsed.data;

  try {
    const remesa = await remesaService.crear(nuevoNegocioId, data);
    return ok(remesa);
  } catch (e) {
    return handleError(e);
  }
}
