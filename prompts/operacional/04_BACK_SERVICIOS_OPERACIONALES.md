# BACK-04: Servicios de Negocio — Módulo Operacional

## CONTEXTO DE NEGOCIO

**Problema:** Necesitamos la lógica de negocio que orquesta los repositorios (BACK-02) y el cliente RNDC (BACK-03). Aquí viven las reglas: qué validaciones ejecutar antes de enviar, qué estados actualizar, cómo coordinar anulación + recreación de manifiestos.

**Prerequisito:** BACK-01, BACK-02 y BACK-03 ejecutados.

**Valor:** Los endpoint handlers (BACK-05) serán thin controllers — solo delegan a estos servicios.

---

## ESTRUCTURA DE ARCHIVOS

```
lib/services/
├── conductorService.ts
├── vehiculoService.ts
├── nuevoNegocioService.ts
├── remesaService.ts
└── manifiestoService.ts
```

---

## `lib/services/conductorService.ts`

```typescript
/**
 * Servicio de Conductores
 * Orquesta directorio local + sync al RNDC
 */
import { conductorRepository } from '@/lib/repositories/conductorRepository';
import { llamarRndc } from './rndcClient';
import { buildXmlConductor } from './rndcXmlBuilder';
import type { Prisma, CategoriaLicencia } from '@prisma/client';

export interface CrearConductorInput {
  cedula: string;
  nombres: string;
  apellidos: string;
  categoriaLicencia: CategoriaLicencia;
  licenciaVigencia?: string;  // ISO date "YYYY-MM-DD"
  telefono?: string;
  email?: string;
  notas?: string;
}

export class ConductorService {
  /**
   * Crea un conductor en el directorio local.
   * NO sincroniza al RNDC todavía — eso es una acción separada.
   */
  async crear(input: CrearConductorInput) {
    const existente = await conductorRepository.findByCedula(input.cedula);
    if (existente) {
      throw new Error(`Ya existe un conductor con cédula ${input.cedula}`);
    }
    return conductorRepository.create({
      ...input,
      licenciaVigencia: input.licenciaVigencia
        ? new Date(input.licenciaVigencia)
        : undefined,
    });
  }

  async actualizar(cedula: string, data: Partial<CrearConductorInput>) {
    const conductor = await conductorRepository.findByCedula(cedula);
    if (!conductor) throw new Error(`Conductor ${cedula} no encontrado`);
    return conductorRepository.update(cedula, {
      ...data,
      licenciaVigencia: data.licenciaVigencia
        ? new Date(data.licenciaVigencia)
        : undefined,
    });
  }

  /**
   * Registra o actualiza el conductor en el RNDC (procesoid 11).
   * Guarda el resultado en SyncRndc.
   * Retorna el resultado de la llamada RNDC.
   */
  async syncRndc(cedula: string) {
    const conductor = await conductorRepository.findByCedula(cedula);
    if (!conductor) throw new Error(`Conductor ${cedula} no encontrado`);

    const xml = buildXmlConductor({
      cedula: conductor.cedula,
      nombres: conductor.nombres,
      apellidos: conductor.apellidos,
      categoriaLicencia: conductor.categoriaLicencia,
    });

    return llamarRndc(xml, {
      processId: 11,
      tipoSolicitud: 1,
      entidadTipo: 'Conductor',
      entidadId: conductor.id,
    });
  }
}

export const conductorService = new ConductorService();
```

---

## `lib/services/nuevoNegocioService.ts`

```typescript
import { nuevoNegocioRepository } from '@/lib/repositories/nuevoNegocioRepository';
import { generarConsecutivo } from '@/lib/utils/consecutivos';
import { prisma } from '@/lib/db/client';

export interface CrearNegocioInput {
  // Ruta A — desde wizard
  solicitudId?: string;
  cotizacionId?: string;
  ajusteComercialId?: string;
  // Ruta B — negocio directo
  clienteNombre?: string;
  clienteNit?: string;
  // Común
  fechaDespachoEstimada?: string;
  notas?: string;
}

export class NuevoNegocioService {
  async crear(input: CrearNegocioInput) {
    // Validar que tenga al menos una forma de identificar el cliente
    if (!input.solicitudId && !input.clienteNombre) {
      throw new Error(
        'Se requiere solicitudId (Ruta A) o clienteNombre/clienteNit (Ruta B)'
      );
    }

    return prisma.$transaction(async (tx) => {
      const codigoNegocio = await generarConsecutivo(tx as any, 'nuevoNegocio', 'NEG');
      return (tx as any).nuevoNegocio.create({
        data: {
          codigoNegocio,
          solicitudId: input.solicitudId,
          cotizacionId: input.cotizacionId,
          ajusteComercialId: input.ajusteComercialId,
          clienteNombre: input.clienteNombre,
          clienteNit: input.clienteNit,
          fechaDespachoEstimada: input.fechaDespachoEstimada
            ? new Date(input.fechaDespachoEstimada)
            : undefined,
          notas: input.notas,
        },
      });
    });
  }

  async cancelar(id: string) {
    const negocio = await nuevoNegocioRepository.findById(id);
    if (!negocio) throw new Error(`Negocio ${id} no encontrado`);

    // Verificar que no tiene manifiestos REGISTRADOS o superiores
    const manifiestoActivo = negocio.manifiestos.some(
      (m) => !['BORRADOR', 'ENVIADO', 'ANULADO'].includes(m.estadoManifiesto)
    );
    if (manifiestoActivo) {
      throw new Error(
        'No se puede cancelar un negocio con manifiestos activos en el RNDC'
      );
    }

    return nuevoNegocioRepository.update(id, { estado: 'CANCELADO' });
  }
}

export const nuevoNegocioService = new NuevoNegocioService();
```

---

## `lib/services/remesaService.ts`

```typescript
import { remesaRepository } from '@/lib/repositories/remesaRepository';
import { llamarRndc } from './rndcClient';
import { buildXmlRemesa, buildXmlCumplirRemesa } from './rndcXmlBuilder';
import { generarConsecutivo } from '@/lib/utils/consecutivos';
import { prisma } from '@/lib/db/client';

export class RemesaService {
  async crear(nuevoNegocioId: string, data: Record<string, unknown>) {
    // Validar campos RNDC obligatorios antes de crear
    if (!data.fechaHoraCitaCargue || !data.fechaHoraCitaDescargue) {
      throw new Error(
        'fechaHoraCitaCargue y fechaHoraCitaDescargue son obligatorios (RNDC desde nov 2025)'
      );
    }

    return prisma.$transaction(async (tx) => {
      const numeroRemesa = await generarConsecutivo(tx as any, 'remesa', 'REM');
      return (tx as any).remesa.create({
        data: {
          ...data,
          numeroRemesa,
          nuevoNegocioId,
          fechaHoraCitaCargue: new Date(data.fechaHoraCitaCargue as string),
          fechaHoraCitaDescargue: new Date(data.fechaHoraCitaDescargue as string),
        },
      });
    });
  }

  /**
   * Envía la remesa al RNDC (procesoid 3).
   * 
   * Precondición: remesa existe y estadoRndc = PENDIENTE (o ENVIADA con error previo)
   * 
   * Si la llamada es exitosa:
   *   - estadoRndc → REGISTRADA
   *   - numeroRemesaRndc → ingresoid del RNDC
   * 
   * Si falla:
   *   - estadoRndc → PENDIENTE (reintentable)
   *   - El error queda en SyncRndc
   */
  async enviarRndc(remesaId: string) {
    const remesa = await remesaRepository.findById(remesaId);
    if (!remesa) throw new Error(`Remesa ${remesaId} no encontrada`);

    if (remesa.estadoRndc === 'REGISTRADA') {
      return { ya_registrada: true, numeroRemesaRndc: remesa.numeroRemesaRndc };
    }

    if (!remesa.fechaHoraCitaCargue || !remesa.fechaHoraCitaDescargue) {
      throw new Error(
        'La remesa no tiene fechas de cita de cargue/descargue — requeridas por el RNDC desde nov 2025'
      );
    }

    // Marcar como ENVIADA antes del SOAP (para no reenviar si hay timeout)
    await remesaRepository.actualizarEstadoRndc(remesaId, 'ENVIADA');

    const xml = buildXmlRemesa({
      ...remesa,
      consecutivo: remesa.numeroRemesa,
    });

    const resultado = await llamarRndc(xml, {
      processId: 3,
      tipoSolicitud: 1,
      entidadTipo: 'Remesa',
      entidadId: remesaId,
    });

    if (resultado.exitoso && resultado.ingresoid) {
      await remesaRepository.actualizarEstadoRndc(
        remesaId,
        'REGISTRADA',
        resultado.ingresoid,
        { responseXml: resultado.responseXml }
      );
    } else {
      // Volver a PENDIENTE para permitir reintento
      await remesaRepository.actualizarEstadoRndc(remesaId, 'PENDIENTE');
    }

    return resultado;
  }

  async cumplir(remesaId: string) {
    const remesa = await remesaRepository.findById(remesaId);
    if (!remesa) throw new Error(`Remesa ${remesaId} no encontrada`);
    if (remesa.estadoRndc !== 'REGISTRADA') {
      throw new Error('Solo se pueden cumplir remesas con estadoRndc=REGISTRADA');
    }

    const xml = buildXmlCumplirRemesa(remesa.numeroRemesaRndc!);
    const resultado = await llamarRndc(xml, {
      processId: 5,
      tipoSolicitud: 1,
      entidadTipo: 'Remesa',
      entidadId: remesaId,
    });

    if (resultado.exitoso) {
      await remesaRepository.update(remesaId, { estado: 'ENTREGADA' });
    }

    return resultado;
  }
}

export const remesaService = new RemesaService();
```

---

## `lib/services/manifiestoService.ts`

```typescript
import { manifiestoOperativoRepository } from '@/lib/repositories/manifiestoOperativoRepository';
import { remesaRepository } from '@/lib/repositories/remesaRepository';
import { conductorRepository } from '@/lib/repositories/conductorRepository';
import { vehiculoRepository } from '@/lib/repositories/vehiculoRepository';
import { llamarRndc } from './rndcClient';
import {
  buildXmlManifiesto,
  buildXmlAnularManifiesto,
  buildXmlCumplirManifiesto,
} from './rndcXmlBuilder';
import { generarConsecutivo } from '@/lib/utils/consecutivos';
import { prisma } from '@/lib/db/client';

export interface CrearManifiestoInput {
  nuevoNegocioId: string;
  conductorCedula: string;
  vehiculoPlaca: string;
  placaRemolque?: string;
  remesasIds: string[];
  origenMunicipio: string;
  origenDane: string;
  destinoMunicipio: string;
  destinoDane: string;
  fletePactado: number;
  valorAnticipo?: number;
  retencionIca?: number;
  fechaExpedicion: string;
  fechaDespacho: string;
  observaciones?: string;
}

export class ManifiestoService {
  /**
   * Crea el manifiesto + lo envía al RNDC en una sola operación.
   * 
   * Precondiciones (todas validadas aquí):
   * 1. Conductor existe y tiene sync RNDC previo exitoso
   * 2. Vehículo existe y tiene sync RNDC previo exitoso
   * 3. Todas las remesas tienen estadoRndc = REGISTRADA
   * 4. Todas las remesas pertenecen al mismo nuevoNegocioId
   * 5. Ninguna remesa está ya asignada a otro manifiesto
   */
  async crear(input: CrearManifiestoInput) {
    // Validar conductor
    const conductor = await conductorRepository.findByCedula(input.conductorCedula);
    if (!conductor) throw new Error(`Conductor ${input.conductorCedula} no existe en el directorio`);

    // Validar vehículo
    const vehiculo = await vehiculoRepository.findByPlaca(input.vehiculoPlaca);
    if (!vehiculo) throw new Error(`Vehículo ${input.vehiculoPlaca} no existe en el directorio`);

    // Validar remesas
    const { validas, errores } = await remesaRepository.validarParaManifiesto(
      input.remesasIds,
      input.nuevoNegocioId
    );
    if (!validas) throw new Error(errores.join('; '));

    // Cargar remesas completas para el XML
    const remesas = await prisma.remesa.findMany({
      where: { id: { in: input.remesasIds } },
    });

    // Calcular peso total
    const pesoTotalKg = remesas.reduce((sum, r) => sum + r.pesoKg, 0);

    // Crear registro en DB
    const manifiesto = await prisma.$transaction(async (tx) => {
      const codigoInterno = await generarConsecutivo(
        tx as any,
        'manifiestoOperativo',
        'MF'
      );
      const m = await (tx as any).manifiestoOperativo.create({
        data: {
          codigoInterno,
          nuevoNegocioId: input.nuevoNegocioId,
          conductorCedula: input.conductorCedula,
          vehiculoPlaca: input.vehiculoPlaca,
          placaRemolque: input.placaRemolque,
          origenMunicipio: input.origenMunicipio,
          origenDane: input.origenDane,
          destinoMunicipio: input.destinoMunicipio,
          destinoDane: input.destinoDane,
          pesoTotalKg,
          fletePactado: input.fletePactado,
          valorAnticipo: input.valorAnticipo ?? 0,
          retencionIca: input.retencionIca ?? 4,
          fechaExpedicion: new Date(input.fechaExpedicion),
          fechaDespacho: new Date(input.fechaDespacho),
          observaciones: input.observaciones,
          estadoManifiesto: 'BORRADOR',
        },
      });
      // Asignar remesas al manifiesto
      await (tx as any).remesa.updateMany({
        where: { id: { in: input.remesasIds } },
        data: { manifiestoOperativoId: m.id, estado: 'ASIGNADA' },
      });
      return m;
    });

    // Enviar al RNDC
    return this.enviarRndc(manifiesto.id);
  }

  async enviarRndc(manifiestoId: string) {
    const manifiesto = await manifiestoOperativoRepository.findById(manifiestoId);
    if (!manifiesto) throw new Error(`Manifiesto ${manifiestoId} no encontrado`);

    if (manifiesto.estadoManifiesto === 'REGISTRADO') {
      return { ya_registrado: true, numeroManifiesto: manifiesto.numeroManifiesto };
    }

    // Marcar como ENVIADO antes del SOAP
    await manifiestoOperativoRepository.actualizarEstado(manifiestoId, 'ENVIADO');

    const remesasConNumero = manifiesto.remesas.filter((r: any) => r.numeroRemesaRndc);
    const xml = buildXmlManifiesto(
      manifiesto as any,
      remesasConNumero.map((r: any) => ({
        numeroRemesaRndc: r.numeroRemesaRndc!,
        pesoKg: r.pesoKg,
      }))
    );

    const resultado = await llamarRndc(xml, {
      processId: 4,
      tipoSolicitud: 1,
      entidadTipo: 'ManifiestoOperativo',
      entidadId: manifiestoId,
    });

    if (resultado.exitoso && resultado.ingresoid) {
      await manifiestoOperativoRepository.actualizarEstado(manifiestoId, 'REGISTRADO', {
        numeroManifiesto: resultado.ingresoid,
      });
    } else {
      // Volver a BORRADOR — reintentable
      await manifiestoOperativoRepository.actualizarEstado(manifiestoId, 'BORRADOR');
    }

    return resultado;
  }

  async anular(manifiestoId: string, motivoAnulacion: string) {
    const manifiesto = await manifiestoOperativoRepository.findById(manifiestoId);
    if (!manifiesto) throw new Error('Manifiesto no encontrado');
    if (manifiesto.estadoManifiesto !== 'REGISTRADO') {
      throw new Error('Solo se pueden anular manifiestos en estado REGISTRADO');
    }
    if (!manifiesto.numeroManifiesto) {
      throw new Error('El manifiesto no tiene número RNDC asignado');
    }

    const xml = buildXmlAnularManifiesto(manifiesto.numeroManifiesto, motivoAnulacion);
    const resultado = await llamarRndc(xml, {
      processId: 32,
      tipoSolicitud: 1,
      entidadTipo: 'ManifiestoOperativo',
      entidadId: manifiestoId,
    });

    if (resultado.exitoso) {
      await manifiestoOperativoRepository.actualizarEstado(manifiestoId, 'ANULADO');
      await prisma.manifiestoOperativo.update({
        where: { id: manifiestoId },
        data: { motivoAnulacion },
      });
      // Liberar las remesas para reasignación
      await prisma.remesa.updateMany({
        where: { manifiestoOperativoId: manifiestoId },
        data: { manifiestoOperativoId: null, estado: 'PENDIENTE' },
      });
    }

    return resultado;
  }

  /**
   * Flow completo de corrección:
   * 1. Anula el manifiesto original (procesoid 32)
   * 2. Crea uno nuevo con los datos corregidos (procesoid 4)
   * 
   * El nuevo manifiesto tiene reemplazaManifiestoId = original para trazabilidad.
   */
  async corregir(
    manifiestoOriginalId: string,
    motivoAnulacion: string,
    datosCorregidos: Partial<CrearManifiestoInput>
  ) {
    const original = await manifiestoOperativoRepository.findById(manifiestoOriginalId);
    if (!original) throw new Error('Manifiesto original no encontrado');

    // Paso 1: Anular el original
    const anulacion = await this.anular(manifiestoOriginalId, motivoAnulacion);
    if (!anulacion.exitoso) {
      throw new Error(`No se pudo anular el manifiesto original: ${anulacion.errorMensaje}`);
    }

    // Paso 2: Crear el nuevo con los datos originales + correcciones
    const remesasOriginales = (original.remesas as any[]).map((r: any) => r.id);
    const nuevosInput: CrearManifiestoInput = {
      nuevoNegocioId: original.nuevoNegocioId,
      conductorCedula: datosCorregidos.conductorCedula ?? original.conductorCedula,
      vehiculoPlaca: datosCorregidos.vehiculoPlaca ?? original.vehiculoPlaca,
      placaRemolque: datosCorregidos.placaRemolque ?? original.placaRemolque ?? undefined,
      remesasIds: datosCorregidos.remesasIds ?? remesasOriginales,
      origenMunicipio: datosCorregidos.origenMunicipio ?? original.origenMunicipio,
      origenDane: datosCorregidos.origenDane ?? original.origenDane,
      destinoMunicipio: datosCorregidos.destinoMunicipio ?? original.destinoMunicipio,
      destinoDane: datosCorregidos.destinoDane ?? original.destinoDane,
      fletePactado: datosCorregidos.fletePactado ?? Number(original.fletePactado),
      valorAnticipo: datosCorregidos.valorAnticipo ?? Number(original.valorAnticipo),
      retencionIca: datosCorregidos.retencionIca ?? original.retencionIca,
      fechaExpedicion:
        datosCorregidos.fechaExpedicion ??
        original.fechaExpedicion.toISOString().split('T')[0],
      fechaDespacho:
        datosCorregidos.fechaDespacho ??
        original.fechaDespacho.toISOString().split('T')[0],
      observaciones: datosCorregidos.observaciones ?? original.observaciones ?? undefined,
    };

    const nuevoManifiesto = await this.crear(nuevosInput);

    // Marcar la relación de corrección
    await prisma.manifiestoOperativo.updateMany({
      where: {
        codigoInterno: {
          // El más reciente creado en crear()
          // Esto asume que crear() devuelve el resultado de enviarRndc que tiene el id
        },
      },
      data: { reemplazaManifiestoId: manifiestoOriginalId },
    });

    return {
      manifiestoAnuladoId: manifiestoOriginalId,
      nuevoManifiesto,
    };
  }

  async cumplir(manifiestoId: string) {
    const manifiesto = await manifiestoOperativoRepository.findById(manifiestoId);
    if (!manifiesto) throw new Error('Manifiesto no encontrado');
    if (manifiesto.estadoManifiesto !== 'REGISTRADO') {
      throw new Error('Solo se pueden cumplir manifiestos REGISTRADOS');
    }

    const xml = buildXmlCumplirManifiesto(manifiesto.numeroManifiesto!);
    const resultado = await llamarRndc(xml, {
      processId: 6,
      tipoSolicitud: 1,
      entidadTipo: 'ManifiestoOperativo',
      entidadId: manifiestoId,
    });

    if (resultado.exitoso) {
      await manifiestoOperativoRepository.actualizarEstado(manifiestoId, 'CULMINADO');
      await prisma.nuevoNegocio.update({
        where: { id: manifiesto.nuevoNegocioId },
        data: { estado: 'COMPLETADO' },
      });
    }

    return resultado;
  }
}

export const manifiestoService = new ManifiestoService();
```

---

## CRITERIOS DE ACEPTACIÓN

- [ ] `conductorService.syncRndc()` construye el XML correcto y llama al RNDC
- [ ] `remesaService.enviarRndc()` marca como `ENVIADA` antes del SOAP (previene re-envío en timeout)
- [ ] `remesaService.enviarRndc()` vuelve a `PENDIENTE` si el RNDC responde error
- [ ] `manifiestoService.crear()` falla si alguna remesa no está `REGISTRADA`
- [ ] `manifiestoService.crear()` ejecuta todo en `$transaction` (registro local + asignación de remesas atómica)
- [ ] `manifiestoService.anular()` libera las remesas (`manifiestoOperativoId = null`)
- [ ] `manifiestoService.anular()` solo funciona con manifiestos en estado `REGISTRADO`
- [ ] `manifiestoService.corregir()` anula primero, luego crea — y no crea si la anulación falla
- [ ] TypeScript compila en strict sin `any` innecesarios
