/**
 * Logger centralizado
 *
 * En desarrollo: muestra el error completo con stack trace.
 * En producción:  solo el mensaje — sin rutas de archivo ni detalles
 *                 internos que puedan filtrarse en logs de terceros.
 *
 * @module Logger
 */

export const logger = {
  /**
   * Registra un error de forma segura según el entorno.
   *
   * @param context - Etiqueta identificadora (ej: "API solicitudes POST")
   * @param error   - Objeto de error capturado en un catch
   */
  error(context: string, error: unknown): void {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${context}]`, error)
    } else {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[${context}] ${message}`)
    }
  },

  /**
   * Log informativo (solo en desarrollo).
   */
  info(context: string, message: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${context}] ${message}`)
    }
  },

  /**
   * Log de advertencia.
   */
  warn(context: string, message: string): void {
    console.warn(`[${context}] ${message}`)
  },
}
