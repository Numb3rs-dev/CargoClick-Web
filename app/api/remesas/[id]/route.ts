/**
 * GET   /api/remesas/[id] — Obtiene una remesa por ID.
 * PATCH /api/remesas/[id] — Actualiza campos editables de una remesa.
 *
 * Solo remesas en estadoRndc=PENDIENTE pueden editarse libremente.
 * Las remesas REGISTRADA/ENVIADA solo permiten editar campos no-RNDC
 * (instruccionesEspeciales, ordenServicioGenerador).
 *
 * @module RemesaByIdRoute
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { remesaRepository } from '@/lib/repositories/remesaRepository';
import { requireAuth, ok, handleError } from '@/lib/utils/apiHelpers';

/**
 * Obtiene los datos completos de una remesa.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  try {
    const { id } = await params;
    const remesa = await remesaRepository.findById(id);
    if (!remesa) throw new Error('Remesa no encontrada');
    return ok(remesa);
  } catch (e) {
    return handleError(e);
  }
}

/**
 * Schema de validación para actualización parcial de remesa.
 */
const actualizarRemesaSchema = z.object({
  descripcionCarga:        z.string().min(3).max(60).optional(),
  pesoKg:                  z.number().int().positive().optional(),
  codOperacionTransporte:  z.string().max(2).optional(),
  codNaturalezaCarga:      z.string().max(2).optional(),
  codigoEmpaque:           z.number().int().optional(),
  mercanciaRemesaCod:      z.number().int().optional(),

  // Cod. arancelado (MERCANCIAREMESA) — 6 dígitos, ej: 009880
  codigoAranceladoCarga:   z.string().max(6).optional(),
  // Condicionales
  tipoConsolidada:         z.string().max(1).optional(),
  codigoUn:                z.string().max(4).optional(),
  estadoMercancia:     z.string().max(1).optional(),
  grupoEmbalajeEnvase: z.string().max(3).optional(),
  pesoContenedorVacio: z.number().nonnegative().optional(),

  tipoIdRemitente:     z.string().max(2).optional(),
  nitRemitente:        z.string().min(5).max(20).optional(),
  codSedeRemitente:    z.string().optional(),
  empresaRemitente:    z.string().optional(),

  tipoIdDestinatario:  z.string().max(2).optional(),
  nitDestinatario:     z.string().min(5).max(20).optional(),
  codSedeDestinatario: z.string().optional(),
  empresaDestinataria: z.string().optional(),

  tipoIdPropietario:   z.string().max(2).optional(),
  nitPropietario:      z.string().min(5).max(20).optional(),
  codSedePropietario:  z.string().max(5).optional(),

  origenMunicipio:     z.string().min(3).optional(),
  origenDane:          z.string().min(5).max(9).optional(),
  destinoMunicipio:    z.string().min(3).optional(),
  destinoDane:         z.string().min(5).max(9).optional(),
  /** REMDIRREMITENTE — dirección física del punto de cargue */
  remDirRemitente:     z.string().max(150).optional(),

  fechaHoraCitaCargue:    z.string().min(10).optional(),
  fechaHoraCitaDescargue: z.string().min(10).optional(),
  horasPactoCarga:        z.number().int().min(0).optional(),
  minutosPactoCarga:      z.number().int().min(0).max(59).optional(),
  horasPactoDescargue:    z.number().int().min(0).optional(),
  minutosPactoDescargue:  z.number().int().min(0).max(59).optional(),

  valorAsegurado:         z.number().nonnegative().optional(),
  ordenServicioGenerador: z.string().max(20).optional(),
  instruccionesEspeciales: z.string().max(500).optional(),

  // Seguro
  numPolizaTransporte:     z.string().max(30).optional(),
  fechaVencimientoPoliza:  z.string().optional(),
});

/**
 * Actualiza una remesa existente.
 * Solo remesas PENDIENTE permiten editar todos los campos.
 * Remesas REGISTRADA/ENVIADA → solo campos no-RNDC.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof Response) return authResult;

  const body = await req.json().catch(() => null);
  if (!body) return handleError(new Error('Body inválido'));

  const parsed = actualizarRemesaSchema.safeParse(body);
  if (!parsed.success) return handleError(parsed.error);

  try {
    const { id } = await params;
    const remesa = await remesaRepository.findById(id);
    if (!remesa) throw new Error('Remesa no encontrada');

    // Restricción de edición por estado RNDC
    const bloqueado = remesa.estadoRndc === 'REGISTRADA' || remesa.estadoRndc === 'ENVIADA';
    const camposNoRndc = new Set(['ordenServicioGenerador', 'instruccionesEspeciales', 'valorAsegurado', 'numPolizaTransporte', 'fechaVencimientoPoliza']);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value === undefined) continue;
      if (bloqueado && !camposNoRndc.has(key)) {
        throw new Error(
          `No se puede modificar "${key}" — la remesa ya está ${remesa.estadoRndc} en el RNDC`
        );
      }
      // remDirRemitente es el alias UI del campo Prisma direccionRemitente
      if (key === 'remDirRemitente') {
        data['direccionRemitente'] = value;
      } else if (key === 'fechaHoraCitaCargue' || key === 'fechaHoraCitaDescargue' || key === 'fechaVencimientoPoliza') {
        data[key] = new Date(value as string);
      } else {
        data[key] = value;
      }
    }

    const updated = await remesaRepository.update(id, data);
    return ok(updated);
  } catch (e) {
    return handleError(e);
  }
}
