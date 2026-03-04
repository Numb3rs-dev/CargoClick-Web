import { notFound } from 'next/navigation';
import { remesaRepository } from '@/lib/repositories/remesaRepository';
import { serialize } from '@/lib/utils/serialize';
import { RemesaForm } from '@/components/operacional/remesas/RemesaForm';
import { PageHeader } from '@/components/operacional/shared/PageHeader';
import type { RemesaInitialData } from '@/components/operacional/remesas/RemesaForm';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const remesa = await remesaRepository.findById(id);
  return {
    title: remesa
      ? `Editar ${remesa.numeroRemesa} | Remesas — CargoClick`
      : 'Remesa no encontrada',
  };
}

/**
 * Página de edición de Remesa.
 * Server Component — obtiene la remesa y pasa initialData al RemesaForm.
 */
export default async function EditarRemesaPage({ params }: Props) {
  const { id } = await params;
  const remesa = await remesaRepository.findById(id);
  if (!remesa) notFound();

  const s = serialize(remesa);

  const initialData: RemesaInitialData = {
    id: s.id,
    descripcionCarga: s.descripcionCarga ?? '',
    pesoKg: s.pesoKg ?? 0,
    codigoEmpaque: s.codigoEmpaque ?? 0,
    codNaturalezaCarga: s.codNaturalezaCarga ?? 'G',
    codOperacionTransporte: s.codOperacionTransporte ?? 'G',
    codigoAranceladoCarga: (s as Record<string, unknown>).codigoAranceladoCarga as string ?? '009880',
    tipoIdRemitente: s.tipoIdRemitente ?? 'N',
    nitRemitente: s.nitRemitente ?? '',
    codSedeRemitente: s.codSedeRemitente ?? '',
    empresaRemitente: s.empresaRemitente ?? '',
    tipoIdDestinatario: s.tipoIdDestinatario ?? 'N',
    nitDestinatario: s.nitDestinatario ?? '',
    codSedeDestinatario: s.codSedeDestinatario ?? '',
    empresaDestinataria: s.empresaDestinataria ?? '',
    tipoIdPropietario: s.tipoIdPropietario ?? 'N',
    nitPropietario: s.nitPropietario ?? '',
    codSedePropietario: s.codSedePropietario ?? '1',
    mercanciaRemesaCod: s.mercanciaRemesaCod ? Number(s.mercanciaRemesaCod) : null,
    codigoUn: s.codigoUn ?? null,
    estadoMercancia: s.estadoMercancia ?? null,
    grupoEmbalajeEnvase: s.grupoEmbalajeEnvase ?? null,
    unidadMedidaProducto: s.unidadMedidaProducto ?? null,
    cantidadProducto: s.cantidadProducto ? Number(s.cantidadProducto) : null,
    pesoContenedorVacio: s.pesoContenedorVacio ? Number(s.pesoContenedorVacio) : null,
    tipoConsolidada: (s as Record<string, unknown>).tipoConsolidada as string ?? null,
    origenDane: s.origenDane ?? '',
    remDirRemitente: s.direccionRemitente ?? null,
    destinoDane: s.destinoDane ?? '',
    fechaHoraCitaCargue: s.fechaHoraCitaCargue ?? null,
    fechaHoraCitaDescargue: s.fechaHoraCitaDescargue ?? null,
    horasPactoCarga: s.horasPactoCarga ?? 0,
    minutosPactoCarga: s.minutosPactoCarga ?? 0,
    horasPactoDescargue: s.horasPactoDescargue ?? 0,
    minutosPactoDescargue: s.minutosPactoDescargue ?? 0,
    valorAsegurado: s.valorAsegurado ? Number(s.valorAsegurado) : null,
    ordenServicioGenerador: s.ordenServicioGenerador ?? '',
    numPolizaTransporte: (s as Record<string, unknown>).numPolizaTransporte as string ?? null,
    fechaVencimientoPoliza: (s as Record<string, unknown>).fechaVencimientoPoliza as string ?? null,
    companiaSeguriNit: s.companiaSeguriNit ?? null,
    companiaSeguriNombre: s.companiaSeguriNombre ?? null,
    duenopoliza: s.duenopoliza ?? null,
    estadoRndc: s.estadoRndc ?? 'PENDIENTE',
  };

  const rndcBadge = s.estadoRndc && s.estadoRndc !== 'PENDIENTE'
    ? ` — RNDC: ${s.estadoRndc}`
    : '';

  return (
    <>
      <PageHeader
        breadcrumb={`Operacional › Remesas › ${s.numeroRemesa ?? id} › Editar`}
        title="Editar Remesa"
        subtitle={`${s.numeroRemesa ?? ''}${rndcBadge}`}
      />

      <div style={{ background: '#F8FAFC', minHeight: '100%' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
          <RemesaForm
            mode="editar"
            initialData={initialData}
            onSuccessRedirect={`/operacional/remesas/${id}`}
          />
        </div>
      </div>
    </>
  );
}
