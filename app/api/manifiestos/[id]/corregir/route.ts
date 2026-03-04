/**
 * POST /api/manifiestos/[id]/corregir — Corrige un manifiesto (procesoid 32 → 4).
 *
 * Flujo corrección:
 * 1. Anula el manifiesto original via procesoid 32 (libera remesas)
 * 2. Crea un nuevo manifiesto con los datos corregidos
 * 3. Registra el nuevo manifiesto en el RNDC via procesoid 4
 *
 * CRÍTICO: Si el procesoid 32 falla, NO se crea el nuevo. Se propaga el error.
 *
 * @module ManifiestoCorregirRoute
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { manifiestoService } from '@/lib/services/manifiestoService';
import { ok, rndcError, handleError, requireAuth } from '@/lib/utils/apiHelpers';

const corregirSchema = z.object({
  motivoAnulacion: z.string().min(10).max(200),
  datosCorregidos: z.object({
    conductorCedula:  z.string().min(5).max(20).optional(),
    vehiculoPlaca:    z.string().min(5).max(7).optional(),
    placaRemolque:    z.string().optional(),
    remesasIds:       z.array(z.string().cuid()).min(1).optional(),
    origenMunicipio:  z.string().min(3).optional(),
    origenDane:       z.string().length(5).optional(),
    destinoMunicipio: z.string().min(3).optional(),
    destinoDane:      z.string().length(5).optional(),
    fletePactado:     z.number().positive().optional(),
    valorAnticipo:    z.number().min(0).optional(),
    retencionIca:     z.number().min(0).optional(),
    fechaExpedicion:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    fechaDespacho:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    observaciones:    z.string().max(200).optional(),
  }),
});

/**
 * Corrige el manifiesto: anula el original y crea uno nuevo con los datos actualizados.
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
    const body = corregirSchema.parse(await req.json());
    const resultado = await manifiestoService.corregir(
      id,
      body.motivoAnulacion,
      body.datosCorregidos
    );

    const rndcResult = resultado.rndcResult;

    if ('ya_registrado' in rndcResult) return ok(resultado);
    if (!rndcResult.exitoso) return rndcError(rndcResult);

    return ok({
      manifiestoAnuladoId:  resultado.manifiestoAnuladoId,
      nuevoManifiestoId:    resultado.nuevoManifiestoId,
      nuevoManifiestoNumero: rndcResult.ingresoid,
      syncRndcId: rndcResult.syncRndcId,
    });
  } catch (e) { return handleError(e); }
}
