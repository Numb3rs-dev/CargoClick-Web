/**
 * BusinessError — error intencional con mensaje seguro para el usuario.
 *
 * Los servicios deben usar esta clase cuando el mensaje está pensado para
 * mostrarse en la UI. Cualquier otro tipo de error (Prisma, red, etc.)
 * será capturado por las routes y sustituido por un mensaje genérico,
 * nunca llegando detalles técnicos al cliente.
 *
 * @example
 * // En un servicio:
 * throw new BusinessError('Ya recibimos tu solicitud. Nos comunicaremos pronto.', 409);
 *
 * // En una API route:
 * } catch (error) {
 *   if (error instanceof BusinessError) {
 *     return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
 *   }
 *   // Todo lo demás → mensaje genérico, nunca detalles de infraestructura
 *   return NextResponse.json({ success: false, error: GENERIC_ERROR }, { status: 500 });
 * }
 */
export class BusinessError extends Error {
  /** Código HTTP que debe devolver la API cuando se captura este error */
  readonly statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'BusinessError';
    this.statusCode = statusCode;
  }
}

/**
 * Mensaje genérico que se envía al cliente para cualquier error no intencional.
 * Nunca debe incluir detalles técnicos (host, puerto, stack trace, etc.).
 */
export const GENERIC_ERROR = 'Ocurrió un error inesperado. Por favor intenta de nuevo.';
