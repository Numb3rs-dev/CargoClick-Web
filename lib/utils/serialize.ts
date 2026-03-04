/**
 * Convierte Prisma Decimal a number para poder pasar datos
 * de Server Components a Client Components.
 *
 * Prisma Decimal → number
 * Recursivo para objetos y arrays.
 * Date se mantiene intacto (Next.js RSC los maneja nativamente).
 *
 * @module serialize
 */

import { Decimal } from '@prisma/client/runtime/library';

/**
 * Serializa recursivamente un valor Prisma para paso a Client Components.
 * - `Decimal` → `number`
 * - Arrays y objetos se recorren recursivamente
 * - Dates, strings, numbers, booleans se retornan tal cual
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serialize<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  // Prisma Decimal → number
  if (obj instanceof Decimal) {
    return obj.toNumber() as unknown as T;
  }

  // Date — dejar intacto (Next.js RSC los serializa correctamente)
  if (obj instanceof Date) {
    return obj as T;
  }

  // Array
  if (Array.isArray(obj)) {
    return obj.map(serialize) as unknown as T;
  }

  // Plain object
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serialize(value);
    }
    return result as T;
  }

  return obj;
}
