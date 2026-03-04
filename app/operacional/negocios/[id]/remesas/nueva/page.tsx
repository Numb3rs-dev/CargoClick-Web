import { RemesaForm } from '@/components/operacional/remesas/RemesaForm';
import { PageHeader } from '@/components/operacional/shared/PageHeader';

export const metadata = { title: 'Nueva Remesa | Operacional — CargoClick' };

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Página de creación de nueva remesa para un negocio.
 * Server Component — renderiza RemesaForm (Client Component) con el negocioId.
 *
 * Tras guardar, RemesaForm redirige al panel del negocio.
 * Para enviar la remesa al RNDC (procesoid 3) usar el botón desde el panel del negocio.
 */
export default async function NuevaRemesaPage({ params }: Props) {
  const { id: negocioId } = await params;

  return (
    <>
      <PageHeader
        breadcrumb={`Operacional › Negocios › ${negocioId} › Nueva remesa`}
        title="Nueva Remesa"
        subtitle="Ingresa los datos de la carga para registrarla en el RNDC. Los campos de tiempos logísticos son obligatorios desde noviembre 2025."
      />

      <div style={{ background: '#F8FAFC', minHeight: '100%' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
          <RemesaForm
            mode="crear"
            negocioId={negocioId}
            onSuccessRedirect={`/operacional/negocios/${negocioId}`}
          />
        </div>
      </div>
    </>
  );
}
