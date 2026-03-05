import { notFound } from 'next/navigation';
import Link from 'next/link';
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
      ? `${cliente.razonSocial} | Clientes — CargoClick`
      : 'Cliente no encontrado',
  };
}

/**
 * Página de detalle (lectura) de un Cliente.
 * Server Component — obtiene el cliente por ID y renderiza el formulario en mode="ver".
 */
export default async function ClienteDetallePage({ params }: Props) {
  const { id } = await params;
  const cliente = await clienteRepository.findById(id);
  if (!cliente) notFound();

  const data = serialize(cliente);

  return (
    <>
      <PageHeader
        breadcrumb={`Operacional › Clientes › ${data.razonSocial}`}
        title={data.razonSocial}
        subtitle={`${data.tipoId === 'N' ? 'NIT' : data.tipoId === 'C' ? 'Cédula' : 'Pasaporte'} ${data.numeroId} · ${data.sucursales.length} sede${data.sucursales.length !== 1 ? 's' : ''}`}
        rightContent={
          <div style={{ display: 'flex', gap: 10 }}>
            <Link
              href="/operacional/clientes"
              style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '9px 20px', fontSize: 14, fontWeight: 500,
                borderRadius: 9, border: '1.5px solid #E2E8F0',
                background: '#F8FAFC', color: '#374151',
                textDecoration: 'none',
              }}
            >
              ← Volver
            </Link>
            <Link
              href={`/operacional/clientes/${id}/editar`}
              style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '9px 22px', fontSize: 14, fontWeight: 600,
                borderRadius: 9, border: 'none', textDecoration: 'none',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#FFFFFF', boxShadow: '0 2px 6px rgba(5,150,105,0.25)',
              }}
            >
              ✏️ Editar
            </Link>
          </div>
        }
      />

      <div style={{ background: '#F8FAFC', minHeight: '100%' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
          <ClienteForm
            mode="ver"
            defaultValues={data as unknown as ClienteConSucursales}
          />
        </div>
      </div>
    </>
  );
}
