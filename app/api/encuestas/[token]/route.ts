/**
 * GET  /api/encuestas/[token] — Obtiene datos públicos de la encuesta por token.
 * POST /api/encuestas/[token] — Responde la encuesta (operación única, idempotente).
 *
 * ⚠️ RUTAS PÚBLICAS — NO requieren autenticación Clerk.
 * El tokenEncuesta es el mecanismo de acceso único enviado al cliente por email/WhatsApp.
 *
 * Lógica de negocio:
 * - GET: Si ya fue respondida retorna 409.
 * - POST: Solo puede responderse una vez — si ya fue respondida retorna 409.
 *
 * @module EncuestasRoute
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { ok, handleError } from '@/lib/utils/apiHelpers';

/**
 * Schema de validación para respuesta de encuesta.
 * calificacionGeneral es obligatorio (1–5). Resto opcionales.
 */
const respuestaSchema = z.object({
  calificacionGeneral:     z.number().int().min(1).max(5),
  calificacionTiempos:     z.number().int().min(1).max(5).optional(),
  calificacionTrato:       z.number().int().min(1).max(5).optional(),
  calificacionEstadoCarga: z.number().int().min(1).max(5).optional(),
  comentario:              z.string().max(1000).optional(),
  recomendaria:            z.boolean().optional(),
});

/**
 * Devuelve datos públicos de la encuesta para renderizar el formulario.
 * No requiere autenticación — el token es el mecanismo de acceso.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const encuesta = await prisma.encuestaPostEntrega.findFirst({
      where: { tokenEncuesta: token },
      include: {
        nuevoNegocio: {
          select: { codigoNegocio: true, clienteNombre: true },
        },
      },
    });

    if (!encuesta) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Encuesta no encontrada o link inválido' },
        { status: 404 }
      );
    }

    if (encuesta.respondidoEn) {
      return NextResponse.json(
        { error: 'CONFLICT', message: 'Esta encuesta ya fue respondida' },
        { status: 409 }
      );
    }

    return ok({
      negocioCode:   encuesta.nuevoNegocio.codigoNegocio,
      clienteNombre: encuesta.nuevoNegocio.clienteNombre,
      tokenEncuesta: encuesta.tokenEncuesta,
    });
  } catch (e) { return handleError(e); }
}

/**
 * Registra la respuesta del cliente a la encuesta.
 * Operación única: retorna 409 si ya fue respondida.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const encuesta = await prisma.encuestaPostEntrega.findFirst({
      where: { tokenEncuesta: token },
    });

    if (!encuesta) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Link inválido' },
        { status: 404 }
      );
    }

    if (encuesta.respondidoEn) {
      return NextResponse.json(
        { error: 'CONFLICT', message: 'Esta encuesta ya fue respondida' },
        { status: 409 }
      );
    }

    const body = respuestaSchema.parse(await req.json());

    await prisma.encuestaPostEntrega.update({
      where: { id: encuesta.id },
      data: {
        calificacionGeneral:     body.calificacionGeneral,
        calificacionTiempos:     body.calificacionTiempos,
        calificacionTrato:       body.calificacionTrato,
        calificacionEstadoCarga: body.calificacionEstadoCarga,
        comentario:              body.comentario,
        recomendaria:            body.recomendaria,
        respondidoEn:            new Date(),
      },
    });

    return ok({ gracias: true });
  } catch (e) { return handleError(e); }
}
