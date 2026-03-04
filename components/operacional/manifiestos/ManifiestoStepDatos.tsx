'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';

// ── Schema ──────────────────────────────────────────────────────────────────────
const stepDatosSchema = z.object({
  conductorCedula:  z.string().min(5, 'Selecciona un conductor'),
  vehiculoPlaca:    z.string().min(5, 'Selecciona un vehículo'),
  placaRemolque:    z.string().optional(),
  origenMunicipio:  z.string().min(3, 'Requerido'),
  origenDane:       z.string().min(5, 'Código DANE requerido'),
  destinoMunicipio: z.string().min(3, 'Requerido'),
  destinoDane:      z.string().min(5, 'Código DANE requerido'),
  fletePactado:     z.coerce.number().positive('El flete es requerido'),
  valorAnticipo:    z.coerce.number().min(0),
  retencionIca:     z.coerce.number().min(0),
  fechaExpedicion:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  fechaDespacho:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  observaciones:    z.string().max(200).optional(),
});

export type StepDatosValues = z.infer<typeof stepDatosSchema>;

interface ConductorResult {
  cedula: string;
  nombres: string;
  apellidos: string;
  categoriaLicencia: string;
}

interface VehiculoResult {
  placa: string;
  tipoVehiculo: string | null;
  configVehiculo: string | null;
  capacidadTon: unknown;
}

interface ManifiestoStepDatosProps {
  remesasIds: string[];
  onBack: () => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  submitting: boolean;
  rndcError: { message: string; syncRndcId: string } | null;
}

// ── Hook de búsqueda con debounce ────────────────────────────────────────────────
function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ── Buscador genérico ────────────────────────────────────────────────────────────
function useBusqueda<T>(url: (q: string) => string) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQ = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQ.length < 2) { setResults([]); return; }
    let cancelled = false;
    setLoading(true);
    fetch(url(encodeURIComponent(debouncedQ)))
      .then(r => r.json())
      .then(j => { if (!cancelled) setResults(j.data ?? []); })
      .catch(() => { if (!cancelled) setResults([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedQ, url]);

  return { query, setQuery, results, loading };
}

// ── Componente ───────────────────────────────────────────────────────────────────
/**
 * Paso 2 del wizard de creación de manifiesto.
 * Selección de conductor y vehículo con búsqueda en tiempo real (debounce 300ms),
 * más todos los datos del viaje y fletes.
 *
 * El conductor y vehículo deben estar registrados en el directorio local.
 */
export function ManifiestoStepDatos({
  onBack,
  onSubmit,
  submitting,
  rndcError,
}: ManifiestoStepDatosProps) {
  const today = new Date().toISOString().split('T')[0];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<StepDatosValues>({
    resolver: zodResolver(stepDatosSchema) as any,
    defaultValues: {
      valorAnticipo: 0,
      retencionIca:  4,
      fechaExpedicion: today,
      fechaDespacho:   today,
    },
  });

  // ── Búsqueda conductor ────────────────────────────────────────────────────────
  const [conductorLabel, setConductorLabel] = useState('');
  const conductorBusq = useBusqueda<ConductorResult>(
    q => `/api/conductores?q=${q}&activo=true`
  );
  const [showConductorList, setShowConductorList] = useState(false);
  const conductorRef = useRef<HTMLDivElement>(null);

  // ── Búsqueda vehículo ────────────────────────────────────────────────────────
  const [vehiculoLabel, setVehiculoLabel] = useState('');
  const vehiculoBusq = useBusqueda<VehiculoResult>(
    q => `/api/vehiculos?q=${q}&activo=true`
  );
  const [showVehiculoList, setShowVehiculoList] = useState(false);

  function selectConductor(c: ConductorResult) {
    form.setValue('conductorCedula', c.cedula, { shouldValidate: true });
    setConductorLabel(`${c.nombres} ${c.apellidos} (${c.cedula}) — ${c.categoriaLicencia}`);
    setShowConductorList(false);
  }

  function selectVehiculo(v: VehiculoResult) {
    form.setValue('vehiculoPlaca', v.placa, { shouldValidate: true });
    setVehiculoLabel(`${v.placa}${v.tipoVehiculo ? ` — ${v.tipoVehiculo}` : ''}${v.configVehiculo ? ` ${v.configVehiculo}` : ''}`);
    setShowVehiculoList(false);
  }

  async function handleSubmit(values: StepDatosValues) {
    await onSubmit(values as Record<string, unknown>);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

        {/* ── Conductor ─────────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Conductor
          </h3>

          <FormField
            control={form.control}
            name="conductorCedula"
            render={() => (
              <FormItem>
                <FormLabel>Conductor *</FormLabel>
                <FormControl>
                  <div className="relative" ref={conductorRef}>
                    <Input
                      placeholder="🔍 Buscar por cédula o nombre…"
                      value={conductorBusq.query || conductorLabel}
                      onChange={e => {
                        conductorBusq.setQuery(e.target.value);
                        setConductorLabel('');
                        setShowConductorList(true);
                      }}
                      onFocus={() => setShowConductorList(true)}
                      onBlur={() => setTimeout(() => setShowConductorList(false), 200)}
                    />
                    {showConductorList && (conductorBusq.results.length > 0 || conductorBusq.loading) && (
                      <ul className="absolute z-10 w-full mt-1 rounded-md border bg-background shadow-md text-sm max-h-48 overflow-y-auto">
                        {conductorBusq.loading && (
                          <li className="px-3 py-2 text-muted-foreground">Buscando…</li>
                        )}
                        {conductorBusq.results.map(c => (
                          <li
                            key={c.cedula}
                            className="px-3 py-2 cursor-pointer hover:bg-muted"
                            onMouseDown={() => selectConductor(c)}
                          >
                            <span className="font-medium">{c.nombres} {c.apellidos}</span>
                            <span className="ml-2 text-muted-foreground font-mono text-xs">
                              {c.cedula} · {c.categoriaLicencia}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </FormControl>
                {conductorLabel && (
                  <p className="text-xs text-green-700 mt-1">✅ {conductorLabel}</p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* ── Vehículo ──────────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Vehículo
          </h3>

          <FormField
            control={form.control}
            name="vehiculoPlaca"
            render={() => (
              <FormItem>
                <FormLabel>Vehículo *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="🔍 Buscar por placa…"
                      value={vehiculoBusq.query || vehiculoLabel}
                      onChange={e => {
                        vehiculoBusq.setQuery(e.target.value);
                        setVehiculoLabel('');
                        setShowVehiculoList(true);
                      }}
                      onFocus={() => setShowVehiculoList(true)}
                      onBlur={() => setTimeout(() => setShowVehiculoList(false), 200)}
                    />
                    {showVehiculoList && (vehiculoBusq.results.length > 0 || vehiculoBusq.loading) && (
                      <ul className="absolute z-10 w-full mt-1 rounded-md border bg-background shadow-md text-sm max-h-48 overflow-y-auto">
                        {vehiculoBusq.loading && (
                          <li className="px-3 py-2 text-muted-foreground">Buscando…</li>
                        )}
                        {vehiculoBusq.results.map(v => (
                          <li
                            key={v.placa}
                            className="px-3 py-2 cursor-pointer hover:bg-muted"
                            onMouseDown={() => selectVehiculo(v)}
                          >
                            <span className="font-mono font-medium">{v.placa}</span>
                            {v.tipoVehiculo && (
                              <span className="ml-2 text-muted-foreground text-xs">
                                {v.tipoVehiculo}{v.configVehiculo ? ` · ${v.configVehiculo}` : ''}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </FormControl>
                {vehiculoLabel && (
                  <p className="text-xs text-green-700 mt-1">✅ {vehiculoLabel}</p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="placaRemolque"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remolque (opcional)</FormLabel>
                <FormControl><Input {...field} placeholder="SZX456" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* ── Ruta ──────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <section className="space-y-3">
            <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Origen
            </h3>
            <FormField
              control={form.control}
              name="origenMunicipio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Municipio *</FormLabel>
                  <FormControl><Input {...field} placeholder="Bogotá, D.C." /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="origenDane"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DANE *</FormLabel>
                  <FormControl><Input {...field} placeholder="11001" maxLength={9} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Destino
            </h3>
            <FormField
              control={form.control}
              name="destinoMunicipio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Municipio *</FormLabel>
                  <FormControl><Input {...field} placeholder="Medellín" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="destinoDane"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DANE *</FormLabel>
                  <FormControl><Input {...field} placeholder="05001" maxLength={9} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>
        </div>

        {/* ── Fletes ────────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Fletes
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="fletePactado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Flete pactado ($) *</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} placeholder="3500000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="valorAnticipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Anticipo ($)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="retencionIca"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Retención ICA (‰)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step={0.1} placeholder="4" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        {/* ── Fechas ────────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Fechas
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="fechaExpedicion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha expedición *</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fechaDespacho"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha despacho *</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        {/* ── Observaciones ─────────────────────────────────────────────────── */}
        <FormField
          control={form.control}
          name="observaciones"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observaciones (opcional)</FormLabel>
              <FormControl>
                <Textarea {...field} rows={2} maxLength={200} placeholder="Instrucciones especiales del viaje…" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Error RNDC ────────────────────────────────────────────────────── */}
        {rndcError && (
          <Alert variant="destructive">
            <AlertDescription>
              <p>{rndcError.message}</p>
              <p className="font-mono text-xs mt-1">ID log: {rndcError.syncRndcId}</p>
            </AlertDescription>
          </Alert>
        )}

        {/* ── Acciones ──────────────────────────────────────────────────────── */}
        <div className="flex justify-between pt-2">
          <Button type="button" variant="outline" onClick={onBack} disabled={submitting}>
            ← Anterior
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Enviando al RNDC…
              </>
            ) : (
              'Crear y enviar al RNDC →'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
