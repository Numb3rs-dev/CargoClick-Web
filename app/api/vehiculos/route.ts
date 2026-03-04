/**
 * GET /api/vehiculos — Lista todos los vehículos (búsqueda opcional).
 * POST /api/vehiculos — Crea un vehículo en el directorio local.
 *
 * Vehículo es una entidad del directorio operativo de CargoClick.
 * Se registra en el RNDC via procesoid 12 a través de sync-rndc.
 *
 * @module VehiculosRoute
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { vehiculoService } from '@/lib/services/vehiculoService';
import { vehiculoRepository } from '@/lib/repositories/vehiculoRepository';
import { paginacion } from '@/lib/validations/queryParams';
import { requireAuth, ok, handleError } from '@/lib/utils/apiHelpers';

/**
 * Schema de validación para creación de vehículo.
 */
const crearVehiculoSchema = z.object({
  placa:                    z.string().min(5).max(7).toUpperCase(),
  configVehiculo:           z.string().min(2).max(20),
  propietarioNombre:        z.string().optional(),
  propietarioDocumento:     z.string().optional(),
  marca:                    z.string().optional(),
  modelo:                   z.coerce.number().min(1900).max(2100).optional(),
  capacidadToneladasMax:    z.coerce.number().positive().optional(),
  notas:                    z.string().max(500).optional(),
});

/**
 * Lista todos los vehículos del directorio.
 * Soporta búsqueda por placa o propietario via query param `q`.
 *
 * @requires Auth Clerk
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  const params = paginacion.safeParse(
    Object.fromEntries(req.nextUrl.searchParams)
  );
  if (!params.success) return handleError(params.error);

  try {
    const { data: vehiculos, total } = await vehiculoRepository.findAll({ q: params.data.q });
    return ok(vehiculos, { total, page: 1, pageSize: total });
  } catch (e) { return handleError(e); }
}

/**
 * Crea un nuevo vehículo en el directorio local.
 * No llama al RNDC — usar POST /api/vehiculos/[placa]/sync-rndc para registrar en RNDC.
 *
 * @requires Auth Clerk
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  try {
    const body = crearVehiculoSchema.parse(await req.json());
    const vehiculo = await vehiculoService.crear(body);
    return ok(vehiculo);
  } catch (e) { return handleError(e); }
}
