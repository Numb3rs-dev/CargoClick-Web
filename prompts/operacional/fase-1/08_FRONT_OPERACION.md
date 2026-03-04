# FRONT-03: Remesas y Manifiestos Operativos

## CONTEXTO DE NEGOCIO

**Problema:** El despachador necesita registrar las remesas de cada negocio (cargas físicas con datos RNDC), enviarlas al RNDC, luego crear el manifiesto que las agrupa (asignando conductor y vehículo), y finalmente gestionar correcciones o cumplidos.

**Pantallas que cubre este documento:**
1. Formulario de Nueva Remesa (dentro del panel de negocio)
2. Drawer de detalle de remesa + acción "Enviar al RNDC"
3. Formulario de Crear Manifiesto (wizard 2 pasos)
4. Panel de Manifiesto — estado, acciones (cumplir, anular, corregir)

---

## ARQUITECTURA DE COMPONENTES

```
components/
└── operacional/
    ├── remesas/
    │   ├── RemesaForm.tsx             ← formulario completo (RHF + Zod)
    │   ├── RemesaDrawer.tsx           ← slide-in con detalle + acciones RNDC
    │   ├── RemesaEstadoBadge.tsx      ← badge estado RNDC
    │   └── RemesaEnviarRndcBtn.tsx    ← botón envío con feedback
    └── manifiestos/
        ├── ManifiestoWizard.tsx       ← wizard 2 pasos
        ├── ManifiestoStepRemesas.tsx  ← Step 1: seleccionar remesas registradas
        ├── ManifiestoStepDatos.tsx    ← Step 2: datos del viaje
        ├── ManifiestoDetalle.tsx      ← panel del manifiesto
        ├── ManifiestoAcciones.tsx     ← botones cumplir/anular/corregir
        └── ManifiestoEstadoBadge.tsx
```

---

## WIREFRAMES

### Pantalla 1 — Formulario Nueva Remesa (Drawer / Modal)

```
┌─────────────────────────────────────────────────────┐
│ Nueva Remesa                                     [✕] │
│ Para: NEG-2025-0042 › Alpina S.A.                    │
│                                                     │
│ Carga                                               │
│ ─────                                               │
│ Descripción *    [ Leche UHT caja x 12         ]    │
│ Peso (kg) *      [    2500   ]   Empaque *  [CAJA▼] │
│ Naturaleza carga [  01 ▼  ]   Operación  [ T ▼ ]   │
│ UM Producto *    [ KG ▼  ]                          │
│                                                     │
│ Remitente                         Destinatario      │
│ ──────────                        ──────────────    │
│ Tipo ID  [ NI ▼ ]                 Tipo ID [ NI ▼ ]  │
│ NIT *    [             ]          NIT *   [       ] │
│ Sede     [ 0 ]                    Sede    [ 0 ]     │
│                                                     │
│ Propietario de la carga                             │
│ ────────────────────────                            │
│ Tipo ID  [ NI ▼ ]    NIT * [                    ]   │
│                                                     │
│ Origen                            Destino           │
│ ──────                            ───────           │
│ Municipio * [ Bogotá, D.C.     ]  [ Medellín    ]   │
│ DANE *      [ 11001 ]             [ 05001 ]         │
│                                                     │
│ Tiempos logísticos (RNDC nov 2025)                  │
│ ──────────────────────────────────                  │
│ Cita cargue *   [ 2025-06-14 ] [ 08:00 ]            │
│ Cita descargue *[ 2025-06-15 ] [ 14:00 ]            │
│ Pacto carga     [ 0h ] [ 30min ]                    │
│ Pacto descargue [ 1h ] [ 0min  ]                    │
│                                                     │
│ Opcionales                                          │
│ ──────────                                          │
│ Valor asegurado  [               ]                  │
│ Orden de servicio[               ]                  │
│                                                     │
│ [Cancelar]                  [Guardar remesa →]      │
└─────────────────────────────────────────────────────┘
```

---

### Pantalla 2 — Wizard Crear Manifiesto

#### Paso 1: Seleccionar Remesas

```
┌────────────────────────────────────────────────────────────┐
│ Crear Manifiesto — Paso 1 de 2                             │
│ ○────●────────────○                                        │
│ Remesas    Datos del viaje                                 │
│                                                            │
│ Selecciona las remesas REGISTRADAS en RNDC que van juntas: │
│                                                            │
│ ☑ REM-2025-0105 │ 2500 kg │ Bogotá → Medellín │ Alpina   │
│ ☑ REM-2025-0106 │ 1800 kg │ Bogotá → Medellín │ Alpina   │
│ ☐ REM-2025-0107 │  900 kg │ Bogotá → Cali     │ Alpina   │
│   ⚠ Destino diferente — puede ir en otro manifiesto        │
│                                                            │
│ Total seleccionado: 4300 kg                                │
│                                                            │
│ [Cancelar]                              [Siguiente →]      │
└────────────────────────────────────────────────────────────┘
```

#### Paso 2: Datos del Viaje

```
┌────────────────────────────────────────────────────────────┐
│ Crear Manifiesto — Paso 2 de 2                             │
│ ○────○────────────●                                        │
│                                                            │
│ Conductor *   [🔍 Buscar por cédula o nombre       ]       │
│               Carlos Pérez (80123456) - B3 ✅ RNDC sync    │
│                                                            │
│ Vehículo *    [🔍 Buscar por placa               ]         │
│               ABC123 - Tractocamión 3S3 ✅ RNDC sync       │
│                                                            │
│ Remolque      [         ] (opcional)                       │
│                                                            │
│ Origen *      [ Bogotá, D.C.        ]  DANE [ 11001 ]      │
│ Destino *     [ Medellín            ]  DANE [ 05001 ]      │
│                                                            │
│ Fletes                                                     │
│ ────────                                                   │
│ Flete pactado *    [ 3,500,000 ]                           │
│ Anticipo           [ 1,750,000 ]                           │
│ Retención ICA (‰)  [ 4        ]                            │
│                                                            │
│ Fecha expedición * [ 2025-06-13 ]                          │
│ Fecha despacho *   [ 2025-06-14 ]                          │
│ Aceptación electrónica  [☑ Sí ]                           │
│ Observaciones      [                                    ]  │
│                                                            │
│ [← Anterior]                    [Crear y enviar al RNDC →] │
└────────────────────────────────────────────────────────────┘
```

---

### Pantalla 3 — Panel de Manifiesto

```
┌──────────────────────────────────────────────────────────────┐
│ MF-2025-0042 — Manifiesto Operativo                         │
│ RNDC: 3047234   Estado: ✅ Registrado                        │
│                                                              │
│ ┌─────────────────────┐  ┌──────────────────────────────┐   │
│ │ Conductor           │  │ Vehículo                     │   │
│ │ Carlos Pérez        │  │ ABC-123  (Remolque: XYZ-456) │   │
│ │ Cédula: 80123456    │  │ Tractocamión 3S3             │   │
│ └─────────────────────┘  └──────────────────────────────┘   │
│                                                              │
│ Remesas incluidas                                            │
│ ─────────────────                                            │
│ REM-2025-0105  │ 2500 kg  │ Registrada RNDC                 │
│ REM-2025-0106  │ 1800 kg  │ Registrada RNDC                 │
│ Total: 4300 kg                                               │
│                                                              │
│ Ruta: Bogotá → Medellín                                      │
│ Flete: $3,500,000  Anticipo: $1,750,000  ICA: 4‰            │
│ Despacho: 14 jun 2025                                        │
│                                                              │
│ Acciones                                                     │
│ ────────                                                     │
│ [✓ Cumplir manifiesto]  [✏ Corregir]  [✗ Anular]           │
└──────────────────────────────────────────────────────────────┘
```

---

## IMPLEMENTACIÓN

### `ManifiestoWizard.tsx`

```tsx
'use client';

import { useState } from 'react';
import { ManifiestoStepRemesas } from './ManifiestoStepRemesas';
import { ManifiestoStepDatos } from './ManifiestoStepDatos';
import type { Remesa } from '@prisma/client';

interface ManifiestoWizardProps {
  negocioId: string;
  remesasDisponibles: Remesa[];
  onClose: () => void;
  onSuccess: (manifiestoId: string) => void;
}

type WizardData = {
  remesasIds: string[];
  conductor: { cedula: string; nombre: string } | null;
  vehiculo: { placa: string; config: string } | null;
};

export function ManifiestoWizard({
  negocioId, remesasDisponibles, onClose, onSuccess
}: ManifiestoWizardProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [data, setData] = useState<WizardData>({
    remesasIds: [],
    conductor: null,
    vehiculo: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [rndcError, setRndcError] = useState<{ message: string; syncRndcId: string } | null>(null);

  function handleStepOneComplete(remesasIds: string[]) {
    setData(prev => ({ ...prev, remesasIds }));
    setStep(2);
  }

  async function handleSubmit(formData: Record<string, unknown>) {
    setSubmitting(true);
    setRndcError(null);
    try {
      const res = await fetch('/api/manifiestos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, remesasIds: data.remesasIds, nuevoNegocioId: negocioId }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 502) {
          setRndcError({ message: json.message, syncRndcId: json.syncRndcId });
        }
        throw new Error(json.message);
      }
      onSuccess(json.data.id);
    } catch (e) {
      if (!rndcError) {
        // Error genérico (400, 422, etc.) — manejado en ManifiestoStepDatos
        throw e;
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Indicador de pasos */}
      <div className="flex items-center gap-3 text-sm">
        <span className={step === 1 ? 'font-semibold text-primary' : 'text-muted-foreground'}>
          1. Remesas
        </span>
        <span className="text-muted-foreground">→</span>
        <span className={step === 2 ? 'font-semibold text-primary' : 'text-muted-foreground'}>
          2. Datos del viaje
        </span>
      </div>

      {step === 1 && (
        <ManifiestoStepRemesas
          remesas={remesasDisponibles}
          selected={data.remesasIds}
          onNext={handleStepOneComplete}
          onCancel={onClose}
        />
      )}

      {step === 2 && (
        <ManifiestoStepDatos
          remesasIds={data.remesasIds}
          onBack={() => setStep(1)}
          onSubmit={handleSubmit}
          submitting={submitting}
          rndcError={rndcError}
        />
      )}
    </div>
  );
}
```

---

### `ManifiestoStepRemesas.tsx`

```tsx
'use client';

import { useState, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Remesa } from '@prisma/client';

interface Props {
  remesas: Remesa[];
  selected: string[];
  onNext: (ids: string[]) => void;
  onCancel: () => void;
}

export function ManifiestoStepRemesas({ remesas, selected: initialSelected, onNext, onCancel }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));

  const remesasRegistradas = remesas.filter(r => r.estadoRndc === 'REGISTRADA');
  const pesoTotal = useMemo(() => {
    return remesasRegistradas
      .filter(r => selected.has(r.id))
      .reduce((sum, r) => sum + r.pesoKg, 0);
  }, [selected, remesasRegistradas]);

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Solo las remesas con estado <Badge variant="default">Registrada RNDC</Badge> pueden asignarse a un manifiesto.
      </p>

      <div className="border rounded-lg divide-y">
        {remesasRegistradas.map(remesa => (
          <label
            key={remesa.id}
            className="flex items-start gap-4 p-4 cursor-pointer hover:bg-muted/50"
          >
            <Checkbox
              checked={selected.has(remesa.id)}
              onCheckedChange={() => toggle(remesa.id)}
              className="mt-1"
            />
            <div className="flex-1 min-w-0">
              <p className="font-mono text-sm font-medium">{remesa.numeroRemesa}</p>
              <p className="text-sm text-muted-foreground">
                {remesa.pesoKg.toLocaleString('es-CO')} kg — {remesa.descripcionCarga}
              </p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {remesa.origenDane} → {remesa.destinoDane}
            </span>
          </label>
        ))}

        {remesasRegistradas.length === 0 && (
          <p className="p-6 text-center text-muted-foreground text-sm">
            No hay remesas registradas en el RNDC disponibles.
            Primero envía las remesas al RNDC.
          </p>
        )}
      </div>

      {selected.size > 0 && (
        <p className="text-sm font-medium">
          {selected.size} remesa{selected.size > 1 ? 's' : ''} seleccionada{selected.size > 1 ? 's' : ''} —{' '}
          <span className="text-primary">{pesoTotal.toLocaleString('es-CO')} kg total</span>
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button
          onClick={() => onNext([...selected])}
          disabled={selected.size === 0}
        >
          Siguiente →
        </Button>
      </div>
    </div>
  );
}
```

---

### `ManifiestoAcciones.tsx` — Cumplir / Anular / Corregir

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';

interface ManifiestoAccionesProps {
  manifiestoId: string;
  estado: string;
}

export function ManifiestoAcciones({ manifiestoId, estado }: ManifiestoAccionesProps) {
  const router = useRouter();
  const [accion, setAccion] = useState<'cumplir' | 'anular' | null>(null);
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (estado !== 'REGISTRADO') return null;

  async function ejecutar() {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/manifiestos/${manifiestoId}/${accion}`;
      const body = accion === 'anular' ? { motivoAnulacion: motivo } : undefined;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? 'Error al ejecutar la acción');
        return;
      }
      setAccion(null);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <Button onClick={() => setAccion('cumplir')}>
          ✓ Cumplir manifiesto
        </Button>
        <Button variant="outline" onClick={() => setAccion('anular')}>
          ✗ Anular
        </Button>
      </div>

      <AlertDialog open={accion !== null} onOpenChange={() => setAccion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {accion === 'cumplir' ? 'Confirmar cumplido' : 'Anular manifiesto'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {accion === 'cumplir'
                ? 'Esta acción registrará el cumplido en el RNDC (procesoid 6). No se puede deshacer.'
                : 'El manifiesto será anulado en el RNDC (procesoid 32). Las remesas quedarán disponibles para reasignación.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {accion === 'anular' && (
            <Textarea
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Motivo de anulación (mínimo 10 caracteres)..."
              className="mt-2"
              rows={3}
            />
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={ejecutar}
              disabled={loading || (accion === 'anular' && motivo.length < 10)}
            >
              {loading ? 'Procesando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

---

## ESTADOS DE MANIFIESTO — VARIANTES UI

| Estado | Badge color | Acciones disponibles |
|--------|-------------|---------------------|
| `BORRADOR` | Gris | Enviar al RNDC (reintento) |
| `ENVIADO` | Azul claro | Esperando respuesta (spinner) |
| `REGISTRADO` | Verde | Cumplir, Anular, Corregir |
| `CULMINADO` | Verde oscuro | Solo lectura |
| `ANULADO` | Rojo | Solo lectura |

---

## CRITERIOS DE ACEPTACIÓN

- [ ] El wizard valida que haya al menos 1 remesa seleccionada en paso 1
- [ ] El paso 2 búsqueda de conductores/vehículos hace GET con debounce (300ms)
- [ ] Si el RNDC devuelve 502, se muestra el error con el `syncRndcId` para debugging
- [ ] El botón "Cumplir" muestra un AlertDialog de confirmación
- [ ] El botón "Anular" requiere escribir el motivo (mínimo 10 chars) en el dialog
- [ ] El manifiesto `CULMINADO` o `ANULADO` no muestra botones de acción
- [ ] El buscador de conductor en paso 2 solo muestra conductores con `rndcSyncExit = true`
- [ ] El peso total se calcula en tiempo real al seleccionar/deseleccionar remesas
- [ ] La corrección (anular + re-crear) lanza el wizard pre-poblado con datos originales
