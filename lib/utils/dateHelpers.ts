/* ═══════════════════════════════════════════════════════════════════════════════
   Helpers de fecha — conversiones reutilizables para formularios
   ═══════════════════════════════════════════════════════════════════════════════ */

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Convierte Date / ISO string → formato `YYYY-MM-DDThh:mm` que acepta
 * `<input type="datetime-local">`.
 */
export function toDatetimeLocal(d: string | Date | null | undefined): string {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Convierte Date / ISO string → formato `YYYY-MM-DD` que acepta
 * `<input type="date">`.
 */
export function toDateOnly(d: string | Date | null | undefined): string {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return typeof d === 'string' ? d : '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
