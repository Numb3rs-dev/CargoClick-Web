# FRONT-02-F2 — UI: Gestión de Facturas Electrónicas

## Contexto

Implementa la interfaz para el ciclo de vida completo de la Factura Electrónica de Transporte:
- Crear factura en borrador
- Enviar a DIAN (mediante proveedor externo)
- Ver estado DIAN (aprobada/rechazada)
- Reportar al RNDC una vez aprobada

---

## Páginas y componentes

### Estructura

```
app/facturas/
├── page.tsx                     — Lista de facturas con filtros y estados
├── nueva/
│   └── page.tsx                 — Formulario creación de factura
└── [id]/
    └── page.tsx                 — Detalle y acciones de factura individual

components/operacional/facturas/
├── FacturasTable.tsx            — Tabla con estados duales DIAN + RNDC
├── FacturaEstadoBadge.tsx       — Badge colorido por estado
├── FacturaAcciones.tsx          — Botones de acción según estado
└── NuevaFacturaForm.tsx         — Formulario creación
```

---

### `components/operacional/facturas/FacturaEstadoBadge.tsx`

```typescript
import { Badge } from '@/components/ui/badge';
import { EstadoFacturaDian, EstadoFacturaRndc } from '@prisma/client';

const colorDian: Record<EstadoFacturaDian, string> = {
  BORRADOR:  'bg-gray-100 text-gray-700',
  ENVIADA:   'bg-blue-100 text-blue-700',
  APROBADA:  'bg-green-100 text-green-700',
  RECHAZADA: 'bg-red-100 text-red-700',
};

const colorRndc: Record<EstadoFacturaRndc, string> = {
  PENDIENTE:   'bg-yellow-100 text-yellow-700',
  ENVIADA:     'bg-blue-100 text-blue-700',
  REGISTRADA:  'bg-green-100 text-green-700',
  ERROR_RNDC:  'bg-red-100 text-red-700',
};

export function FacturaDianBadge({ estado }: { estado: EstadoFacturaDian }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorDian[estado]}`}>
      DIAN: {estado}
    </span>
  );
}

export function FacturaRndcBadge({ estado }: { estado: EstadoFacturaRndc }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorRndc[estado]}`}>
      RNDC: {estado}
    </span>
  );
}
```

---

### `components/operacional/facturas/FacturaAcciones.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { EstadoFacturaDian, EstadoFacturaRndc } from '@prisma/client';
import { Send, Upload, ExternalLink } from 'lucide-react';

interface FacturaAccionesProps {
  facturaId: string;
  estadoDian: EstadoFacturaDian;
  estadoRndc: EstadoFacturaRndc;
  onActualizar: () => void;
}

export function FacturaAcciones({
  facturaId,
  estadoDian,
  estadoRndc,
  onActualizar,
}: FacturaAccionesProps) {
  const [cargando, setCargando] = useState(false);

  // Reportar al RNDC (solo si DIAN aprobó y aún no está en RNDC)
  async function reportarRndc() {
    setCargando(true);
    try {
      const res = await fetch(`/api/facturas/${facturaId}/reportar-rndc`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Factura reportada al RNDC');
      onActualizar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error reportando al RNDC');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {/* Enlace al proveedor DIAN */}
      {estadoDian === 'BORRADOR' && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.open(process.env.NEXT_PUBLIC_DIAN_PORTAL_URL, '_blank')}
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
          Enviar a DIAN
        </Button>
      )}

      {/* Reportar al RNDC */}
      {estadoDian === 'APROBADA' && estadoRndc === 'PENDIENTE' && (
        <Button
          size="sm"
          onClick={reportarRndc}
          disabled={cargando}
        >
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          {cargando ? 'Reportando...' : 'Reportar al RNDC'}
        </Button>
      )}

      {estadoRndc === 'ERROR_RNDC' && (
        <Button
          size="sm"
          variant="destructive"
          onClick={reportarRndc}
          disabled={cargando}
        >
          Reintentar RNDC
        </Button>
      )}
    </div>
  );
}
```

---

### `app/facturas/page.tsx`

```typescript
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { listarFacturas } from '@/lib/services/facturaElectronicaService';
import { FacturasTable } from '@/components/operacional/facturas/FacturasTable';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const metadata = { title: 'Facturas Electrónicas — CargoClick' };

export default async function FacturasPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const facturas = await listarFacturas();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturas Electrónicas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión y reporte al RNDC + DIAN</p>
        </div>
        <Button asChild>
          <Link href="/facturas/nueva">
            <Plus className="h-4 w-4 mr-1.5" />
            Nueva factura
          </Link>
        </Button>
      </div>

      <FacturasTable facturas={facturas} />
    </div>
  );
}
```

---

### `components/operacional/facturas/FacturasTable.tsx`

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatCOP } from '@/lib/utils/formatters';
import { FacturaDianBadge, FacturaRndcBadge } from './FacturaEstadoBadge';
import { FacturaAcciones } from './FacturaAcciones';

export function FacturasTable({ facturas: initialFacturas }: { facturas: any[] }) {
  const [facturas, setFacturas] = useState(initialFacturas);

  async function recargar() {
    const res = await fetch('/api/facturas');
    const data = await res.json();
    setFacturas(data.facturas);
  }

  if (!facturas.length) {
    return (
      <div className="text-center py-12 text-gray-400">
        No hay facturas registradas
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
          <tr>
            <th className="px-4 py-3 text-left">Número</th>
            <th className="px-4 py-3 text-left">Adquirente</th>
            <th className="px-4 py-3 text-right">Total</th>
            <th className="px-4 py-3">Estado DIAN</th>
            <th className="px-4 py-3">Estado RNDC</th>
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {facturas.map((f) => (
            <tr key={f.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono font-medium">
                <Link href={`/facturas/${f.id}`} className="text-blue-600 hover:underline">
                  {f.numeroFactura}
                </Link>
              </td>
              <td className="px-4 py-3">
                <div className="font-medium">{f.nombreAdquirente}</div>
                <div className="text-gray-400 text-xs">{f.nitAdquirente}</div>
              </td>
              <td className="px-4 py-3 text-right font-medium">
                {formatCOP(Number(f.total))}
              </td>
              <td className="px-4 py-3 text-center">
                <FacturaDianBadge estado={f.estadoDian} />
              </td>
              <td className="px-4 py-3 text-center">
                <FacturaRndcBadge estado={f.estadoRndc} />
              </td>
              <td className="px-4 py-3 text-gray-500 text-xs">
                {new Date(f.creadaEn).toLocaleDateString('es-CO')}
              </td>
              <td className="px-4 py-3">
                <FacturaAcciones
                  facturaId={f.id}
                  estadoDian={f.estadoDian}
                  estadoRndc={f.estadoRndc}
                  onActualizar={recargar}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Nota sobre integración DIAN

El botón "Enviar a DIAN" redirige al portal del proveedor de facturación electrónica. El flujo de aprobación es externo: el proveedor llama al webhook `/api/facturas/[id]/dian-aprobacion` con el CUFE. Solo después de eso se habilita "Reportar al RNDC".

Agregar en `.env`:
```env
NEXT_PUBLIC_DIAN_PORTAL_URL=https://app.miproveedor.com/facturas
```
