import Link from 'next/link';
import type { Vehiculo, ManifiestoOperativo } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SyncRndcButton } from './SyncRndcButton';

interface VehiculoDetalleProps {
  vehiculo:     Vehiculo;
  rndcExitoso?: boolean | null;
  rndcLastAt?:  Date | null;
  manifiestos:  Pick<ManifiestoOperativo, 'id' | 'codigoInterno' | 'origenMunicipio' | 'destinoMunicipio' | 'estadoManifiesto'>[];
}

function RndcEstadoBadge({ exitoso }: { exitoso?: boolean | null }) {
  if (exitoso === true)  return <Badge variant="default">✅ Registrado</Badge>;
  if (exitoso === false) return <Badge variant="destructive">❌ Error RNDC</Badge>;
  return <Badge variant="outline">✏️ Borrador</Badge>;
}

function DocVigencia({ vigencia, label }: { vigencia: Date | null; label: string }) {
  if (!vigencia) {
    return (
      <>
        <dt className="text-muted-foreground">{label}</dt>
        <dd className="text-muted-foreground">Sin registrar</dd>
      </>
    );
  }
  const dias    = Math.ceil((vigencia.getTime() - Date.now()) / 86_400_000);
  const vencida = dias < 0;
  const proxima = !vencida && dias < 30;
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={vencida ? 'text-destructive font-medium' : proxima ? 'text-yellow-600' : ''}>
        {new Date(vigencia).toLocaleDateString('es-CO')}
        {vencida && ' ⚠️ VENCIDO'}
        {proxima && ` (${dias}d)`}
      </dd>
    </>
  );
}

export function VehiculoDetalle({
  vehiculo,
  rndcExitoso,
  rndcLastAt,
  manifiestos,
}: VehiculoDetalleProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <nav className="text-sm text-muted-foreground">
            <Link href="/operacional/vehiculos" className="hover:underline">
              Vehículos
            </Link>{' '}
            ›{' '}
            <span className="font-medium text-foreground">{vehiculo.placa}</span>
          </nav>
          <h1 className="mt-1 text-2xl font-semibold font-mono">{vehiculo.placa}</h1>
          {vehiculo.propietarioNombre && (
            <p className="text-sm text-muted-foreground">{vehiculo.propietarioNombre}</p>
          )}
        </div>
        <Link
          href={`/operacional/vehiculos/${vehiculo.placa}/editar`}
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted transition-colors"
        >
          Editar
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Datos ── */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Datos del vehículo</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Placa</dt>
              <dd className="font-mono font-medium">{vehiculo.placa}</dd>

              {vehiculo.configVehiculo && (
                <>
                  <dt className="text-muted-foreground">Configuración</dt>
                  <dd className="font-medium">{vehiculo.configVehiculo}</dd>
                </>
              )}

              {vehiculo.tipoVehiculo && (
                <>
                  <dt className="text-muted-foreground">Tipo</dt>
                  <dd>{vehiculo.tipoVehiculo}</dd>
                </>
              )}

              {vehiculo.anioVehiculo && (
                <>
                  <dt className="text-muted-foreground">Año</dt>
                  <dd>{vehiculo.anioVehiculo}</dd>
                </>
              )}

              {vehiculo.capacidadTon !== null && vehiculo.capacidadTon !== undefined && (
                <>
                  <dt className="text-muted-foreground">Capacidad</dt>
                  <dd>{String(vehiculo.capacidadTon)} ton</dd>
                </>
              )}

              {vehiculo.propietarioNombre && (
                <>
                  <dt className="text-muted-foreground">Propietario</dt>
                  <dd>{vehiculo.propietarioNombre}</dd>
                </>
              )}

              {vehiculo.propietarioId && (
                <>
                  <dt className="text-muted-foreground">Cédula propietario</dt>
                  <dd className="font-mono">{vehiculo.propietarioId}</dd>
                </>
              )}

              <DocVigencia vigencia={vehiculo.soatVigencia ?? null} label="SOAT" />
              <DocVigencia vigencia={vehiculo.rtmVigencia ?? null} label="RTM" />

              {vehiculo.notas && (
                <>
                  <dt className="text-muted-foreground">Notas</dt>
                  <dd className="col-span-1 max-w-sm whitespace-pre-wrap text-xs">{vehiculo.notas}</dd>
                </>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* ── Estado RNDC ── */}
        <Card>
          <CardHeader>
            <CardTitle>Estado RNDC</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RndcEstadoBadge exitoso={rndcExitoso} />
            <SyncRndcButton
              entityType="vehiculo"
              entityId={vehiculo.placa}
              syncStatus={rndcExitoso ?? null}
              lastSyncAt={rndcLastAt ?? null}
            />
          </CardContent>
        </Card>
      </div>

      {/* ── Manifiestos recientes ── */}
      {manifiestos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de manifiestos (últimos 5)</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-4 text-left">Código</th>
                  <th className="py-2 pr-4 text-left">Ruta</th>
                  <th className="py-2 text-left">Estado</th>
                </tr>
              </thead>
              <tbody>
                {manifiestos.map(m => (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-mono">{m.codigoInterno}</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {m.origenMunicipio} → {m.destinoMunicipio}
                    </td>
                    <td className="py-2">
                      <Badge variant="secondary" className="text-xs">
                        {m.estadoManifiesto}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
