'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/operacional/shared/PageHeader';
import { SlideOver } from '@/components/ui/SlideOver';
import { VehiculoList, type VehiculoWithRndc } from './VehiculoList';
import { VehiculoForm } from './VehiculoForm';

interface Props {
  items: VehiculoWithRndc[];
  total: number;
  page: number;
  pageSize: number;
  q?: string;
}

export function VehiculosPageClient({ items, total, page, pageSize, q }: Props) {
  const router          = useRouter();
  const [open, setOpen] = useState(false);

  function handleSuccess() {
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      {/* Page header strip */}
      <PageHeader
        breadcrumb="Operacional"
        title="Vehículos"
        subtitle={`${total} vehículo${total !== 1 ? 's' : ''} en el directorio`}
        actionLabel="+ Nuevo vehículo"
        onAction={() => setOpen(true)}
      />

      {/* Content */}
      <VehiculoList items={items} total={total} page={page} pageSize={pageSize} q={q} />

      {/* Slide-over */}
      <SlideOver open={open} onClose={() => setOpen(false)} title="Nuevo vehículo">
        <VehiculoForm mode="crear" onSuccess={handleSuccess} />
      </SlideOver>
    </>
  );
}
