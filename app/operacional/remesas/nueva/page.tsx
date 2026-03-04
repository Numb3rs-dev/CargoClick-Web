import { RemesaForm } from '@/components/operacional/remesas/RemesaForm';
import { PageHeader } from '@/components/operacional/shared/PageHeader';

export const metadata = { title: 'Nueva Remesa | Operacional — CargoClick' };

/**
 * Página standalone para crear una remesa sin asociarla a un negocio.
 * Tras guardar, redirige al listado global de remesas.
 */
export default function RemesaNuevaPage() {
  return (
    <>
      <PageHeader
        breadcrumb="Operacional › Remesas › Nueva"
        title="Nueva Remesa"
        subtitle="Ingresa los datos de la carga para registrarla en el RNDC."
      />

      <div style={{ background: '#F8FAFC', minHeight: '100%' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
          <RemesaForm mode="crear" onSuccessRedirect="/operacional/remesas" />
        </div>
      </div>
    </>
  );
}
