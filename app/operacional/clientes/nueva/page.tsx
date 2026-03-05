import { ClienteForm } from '@/components/operacional/clientes/ClienteForm';
import { PageHeader } from '@/components/operacional/shared/PageHeader';

export const metadata = { title: 'Nuevo Cliente | Operacional — CargoClick' };

/**
 * Página standalone para crear un cliente.
 * Tras guardar, el ClienteForm redirige al detalle: /operacional/clientes/[id]
 */
export default function ClienteNuevoPage() {
  return (
    <>
      <PageHeader
        breadcrumb="Operacional › Clientes › Nuevo"
        title="Nuevo Cliente"
        subtitle="Registra el cliente con sus sedes para habilitarlo en remesas y el RNDC."
      />

      <div style={{ background: '#F8FAFC', minHeight: '100%' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
          <ClienteForm
            mode="crear"
            onSuccessRedirect="/operacional/clientes"
          />
        </div>
      </div>
    </>
  );
}
