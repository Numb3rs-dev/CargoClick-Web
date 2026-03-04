'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/operacional/shared/PageHeader';
import { SlideOver } from '@/components/ui/SlideOver';
import { OrdenCargueList } from './OrdenCargueList';
import { OrdenCargueForm } from './OrdenCargueForm';
import type { OrdenCargueConRelaciones } from '@/lib/repositories/ordenCargueRepository';

interface Props {
  items:    OrdenCargueConRelaciones[];
  total:    number;
  page:     number;
  pageSize: number;
  q:        string;
  estado:   string;
}

export function OrdenesCarguePageClient({ items, total, page, pageSize, q, estado }: Props) {
  const router  = useRouter();
  const [open,    setOpen]    = useState(false);
  const [editing, setEditing] = useState<OrdenCargueConRelaciones | null>(null);

  function handleSuccess() {
    setOpen(false);
    setEditing(null);
    router.refresh();
  }

  function openEdit(o: OrdenCargueConRelaciones) {
    setEditing(o);
    setOpen(true);
  }

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  return (
    <>
      {/* Header strip */}
      <PageHeader
        breadcrumb="Operacional"
        title="Órdenes de cargue"
        subtitle={`${total} orden${total !== 1 ? 'es' : ''} registrada${total !== 1 ? 's' : ''}`}
        actionLabel="+ Nueva orden"
        onAction={openCreate}
      />

      {/* List */}
      <OrdenCargueList
        items={items}
        total={total}
        page={page}
        pageSize={pageSize}
        q={q}
        estado={estado}
        onEdit={openEdit}
      />

      {/* Slide-over */}
      <SlideOver
        open={open}
        onClose={() => { setOpen(false); setEditing(null); }}
        title={editing ? `Editar — ${editing.numeroOrden}` : 'Nueva orden de cargue'}
        size="md"
      >
        <OrdenCargueForm
          mode={editing ? 'editar' : 'crear'}
          defaultValues={editing ? {
            id:                    editing.id,
            nuevoNegocioId:        editing.nuevoNegocioId,
            nuevoNegocio:          editing.nuevoNegocio,
            vehiculoPlaca:         editing.vehiculoPlaca,
            conductorCedula:       editing.conductorCedula,
            conductor:             editing.conductor,
            fechaHoraCargue:       editing.fechaHoraCargue,
            puntoCargueDireccion:  editing.puntoCargueDireccion,
            puntoCargueMunicipio:  editing.puntoCargueMunicipio,
            puntoCargueDane:       editing.puntoCargueDane,
            notas:                 editing.notas,
          } : undefined}
          onSuccess={handleSuccess}
        />
      </SlideOver>
    </>
  );
}
