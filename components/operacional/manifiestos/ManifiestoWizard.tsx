'use client';

import { useState } from 'react';
import { ManifiestoStepRemesas, type RemesaItem } from './ManifiestoStepRemesas';
import { ManifiestoStepDatos } from './ManifiestoStepDatos';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ManifiestoWizardProps {
  /** ID del negocio. Opcional cuando se crea en modo standalone. */
  negocioId?: string | null;
  /** Remesas disponibles para seleccionar */
  remesasDisponibles: RemesaItem[];
  onClose: () => void;
  onSuccess: (manifiestoId: string) => void;
}

type WizardData = {
  remesasIds: string[];
};

/**
 * Wizard de 2 pasos para crear un ManifiestoOperativo.
 *
 * Paso 1: seleccionar remesas con estadoRndc=REGISTRADA
 * Paso 2: datos del viaje (conductor, vehículo, ruta, fletes, fechas)
 *
 * Al finalizar el paso 2, hace POST /api/manifiestos — que registra el manifiesto
 * en el RNDC (procesoid 4) en una sola llamada.
 *
 * Si el RNDC devuelve error (HTTP 502), muestra el mensaje con syncRndcId para debugging.
 */
export function ManifiestoWizard({
  negocioId,
  remesasDisponibles,
  onClose,
  onSuccess,
}: ManifiestoWizardProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [data, setData] = useState<WizardData>({ remesasIds: [] });
  const [submitting, setSubmitting] = useState(false);
  const [rndcError, setRndcError] = useState<{ message: string; syncRndcId: string } | null>(null);
  const [genericError, setGenericError] = useState<string | null>(null);

  function handleStepOneComplete(remesasIds: string[]) {
    setData({ remesasIds });
    setStep(2);
  }

  async function handleSubmit(formData: Record<string, unknown>) {
    setSubmitting(true);
    setRndcError(null);
    setGenericError(null);

    try {
      const res = await fetch('/api/manifiestos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          remesasIds: data.remesasIds,
          ...(negocioId && { nuevoNegocioId: negocioId }),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 502) {
          // Error RNDC — setear en ManifiestoStepDatos via rndcError prop
          setRndcError({ message: json.message, syncRndcId: json.syncRndcId });
          return;
        }
        throw new Error(json.message ?? 'Error al crear el manifiesto');
      }

      onSuccess(json.data.id);
    } catch (e) {
      setGenericError((e as Error).message);
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

      {genericError && (
        <Alert variant="destructive">
          <AlertDescription>{genericError}</AlertDescription>
        </Alert>
      )}

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
