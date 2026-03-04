'use client';

import { useEffect } from 'react';
import { RemesaEnviarRndcBtn } from './RemesaEnviarRndcBtn';
import { RemesaEstadoBadge } from './RemesaEstadoBadge';

export interface RemesaDrawerData {
  id: string;
  numeroRemesa: string;
  descripcionCarga: string;
  pesoKg: number;
  estadoRndc: string;
  estado: string;
  origenMunicipio: string;
  destinoMunicipio: string;
  nitRemitente: string;
  nitDestinatario: string;
  numeroRemesaRndc?: string | null;
  createdAt: string | Date;
}

interface RemesaDrawerProps {
  remesa: RemesaDrawerData | null;
  onClose: () => void;
}

/**
 * Panel lateral deslizante (slide-in) con el detalle de una remesa.
 * Muestra estado RNDC, datos principales y el botón de envío al RNDC.
 *
 * Se abre al hacer clic en una remesa desde NegocioRemesasSection.
 * Se cierra con Escape o al hacer clic fuera del panel.
 */
export function RemesaDrawer({ remesa, onClose }: RemesaDrawerProps) {
  // Cerrar con Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const isOpen = remesa !== null;

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Panel lateral */}
      <div
        role="dialog"
        aria-label="Detalle de remesa"
        aria-modal="true"
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background shadow-xl transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {remesa && (
          <>
            {/* Encabezado */}
            <div className="flex items-start justify-between border-b px-6 py-4">
              <div>
                <h2 className="font-mono text-base font-semibold">{remesa.numeroRemesa}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{remesa.descripcionCarga}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-sm p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {/* Estado RNDC */}
              <section className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  Estado RNDC
                </p>
                <RemesaEstadoBadge estado={remesa.estadoRndc} />
                {remesa.numeroRemesaRndc && (
                  <p className="font-mono text-sm text-muted-foreground">
                    Nro. RNDC: {remesa.numeroRemesaRndc}
                  </p>
                )}
              </section>

              {/* Datos de la carga */}
              <section className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  Carga
                </p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Peso</dt>
                    <dd className="font-medium">{remesa.pesoKg.toLocaleString('es-CO')} kg</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Estado operativo</dt>
                    <dd className="font-medium">{remesa.estado}</dd>
                  </div>
                </dl>
              </section>

              {/* Ruta */}
              <section className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  Ruta
                </p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Origen</dt>
                    <dd className="font-medium">{remesa.origenMunicipio}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Destino</dt>
                    <dd className="font-medium">{remesa.destinoMunicipio}</dd>
                  </div>
                </dl>
              </section>

              {/* Partes */}
              <section className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  Partes
                </p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Remitente (NIT)</dt>
                    <dd className="font-mono font-medium">{remesa.nitRemitente}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Destinatario (NIT)</dt>
                    <dd className="font-mono font-medium">{remesa.nitDestinatario}</dd>
                  </div>
                </dl>
              </section>

              {/* Fecha creación */}
              <p className="text-xs text-muted-foreground">
                Creada{' '}
                {new Date(remesa.createdAt).toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            {/* Footer — Acción RNDC */}
            <div className="border-t px-6 py-4">
              <p className="text-xs text-muted-foreground mb-3">
                {remesa.estadoRndc === 'REGISTRADA'
                  ? 'Esta remesa está registrada en el RNDC y puede asignarse a un manifiesto.'
                  : 'Envía esta remesa al RNDC antes de poder incluirla en un manifiesto.'}
              </p>
              <RemesaEnviarRndcBtn
                remesaId={remesa.id}
                estadoRndc={remesa.estadoRndc}
                onSuccess={onClose}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}
