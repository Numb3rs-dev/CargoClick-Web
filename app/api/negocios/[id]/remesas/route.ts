/**
 * GET  /api/negocios/[id]/remesas — Lista remesas de un negocio.
 * POST /api/negocios/[id]/remesas — Crea una remesa y la registra en el RNDC (procesoid 3).
 *
 * Las remesas son las unidades mínimas de carga enviadas al RNDC.
 * Solo remesas con estadoRndc=REGISTRADA pueden asignarse a manifiestos.
 *
 * CAMPOS OBLIGATORIOS RNDC desde noviembre 2025:
 * - fechaHoraCitaCargue / fechaHoraCitaDescargue
 * - horasPactoCarga / minutosPactoCarga / horasPactoDescargue / minutosPactoDescargue
 *
 * @module NegocioRemesasRoute
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { remesaService } from '@/lib/services/remesaService';
import { remesaRepository } from '@/lib/repositories/remesaRepository';
import { requireAuth, ok, handleError } from '@/lib/utils/apiHelpers';

/**
 * Schema de validación para creación de remesa.
 * Campos de cita de cargue/descargue obligatorios desde nov 2025.
 */
const crearRemesaSchema = z.object({
  descripcionCarga:        z.string().min(3).max(60),
  pesoKg:                  z.number().positive(),
  unidadMedidaProducto:    z.string().optional(),
  codOperacionTransporte:   z.string().optional(),
  codNaturalezaCarga:      z.string().optional(),
  codigoEmpaque:           z.coerce.number().optional(),
  tipoIdRemitente:         z.string().optional(),
  nitRemitente:            z.string(),
  codSedeRemitente:        z.string().default('0'),
  tipoIdDestinatario:      z.string().optional(),
  nitDestinatario:         z.string(),
  codSedeDestinatario:     z.string().default('0'),
  tipoIdPropietario:       z.string().optional(),
  nitPropietario:          z.string(),
  origenMunicipio:         z.string().min(3),
  origenDane:              z.string().length(5),
  destinoMunicipio:        z.string().min(3),
  destinoDane:             z.string().length(5),
  // Obligatorios desde nov 2025
  fechaHoraCitaCargue:     z.string().datetime(),
  fechaHoraCitaDescargue:  z.string().datetime(),
  horasPactoCarga:         z.number().min(0).max(23).default(0),
  minutosPactoCarga:       z.number().min(0).max(59).default(0),
  horasPactoDescargue:     z.number().min(0).max(23).default(0),
  minutosPactoDescargue:   z.number().min(0).max(59).default(0),
  // Opcionales
  valorAsegurado:          z.number().optional(),
  ordenServicioGenerador:  z.string().max(20).optional(),
});

/**
 * Lista las remesas de un negocio.
 *
 * @requires Auth Clerk
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  try {
    const { id } = await params;
    const remesas = await remesaRepository.findByNegocio(id);
    return ok(remesas, { total: remesas.length });
  } catch (e) { return handleError(e); }
}

/**
 * Crea una remesa y la registra en el RNDC (procesoid 3).
 * Precondición: el negocio existe y está CONFIRMADO o ACTIVO.
 * Poscondición: remesa en estadoRndc=REGISTRADA con numeroRemesaRndc asignado.
 *
 * @requires Auth Clerk
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  try {
    const { id } = await params;
    const body = crearRemesaSchema.parse(await req.json());
    const remesa = await remesaService.crear(id, body);
    return ok(remesa);
  } catch (e) { return handleError(e); }
}
