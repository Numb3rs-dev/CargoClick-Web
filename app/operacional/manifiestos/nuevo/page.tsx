import Link from 'next/link';
import { manifiestoOperativoRepository } from '@/lib/repositories/manifiestoOperativoRepository';
import { ManifiestoNuevoStandaloneClient } from './ManifiestoNuevoStandaloneClient';
import type { RemesaItem } from '@/components/operacional/manifiestos/ManifiestoStepRemesas';

export const metadata = { title: 'Nuevo Manifiesto | Operacional — CargoClick' };

/**
 * Página standalone para crear un ManifiestoOperativo sin negocio.
 * Server Component — obtiene todas las remesas disponibles (REGISTRADA, sin manifiesto).
 */
export default async function ManifiestoNuevoPage() {
  const remesasRaw = await manifiestoOperativoRepository.findRemesasDisponibles();

  const remesasDisponibles: RemesaItem[] = remesasRaw.map(r => ({
    id:                    r.id,
    numeroRemesa:          r.numeroRemesa,
    descripcionCarga:      r.descripcionCarga,
    pesoKg:                r.pesoKg,
    origenMunicipio:       r.origenMunicipio,
    destinoMunicipio:      r.destinoMunicipio,
    estadoRndc:            r.estadoRndc,
    manifiestoOperativoId: r.manifiestoOperativoId,
  }));

  return (
    <>
      {/* Page header strip */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '28px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          {/* Breadcrumb */}
          <nav style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link href="/operacional/manifiestos" style={{ color: '#6B7280', textDecoration: 'none' }}>
              Manifiestos
            </Link>
            <span>›</span>
            <span>Nuevo</span>
          </nav>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>Nuevo Manifiesto</h1>
          {remesasDisponibles.length === 0 && (
            <p style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>
              No hay remesas disponibles. Primero debes{' '}
              <Link href="/operacional/remesas/nueva" style={{ color: '#1D4ED8' }}>
                crear y registrar una remesa en el RNDC
              </Link>
              .
            </p>
          )}
        </div>
      </div>

      {/* Wizard */}
      <div style={{ background: '#F8FAFC', minHeight: '100%' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
          <ManifiestoNuevoStandaloneClient remesasDisponibles={remesasDisponibles} />
        </div>
      </div>
    </>
  );
}
