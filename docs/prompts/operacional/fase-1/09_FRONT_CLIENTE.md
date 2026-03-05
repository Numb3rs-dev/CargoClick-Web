# FRONT-04: Seguimiento del Cliente y Encuesta Post-Entrega

## CONTEXTO DE NEGOCIO

**Problema:** Uma vez creado el manifiesto, el cliente necesita saber dónde está su carga. El despachador registra hitos de seguimiento que se notifican al cliente. Al completar la entrega, se envía automáticamente un link de encuesta de satisfacción.

**Pantallas que cubre este documento:**
1. Panel de Seguimiento (despachador) — dentro del NegocioPanel
2. Página pública de Encuesta Post-Entrega (sin autenticación)

---

## ARQUITECTURA DE COMPONENTES

```
app/
├── operacional/
│   └── (seguimiento vive dentro de negocios/[id]/page.tsx)
└── encuesta/
    └── [token]/
        ├── page.tsx        ← Página pública (no requiere auth)
        └── gracias/
            └── page.tsx    ← Página de agradecimiento post-envío

components/
└── operacional/
    ├── seguimiento/
    │   ├── SeguimientoTimeline.tsx     ← timeline de hitos
    │   ├── SeguimientoHitoForm.tsx     ← formulario inline registrar hito
    │   └── SeguimientoHitoCard.tsx     ← card individual del hito
    └── encuesta/
        ├── EncuestaForm.tsx            ← formulario estrella + comentario
        ├── EncuestaEstrellas.tsx       ← selector de rating visual
        └── EncuestaGracias.tsx         ← pantalla de agradecimiento
```

---

## WIREFRAMES

### Pantalla 1 — Panel de Seguimiento (despachador)

```
┌──────────────────────────────────────────────────────────────┐
│ Seguimiento del cliente                     [+ Registrar hito]│
│                                                              │
│ Timeline                                                     │
│ ─────────                                                    │
│  ● ENTREGADO         15 jun · 14:30                          │
│  │ "Mercancía entregada sin novedad"                         │
│  │                                                           │
│  ● DESCARGUE_COMPLETADO  15 jun · 13:00                      │
│  │ "Proceso de descargue finalizado"                         │
│  │                                                           │
│  ● LLEGADA_DESTINO   15 jun · 12:15                          │
│  │ 📍 Parque Industrial Guarne, entrada 2                    │
│  │                                                           │
│  ● EN_TRANSITO       14 jun · 08:30                          │
│  │ "Vehículo en ruta"                                        │
│  │                                                           │
│  ● CARGUE_COMPLETADO 14 jun · 07:45                          │
│  │                                                           │
│  ○ (sin hitos anteriores)                                    │
│                                                              │
│ Encuesta                                                     │
│ ────────                                                     │
│  Estado: Pendiente  [Enviar encuesta al cliente]             │
└──────────────────────────────────────────────────────────────┘
```

---

### Pantalla 2 — Formulario Registrar Hito (se abre inline)

```
┌──────────────────────────────────────────────────┐
│ Registrar hito de seguimiento                    │
│                                                  │
│ Hito *                                           │
│ [ EN_TRANSITO ▼ ]                                │
│                                                  │
│ Descripción                                      │
│ [                                             ]  │
│                                                  │
│ Ubicación (opcional)                             │
│ [ Ej: Km 105 vía Bogotá-Medellín          ]      │
│                                                  │
│ Evidencia (URL imagen, foto)                     │
│ [                                             ]  │
│                                                  │
│ ☑ Notificar al cliente por WhatsApp/Email        │
│                                                  │
│ [Cancelar]          [Guardar hito]               │
└──────────────────────────────────────────────────┘
```

---

### Pantalla 3 — Página Pública de Encuesta

```
╔═══════════════════════════════════════════════════════╗
║                   CargoClick                          ║
║                                                       ║
║  ¿Cómo fue tu experiencia?                           ║
║                                                       ║
║  Hola, te escribimos de CargoClick.                  ║
║  Tu envío NEG-2025-0042 fue entregado.                ║
║  Nos gustaría saber tu opinión.                       ║
║                                                       ║
║  Calificación *                                       ║
║                                                       ║
║        ★  ★  ★  ★  ☆                                ║
║       (haz clic para calificar)                       ║
║                                                       ║
║  Comentarios (opcional)                               ║
║  ┌───────────────────────────────────────────────┐   ║
║  │ ¿Qué podemos mejorar?                         │   ║
║  └───────────────────────────────────────────────┘   ║
║                                                       ║
║            [ Enviar calificación ]                    ║
╚═══════════════════════════════════════════════════════╝
```

---

### Pantalla 4 — Agradecimiento

```
╔═══════════════════════════════════════════════════════╗
║                   CargoClick                          ║
║                                                       ║
║              🎉 ¡Muchas gracias!                      ║
║                                                       ║
║  Tu calificación ha sido registrada.                  ║
║  Nos ayuda a seguir mejorando.                        ║
║                                                       ║
║  Hasta la próxima 🚛                                  ║
╚═══════════════════════════════════════════════════════╝
```

---

## IMPLEMENTACIÓN

### `SeguimientoHitoForm.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

const HITOS = [
  { value: 'CONDUCTOR_ASIGNADO',     label: 'Conductor asignado' },
  { value: 'VEHICULO_EN_ORIGEN',     label: 'Vehículo en origen' },
  { value: 'CARGUE_INICIADO',        label: 'Cargue iniciado' },
  { value: 'CARGUE_COMPLETADO',      label: 'Cargue completado' },
  { value: 'EN_TRANSITO',            label: 'En tránsito' },
  { value: 'LLEGADA_DESTINO',        label: 'Llegada al destino' },
  { value: 'DESCARGUE_INICIADO',     label: 'Descargue iniciado' },
  { value: 'DESCARGUE_COMPLETADO',   label: 'Descargue completado' },
  { value: 'ENTREGADO',              label: 'Entregado' },
] as const;

const schema = z.object({
  hito:             z.enum(['CONDUCTOR_ASIGNADO','VEHICULO_EN_ORIGEN','CARGUE_INICIADO','CARGUE_COMPLETADO','EN_TRANSITO','LLEGADA_DESTINO','DESCARGUE_INICIADO','DESCARGUE_COMPLETADO','ENTREGADO']),
  descripcion:      z.string().max(300).optional(),
  ubicacion:        z.string().max(100).optional(),
  evidenciaUrl:     z.string().url().optional().or(z.literal('')),
  notificarCliente: z.boolean().default(false),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  negocioId: string;
  onClose: () => void;
}

export function SeguimientoHitoForm({ negocioId, onClose }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { notificarCliente: false },
  });

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      const res = await fetch(`/api/negocios/${negocioId}/seguimiento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Error al registrar');
      onClose();
      router.refresh();
    } catch (e) {
      form.setError('root', { message: (e as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="hito" render={({ field }) => (
          <FormItem>
            <FormLabel>Hito *</FormLabel>
            <Select onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Seleccionar hito..." /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {HITOS.map(h => (
                  <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="descripcion" render={({ field }) => (
          <FormItem>
            <FormLabel>Descripción</FormLabel>
            <FormControl>
              <Textarea {...field} rows={2} placeholder="Detalles adicionales..." />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="ubicacion" render={({ field }) => (
          <FormItem>
            <FormLabel>Ubicación</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Km 105 vía Bogotá-Medellín" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="notificarCliente" render={({ field }) => (
          <FormItem className="flex items-center gap-3 space-y-0">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <FormLabel className="font-normal cursor-pointer">
              Notificar al cliente por WhatsApp / Email
            </FormLabel>
          </FormItem>
        )} />

        {form.formState.errors.root && (
          <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar hito'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

---

### `SeguimientoTimeline.tsx`

```tsx
import type { SeguimientoCliente } from '@prisma/client';

const HITO_LABELS: Record<string, string> = {
  CONDUCTOR_ASIGNADO:   'Conductor asignado',
  VEHICULO_EN_ORIGEN:   'Vehículo en origen',
  CARGUE_INICIADO:      'Cargue iniciado',
  CARGUE_COMPLETADO:    'Cargue completado',
  EN_TRANSITO:          'En tránsito',
  LLEGADA_DESTINO:      'Llegada al destino',
  DESCARGUE_INICIADO:   'Descargue iniciado',
  DESCARGUE_COMPLETADO: 'Descargue completado',
  ENTREGADO:            'Entregado ✓',
};

interface Props {
  hitos: SeguimientoCliente[];
}

export function SeguimientoTimeline({ hitos }: Props) {
  const sorted = [...hitos].sort(
    (a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime()
  );

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No hay hitos de seguimiento registrados todavía.
      </p>
    );
  }

  return (
    <ol className="relative border-l border-border space-y-6 pl-6">
      {sorted.map((hito, idx) => (
        <li key={hito.id} className="relative">
          <span
            className={`absolute -left-[25px] w-4 h-4 rounded-full border-2 border-background ${
              idx === 0 ? 'bg-primary' : 'bg-muted'
            }`}
          />
          <div>
            <p className="font-medium text-sm">
              {HITO_LABELS[hito.hito] ?? hito.hito}
            </p>
            {hito.descripcion && (
              <p className="text-sm text-muted-foreground mt-0.5">{hito.descripcion}</p>
            )}
            {hito.ubicacion && (
              <p className="text-xs text-muted-foreground mt-0.5">
                📍 {hito.ubicacion}
              </p>
            )}
            <time className="text-xs text-muted-foreground">
              {new Date(hito.creadoEn).toLocaleString('es-CO', {
                dateStyle: 'medium', timeStyle: 'short'
              })}
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
}
```

---

### `app/encuesta/[token]/page.tsx` — Página Pública

```tsx
// ⚠️ Asegurarse que Clerk middleware NO proteja esta ruta
// middleware.ts debe tener: publicRoutes: ['/encuesta/:token*']

import { notFound } from 'next/navigation';
import { EncuestaForm } from '@/components/operacional/encuesta/EncuestaForm';

interface Props {
  params: { token: string };
}

async function getEncuesta(token: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/encuestas/${token}`,
    { cache: 'no-store' }   // siempre fresco — el estado puede cambiar
  );
  if (!res.ok) return null;
  const { data } = await res.json();
  return data;
}

export default async function EncuestaPage({ params }: Props) {
  const encuesta = await getEncuesta(params.token);

  if (!encuesta) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-lg font-medium">Enlace no válido</p>
          <p className="text-muted-foreground mt-2">
            Este link de encuesta no existe o ya expiró.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-6">
          <p className="text-lg font-bold">CargoClick</p>
        </div>

        <h1 className="text-xl font-semibold text-center">¿Cómo fue tu experiencia?</h1>
        <p className="text-muted-foreground text-sm text-center mt-2 mb-6">
          Tu envío <span className="font-mono font-medium">{encuesta.negocioCode}</span> fue entregado.
          <br />Nos gustaría escuchar tu opinión.
        </p>

        <EncuestaForm token={params.token} />
      </div>
    </div>
  );
}
```

---

### `EncuestaForm.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { EncuestaEstrellas } from './EncuestaEstrellas';

interface Props {
  token: string;
}

export function EncuestaForm({ token }: Props) {
  const router = useRouter();
  const [puntuacion, setPuntuacion] = useState<number | null>(null);
  const [comentarios, setComentarios] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!puntuacion) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/encuestas/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puntuacion, comentarios }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          router.push(`/encuesta/${token}/gracias`);  // ya respondida — ir a gracias
          return;
        }
        throw new Error(json.message);
      }
      router.push(`/encuesta/${token}/gracias`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium block text-center">
          Calificación *
        </label>
        <EncuestaEstrellas value={puntuacion} onChange={setPuntuacion} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="comentarios">
          Comentarios (opcional)
        </label>
        <Textarea
          id="comentarios"
          value={comentarios}
          onChange={e => setComentarios(e.target.value)}
          placeholder="¿Qué podemos mejorar?"
          rows={3}
          maxLength={1000}
        />
      </div>

      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      <Button type="submit" className="w-full" disabled={!puntuacion || submitting}>
        {submitting ? 'Enviando...' : 'Enviar calificación'}
      </Button>
    </form>
  );
}
```

---

### `EncuestaEstrellas.tsx`

```tsx
'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface Props {
  value: number | null;
  onChange: (v: number) => void;
}

export function EncuestaEstrellas({ value, onChange }: Props) {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className="flex justify-center gap-2" role="group" aria-label="Calificación">
      {[1, 2, 3, 4, 5].map(n => {
        const activa = (hover ?? value ?? 0) >= n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(null)}
            aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
            className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded"
          >
            <Star
              size={36}
              className={`transition-colors ${
                activa
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-transparent text-muted-foreground'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
```

---

### `app/encuesta/[token]/gracias/page.tsx`

```tsx
export default function GraciasPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white rounded-2xl shadow-sm border p-10 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-xl font-semibold">¡Muchas gracias!</h1>
        <p className="text-muted-foreground mt-2">
          Tu calificación ha sido registrada. Nos ayuda a seguir mejorando.
        </p>
        <p className="mt-6 text-2xl">🚛</p>
      </div>
    </div>
  );
}
```

---

## CONFIGURACIÓN DE MIDDLEWARE

```typescript
// middleware.ts — asegurar que estas rutas sean públicas
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|encuesta).*)'],
};
// O usando clerkMiddleware con publicRoutes:
// publicRoutes: ['/encuesta(.*)', '/api/encuestas(.*)']
```

---

## CRITERIOS DE ACEPTACIÓN

- [ ] La página `/encuesta/[token]` NO requiere Clerk — accesible sin login
- [ ] Si el token no existe → mostrar mensaje de error (no 404 crudo)
- [ ] Si la encuesta ya fue respondida → redirigir a `/gracias` en lugar de error hostil
- [ ] Las estrellas responden al hover con animación (fill + scale)
- [ ] Sin puntuación seleccionada, el botón "Enviar" está deshabilitado
- [ ] El formulario de hitos del despachador muestra los campos opcionales (ubicación, evidencia)
- [ ] El checkbox "Notificar al cliente" es visible y funcional
- [ ] La timeline ordena hitos por fecha descendente (más reciente arriba)
- [ ] La página de encuesta es responsive en mobile (1 columna, estrellas grandes)
- [ ] La accesibilidad del selector de estrellas: botones con `aria-label`
