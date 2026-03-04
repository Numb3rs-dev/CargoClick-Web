# BACK-02: Capa de Repositorios — Módulo Operacional

## CONTEXTO DE NEGOCIO

**Problema:** Necesitamos acceso a datos limpio y testeeable para los 9 modelos nuevos del módulo operacional. Cada repositorio encapsula las queries Prisma y expone métodos con tipos correctos.

**Prerequisito:** BACK-01 ejecutado — schema migrado y modelos disponibles en Prisma Client.

**Valor:** Los servicios de negocio (BACK-04) dependen de estos repositorios. Sin esta capa, los servicios tendrían queries Prisma directas mezcladas con lógica de negocio.

---

## ARQUITECTURA

### Patrón
Cada repositorio es una **clase** con métodos `async`. Recibe `PrismaClient` en el constructor (injection). Se exporta una instancia singleton al final del archivo.

```
lib/repositories/
├── conductorRepository.ts
├── vehiculoRepository.ts
├── consultaRuntRepository.ts
├── nuevoNegocioRepository.ts
├── remesaRepository.ts
├── manifiestoOperativoRepository.ts
├── seguimientoClienteRepository.ts
├── encuestaPostEntregaRepository.ts
└── syncRndcRepository.ts
```

---

## IMPLEMENTACIONES

### `lib/repositories/conductorRepository.ts`

```typescript
import { prisma } from '@/lib/db/client';
import type { Conductor, Prisma } from '@prisma/client';

export class ConductorRepository {
  async findByCedula(cedula: string): Promise<Conductor | null> {
    return prisma.conductor.findUnique({ where: { cedula } });
  }

  async findAll(filters: {
    activo?: boolean;
    q?: string;         // busca en cedula, nombres, apellidos
  } = {}): Promise<Conductor[]> {
    const where: Prisma.ConductorWhereInput = {};
    if (filters.activo !== undefined) where.activo = filters.activo;
    if (filters.q) {
      where.OR = [
        { cedula: { contains: filters.q, mode: 'insensitive' } },
        { nombres: { contains: filters.q, mode: 'insensitive' } },
        { apellidos: { contains: filters.q, mode: 'insensitive' } },
      ];
    }
    return prisma.conductor.findMany({
      where,
      orderBy: [{ activo: 'desc' }, { apellidos: 'asc' }],
    });
  }

  async create(data: Prisma.ConductorCreateInput): Promise<Conductor> {
    return prisma.conductor.create({ data });
  }

  async update(
    cedula: string,
    data: Prisma.ConductorUpdateInput
  ): Promise<Conductor> {
    return prisma.conductor.update({ where: { cedula }, data });
  }

  /** Guarda el snapshot RUNT y la fecha de última consulta */
  async actualizarSnapshotRunt(
    cedula: string,
    snapshot: Record<string, unknown>
  ): Promise<void> {
    await prisma.conductor.update({
      where: { cedula },
      data: { snapshotRunt: snapshot, ultimaConsultaRunt: new Date() },
    });
  }
}

export const conductorRepository = new ConductorRepository();
```

---

### `lib/repositories/vehiculoRepository.ts`

```typescript
import { prisma } from '@/lib/db/client';
import type { Vehiculo, Prisma } from '@prisma/client';

export class VehiculoRepository {
  async findByPlaca(placa: string): Promise<Vehiculo | null> {
    return prisma.vehiculo.findUnique({ where: { placa } });
  }

  async findAll(filters: { activo?: boolean; q?: string } = {}): Promise<Vehiculo[]> {
    const where: Prisma.VehiculoWhereInput = {};
    if (filters.activo !== undefined) where.activo = filters.activo;
    if (filters.q) {
      where.OR = [
        { placa: { contains: filters.q, mode: 'insensitive' } },
        { propietarioNombre: { contains: filters.q, mode: 'insensitive' } },
      ];
    }
    return prisma.vehiculo.findMany({
      where,
      orderBy: [{ activo: 'desc' }, { placa: 'asc' }],
    });
  }

  async create(data: Prisma.VehiculoCreateInput): Promise<Vehiculo> {
    return prisma.vehiculo.create({ data });
  }

  async update(placa: string, data: Prisma.VehiculoUpdateInput): Promise<Vehiculo> {
    return prisma.vehiculo.update({ where: { placa }, data });
  }

  async actualizarSnapshotRunt(
    placa: string,
    snapshot: Record<string, unknown>
  ): Promise<void> {
    await prisma.vehiculo.update({
      where: { placa },
      data: { snapshotRunt: snapshot, ultimaConsultaRunt: new Date() },
    });
  }
}

export const vehiculoRepository = new VehiculoRepository();
```

---

### `lib/repositories/nuevoNegocioRepository.ts`

```typescript
import { prisma } from '@/lib/db/client';
import type { NuevoNegocio, EstadoNegocio, Prisma } from '@prisma/client';

// Tipo enriquecido para el detalle completo
export type NuevoNegocioDetalle = NuevoNegocio & {
  remesas: Array<{
    id: string;
    numeroRemesa: string;
    descripcionCarga: string;
    pesoKg: number;
    origenMunicipio: string;
    destinoMunicipio: string;
    estadoRndc: string;
    estado: string;
    manifiestoOperativoId: string | null;
  }>;
  manifiestos: Array<{
    id: string;
    codigoInterno: string;
    numeroManifiesto: string | null;
    estadoManifiesto: string;
    conductorCedula: string;
    vehiculoPlaca: string;
    fechaDespacho: Date;
  }>;
  seguimientos: Array<{
    id: string;
    hito: string;
    descripcion: string | null;
    createdAt: Date;
  }>;
};

export class NuevoNegocioRepository {
  async findById(id: string): Promise<NuevoNegocioDetalle | null> {
    return prisma.nuevoNegocio.findUnique({
      where: { id },
      include: {
        remesas: {
          select: {
            id: true,
            numeroRemesa: true,
            descripcionCarga: true,
            pesoKg: true,
            origenMunicipio: true,
            destinoMunicipio: true,
            estadoRndc: true,
            estado: true,
            manifiestoOperativoId: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        manifiestos: {
          select: {
            id: true,
            codigoInterno: true,
            numeroManifiesto: true,
            estadoManifiesto: true,
            conductorCedula: true,
            vehiculoPlaca: true,
            fechaDespacho: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        seguimientos: {
          select: { id: true, hito: true, descripcion: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    }) as Promise<NuevoNegocioDetalle | null>;
  }

  async findAll(filters: {
    estado?: EstadoNegocio;
    clienteNit?: string;
    desde?: Date;
    hasta?: Date;
    page?: number;
    pageSize?: number;
  } = {}): Promise<{ data: NuevoNegocio[]; total: number }> {
    const { page = 1, pageSize = 20, ...rest } = filters;
    const where: Prisma.NuevoNegocioWhereInput = {};

    if (rest.estado) where.estado = rest.estado;
    if (rest.clienteNit) where.clienteNit = { contains: rest.clienteNit };
    if (rest.desde || rest.hasta) {
      where.createdAt = {
        ...(rest.desde && { gte: rest.desde }),
        ...(rest.hasta && { lte: rest.hasta }),
      };
    }

    const [data, total] = await prisma.$transaction([
      prisma.nuevoNegocio.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.nuevoNegocio.count({ where }),
    ]);

    return { data, total };
  }

  async create(data: Prisma.NuevoNegocioCreateInput): Promise<NuevoNegocio> {
    return prisma.nuevoNegocio.create({ data });
  }

  async update(
    id: string,
    data: Prisma.NuevoNegocioUpdateInput
  ): Promise<NuevoNegocio> {
    return prisma.nuevoNegocio.update({ where: { id }, data });
  }
}

export const nuevoNegocioRepository = new NuevoNegocioRepository();
```

---

### `lib/repositories/remesaRepository.ts`

```typescript
import { prisma } from '@/lib/db/client';
import type { Remesa, EstadoRndcRemesa, Prisma } from '@prisma/client';

export class RemesaRepository {
  async findById(id: string): Promise<Remesa | null> {
    return prisma.remesa.findUnique({ where: { id } });
  }

  async findByNegocio(nuevoNegocioId: string): Promise<Remesa[]> {
    return prisma.remesa.findMany({
      where: { nuevoNegocioId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Valida que todas las remesas de una lista cumplen estadoRndc = REGISTRADA
   * y no están asignadas a otro manifiesto.
   * Usado como precondición al crear un ManifiestoOperativo.
   */
  async validarParaManifiesto(
    ids: string[],
    nuevoNegocioId: string
  ): Promise<{ validas: boolean; errores: string[] }> {
    const remesas = await prisma.remesa.findMany({ where: { id: { in: ids } } });
    const errores: string[] = [];

    for (const r of remesas) {
      if (r.nuevoNegocioId !== nuevoNegocioId)
        errores.push(`Remesa ${r.numeroRemesa} no pertenece a este negocio`);
      if (r.estadoRndc !== 'REGISTRADA')
        errores.push(`Remesa ${r.numeroRemesa} aún no está REGISTRADA en el RNDC (estado actual: ${r.estadoRndc})`);
      if (r.manifiestoOperativoId)
        errores.push(`Remesa ${r.numeroRemesa} ya está asignada a otro manifiesto`);
    }

    return { validas: errores.length === 0, errores };
  }

  async create(data: Prisma.RemesaCreateInput): Promise<Remesa> {
    return prisma.remesa.create({ data });
  }

  async update(id: string, data: Prisma.RemesaUpdateInput): Promise<Remesa> {
    return prisma.remesa.update({ where: { id }, data });
  }

  async actualizarEstadoRndc(
    id: string,
    estadoRndc: EstadoRndcRemesa,
    numeroRemesaRndc?: string,
    respuestaRndcJson?: object
  ): Promise<Remesa> {
    return prisma.remesa.update({
      where: { id },
      data: {
        estadoRndc,
        ...(numeroRemesaRndc && { numeroRemesaRndc }),
        ...(respuestaRndcJson && { respuestaRndcJson }),
      },
    });
  }
}

export const remesaRepository = new RemesaRepository();
```

---

### `lib/repositories/manifiestoOperativoRepository.ts`

```typescript
import { prisma } from '@/lib/db/client';
import type { ManifiestoOperativo, EstadoManifiesto, Prisma } from '@prisma/client';

export class ManifiestoOperativoRepository {
  async findById(id: string) {
    return prisma.manifiestoOperativo.findUnique({
      where: { id },
      include: {
        remesas: true,
        conductor: true,
        vehiculo: true,
        nuevoNegocio: { select: { codigoNegocio: true, clienteNombre: true } },
        reemplazadoPor: { select: { id: true, codigoInterno: true, estadoManifiesto: true } },
        reemplazos: { select: { id: true, codigoInterno: true, estadoManifiesto: true } },
      },
    });
  }

  async findByNegocio(nuevoNegocioId: string) {
    return prisma.manifiestoOperativo.findMany({
      where: { nuevoNegocioId },
      include: {
        conductor: { select: { cedula: true, nombres: true, apellidos: true } },
        vehiculo: { select: { placa: true, tipoVehiculo: true } },
        remesas: { select: { id: true, numeroRemesa: true, descripcionCarga: true, pesoKg: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Prisma.ManifiestoOperativoCreateInput): Promise<ManifiestoOperativo> {
    return prisma.manifiestoOperativo.create({ data });
  }

  async actualizarEstado(
    id: string,
    estadoManifiesto: EstadoManifiesto,
    extras?: { numeroManifiesto?: string; respuestaRndcJson?: object }
  ): Promise<ManifiestoOperativo> {
    return prisma.manifiestoOperativo.update({
      where: { id },
      data: { estadoManifiesto, ...extras },
    });
  }
}

export const manifiestoOperativoRepository = new ManifiestoOperativoRepository();
```

---

### `lib/repositories/syncRndcRepository.ts`

```typescript
import { prisma } from '@/lib/db/client';
import type { SyncRndc, Prisma } from '@prisma/client';

export class SyncRndcRepository {
  /** INSERT — nunca UPDATE ni DELETE */
  async registrar(data: Omit<Prisma.SyncRndcCreateInput, 'id'>): Promise<SyncRndc> {
    return prisma.syncRndc.create({ data });
  }

  async findById(id: string): Promise<SyncRndc | null> {
    return prisma.syncRndc.findUnique({ where: { id } });
  }

  async findAll(filters: {
    processId?: number;
    exitoso?: boolean;
    entidadTipo?: string;
    desde?: Date;
    hasta?: Date;
    page?: number;
    pageSize?: number;
  } = {}): Promise<{ data: SyncRndc[]; total: number }> {
    const { page = 1, pageSize = 50, ...rest } = filters;
    const where: Prisma.SyncRndcWhereInput = {};

    if (rest.processId !== undefined) where.processId = rest.processId;
    if (rest.exitoso !== undefined) where.exitoso = rest.exitoso;
    if (rest.entidadTipo) where.entidadTipo = rest.entidadTipo;
    if (rest.desde || rest.hasta) {
      where.createdAt = {
        ...(rest.desde && { gte: rest.desde }),
        ...(rest.hasta && { lte: rest.hasta }),
      };
    }

    const [data, total] = await prisma.$transaction([
      prisma.syncRndc.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.syncRndc.count({ where }),
    ]);

    return { data, total };
  }
}

export const syncRndcRepository = new SyncRndcRepository();
```

---

### Repositorios menores (seguimiento y encuesta)

```typescript
// lib/repositories/seguimientoClienteRepository.ts
import { prisma } from '@/lib/db/client';
import type { Prisma } from '@prisma/client';

export class SeguimientoClienteRepository {
  async findByNegocio(nuevoNegocioId: string) {
    return prisma.seguimientoCliente.findMany({
      where: { nuevoNegocioId },
      orderBy: { createdAt: 'asc' },
    });
  }
  async create(data: Prisma.SeguimientoClienteCreateInput) {
    return prisma.seguimientoCliente.create({ data });
  }
}
export const seguimientoClienteRepository = new SeguimientoClienteRepository();

// lib/repositories/encuestaPostEntregaRepository.ts
import { prisma } from '@/lib/db/client';

export class EncuestaPostEntregaRepository {
  async findByToken(token: string) {
    return prisma.encuestaPostEntrega.findUnique({
      where: { tokenEncuesta: token },
      include: { nuevoNegocio: { select: { codigoNegocio: true, clienteNombre: true } } },
    });
  }
  async findByNegocio(nuevoNegocioId: string) {
    return prisma.encuestaPostEntrega.findUnique({ where: { nuevoNegocioId } });
  }
  async create(nuevoNegocioId: string) {
    return prisma.encuestaPostEntrega.create({
      data: { nuevoNegocioId, calificacionGeneral: 0 }, // placeholder hasta que responda
    });
  }
  async responder(
    token: string,
    data: {
      calificacionGeneral: number;
      calificacionTiempos?: number;
      calificacionTrato?: number;
      calificacionEstadoCarga?: number;
      comentario?: string;
      recomendaria?: boolean;
    }
  ) {
    return prisma.encuestaPostEntrega.update({
      where: { tokenEncuesta: token },
      data: { ...data, respondidoEn: new Date() },
    });
  }
}
export const encuestaPostEntregaRepository = new EncuestaPostEntregaRepository();
```

---

## CRITERIOS DE ACEPTACIÓN

- [ ] Cada repositorio está en su propio archivo en `lib/repositories/`
- [ ] Todos los métodos tienen JSDoc con descripción, params y return type
- [ ] `remesaRepository.validarParaManifiesto()` rechaza remesas que no estén REGISTRADAS
- [ ] `syncRndcRepository.registrar()` nunca llama a `update` ni `delete`
- [ ] `nuevoNegocioRepository.findById()` hace un único query con includes (no N+1)
- [ ] Los filtros de paginación usan `$transaction([findMany, count])` para consistencia
- [ ] Todos los repositorios exportan una instancia singleton
- [ ] TypeScript compila sin errores en modo strict
