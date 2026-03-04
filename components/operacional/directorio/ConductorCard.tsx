import Link from 'next/link';
import type { Conductor } from '@prisma/client';
import { Badge } from '@/components/ui/badge';

// ── RNDC sync status derived from the last SyncRndc record ────────
export interface RndcStatus {
  exitoso: boolean | null;  // null = never synced
  createdAt?: Date | null;
}

interface ConductorCardProps {
  conductor: Conductor;
  rndcStatus?: RndcStatus;
}

function RndcBadge({ status }: { status?: RndcStatus }) {
  if (!status || status.exitoso === null) {
    return <Badge variant="outline">Borrador</Badge>;
  }
  return status.exitoso ? (
    <Badge variant="default">Registrado</Badge>
  ) : (
    <Badge variant="destructive">Error RNDC</Badge>
  );
}

function LicenciaBadge({ vigencia }: { vigencia: Date | null }) {
  if (!vigencia) return <span className="text-sm text-muted-foreground">Sin fecha</span>;
  const diasRestantes = Math.ceil((vigencia.getTime() - Date.now()) / 86_400_000);
  const vencida = diasRestantes < 0;
  const proxima = !vencida && diasRestantes < 30;
  return (
    <span
      className={`text-sm ${
        vencida ? 'font-medium text-destructive' :
        proxima ? 'text-yellow-600' :
        'text-foreground'
      }`}
    >
      {vigencia.toLocaleDateString('es-CO')}
      {vencida && ' ⚠️'}
      {proxima && ` (${diasRestantes}d)`}
    </span>
  );
}

export function ConductorCard({ conductor, rndcStatus }: ConductorCardProps) {
  return (
    <tr className="border-b border-border hover:bg-muted/40 transition-colors">
      <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
        {conductor.cedula}
      </td>
      <td className="px-4 py-3">
        <Link
          href={`/operacional/conductores/${conductor.cedula}`}
          className="text-sm font-medium text-foreground hover:text-primary hover:underline"
        >
          {conductor.apellidos}, {conductor.nombres}
        </Link>
      </td>
      <td className="px-4 py-3">
        <RndcBadge status={rndcStatus} />
      </td>
      <td className="px-4 py-3 text-sm">
        <span className="mr-1 font-medium">{conductor.categoriaLicencia}</span>
        <LicenciaBadge vigencia={conductor.licenciaVigencia ?? null} />
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
            conductor.activo
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}
          title={conductor.activo ? 'Activo' : 'Inactivo'}
        >
          {conductor.activo ? '✓' : '×'}
        </span>
      </td>
    </tr>
  );
}
