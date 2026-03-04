import Link from 'next/link';
import type { Conductor, ManifiestoOperativo } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SyncRndcButton } from './SyncRndcButton';

interface ConductorDetalleProps {
  conductor: Conductor;
  /** Estado del último SyncRndc (process 11) */
  rndcExitoso?: boolean | null;
  rndcLastAt?:  Date | null;
  manifiestos:  Pick<ManifiestoOperativo, 'id' | 'codigoInterno' | 'origenMunicipio' | 'destinoMunicipio' | 'estadoManifiesto'>[];
}

function RndcEstadoBadge({ exitoso }: { exitoso?: boolean | null }) {
  if (exitoso === true)  return <Badge variant="default">✅ Registrado</Badge>;
  if (exitoso === false) return <Badge variant="destructive">❌ Error RNDC</Badge>;
  return <Badge variant="outline">✏️ Borrador</Badge>;
}

export function ConductorDetalle({
  conductor,
  rndcExitoso,
  rndcLastAt,
  manifiestos,
}: ConductorDetalleProps) {
  const vigencia = conductor.licenciaVigencia;
  const diasRestantes = vigencia
    ? Math.ceil((new Date(vigencia).getTime() - Date.now()) / 86_400_000)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <nav className="text-sm text-muted-foreground">
            <Link href="/operacional/conductores" className="hover:underline">
              Conductores
            </Link>{' '}
            ›{' '}
            <span className="text-foreground font-medium">
              {conductor.nombres} {conductor.apellidos}
            </span>
          </nav>
          <h1 className="mt-1 text-2xl font-semibold">
            {conductor.nombres} {conductor.apellidos}
          </h1>
          <p className="text-sm text-muted-foreground font-mono">{conductor.cedula}</p>
        </div>
        <Link
          href={`/operacional/conductores/${conductor.cedula}/editar`}
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted transition-colors"
        >
          Editar
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Datos ── */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Datos del conductor</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Cédula</dt>
              <dd className="font-mono">{conductor.cedula}</dd>

              <dt className="text-muted-foreground">Nombre</dt>
              <dd>{conductor.nombres} {conductor.apellidos}</dd>

              <dt className="text-muted-foreground">Categoría</dt>
              <dd className="font-medium">{conductor.categoriaLicencia}</dd>

              <dt className="text-muted-foreground">Vigencia licencia</dt>
              <dd>
                {vigencia ? (
                  <span className={diasRestantes !== null && diasRestantes < 0 ? 'text-destructive font-medium' : diasRestantes !== null && diasRestantes < 30 ? 'text-yellow-600' : ''}>
                    {new Date(vigencia).toLocaleDateString('es-CO')}
                    {diasRestantes !== null && diasRestantes < 0 && ' ⚠️ VENCIDA'}
                    {diasRestantes !== null && diasRestantes >= 0 && diasRestantes < 30 && ` (${diasRestantes}d)`}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Sin registrar</span>
                )}
              </dd>

              {conductor.telefono && (
                <>
                  <dt className="text-muted-foreground">Teléfono</dt>
                  <dd>{conductor.telefono}</dd>
                </>
              )}

              {conductor.email && (
                <>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd>{conductor.email}</dd>
                </>
              )}

              {conductor.notas && (
                <>
                  <dt className="text-muted-foreground">Notas</dt>
                  <dd className="col-span-1 max-w-sm whitespace-pre-wrap text-xs">{conductor.notas}</dd>
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
              entityType="conductor"
              entityId={conductor.cedula}
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
