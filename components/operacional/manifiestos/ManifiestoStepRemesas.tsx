'use client';

import { useState, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';

/** Subconjunto de campos de remesa que el Wizard necesita */
export interface RemesaItem {
  id: string;
  numeroRemesa: string;
  descripcionCarga: string;
  pesoKg: number;
  origenMunicipio: string;
  destinoMunicipio: string;
  estadoRndc: string;
  manifiestoOperativoId: string | null;
}

interface ManifiestoStepRemesasProps {
  remesas: RemesaItem[];
  /** IDs pre-seleccionados (para re-poblar el wizard en flujo corrección) */
  selected: string[];
  onNext: (ids: string[]) => void;
  onCancel: () => void;
}

/**
 * Paso 1 del wizard de creación de manifiesto.
 * Muestra las remesas REGISTRADAS en RNDC disponibles (sin manifiesto asignado).
 * Calcula el peso total en tiempo real al seleccionar / deseleccionar.
 */
export function ManifiestoStepRemesas({
  remesas,
  selected: initialSelected,
  onNext,
  onCancel,
}: ManifiestoStepRemesasProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));

  // Solo remesas registradas y sin manifiesto asignado
  const remesasDisponibles = remesas.filter(
    r => r.estadoRndc === 'REGISTRADA' && !r.manifiestoOperativoId
  );

  const pesoTotal = useMemo(() => {
    return remesasDisponibles
      .filter(r => selected.has(r.id))
      .reduce((sum, r) => sum + r.pesoKg, 0);
  }, [selected, remesasDisponibles]);

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground flex items-center flex-wrap gap-1">
        Solo las remesas con estado{' '}
        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-xs">
          ✅ Registrada RNDC
        </Badge>{' '}
        y sin manifiesto asignado pueden incluirse.
      </div>

      <div className="border rounded-lg divide-y max-h-80 overflow-y-auto">
        {remesasDisponibles.map(remesa => (
          <label
            key={remesa.id}
            className="flex items-start gap-4 p-4 cursor-pointer hover:bg-muted/50 select-none"
          >
            <Checkbox
              checked={selected.has(remesa.id)}
              onCheckedChange={() => toggle(remesa.id)}
              className="mt-1 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="font-mono text-sm font-medium">{remesa.numeroRemesa}</p>
              <p className="text-sm text-muted-foreground truncate">
                {remesa.pesoKg.toLocaleString('es-CO')} kg — {remesa.descripcionCarga}
              </p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
              {remesa.origenMunicipio} → {remesa.destinoMunicipio}
            </span>
          </label>
        ))}

        {remesasDisponibles.length === 0 && (
          <p className="p-6 text-center text-muted-foreground text-sm">
            No hay remesas registradas en el RNDC disponibles para este negocio.
            Primero envía las remesas al RNDC desde el panel del negocio.
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
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={() => onNext([...selected])}
          disabled={selected.size === 0}
        >
          Siguiente →
        </Button>
      </div>
    </div>
  );
}
