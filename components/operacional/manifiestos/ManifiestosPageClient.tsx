'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/operacional/shared/PageHeader';
import { SlideOver } from '@/components/ui/SlideOver';
import { ManifiestoList, type ManifiestoListItem } from './ManifiestoList';
import { ManifiestoWizard } from './ManifiestoWizard';
import type { RemesaItem } from './ManifiestoStepRemesas';

interface Props {
  items:                ManifiestoListItem[];
  total:                number;
  page:                 number;
  pageSize:             number;
  q:                    string;
  estadoManifiesto:     string;
  origenDane:           string;
  destinoDane:          string;
  anio:                 string;
  mes:                  string;
  aniosDisponibles:     number[];
  /** Remesas con estadoRndc=REGISTRADA disponibles para asignar */
  remesasDisponibles:   RemesaItem[];
}

export function ManifiestosPageClient({
  items,
  total,
  page,
  pageSize,
  q,
  estadoManifiesto,
  origenDane,
  destinoDane,
  anio,
  mes,
  aniosDisponibles,
  remesasDisponibles,
}: Props) {
  const router          = useRouter();
  const [open, setOpen] = useState(false);

  function handleSuccess(_manifiestoId: string) {
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      {/* Page header strip */}
      <PageHeader
        breadcrumb="Operacional"
        title="Manifiestos"
        subtitle={`${total} manifiesto${total !== 1 ? 's' : ''} en total`}
        actionLabel="+ Manifiesto"
        onAction={() => setOpen(true)}
      />

      {/* Content */}
      <ManifiestoList
        items={items}
        total={total}
        page={page}
        pageSize={pageSize}
        q={q}
        estadoManifiesto={estadoManifiesto}
        origenDane={origenDane}
        destinoDane={destinoDane}
        anio={anio}
        mes={mes}
        aniosDisponibles={aniosDisponibles}
      />

      {/* Slide-over (lg — wizard has 2 steps) */}
      <SlideOver open={open} onClose={() => setOpen(false)} title="Nuevo manifiesto" size="lg">
        <ManifiestoWizard
          remesasDisponibles={remesasDisponibles}
          onClose={() => setOpen(false)}
          onSuccess={handleSuccess}
        />
      </SlideOver>
    </>
  );
}
