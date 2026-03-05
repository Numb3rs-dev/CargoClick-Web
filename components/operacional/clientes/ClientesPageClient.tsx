'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/operacional/shared/PageHeader';
import { ClienteList, type ClienteConSucursales } from './ClienteList';

interface Props {
  items:    ClienteConSucursales[];
  total:    number;
  page:     number;
  pageSize: number;
  q:        string;
}

export function ClientesPageClient({ items, total, page, pageSize, q }: Props) {
  const router = useRouter();

  return (
    <>
      <PageHeader
        breadcrumb="Operacional"
        title="Directorio de clientes"
        subtitle={`${total} cliente${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}`}
        actionLabel="+ Nuevo cliente"
        onAction={() => router.push('/operacional/clientes/nueva')}
      />

      <ClienteList
        items={items}
        total={total}
        page={page}
        pageSize={pageSize}
        q={q}
      />
    </>
  );
}
