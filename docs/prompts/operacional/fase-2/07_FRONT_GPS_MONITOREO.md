# FRONT-03-F2 — UI: Monitoreo GPS y Novedades de Flota

## Contexto

Implementa el panel de monitoreo de flota en tiempo real y el registro de novedades GPS por viaje. Las novedades se reportan al RNDC (procesoid 45) y se persisten localmente.

---

## Componentes

### Estructura

```
app/flota/
└── page.tsx                         — Dashboard de monitoreo de flota

components/operacional/gps/
├── FlotaMonitorPanel.tsx            — Listado de viajes activos con última novedad
├── NovedadGPSForm.tsx               — Formulario registro de novedad
├── NovedadesTimeline.tsx            — Timeline de novedades de un viaje
└── MapaPlaceholder.tsx              — Placeholder mapa (Leaflet/Google Maps)
```

---

### `components/operacional/gps/NovedadesTimeline.tsx`

Timeline que muestra el progreso del viaje basado en las novedades GPS registradas.

```typescript
'use client';

import { TipoNovedadGPS } from '@prisma/client';
import { CheckCircle2, Circle, Truck, MapPin, Package } from 'lucide-react';

interface Novedad {
  id: string;
  tipo: TipoNovedadGPS;
  registradaEn: string;
  municipioDane?: string;
  descripcion?: string;
  estadoRndc?: string;
}

const ICONOS: Record<TipoNovedadGPS, React.ReactNode> = {
  INICIO_CARGUE:    <Package className="h-4 w-4" />,
  FIN_CARGUE:       <Package className="h-4 w-4" />,
  INICIO_VIAJE:     <Truck className="h-4 w-4" />,
  EN_RUTA:          <MapPin className="h-4 w-4" />,
  LLEGADA_DESTINO:  <MapPin className="h-4 w-4" />,
  INICIO_DESCARGUE: <Package className="h-4 w-4" />,
  FIN_DESCARGUE:    <CheckCircle2 className="h-4 w-4" />,
  NOVEDAD_TRANSITO: <Circle className="h-4 w-4 text-orange-500" />,
};

const ETIQUETAS: Record<TipoNovedadGPS, string> = {
  INICIO_CARGUE:    'Inicio de cargue',
  FIN_CARGUE:       'Fin de cargue',
  INICIO_VIAJE:     'Inicio de viaje',
  EN_RUTA:          'En ruta',
  LLEGADA_DESTINO:  'Llegada al destino',
  INICIO_DESCARGUE: 'Inicio de descargue',
  FIN_DESCARGUE:    'Entrega completada',
  NOVEDAD_TRANSITO: 'Novedad en tránsito',
};

export function NovedadesTimeline({ novedades }: { novedades: Novedad[] }) {
  if (!novedades.length) {
    return (
      <p className="text-sm text-gray-400 py-4 text-center">
        Sin novedades registradas para este viaje
      </p>
    );
  }

  return (
    <ol className="relative border-l border-gray-200 space-y-4 ml-2">
      {novedades.map((n, i) => (
        <li key={n.id} className="ml-4">
          <span className="absolute -left-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-white border-2 border-blue-400 text-blue-600">
            {ICONOS[n.tipo]}
          </span>
          <div className="pl-2">
            <p className="text-sm font-medium text-gray-900">{ETIQUETAS[n.tipo]}</p>
            <time className="text-xs text-gray-400">
              {new Date(n.registradaEn).toLocaleString('es-CO', {
                dateStyle: 'short', timeStyle: 'short',
              })}
            </time>
            {n.descripcion && (
              <p className="text-xs text-gray-600 mt-0.5">{n.descripcion}</p>
            )}
            {n.estadoRndc && (
              <span className={`text-xs px-1.5 py-0.5 rounded mt-1 inline-block ${
                n.estadoRndc === 'REGISTRADA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                RNDC: {n.estadoRndc}
              </span>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
```

---

### `components/operacional/gps/NovedadGPSForm.tsx`

Formulario para registrar una novedad GPS en un manifiesto.

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { TipoNovedadGPS } from '@prisma/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const TIPOS_NOVEDAD: { value: TipoNovedadGPS; label: string }[] = [
  { value: 'INICIO_CARGUE',    label: 'Inicio de cargue' },
  { value: 'FIN_CARGUE',       label: 'Fin de cargue' },
  { value: 'INICIO_VIAJE',     label: 'Inicio de viaje' },
  { value: 'EN_RUTA',          label: 'En ruta (actualización)' },
  { value: 'LLEGADA_DESTINO',  label: 'Llegada al destino' },
  { value: 'INICIO_DESCARGUE', label: 'Inicio de descargue' },
  { value: 'FIN_DESCARGUE',    label: 'Fin de descargue / Entrega' },
  { value: 'NOVEDAD_TRANSITO', label: 'Novedad en tránsito' },
];

interface Props {
  manifiestoId: string;
  onRegistrada?: () => void;
}

export function NovedadGPSForm({ manifiestoId, onRegistrada }: Props) {
  const [tipo, setTipo] = useState<TipoNovedadGPS | ''>('');
  const [descripcion, setDescripcion] = useState('');
  const [obteniendo, setObteniendo] = useState(false);
  const [latitud, setLatitud] = useState<number>();
  const [longitud, setLongitud] = useState<number>();
  const [guardando, setGuardando] = useState(false);

  async function obtenerUbicacion() {
    setObteniendo(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej)
      );
      setLatitud(pos.coords.latitude);
      setLongitud(pos.coords.longitude);
      toast.success('Ubicación obtenida');
    } catch {
      toast.error('No se pudo obtener la ubicación del dispositivo');
    } finally {
      setObteniendo(false);
    }
  }

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    if (!tipo) return toast.error('Selecciona el tipo de novedad');

    setGuardando(true);
    try {
      const res = await fetch(`/api/manifiestos/${manifiestoId}/novedades-gps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, latitud, longitud, descripcion }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Novedad registrada en RNDC');
      setTipo('');
      setDescripcion('');
      onRegistrada?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error registrando novedad');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={registrar} className="space-y-3">
      <Select value={tipo} onValueChange={(v) => setTipo(v as TipoNovedadGPS)}>
        <SelectTrigger>
          <SelectValue placeholder="Tipo de novedad" />
        </SelectTrigger>
        <SelectContent>
          {TIPOS_NOVEDAD.map((t) => (
            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Textarea
        placeholder="Descripción (opcional)"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        rows={2}
      />

      <div className="flex gap-2 items-center">
        <Button type="button" variant="outline" size="sm" onClick={obtenerUbicacion} disabled={obteniendo}>
          {obteniendo ? 'Obteniendo...' : latitud ? `📍 ${latitud.toFixed(4)}, ${longitud?.toFixed(4)}` : '📍 Usar mi ubicación'}
        </Button>
      </div>

      <Button type="submit" className="w-full" disabled={guardando || !tipo}>
        {guardando ? 'Registrando...' : 'Registrar novedad en RNDC'}
      </Button>
    </form>
  );
}
```

---

### `app/flota/page.tsx`

Dashboard de flota — muestra manifiestos activos y sus novedades recientes.

```typescript
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { FlotaMonitorPanel } from '@/components/operacional/gps/FlotaMonitorPanel';

export const metadata = { title: 'Monitoreo de Flota — CargoClick' };

export default async function FlotaPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  // Manifiestos activos (EN_TRANSITO o CARGADO)
  const manifiestos = await prisma.manifiesto.findMany({
    where: {
      estado: { in: ['EN_TRANSITO', 'CARGADO'] },
    },
    include: {
      conductor: { select: { nombre: true, cedula: true } },
      vehiculo:  { select: { placa: true, tipoConfiguracion: true } },
      novedadesGPS: {
        orderBy: { registradaEn: 'desc' },
        take: 1,
      },
    },
    orderBy: { fechaSalida: 'asc' },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Monitoreo de Flota</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {manifiestos.length} viaje{manifiestos.length !== 1 ? 's' : ''} activo{manifiestos.length !== 1 ? 's' : ''}
        </p>
      </div>

      <FlotaMonitorPanel manifiestos={manifiestos} />
    </div>
  );
}
```

---

## Integración en detalle de manifiesto

En el componente `ManifiestoDetail`, agregar la sección GPS:

```typescript
import { NovedadesTimeline } from '@/components/operacional/gps/NovedadesTimeline';
import { NovedadGPSForm } from '@/components/operacional/gps/NovedadGPSForm';

// En el JSX del detalle:
<section className="space-y-3">
  <h3 className="font-semibold text-gray-900">Seguimiento GPS</h3>
  <NovedadesTimeline novedades={novedades} />
  <NovedadGPSForm manifiestoId={manifiesto.id} onRegistrada={recargarNovedades} />
</section>
```
