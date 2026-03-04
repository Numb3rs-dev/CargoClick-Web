/**
 * GET  /api/conductores — Lista todos los conductores (búsqueda opcional).
 * POST /api/conductores — Crea un conductor en el directorio local.
 *
 * Conductor es una entidad del directorio operativo de CargoClick.
 * Se registra en el RNDC via procesoid 11 a través de sync-rndc.
 *
 * @module ConductoresRoute
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { conductorService } from '@/lib/services/conductorService';
import { conductorRepository } from '@/lib/repositories/conductorRepository';
import { paginacion } from '@/lib/validations/queryParams';
import { requireAuth, ok, handleError } from '@/lib/utils/apiHelpers';

/**
 * Schema de validación para creación de conductor.
 * Zod valida en servidor (doble validación — client + server).
 */
const crearSchema = z.object({
  cedula:            z.string().min(5).max(20),
  nombres:           z.string().min(2).max(80),
  apellidos:         z.string().min(2).max(80),
  categoriaLicencia: z.enum(['A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3']),
  licenciaVigencia:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  telefono:          z.string().min(7).max(20).optional(),
  email:             z.string().email().optional(),
  notas:             z.string().max(500).optional(),
});

/**
 * Lista todos los conductores del directorio.
 * Soporta búsqueda por cédula, nombre o apellido via query param `q`.
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
    const { data: conductores, total } = await conductorRepository.findAll({ q: params.data.q });
    return ok(conductores, { total, page: 1, pageSize: total });
  } catch (e) { return handleError(e); }
}

/**
 * Crea un nuevo conductor en el directorio local.
 * No llama al RNDC — usar POST /api/conductores/[cedula]/sync-rndc para registrar en RNDC.
 *
 * @requires Auth Clerk
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  try {
    const body = crearSchema.parse(await req.json());
    const conductor = await conductorService.crear(body);
    return ok(conductor);
  } catch (e) { return handleError(e); }
}
