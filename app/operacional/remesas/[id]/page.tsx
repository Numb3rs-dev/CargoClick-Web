import { notFound } from 'next/navigation';
import { remesaRepository } from '@/lib/repositories/remesaRepository';
import { serialize } from '@/lib/utils/serialize';
import { RemesaForm } from '@/components/operacional/remesas/RemesaForm';
import { EnviarRndcButton } from '@/components/operacional/remesas/EnviarRndcButton';
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
      ? `${remesa.numeroRemesa} | Remesas — CargoClick`
      : 'Remesa no encontrada',
  };
}

/**
 * Página de detalle de una Remesa.
 * Server Component — obtiene la remesa por ID vía repositorio.
 * Usa RemesaForm en mode="ver" (campos deshabilitados, sin submit).
 */
export default async function RemesaDetallePage({ params }: Props) {
  const { id } = await params;
  const remesa = await remesaRepository.findById(id);
  if (!remesa) notFound();

  const s = serialize(remesa);

  const initialData: RemesaInitialData = {
    id: s.id,
    descripcionCarga: s.descripcionCarga ?? '',
    pesoKg: s.pesoKg ?? 0,
    codigoEmpaque: s.codigoEmpaque ?? 1,
    codNaturalezaCarga: s.codNaturalezaCarga ?? 'G',
    codOperacionTransporte: s.codOperacionTransporte ?? 'G',
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
    nombrePropietario: (s as Record<string, unknown>).nombrePropietario as string ?? null,
    mercanciaRemesaCod: s.mercanciaRemesaCod ? Number(s.mercanciaRemesaCod) : null,
    codigoUn: s.codigoUn ?? null,
    estadoMercancia: s.estadoMercancia ?? null,
    grupoEmbalajeEnvase: s.grupoEmbalajeEnvase ?? null,
    unidadMedidaProducto: s.unidadMedidaProducto ?? null,
    cantidadProducto: s.cantidadProducto ? Number(s.cantidadProducto) : null,
    pesoContenedorVacio: s.pesoContenedorVacio ? Number(s.pesoContenedorVacio) : null,
    tipoConsolidada: (s as Record<string, unknown>).tipoConsolidada as string ?? null,
    origenDane: s.origenDane ?? '',
    origenMunicipio: s.origenMunicipio ?? null,
    remDirRemitente: s.direccionRemitente ?? null,
    codigoAranceladoCarga: (s as Record<string, unknown>).codigoAranceladoCarga as string ?? null,
    destinoDane: s.destinoDane ?? '',
    destinoMunicipio: s.destinoMunicipio ?? null,
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
    /* Campos extra para ver */
    numeroRemesa: s.numeroRemesa ?? null,
    estado: s.estado ?? null,
    nuevoNegocioId: s.nuevoNegocioId ?? null,
    numeroRemesaRndc: s.numeroRemesaRndc ?? null,
    fechaIngresoRndc: s.fechaIngresoRndc ?? null,
    instruccionesEspeciales: s.instruccionesEspeciales ?? null,
    createdAt: s.createdAt ?? null,
    updatedAt: s.updatedAt ?? null,
  };

  return (
    <>
      <PageHeader
        breadcrumb="Operacional › Remesas"
        title={`Remesa ${s.numeroRemesa ?? ''}`}
        subtitle="Detalle completo de la remesa"
      />

      <div style={{ background: '#F8FAFC', minHeight: '100%' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
          <RemesaForm mode="ver" initialData={initialData} />
          {s.estadoRndc === 'PENDIENTE' && (
            <EnviarRndcButton
              remesaId={s.id}
              numeroRemesa={s.numeroRemesa ?? ''}
            />
          )}
        </div>
      </div>
    </>
  );
}
