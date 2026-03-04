'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/operacional/shared/PageHeader';
import { SlideOver } from '@/components/ui/SlideOver';
import { ConductorList, type ConductorWithRndc } from './ConductorList';
import { ConductorForm } from './ConductorForm';

interface Props {
  items: ConductorWithRndc[];
  total: number;
  page: number;
  pageSize: number;
  q?: string;
}

export function ConductoresPageClient({ items, total, page, pageSize, q }: Props) {
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
        title="Conductores"
        subtitle={`${total} conductor${total !== 1 ? 'es' : ''} en el directorio`}
        actionLabel="+ Nuevo conductor"
        onAction={() => setOpen(true)}
      />

      {/* Content */}
      <ConductorList items={items} total={total} page={page} pageSize={pageSize} q={q} />

      {/* Slide-over */}
      <SlideOver open={open} onClose={() => setOpen(false)} title="Nuevo conductor">
        <ConductorForm mode="crear" onSuccess={handleSuccess} />
      </SlideOver>
    </>
  );
}
