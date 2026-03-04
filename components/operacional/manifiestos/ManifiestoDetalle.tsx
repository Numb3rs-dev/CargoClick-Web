import { manifiestoOperativoRepository } from '@/lib/repositories/manifiestoOperativoRepository';
import { ManifiestoEstadoBadge } from './ManifiestoEstadoBadge';
import { ManifiestoAcciones } from './ManifiestoAcciones';
import Link from 'next/link';

interface ManifiestoDetalleProps {
  manifiestoId: string;
  negocioId: string;
}

/**
 * Panel de detalle de un ManifiestoOperativo.
 * Server Component — obtiene datos directamente del repositorio.
 *
 * Muestra conductor, vehículo, remesas incluidas, ruta, fletes
 * y las acciones disponibles (cumplir / anular) según el estado.
 */
export async function ManifiestoDetalle({ manifiestoId, negocioId }: ManifiestoDetalleProps) {
  const manifiesto = await manifiestoOperativoRepository.findById(manifiestoId);

  if (!manifiesto) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-8 text-center">
        <p className="text-sm text-muted-foreground">Manifiesto no encontrado.</p>
      </div>
    );
  }

  const pesoTotal = manifiesto.remesas.reduce((sum, r) => sum + r.pesoKg, 0);

  return (
    <div className="space-y-6">
      {/* ── Encabezado ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-mono text-2xl font-semibold tracking-tight">
            {manifiesto.codigoInterno}
          </h1>
          {manifiesto.nuevoNegocio && (
            <p className="mt-1 text-sm text-muted-foreground">
              Negocio:{' '}
              <Link
                href={`/operacional/negocios/${negocioId}`}
                className="font-mono hover:underline"
              >
                {manifiesto.nuevoNegocio.codigoNegocio}
              </Link>
              {manifiesto.nuevoNegocio.clienteNombre && ` — ${manifiesto.nuevoNegocio.clienteNombre}`}
            </p>
          )}
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <ManifiestoEstadoBadge estado={manifiesto.estadoManifiesto} />
          {manifiesto.numeroManifiesto && (
            <p className="font-mono text-xs text-muted-foreground">
              RNDC: {manifiesto.numeroManifiesto}
            </p>
          )}
        </div>
      </div>

      {/* ── Conductor y Vehículo ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-4 space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
            Conductor
          </p>
          <p className="font-medium">
            {manifiesto.conductor.nombres} {manifiesto.conductor.apellidos}
          </p>
          <p className="font-mono text-sm text-muted-foreground">
            Cédula: {manifiesto.conductor.cedula}
          </p>
          {manifiesto.conductor.categoriaLicencia && (
            <p className="text-xs text-muted-foreground">
              Licencia: {manifiesto.conductor.categoriaLicencia}
            </p>
          )}
        </div>

        <div className="rounded-lg border border-border p-4 space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
            Vehículo
          </p>
          <p className="font-mono text-lg font-semibold">{manifiesto.vehiculoPlaca}</p>
          {manifiesto.vehiculo.tipoVehiculo && (
            <p className="text-sm text-muted-foreground">{manifiesto.vehiculo.tipoVehiculo}</p>
          )}
          {manifiesto.placaRemolque && (
            <p className="text-xs text-muted-foreground">
              Remolque: <span className="font-mono">{manifiesto.placaRemolque}</span>
            </p>
          )}
        </div>
      </div>

      {/* ── Remesas incluidas ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">
          Remesas incluidas{' '}
          <span className="font-normal text-muted-foreground">
            ({manifiesto.remesas.length}) — {pesoTotal.toLocaleString('es-CO')} kg total
          </span>
        </h2>

        {manifiesto.remesas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin remesas asignadas.</p>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {manifiesto.remesas.map(r => (
              <div
                key={r.id}
                className="flex items-center justify-between px-4 py-3 bg-background"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-medium">{r.numeroRemesa}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.descripcionCarga}</p>
                </div>
                <span className="text-sm text-muted-foreground ml-4 shrink-0">
                  {r.pesoKg.toLocaleString('es-CO')} kg
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Ruta ─────────────────────────────────────────────────────────── */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Ruta</h2>
        <p className="text-sm">
          <span className="font-medium">{manifiesto.origenMunicipio}</span>
          <span className="mx-2 text-muted-foreground">→</span>
          <span className="font-medium">{manifiesto.destinoMunicipio}</span>
        </p>
      </section>

      {/* ── Fletes y fechas ───────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Economía del viaje</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Flete pactado</dt>
            <dd className="font-medium">
              {Number(manifiesto.fletePactado).toLocaleString('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
              })}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Anticipo</dt>
            <dd className="font-medium">
              {Number(manifiesto.valorAnticipo).toLocaleString('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
              })}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Retención ICA</dt>
            <dd className="font-medium">{manifiesto.retencionIca}‰</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Fecha expedición</dt>
            <dd className="font-medium">
              {new Date(manifiesto.fechaExpedicion).toLocaleDateString('es-CO', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Fecha despacho</dt>
            <dd className="font-medium">
              {new Date(manifiesto.fechaDespacho).toLocaleDateString('es-CO', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Aceptación electrónica</dt>
            <dd className="font-medium">{manifiesto.aceptacionElectronica ? 'Sí' : 'No'}</dd>
          </div>
        </dl>

        {manifiesto.observaciones && (
          <div>
            <dt className="text-xs text-muted-foreground uppercase tracking-wide">
              Observaciones
            </dt>
            <dd className="text-sm mt-1">{manifiesto.observaciones}</dd>
          </div>
        )}
      </section>

      {/* ── Corrección: manifiesto que este reemplazó ─────────────────────── */}
      {manifiesto.reemplazadoPor && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Corrige a</h2>
          <p className="text-sm font-mono">
            {manifiesto.reemplazadoPor.codigoInterno}{' '}
            <span className="text-muted-foreground">({manifiesto.reemplazadoPor.estadoManifiesto})</span>
          </p>
        </section>
      )}

      {/* ── Acciones ─────────────────────────────────────────────────────── */}
      <section className="space-y-3 pt-2">
        <h2 className="text-sm font-semibold">Acciones</h2>
        <ManifiestoAcciones
          manifiestoId={manifiesto.id}
          estado={manifiesto.estadoManifiesto}
        />
        {manifiesto.estadoManifiesto !== 'REGISTRADO' && (
          <p className="text-xs text-muted-foreground">
            Estado actual:{' '}
            <span className="font-medium">{manifiesto.estadoManifiesto}</span> — sin acciones disponibles.
          </p>
        )}
      </section>
    </div>
  );
}
