'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/operacional/shared/PageHeader';
import { Btn } from '@/components/operacional/shared/Btn';
import { SlideOver } from '@/components/ui/SlideOver';
import { NegocioList } from './NegocioList';
import { NegocioKanban } from './NegocioKanban';
import { NegocioVistaToggle } from './NegocioVistaToggle';
import { NuevoNegocioSelector } from './NuevoNegocioSelector';
import type { NuevoNegocio } from '@prisma/client';

interface Props {
  // Tabla
  items: NuevoNegocio[];
  total: number;
  page: number;
  pageSize: number;
  q: string;
  estado: string;
  // Kanban
  vista: 'tabla' | 'kanban';
}

export function NegociosPageClient({ items, total, page, pageSize, q, estado, vista }: Props) {
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
        title="Negocios"
        subtitle={vista === 'tabla' ? `${total} negocio${total !== 1 ? 's' : ''} en total` : undefined}
        rightContent={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <NegocioVistaToggle />
            <Btn variant="primary" onClick={() => setOpen(true)}>+ Negocio</Btn>
          </div>
        }
      />

      {/* Content */}
      {vista === 'kanban'
        ? <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}><NegocioKanban items={items} /></div>
        : <NegocioList items={items} total={total} page={page} pageSize={pageSize} q={q} estado={estado} />
      }

      {/* Slide-over */}
      <SlideOver open={open} onClose={() => setOpen(false)} title="Nuevo negocio">
        <NuevoNegocioSelector onSuccess={handleSuccess} />
      </SlideOver>
    </>
  );
}
