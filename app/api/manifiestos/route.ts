/**
 * GET  /api/manifiestos — Lista manifiestos con filtros y paginación.
 * POST /api/manifiestos — Crea un manifiesto y lo registra en el RNDC (procesoid 4).
 *
 * ManifiestoOperativo agrupa remesas para un despacho físico de carga.
 * Precondición de POST: todas las remesasIds deben tener estadoRndc=REGISTRADA.
 * El conductor y vehículo deben existir en el directorio local.
 *
 * @module ManifiestosRoute
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { manifiestoService } from '@/lib/services/manifiestoService';
import { prisma } from '@/lib/db/prisma';
import { paginacion } from '@/lib/validations/queryParams';
import { requireAuth, ok, handleError, rndcError } from '@/lib/utils/apiHelpers';

/**
 * Schema de validación para creación de manifiesto.
 */
const crearManifiestoSchema = z.object({
  /** ID del negocio. Opcional cuando se crea en modo standalone. */
  nuevoNegocioId:   z.string().cuid().optional(),
  conductorCedula:  z.string().min(5).max(20),
  vehiculoPlaca:    z.string().min(5).max(7),
  placaRemolque:    z.string().optional(),
  remesasIds:       z.array(z.string().cuid()).min(1),
  origenMunicipio:  z.string().min(3),
  origenDane:       z.string().length(5),
  destinoMunicipio: z.string().min(3),
  destinoDane:      z.string().length(5),
  fletePactado:     z.number().positive(),
  valorAnticipo:    z.number().min(0).default(0),
  retencionIca:     z.number().min(0).default(4),
  fechaExpedicion:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fechaDespacho:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  observaciones:    z.string().max(200).optional(),
});

/**
 * Lista manifiestos con paginación. Soporta filtro por negocio y estado.
 *
 * @requires Auth Clerk
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  const params = paginacion.extend({
    nuevoNegocioId: z.string().optional(),
    estado:         z.string().optional(),
  }).safeParse(Object.fromEntries(req.nextUrl.searchParams));

  if (!params.success) return handleError(params.error);

  try {
    const { page, pageSize, nuevoNegocioId, estado } = params.data;
    const where: Record<string, unknown> = {};
    if (nuevoNegocioId) where.nuevoNegocioId = nuevoNegocioId;
    if (estado) where.estadoManifiesto = estado;

    const [data, total] = await Promise.all([
      prisma.manifiestoOperativo.findMany({
        where,
        include: {
          conductor: { select: { cedula: true, nombres: true, apellidos: true } },
          vehiculo:  { select: { placa: true, tipoVehiculo: true } },
          remesas:   { select: { id: true, numeroRemesa: true, descripcionCarga: true } },
          nuevoNegocio: { select: { codigoNegocio: true, clienteNombre: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.manifiestoOperativo.count({ where }),
    ]);

    return ok(data, { total, page, pageSize });
  } catch (e) { return handleError(e); }
}

/**
 * Crea un manifiesto operativo y lo registra en el RNDC (procesoid 4).
 *
 * Validaciones internas del servicio:
 * - Conductor y vehículo existen en el directorio
 * - Remesas son REGISTRADAS en RNDC y pertenecen al nuevoNegocio
 * - Ninguna remesa ya está asignada a otro manifiesto
 *
 * @requires Auth Clerk
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  try {
    const body = crearManifiestoSchema.parse(await req.json());
    const resultado = await manifiestoService.crear(body);

    // Idempotencia: manifiesto ya registrado
    if ('ya_registrado' in resultado) return ok(resultado);

    if (!resultado.exitoso) return rndcError(resultado);

    return ok({
      numeroManifiesto: resultado.ingresoid,
      syncRndcId:       resultado.syncRndcId,
    });
  } catch (e) { return handleError(e); }
}
