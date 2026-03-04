# FRONT-01-F2 — UI: Aceptación Electrónica del Conductor

## Contexto

Implementa la interfaz de usuario para el flujo de aceptación electrónica del conductor, que es un paso obligatorio del RNDC (procesoids 73/75). El conductor recibe un enlace en su celular, confirma su identidad y acepta el manifiesto.

---

## Flujo

```
Operador en CargoClick               Conductor (móvil)
─────────────────────                ────────────────────
1. Ve manifiesto "En tránsito"
2. Hace clic "Solicitar aceptación"
   → POST /api/manifiestos/[id]/aceptacion-conductor
   ← recibe URL pública
3. Comparte URL via SMS / WhatsApp
                                     4. Abre URL en celular
                                     5. Ve datos del manifiesto
                                     6. Toca "Acepto y confirmo"
                                        → POST /api/aceptacion-conductor/confirmar
7. Panel se actualiza con
   "Conductor aceptó ✓"
```

---

## Componentes a crear

### 1. `components/operacional/aceptacion/AceptacionConductorPanel.tsx`

Panel que muestra el estado de aceptación en el detalle del manifiesto.

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Share2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AceptacionData {
  estadoRndc: string | null;
  fechaAceptacion: string | null;
  nombreConductor: string | null;
  cedula: string | null;
}

interface AceptacionConductorPanelProps {
  manifiestoId: string;
  aceptacion: AceptacionData | null;
  onRefresh?: () => void;
}

export function AceptacionConductorPanel({
  manifiestoId,
  aceptacion,
  onRefresh,
}: AceptacionConductorPanelProps) {
  const [iniciando, setIniciando] = useState(false);
  const [urlCompartir, setUrlCompartir] = useState<string | null>(null);

  const yaAceptado = aceptacion?.estadoRndc === 'ACEPTADO';
  const pendiente  = aceptacion && !yaAceptado;

  async function iniciarAceptacion() {
    setIniciando(true);
    try {
      const res = await fetch(`/api/manifiestos/${manifiestoId}/aceptacion-conductor`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUrlCompartir(data.url);
      await navigator.clipboard.writeText(data.url);
      toast.success('Enlace copiado al portapapeles');
    } catch (err) {
      toast.error('Error generando enlace de aceptación');
    } finally {
      setIniciando(false);
    }
  }

  async function copiarEnlace() {
    if (!urlCompartir) return;
    await navigator.clipboard.writeText(urlCompartir);
    toast.success('Enlace copiado');
  }

  if (yaAceptado) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3 text-sm">
        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
        <div>
          <p className="font-medium text-green-800">Conductor aceptó el manifiesto</p>
          {aceptacion?.fechaAceptacion && (
            <p className="text-green-600 text-xs mt-0.5">
              {new Date(aceptacion.fechaAceptacion).toLocaleString('es-CO')}
            </p>
          )}
        </div>
        <Badge variant="secondary" className="ml-auto">RNDC ✓</Badge>
      </div>
    );
  }

  if (pendiente) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 space-y-2">
        <div className="flex items-center gap-2 text-sm text-yellow-800">
          <Clock className="h-4 w-4 shrink-0" />
          <span>Esperando aceptación del conductor</span>
        </div>
        {urlCompartir && (
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={urlCompartir}
              className="flex-1 text-xs bg-white border rounded px-2 py-1 text-gray-600 truncate"
            />
            <Button size="sm" variant="outline" onClick={copiarEnlace}>
              Copiar
            </Button>
          </div>
        )}
        <Button size="sm" variant="outline" onClick={iniciarAceptacion} disabled={iniciando}>
          <Share2 className="h-3.5 w-3.5 mr-1.5" />
          Reenviar enlace
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <p className="text-sm text-gray-600 flex items-center gap-1.5">
        <AlertCircle className="h-4 w-4 text-gray-400" />
        Aceptación electrónica del conductor pendiente (obligatoria RNDC)
      </p>
      <Button
        size="sm"
        onClick={iniciarAceptacion}
        disabled={iniciando}
        className="w-full"
      >
        <Share2 className="h-3.5 w-3.5 mr-1.5" />
        {iniciando ? 'Generando enlace...' : 'Solicitar aceptación'}
      </Button>
    </div>
  );
}
```

---

### 2. `app/aceptacion-conductor/page.tsx`

Página pública (sin auth) que el conductor abre en su celular.

```typescript
// app/aceptacion-conductor/page.tsx
import { Suspense } from 'react';
import { AceptacionConductorForm } from './AceptacionConductorForm';

export const metadata = { title: 'Aceptación de Manifiesto — CargoClick' };

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-900">CargoClick</h1>
          <p className="text-sm text-gray-500 mt-1">Aceptación electrónica de manifiesto</p>
        </div>
        <Suspense fallback={<div className="text-center text-sm text-gray-400">Cargando...</div>}>
          <AceptacionConductorForm />
        </Suspense>
      </div>
    </div>
  );
}
```

### 3. `app/aceptacion-conductor/AceptacionConductorForm.tsx`

```typescript
'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';

export function AceptacionConductorForm() {
  const params = useSearchParams();
  const token  = params.get('token');

  const [estado, setEstado] = useState<'pendiente' | 'procesando' | 'exito' | 'error'>('pendiente');
  const [mensaje, setMensaje] = useState('');
  const [nombre, setNombre] = useState('');

  if (!token) {
    return (
      <div className="text-center text-red-600">
        <XCircle className="h-12 w-12 mx-auto mb-2" />
        <p>Enlace inválido. Solicita un nuevo enlace a la empresa transportadora.</p>
      </div>
    );
  }

  async function confirmar() {
    setEstado('procesando');
    try {
      const res = await fetch('/api/aceptacion-conductor/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok || !data.exito) {
        setEstado('error');
        setMensaje(data.error ?? data.mensaje ?? 'Error al procesar');
        return;
      }
      setEstado('exito');
      setNombre(data.nombreConductor ?? '');
      setMensaje(data.mensaje ?? 'Aceptación registrada correctamente');
    } catch {
      setEstado('error');
      setMensaje('Error de conexión. Intente nuevamente.');
    }
  }

  if (estado === 'exito') {
    return (
      <div className="text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-900">¡Aceptación registrada!</h2>
        <p className="text-sm text-gray-600 mt-1">{nombre && `Hola, ${nombre}.`} {mensaje}</p>
        <p className="text-xs text-gray-400 mt-3">
          Esta aceptación ha sido registrada en el RNDC del Ministerio de Transporte.
        </p>
      </div>
    );
  }

  if (estado === 'error') {
    return (
      <div className="text-center">
        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-gray-700">{mensaje}</p>
        <Button className="mt-4 w-full" variant="outline" onClick={() => setEstado('pendiente')}>
          Intentar de nuevo
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
        <p>Al tocar el botón confirmas que eres el conductor asignado a este manifiesto y
           aceptas realizar el viaje según las condiciones pactadas.</p>
      </div>
      <Button
        className="w-full h-12 text-base"
        onClick={confirmar}
        disabled={estado === 'procesando'}
      >
        {estado === 'procesando' ? 'Registrando...' : 'Acepto y confirmo ✓'}
      </Button>
      <p className="text-xs text-center text-gray-400">
        Esta acción queda registrada en el RNDC y tiene validez legal.
      </p>
    </div>
  );
}
```

---

## Integración en ManifiestoDetail

En el componente de detalle de manifiesto (Fase 1), agregar el panel:

```typescript
// En ManifiestoDetail o similar
import { AceptacionConductorPanel } from '@/components/operacional/aceptacion/AceptacionConductorPanel';

// Fetch estado aceptación junto con el manifiesto
const { data: aceptacionData } = useSWR(
  `/api/manifiestos/${id}/aceptacion-conductor`
);

// En el JSX, después del estado del manifiesto:
<AceptacionConductorPanel
  manifiestoId={id}
  aceptacion={aceptacionData?.aceptacion ?? null}
  onRefresh={mutate}
/>
```

---

## Middleware — excluir ruta pública

En `middleware.ts`, asegurarse de que `/aceptacion-conductor` no requiere autenticación Clerk:

```typescript
export const config = {
  matcher: [
    '/((?!aceptacion-conductor|api/aceptacion-conductor|_next/static|_next/image|favicon.ico).*)',
  ],
};
```
