import { Prisma } from '@prisma/client';

/**
 * Modelos que soportan generación de consecutivos y los campos de código correspondientes.
 */
const MODELO_CAMPO: Record<ModeloConsecutivo, string> = {
  nuevoNegocio:         'codigoNegocio',
  remesa:               'numeroRemesa',
  manifiestoOperativo:  'codigoInterno',
  ordenCargue:          'numeroOrden',
};

export type ModeloConsecutivo = 'nuevoNegocio' | 'remesa' | 'manifiestoOperativo' | 'ordenCargue';
export type PrefijoConsecutivo = 'NEG' | 'REM' | 'MF' | 'OC';

/**
 * Tipo helper para el acceso dinámico a delegates de modelos Prisma.
 * Se usa un cast explícito porque el acceso por nombre de modelo es inherentemente dinámico.
 * Una vez ejecutado `prisma generate`, el tipo real del delegate estará disponible.
 */
type DelegateFindFirst = {
  findFirst: (args: {
    where: Record<string, unknown>;
    orderBy: Record<string, unknown>;
    select: Record<string, unknown>;
  }) => Promise<Record<string, string> | null>;
};

/**
 * Genera el siguiente código consecutivo para una entidad del módulo operacional.
 *
 * Formato: PREFIX-YYYY-NNNN  (ejemplo: NEG-2026-0001)
 *
 * Precondiciones:
 *   - Debe invocarse dentro de una transacción Prisma para garantizar aislamiento
 *     y evitar race conditions en entornos de alta concurrencia.
 *
 * Postcondiciones:
 *   - Devuelve el siguiente código disponible para el año en curso.
 *   - No crea ningún registro — solo calcula el siguiente valor.
 *
 * @param tx       - Instancia de PrismaClient o TransactionClient (usar siempre dentro de $transaction)
 * @param modelo   - Nombre del modelo Prisma: 'nuevoNegocio' | 'remesa' | 'manifiestoOperativo'
 * @param prefijo  - Prefijo del código: 'NEG' | 'REM' | 'MF'
 * @returns Código consecutivo con formato PREFIX-YYYY-NNNN, ej: "MF-2026-0042"
 */
export async function generarConsecutivo(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: Prisma.TransactionClient | Record<string, any>,
  modelo: ModeloConsecutivo,
  prefijo: PrefijoConsecutivo,
): Promise<string> {
  const anio    = new Date().getFullYear();
  const patron  = `${prefijo}-${anio}-`;
  const campo   = MODELO_CAMPO[modelo];

  // Acceso dinámico al delegate del modelo por nombre.
  // Cast necesario porque TypeScript no puede inferir el tipo en acceso dinámico por string.
  const delegate = (tx as Record<string, DelegateFindFirst>)[modelo];

  // Buscar el último código del año actual en orden descendente
  const ultimo = await delegate.findFirst({
    where:    { [campo]: { startsWith: patron } },
    orderBy:  { [campo]: 'desc' },
    select:   { [campo]: true },
  });

  // Extraer número del último código (parte después del tercer guión: PREFIX-YYYY-NNNN)
  const siguienteNumero = ultimo
    ? parseInt(ultimo[campo].split('-')[2], 10) + 1
    : 1;

  return `${patron}${String(siguienteNumero).padStart(4, '0')}`;
}
