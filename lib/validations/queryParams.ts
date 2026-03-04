/**
 * Schemas de validación para query params paginados.
 * Compartido por todos los endpoints operacionales.
 *
 * @module QueryParams
 */
import { z } from 'zod';

/**
 * Params de paginación estándar compartidos por todos los listados.
 * page y pageSize con coerción desde string (URL params).
 */
export const paginacion = z.object({
  page:     z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  q:        z.string().optional(),
});

export type PaginacionParams = z.infer<typeof paginacion>;
