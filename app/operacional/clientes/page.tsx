import { clienteRepository } from '@/lib/repositories/clienteRepository';
import { ClientesPageClient } from '@/components/operacional/clientes/ClientesPageClient';
import { serialize } from '@/lib/utils/serialize';

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}

export const metadata = { title: 'Clientes | CargoClick' };

export default async function ClientesPage({ searchParams }: PageProps) {
  const sp       = await searchParams;
  const q        = sp.q        ?? '';
  const page     = Math.max(1, Number(sp.page     ?? '1'));
  const pageSize = Math.min(50, Number(sp.pageSize ?? '30'));

  const { data: items, total } = await clienteRepository.findAll({ q, page, pageSize });

  return (
    <ClientesPageClient
      items={serialize(items)}
      total={total}
      page={page}
      pageSize={pageSize}
      q={q}
    />
  );
}
