import { notFound } from 'next/navigation';
import { clienteRepository } from '@/lib/repositories/clienteRepository';
import { serialize } from '@/lib/utils/serialize';
import { ClienteForm } from '@/components/operacional/clientes/ClienteForm';
import { PageHeader } from '@/components/operacional/shared/PageHeader';
import type { ClienteConSucursales } from '@/components/operacional/clientes/ClienteList';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const cliente = await clienteRepository.findById(id);
  return {
    title: cliente
      ? `Editar ${cliente.razonSocial} | Clientes — CargoClick`
      : 'Cliente no encontrado',
  };
}

/**
 * Página de edición de un Cliente.
 * Server Component — obtiene el cliente y pasa los datos al formulario en mode="editar".
 * Tras guardar, redirige al detalle del mismo cliente.
 */
export default async function ClienteEditarPage({ params }: Props) {
  const { id } = await params;
  const cliente = await clienteRepository.findById(id);
  if (!cliente) notFound();

  const data = serialize(cliente);

  return (
    <>
      <PageHeader
        breadcrumb={`Operacional › Clientes › ${data.razonSocial} › Editar`}
        title={`Editar — ${data.razonSocial}`}
        subtitle={`${data.tipoId === 'N' ? 'NIT' : data.tipoId === 'C' ? 'Cédula' : 'Pasaporte'} ${data.numeroId}`}
      />

      <div style={{ background: '#F8FAFC', minHeight: '100%' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
          <ClienteForm
            mode="editar"
            defaultValues={data as unknown as ClienteConSucursales}
            onSuccessRedirect={`/operacional/clientes/${id}`}
          />
        </div>
      </div>
    </>
  );
}
