'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/operacional/shared/PageHeader';
import { SlideOver } from '@/components/ui/SlideOver';
import { ClienteList, type ClienteConSucursales } from './ClienteList';
import { ClienteForm } from './ClienteForm';

interface Props {
  items:    ClienteConSucursales[];
  total:    number;
  page:     number;
  pageSize: number;
  q:        string;
}

export function ClientesPageClient({ items, total, page, pageSize, q }: Props) {
  const router  = useRouter();
  const [open,         setOpen]         = useState(false);
  const [editing,      setEditing]      = useState<ClienteConSucursales | null>(null);

  function handleSuccess() {
    setOpen(false);
    setEditing(null);
    router.refresh();
  }

  function openEdit(c: ClienteConSucursales) {
    setEditing(c);
    setOpen(true);
  }

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  return (
    <>
      {/* Page header strip */}
      <PageHeader
        breadcrumb="Operacional"
        title="Directorio de clientes"
        subtitle={`${total} cliente${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}`}
        actionLabel="+ Nuevo cliente"
        onAction={openCreate}
      />

      {/* List */}
      <ClienteList
        items={items}
        total={total}
        page={page}
        pageSize={pageSize}
        q={q}
        onEdit={openEdit}
      />

      {/* Slide-over */}
      <SlideOver
        open={open}
        onClose={() => { setOpen(false); setEditing(null); }}
        title={editing ? `Editar — ${editing.razonSocial}` : 'Nuevo cliente'}
        size="md"
      >
        <ClienteForm
          mode={editing ? 'editar' : 'crear'}
          defaultValues={editing ?? undefined}
          onSuccess={handleSuccess}
        />
      </SlideOver>
    </>
  );
}
