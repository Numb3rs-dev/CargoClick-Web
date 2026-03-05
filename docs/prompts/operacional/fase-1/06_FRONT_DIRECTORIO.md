# FRONT-01: Directorio de Conductores y Vehículos

## CONTEXTO DE NEGOCIO

**Problema:** El despachador necesita un repositorio de conductores y vehículos habilitados para crear manifiestos. Debe poder registrarlos, sincronizarlos con el RNDC, y consultar su estado de documentación antes de asignarlos a un viaje.

**Pantallas que cubre este documento:**
1. Listado de Conductores
2. Detalle / Creación de Conductor
3. Listado de Vehículos
4. Detalle / Creación de Vehículo

---

## ARQUITECTURA DE COMPONENTES

```
app/
└── operacional/
    ├── layout.tsx                    ← layout con sidebar operacional
    ├── conductores/
    │   ├── page.tsx                  ← Server Component — SSR list
    │   ├── nuevo/
    │   │   └── page.tsx              ← formulario creación
    │   └── [cedula]/
    │       └── page.tsx              ← detalle + acciones
    └── vehiculos/
        ├── page.tsx
        ├── nuevo/
        │   └── page.tsx
        └── [placa]/
            └── page.tsx

components/
└── operacional/
    └── directorio/
        ├── ConductorList.tsx          ← tabla + paginación
        ├── ConductorCard.tsx          ← fila con badge de estado RNDC
        ├── ConductorForm.tsx          ← formulario RHF + Zod
        ├── ConductorDetalle.tsx       ← panel detalle con acciones
        ├── SyncRndcButton.tsx         ← botón reutilizable con estado loading
        ├── VehiculoList.tsx
        ├── VehiculoCard.tsx
        ├── VehiculoForm.tsx
        └── VehiculoDetalle.tsx
```

---

## WIREFRAMES

### Pantalla 1 — Listado de Conductores

```
┌─────────────────────────────────────────────────────┐
│ Directorio › Conductores                            │
│                                                     │
│ [🔍 Buscar por nombre o cédula...]  [+ Nuevo]      │
│                                                     │
│ ┌──────────┬──────────────────┬──────────┬────────┐ │
│ │ Cédula   │ Nombre           │ RNDC     │  Lic.  │ │
│ ├──────────┼──────────────────┼──────────┼────────┤ │
│ │ 80123456 │ Carlos Pérez     │ ✅ Sync  │ B3 ✅  │ │
│ │ 71234567 │ Juan García      │ ⚠️ No sync│ C2 ⚠️  │ │
│ │ 52345678 │ Ana Torres       │ ❌ Error  │ B2 ✅  │ │
│ └──────────┴──────────────────┴──────────┴────────┘ │
│                           [ 1  2  3 ... ]  20/página│
└─────────────────────────────────────────────────────┘
```

**Badges de estado RNDC:**
- `✅ Sincronizado` — verde — `rndcSyncExit = true`
- `⚠️ Sin sincronizar` — amarillo — `rndcSyncExit = null`
- `❌ Error RNDC` — rojo — `rndcSyncExit = false`

---

### Pantalla 2 — Creación / Edición de Conductor

```
┌──────────────────────────────────────────────────┐
│ ← Conductores › Nuevo Conductor                  │
│                                                  │
│  Información básica                              │
│  ─────────────────                               │
│  Cédula *        [               ]               │
│  Nombres *       [               ]               │
│  Apellidos *     [               ]               │
│                                                  │
│  Licencia                                        │
│  ─────────                                       │
│  Categoría *     [ B3 ▼ ]                        │
│  Vigencia        [ 2026-12-31 ]   📅             │
│                                                  │
│  Contacto (opcional)                             │
│  ──────────────────                              │
│  Teléfono        [               ]               │
│  Email           [               ]               │
│                                                  │
│  Notas           [                            ]  │
│                  [                            ]  │
│                                                  │
│  [Cancelar]                      [Guardar →]    │
└──────────────────────────────────────────────────┘
```

---

### Pantalla 3 — Detalle de Conductor

```
┌─────────────────────────────────────────────────────┐
│ ← Conductores › Carlos Pérez (80123456)             │
│                                                     │
│  ┌─────────────────────────────┐  ┌───────────────┐ │
│  │ Datos del conductor         │  │ Estado RNDC   │ │
│  │ ──────────────────────────  │  │ ────────────  │ │
│  │ Cédula:    80123456         │  │ ✅ Registrado │ │
│  │ Nombre:    Carlos Pérez     │  │ Último sync:  │ │
│  │ Licencia:  B3               │  │ hace 3 días   │ │
│  │ Vigencia:  31/12/2026 ✅    │  │               │ │
│  │ Teléfono:  310-555-0100     │  │ [Sincronizar  │ │
│  │                             │  │  al RNDC]     │ │
│  └─────────────────────────────┘  └───────────────┘ │
│                                                     │
│  Historial de manifiestos (últimos 5)               │
│  ─────────────────────────────────────              │
│  MF-2025-0042  |  Bogotá→Medellín  |  Culminado     │
│  MF-2025-0038  |  Bogotá→Cali      |  Registrado    │
└─────────────────────────────────────────────────────┘
```

---

## IMPLEMENTACIÓN DE COMPONENTES

### `ConductorForm.tsx`
```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

const schema = z.object({
  cedula:             z.string().min(5).max(20),
  nombres:            z.string().min(2).max(80),
  apellidos:          z.string().min(2).max(80),
  categoriaLicencia:  z.enum(['A1','A2','B1','B2','B3','C1','C2','C3']),
  licenciaVigencia:   z.string().optional(),
  telefono:           z.string().optional(),
  email:              z.string().email().optional().or(z.literal('')),
  notas:              z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

const CATEGORIAS = ['A1','A2','B1','B2','B3','C1','C2','C3'] as const;

interface ConductorFormProps {
  defaultValues?: Partial<FormValues>;
  mode: 'crear' | 'editar';
  cedula?: string;
}

export function ConductorForm({ defaultValues, mode, cedula }: ConductorFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      categoriaLicencia: 'B3',
      ...defaultValues,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      const url = mode === 'crear' ? '/api/conductores' : `/api/conductores/${cedula}`;
      const method = mode === 'crear' ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        body: JSON.stringify(values),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const err = await res.json();
        if (err.fields) {
          Object.entries(err.fields).forEach(([k, v]) => {
            form.setError(k as keyof FormValues, { message: v as string });
          });
          return;
        }
        throw new Error(err.message);
      }

      const { data } = await res.json();
      router.push(`/operacional/conductores/${data.cedula}`);
      router.refresh();
    } catch (e) {
      form.setError('root', { message: (e as Error).message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
        {/* Información básica */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Información básica
          </h3>

          <FormField control={form.control} name="cedula" render={({ field }) => (
            <FormItem>
              <FormLabel>Cédula *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="80123456" disabled={mode === 'editar'} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="nombres" render={({ field }) => (
              <FormItem>
                <FormLabel>Nombres *</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="apellidos" render={({ field }) => (
              <FormItem>
                <FormLabel>Apellidos *</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        {/* Licencia */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Licencia de conducción
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="categoriaLicencia" render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIAS.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="licenciaVigencia" render={({ field }) => (
              <FormItem>
                <FormLabel>Vigencia</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        {/* Errores generales */}
        {form.formState.errors.root && (
          <p className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Guardando...' : mode === 'crear' ? 'Crear conductor' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

---

### `SyncRndcButton.tsx`

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

interface SyncRndcButtonProps {
  entityType: 'conductor' | 'vehiculo';
  entityId: string;  // cedula o placa
  syncStatus?: boolean | null;  // null=nunca, true=ok, false=error
  lastSyncAt?: Date | null;
}

export function SyncRndcButton({
  entityType,
  entityId,
  syncStatus,
  lastSyncAt
}: SyncRndcButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncRndcId, setSyncRndcId] = useState<string | null>(null);

  const badgeVariant = syncStatus === true
    ? 'default'
    : syncStatus === false
    ? 'destructive'
    : 'secondary';

  const badgeText = syncStatus === true
    ? 'Registrado en RNDC'
    : syncStatus === false
    ? 'Error RNDC'
    : 'Sin sincronizar';

  async function handleSync() {
    setLoading(true);
    setError(null);
    try {
      const url = entityType === 'conductor'
        ? `/api/conductores/${entityId}/sync-rndc`
        : `/api/vehiculos/${entityId}/sync-rndc`;

      const res = await fetch(url, { method: 'POST' });
      const json = await res.json();

      if (!res.ok) {
        if (res.status === 502) {
          setError(`RNDC rechazó: ${json.message} (ID log: ${json.syncRndcId})`);
          setSyncRndcId(json.syncRndcId);
        } else {
          setError(json.message);
        }
        return;
      }

      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <Badge variant={badgeVariant}>{badgeText}</Badge>
        {lastSyncAt && (
          <span className="text-xs text-muted-foreground">
            {new Intl.RelativeTimeFormat('es', { numeric: 'auto' }).format(
              Math.round((lastSyncAt.getTime() - Date.now()) / 86400000),
              'day'
            )}
          </span>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={loading}
      >
        {loading ? 'Sincronizando...' : 'Sincronizar con RNDC'}
      </Button>
      {error && (
        <p className="text-xs text-destructive">
          {error}
          {syncRndcId && (
            <span className="block mt-1 font-mono text-[10px]">Log ID: {syncRndcId}</span>
          )}
        </p>
      )}
    </div>
  );
}
```

---

### `app/operacional/conductores/page.tsx` (Server Component)

```tsx
import { conductorRepository } from '@/lib/repositories/conductorRepository';
import { ConductorList } from '@/components/operacional/directorio/ConductorList';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Props {
  searchParams: { q?: string; page?: string };
}

export default async function ConductoresPage({ searchParams }: Props) {
  const page = Number(searchParams.page ?? 1);
  const { data: conductores, total } = await conductorRepository.findAll({
    q: searchParams.q,
    page,
    pageSize: 20,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Conductores</h1>
          <p className="text-sm text-muted-foreground">{total} conductores en el directorio</p>
        </div>
        <Button asChild>
          <Link href="/operacional/conductores/nuevo">+ Nuevo conductor</Link>
        </Button>
      </div>

      <ConductorList
        conductores={conductores}
        total={total}
        page={page}
        searchParams={searchParams}
      />
    </div>
  );
}
```

---

## ESTADOS Y VARIANTES UI

### Badge de estado RNDC
| Estado | Color | Icono | Descripción |
|--------|-------|-------|-------------|
| Registrado | `bg-green-100 text-green-800` | ✅ | `rndcSyncExit = true` |
| Sin sincronizar | `bg-yellow-100 text-yellow-800` | ⚠️ | `rndcSyncExit = null` |
| Error | `bg-red-100 text-red-800` | ❌ | `rndcSyncExit = false` |

### Licencia con vencimiento
```tsx
function LicenciaBadge({ vigencia }: { vigencia: Date | null }) {
  if (!vigencia) return <span className="text-muted-foreground">Sin fecha</span>;
  const hoy = new Date();
  const diasRestantes = Math.ceil((vigencia.getTime() - hoy.getTime()) / 86400000);
  const vencida = diasRestantes < 0;
  const proxima = diasRestantes < 30;
  return (
    <span className={`text-sm ${vencida ? 'text-destructive font-medium' : proxima ? 'text-yellow-600' : 'text-foreground'}`}>
      {vigencia.toLocaleDateString('es-CO')}
      {vencida && ' ⚠️ VENCIDA'}
      {!vencida && proxima && ` (${diasRestantes}d)`}
    </span>
  );
}
```

---

## CRITERIOS DE ACEPTACIÓN

- [ ] El listado usa Server Component con SSR (no skeleton en primera carga)
- [ ] La búsqueda debouncea 300ms antes de hacer GET (no golpea la API en cada keystroke)
- [ ] El formulario de creación valida con Zod en cliente antes de hacer POST
- [ ] `SyncRndcButton` muestra spinner mientras envía, error si falla con log ID visible
- [ ] Las licencias vencidas se destacan visualmente en rojo
- [ ] La cédula no es editable en modo edición
- [ ] Paginación funciona con parámetros `?page=N` en la URL (linkeable)
- [ ] Las pantallas de Vehículo siguen el mismo patrón que Conductor
- [ ] Responsive: en mobile la tabla se convierte en cards
