/**
 * solicitudApiClient.ts
 *
 * Funciones async puras para comunicarse con los endpoints de solicitudes.
 * Sin estado React — únicamente fetch + error handling.
 */

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface CrearSolicitudResult {
  id: string;
  reanudada: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
}

// ── Clientes HTTP ─────────────────────────────────────────────────────────────

/**
 * POST /api/solicitudes — crea una solicitud nueva.
 *
 * En la respuesta, el servidor puede indicar que ya existe una solicitud abierta
 * para ese teléfono (reanudada = true) y devolver esos datos.
 */
export async function apiCrearSolicitud(
  telefono: string,
  contacto: string,
  empresa: string,
): Promise<CrearSolicitudResult> {
  const resp = await fetch('/api/solicitudes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telefono, contacto, empresa }),
  });

  const body = await resp.json();

  if (!resp.ok) {
    throw new Error(body?.error ?? `Error ${resp.status} al crear solicitud`);
  }

  return {
    id:       body.data?.id ?? body.id,
    reanudada: body.reanudada ?? false,
    data:      body.data ?? body,
  };
}

/**
 * PATCH /api/solicitudes/:id — actualiza campos de una solicitud.
 * Lanza un Error si la respuesta no es exitosa.
 */
export async function apiPatchSolicitud(
  id: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const resp = await fetch(`/api/solicitudes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body?.error ?? `Error ${resp.status} al actualizar solicitud`);
  }
}

/**
 * Dispara la cotización en segundo plano (fire-and-forget).
 * Ambas fases usan el mismo endpoint POST /api/solicitudes/:id/cotizar
 * con el campo `fase` en el cuerpo.
 * Los errores se registran en consola pero NO se propagan.
 *
 * @param id   - ID de la solicitud
 * @param fase - 'sisetac' | 'rndc'
 */
export function apiDispararCotizacion(id: string, fase: 'sisetac' | 'rndc'): void {
  fetch(`/api/solicitudes/${id}/cotizar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fase }),
  }).catch((err) => {
    console.error(
      `[cotizar-${fase}] Error disparando cotización:`,
      err,
    );
  });
}

/**
 * GET /api/solicitudes/:id — carga los datos de una solicitud existente.
 * Devuelve body.data si la respuesta es exitosa, null en caso contrario.
 */
export async function apiCargarSolicitud(
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Record<string, any> | null> {
  try {
    const resp = await fetch(`/api/solicitudes/${id}`);
    if (!resp.ok) return null;
    const body = await resp.json();
    return body.data ?? null;
  } catch {
    return null;
  }
}
