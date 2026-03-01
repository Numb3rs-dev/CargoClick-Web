# FRONT-02: Módulo Nuevo Negocio (Dashboard Operativo)

## CONTEXTO DE NEGOCIO

**Problema:** Un despachador crea un "Nuevo Negocio" para iniciar la operación de una carga. Puede venir de una solicitud aprobada del ciclo comercial (Ruta A) o crearse directamente sin cotización previa (Ruta B). Luego gestiona el negocio desde un panel central hasta completarlo.

**Pantallas que cubre este documento:**
1. Listado de Negocios (dashboard operativo)
2. Crear Negocio — Selección de Ruta A / Ruta B
3. Formulario Ruta B (negocio directo)
4. Panel de Detalle del Negocio

---

## ARQUITECTURA DE COMPONENTES

```
app/
└── operacional/
    └── negocios/
        ├── page.tsx                  ← Server Component — listado con filtros
        ├── nuevo/
        │   └── page.tsx              ← Selector de ruta + formularios
        └── [id]/
            └── page.tsx              ← Panel completo del negocio

components/
└── operacional/
    └── negocios/
        ├── NegocioList.tsx            ← tabla con estado, filtros, paginación
        ├── NegocioKanban.tsx          ← vista alternativa kanban por estado
        ├── NuevoNegocioSelector.tsx   ← Step 0: elegir Ruta A o B
        ├── NegocioDesdeComercial.tsx  ← Step A: selector de solicitud aprobada
        ├── NegocioDirectoForm.tsx     ← Step B: formulario libre
        ├── NegocioPanel.tsx           ← panel de detalle principal
        ├── NegocioTimeline.tsx        ← estados del negocio en timeline
        └── NegocioEstadoBadge.tsx     ← badge reutilizable
```

---

## WIREFRAMES

### Pantalla 1 — Listado de Negocios (Dashboard Operativo)

```
┌──────────────────────────────────────────────────────────────────┐
│ Operacional › Negocios                                           │
│                                                                  │
│ [🔍 Buscar código o cliente...]  [Estado: Todos ▼]  [+ Negocio] │
│                                                                  │
│  Vista: [Tabla ▣]  [Kanban ⊞]                                    │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐   │
│ │ Código        │ Cliente            │ Estado   │ Despacho   │   │
│ ├───────────────┼────────────────────┼──────────┼────────────┤   │
│ │ NEG-2025-0042 │ Alpina S.A.        │ ▶ Activo │ 14 jun     │   │
│ │ NEG-2025-0041 │ Bavaria S.A.       │ ✓ Compl. │ 10 jun     │   │
│ │ NEG-2025-0040 │ Cliente B (directo)│ ⚠ Sin MF │ 12 jun     │   │
│ │ NEG-2025-0039 │ Nutresa            │ ✗ Cancel.│ —          │   │
│ └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

**Estados del Negocio:**
| Estado | Color | Descripción |
|--------|-------|-------------|
| `CREADO` | Gris | Negocio sin remesas |
| `EN_PROCESO` | Azul | Tiene remesas/manifiestos activos |
| `COMPLETADO` | Verde | Manifiesto cumplido |
| `CANCELADO` | Rojo tenue | Cancelado por el operador |

---

### Pantalla 2 — Selector de Ruta

```
┌───────────────────────────────────────────────────────┐
│ ← Negocios › Nuevo Negocio                           │
│                                                       │
│  ¿Cómo ingresó esta carga?                           │
│                                                       │
│  ┌────────────────────────────────────────────────┐   │
│  │  📋  Desde solicitud aprobada (Ruta A)         │   │
│  │                                                │   │
│  │  La carga viene del ciclo comercial.           │   │
│  │  Selecciona la cotización o ajuste comercial.  │   │
│  │                                                │   │
│  │              [ Seleccionar solicitud → ]       │   │
│  └────────────────────────────────────────────────┘   │
│                                                       │
│  ┌────────────────────────────────────────────────┐   │
│  │  ✏️  Negocio directo (Ruta B)                  │   │
│  │                                                │   │
│  │  El cliente llegó directamente por teléfono,  │   │
│  │  referido o canal propio.                      │   │
│  │                                                │   │
│  │              [ Ingresar datos del cliente → ]  │   │
│  └────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────┘
```

---

### Pantalla 3 — Formulario Ruta B (Negocio Directo)

```
┌────────────────────────────────────────────────────────┐
│ ← Nuevo Negocio › Ruta B — Datos del cliente           │
│                                                        │
│  Cliente                                               │
│  ────────                                              │
│  Nombre / Razón social *  [                        ]   │
│  NIT / Cédula             [                        ]   │
│                                                        │
│  Operación                                             │
│  ──────────                                            │
│  Fecha estimada despacho  [  2025-06-14  ] 📅          │
│  Notas internas           [                        ]   │
│                           [                        ]   │
│                                                        │
│  [Cancelar]                          [Crear negocio →] │
└────────────────────────────────────────────────────────┘
```

---

### Pantalla 4 — Panel de Detalle del Negocio

```
┌──────────────────────────────────────────────────────────┐
│ ← Negocios › NEG-2025-0042                               │
│                                                          │
│ ┌────────────────────────────┐  ┌─────────────────────┐  │
│ │ Alpina S.A.                │  │ Estado: ▶ En proceso │  │
│ │ NEG-2025-0042              │  │ Despacho: 14 jun     │  │
│ │ Creado: 10 jun 2025        │  │ [Cancelar negocio]   │  │
│ └────────────────────────────┘  └─────────────────────┘  │
│                                                          │
│  Remesas (3)                           [+ Nueva remesa]  │
│  ────────────────────────────────────────────────────    │
│  REM-2025-0105 │ 2500 kg │ ✅ Registrada RNDC           │
│  REM-2025-0106 │ 1800 kg │ ⚠️ Pendiente RNDC            │
│  REM-2025-0107 │  900 kg │ ⚠️ Pendiente RNDC            │
│                                                          │
│  Manifiestos (1)                   [+ Crear manifiesto]  │
│  ────────────────────────────────────────────────────    │
│  MF-2025-0042  │ ABC123 │ Carlos P. │ ✅ Registrado     │
│                                                          │
│  Seguimiento del cliente                                 │
│  ──────────────────────                                  │
│  [+ Registrar hito]                                      │
│  ○ CREADO    10 jun — Negocio creado                     │
│  ● ASIGNADO  11 jun — Carlos Pérez asignado              │
└──────────────────────────────────────────────────────────┘
```

---

## IMPLEMENTACIÓN DE COMPONENTES

### `NuevoNegocioSelector.tsx`

```tsx
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NegocioDesdeComercial } from './NegocioDesdeComercial';
import { NegocioDirectoForm } from './NegocioDirectoForm';

type Ruta = 'A' | 'B' | null;

export function NuevoNegocioSelector() {
  const [ruta, setRuta] = useState<Ruta>(null);

  if (ruta === 'A') return <NegocioDesdeComercial onBack={() => setRuta(null)} />;
  if (ruta === 'B') return <NegocioDirectoForm onBack={() => setRuta(null)} />;

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Nuevo Negocio</h1>
        <p className="text-muted-foreground mt-1">¿Cómo ingresó esta carga?</p>
      </div>

      <div className="grid gap-4">
        <Card
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => setRuta('A')}
        >
          <CardContent className="p-6 flex items-start gap-4">
            <div className="text-3xl">📋</div>
            <div className="flex-1">
              <h3 className="font-semibold">Desde solicitud aprobada</h3>
              <p className="text-sm text-muted-foreground mt-1">
                La carga viene del ciclo comercial. Selecciona la cotización o ajuste aprobado.
              </p>
            </div>
            <Button variant="outline" size="sm">Seleccionar →</Button>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => setRuta('B')}
        >
          <CardContent className="p-6 flex items-start gap-4">
            <div className="text-3xl">✏️</div>
            <div className="flex-1">
              <h3 className="font-semibold">Negocio directo</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Cliente llegó directamente. No tiene cotización en el sistema.
              </p>
            </div>
            <Button variant="outline" size="sm">Ingresar datos →</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

### `NegocioDirectoForm.tsx`

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage
} from '@/components/ui/form';

const schema = z.object({
  clienteNombre:          z.string().min(2).max(100),
  clienteNit:             z.string().max(20).optional(),
  fechaDespachoEstimada:  z.string().optional(),
  notas:                  z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof schema>;

export function NegocioDirectoForm({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      const res = await fetch('/api/negocios', {
        method: 'POST',
        body: JSON.stringify(values),
        headers: { 'Content-Type': 'application/json' },
      });
      const { data, error, message } = await res.json();
      if (!res.ok) throw new Error(message || error);
      router.push(`/operacional/negocios/${data.id}`);
    } catch (e) {
      form.setError('root', { message: (e as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>← Atrás</Button>
        <div>
          <h2 className="text-xl font-semibold">Negocio directo</h2>
          <p className="text-sm text-muted-foreground">Ruta B — sin cotización previa</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-4">
            <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Cliente
            </h3>
            <FormField control={form.control} name="clienteNombre" render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre / Razón social *</FormLabel>
                <FormControl><Input {...field} placeholder="Alpina S.A." /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="clienteNit" render={({ field }) => (
              <FormItem>
                <FormLabel>NIT / Cédula</FormLabel>
                <FormControl><Input {...field} placeholder="900123456" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Operación
            </h3>
            <FormField control={form.control} name="fechaDespachoEstimada" render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha estimada de despacho</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notas" render={({ field }) => (
              <FormItem>
                <FormLabel>Notas internas</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={3} placeholder="Instrucciones especiales, contacto en destino..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          {form.formState.errors.root && (
            <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onBack}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creando...' : 'Crear negocio →'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
```

---

### `NegocioPanel.tsx` (estructura del panel de detalle)

```tsx
import { nuevoNegocioRepository } from '@/lib/repositories/nuevoNegocioRepository';
import { NegocioRemesasSection } from './NegocioRemesasSection';
import { NegocioManifiestoSection } from './NegocioManifiestoSection';
import { NegocioSeguimientoSection } from './NegocioSeguimientoSection';
import { NegocioEstadoBadge } from './NegocioEstadoBadge';

export async function NegocioPanel({ id }: { id: string }) {
  const negocio = await nuevoNegocioRepository.findById(id);
  if (!negocio) return <div>Negocio no encontrado</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold font-mono">{negocio.codigoNegocio}</h1>
          <p className="text-muted-foreground mt-1">
            {negocio.clienteNombre ?? negocio.solicitud?.contactoNombre ?? 'Cliente externo'}
          </p>
        </div>
        <NegocioEstadoBadge estado={negocio.estado} />
      </div>

      {/* Remesas */}
      <NegocioRemesasSection negocioId={id} remesas={negocio.remesas} />

      {/* Manifiesto */}
      <NegocioManifiestoSection negocioId={id} manifiestos={negocio.manifiestos} />

      {/* Seguimiento */}
      <NegocioSeguimientoSection negocioId={id} hitos={negocio.seguimiento} />
    </div>
  );
}
```

---

## HOOK DE FILTROS

```tsx
// hooks/useNegocioFiltros.ts
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition } from 'react';

export function useNegocioFiltros() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function setFiltro(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');  // reset paginación al filtrar
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return {
    q: searchParams.get('q') ?? '',
    estado: searchParams.get('estado') ?? '',
    page: Number(searchParams.get('page') ?? 1),
    isPending,
    setFiltro,
  };
}
```

---

## CRITERIOS DE ACEPTACIÓN

- [ ] El selector Ruta A / Ruta B es un componente Client-side sin rutas diferentes
- [ ] El listado de negocios usa Server Component con filtros en query params (linkeable)
- [ ] El panel de detalle agrupa Remesas, Manifiestos y Seguimiento en secciones expandibles
- [ ] El botón "Cancelar negocio" muestra un modal de confirmación antes de proceder
- [ ] Los negocios `COMPLETADO` o `CANCELADO` están en modo solo lectura (sin botones de acción)
- [ ] La fecha de despacho estimada se destaca si ya pasó y el negocio sigue activo
- [ ] El código `NEG-YYYY-NNNN` se muestra en fuente monoespaciada
- [ ] Ruta A: la búsqueda de solicitudes hace GET a `/api/solicitudes?estado=APROBADA&q=...`
- [ ] Paginación por query params `?page=N&estado=X&q=Y`
