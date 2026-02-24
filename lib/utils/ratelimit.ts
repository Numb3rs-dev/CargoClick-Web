/**
 * Rate limiter — sliding window en memoria
 *
 * C-2: limita las peticiones a endpoints públicos para prevenir DoS / spam.
 *
 * Configuración:
 *   MAX_REQUESTS — máximo de peticiones permitidas por ventana (default: 20)
 *   WINDOW_MS    — duración de la ventana en milisegundos (default: 60 s)
 *
 * NOTA para producción:
 *   Este implementación persiste en memoria del proceso.
 *   En despliegues multi-instancia (Vercel serverless) cambiar por
 *   @upstash/ratelimit + Redis para compartir estado entre instancias.
 *
 * @module RateLimit
 */

interface SlidingWindow {
  timestamps: number[]
}

const store = new Map<string, SlidingWindow>()

const WINDOW_MS    = 60_000  // 1 minuto
const MAX_REQUESTS = 20      // 20 req / minuto por IP

/**
 * Extrae la IP del cliente de los headers estándar de proxies.
 */
export function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'anonymous'
}

/**
 * Verifica si una clave (IP o user-id) ha superado el límite.
 *
 * @returns `{ success: true }` si está dentro del límite
 *          `{ success: false }` si ha superado MAX_REQUESTS en WINDOW_MS
 */
export function rateLimitCheck(key: string): { success: boolean; remaining: number } {
  const now = Date.now()
  const win = store.get(key) ?? { timestamps: [] }

  // Limpiar entradas fuera de la ventana actual
  win.timestamps = win.timestamps.filter((t) => now - t < WINDOW_MS)

  if (win.timestamps.length >= MAX_REQUESTS) {
    store.set(key, win)
    return { success: false, remaining: 0 }
  }

  win.timestamps.push(now)
  store.set(key, win)
  return { success: true, remaining: MAX_REQUESTS - win.timestamps.length }
}

// Limpieza periódica del store para evitar memory leaks en procesos long-running
// (Next.js dev server — en prod serverless cada invocación es stateless)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, win] of store.entries()) {
      const active = win.timestamps.filter((t) => now - t < WINDOW_MS)
      if (active.length === 0) {
        store.delete(key)
      } else {
        win.timestamps = active
      }
    }
  }, WINDOW_MS * 2)
}
