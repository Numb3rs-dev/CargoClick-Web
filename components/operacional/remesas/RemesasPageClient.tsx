'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/operacional/shared/PageHeader';
import { RemesaList, type RemesaListItem } from './RemesaList';

interface Props {
  items:              RemesaListItem[];
  total:              number;
  page:               number;
  pageSize:           number;
  q:                  string;
  estadoRndc:         string;
  origenDane:         string;
  destinoDane:        string;
  anio:               string;
  mes:                string;
  aniosDisponibles:   number[];
}

export function RemesasPageClient({
  items, total, page, pageSize,
  q, estadoRndc, origenDane, destinoDane, anio, mes,
  aniosDisponibles,
}: Props) {
  const router = useRouter();

  return (
    <>
      {/* Page header strip */}
      <PageHeader
        breadcrumb="Operacional"
        title="Remesas"
        subtitle={`${total} remesa${total !== 1 ? 's' : ''} en total`}
        actionLabel="+ Remesa"
        onAction={() => router.push('/operacional/remesas/nueva')}
      />

      {/* Content */}
      <RemesaList
        items={items}
        total={total}
        page={page}
        pageSize={pageSize}
        q={q}
        estadoRndc={estadoRndc}
        origenDane={origenDane}
        destinoDane={destinoDane}
        anio={anio}
        mes={mes}
        aniosDisponibles={aniosDisponibles}
      />
    </>
  );
}
