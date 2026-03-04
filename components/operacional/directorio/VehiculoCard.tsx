import Link from 'next/link';
import type { Vehiculo } from '@prisma/client';
import { Badge } from '@/components/ui/badge';

export interface RndcStatus {
  exitoso: boolean | null;
  createdAt?: Date | null;
}

interface VehiculoCardProps {
  vehiculo:    Vehiculo;
  rndcStatus?: RndcStatus;
}

function RndcBadge({ status }: { status?: RndcStatus }) {
  if (!status || status.exitoso === null) {
    return <Badge variant="outline">Borrador</Badge>;
  }
  return status.exitoso
    ? <Badge variant="default">Registrado</Badge>
    : <Badge variant="destructive">Error RNDC</Badge>;
}

function DocBadge({ vigencia, label }: { vigencia: Date | null; label: string }) {
  if (!vigencia) {
    return <span className="text-xs text-muted-foreground">{label}: sin fecha</span>;
  }
  const dias    = Math.ceil((vigencia.getTime() - Date.now()) / 86_400_000);
  const vencida = dias < 0;
  const proxima = !vencida && dias < 30;
  return (
    <span className={`text-xs ${vencida ? 'text-destructive font-medium' : proxima ? 'text-yellow-600' : 'text-foreground'}`}>
      {label}: {vigencia.toLocaleDateString('es-CO')}
      {vencida && ' ⚠️'}
    </span>
  );
}

export function VehiculoCard({ vehiculo, rndcStatus }: VehiculoCardProps) {
  return (
    <tr className="border-b border-border hover:bg-muted/40 transition-colors">
      <td className="px-4 py-3 text-sm font-mono font-medium">
        <Link
          href={`/operacional/vehiculos/${vehiculo.placa}`}
          className="text-foreground hover:text-primary hover:underline"
        >
          {vehiculo.placa}
        </Link>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {vehiculo.configVehiculo ?? '—'}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {vehiculo.propietarioNombre ?? '—'}
      </td>
      <td className="px-4 py-3">
        <RndcBadge status={rndcStatus} />
      </td>
      <td className="px-4 py-3 space-y-1">
        <DocBadge vigencia={vehiculo.soatVigencia ?? null} label="SOAT" />
        <br />
        <DocBadge vigencia={vehiculo.rtmVigencia ?? null} label="RTM" />
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${vehiculo.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
          title={vehiculo.activo ? 'Activo' : 'Inactivo'}
        >
          {vehiculo.activo ? '✓' : '×'}
        </span>
      </td>
    </tr>
  );
}
