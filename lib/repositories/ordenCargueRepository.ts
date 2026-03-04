import { prisma } from '@/lib/db/prisma';
import { generarConsecutivo } from '@/lib/utils/consecutivos';
import type { OrdenCargue, EstadoOrdenCargue, Prisma } from '@prisma/client';

export type OrdenCargueConRelaciones = OrdenCargue & {
  nuevoNegocio: { id: string; codigoNegocio: string; clienteNombre: string | null };
  vehiculo:     { placa: string; configVehiculo: string | null } | null;
  conductor:    { cedula: string; nombres: string; apellidos: string } | null;
};

export interface FindOrdenesOptions {
  q?:        string;
  estado?:   EstadoOrdenCargue;
  page?:     number;
  pageSize?: number;
}

export interface CreateOrdenCargueInput {
  nuevoNegocioId:       string;
  vehiculoPlaca?:       string;
  conductorCedula?:     string;
  fechaHoraCargue?:     string; // ISO string
  puntoCargueDireccion?: string;
  puntoCargueMunicipio?: string;
  puntoCargueDane?:      string;
  notas?:                string;
}

export interface UpdateOrdenCargueInput {
  vehiculoPlaca?:        string | null;
  conductorCedula?:      string | null;
  estado?:               EstadoOrdenCargue;
  fechaHoraCargue?:      string | null;
  puntoCargueDireccion?: string;
  puntoCargueMunicipio?: string;
  puntoCargueDane?:      string;
  notas?:                string;
}

const INCLUDE = {
  nuevoNegocio: { select: { id: true, codigoNegocio: true, clienteNombre: true } },
  vehiculo:     { select: { placa: true, configVehiculo: true } },
  conductor:    { select: { cedula: true, nombres: true, apellidos: true } },
} satisfies Prisma.OrdenCargueInclude;

export const ordenCargueRepository = {

  async findAll(opts: FindOrdenesOptions = {}): Promise<{ data: OrdenCargueConRelaciones[]; total: number }> {
    const { q, estado, page = 1, pageSize = 30 } = opts;

    const where: Prisma.OrdenCargueWhereInput = {};
    if (estado) where.estado = estado;
    if (q) {
      where.OR = [
        { numeroOrden:           { contains: q, mode: 'insensitive' } },
        { vehiculoPlaca:         { contains: q, mode: 'insensitive' } },
        { puntoCargueMunicipio:  { contains: q, mode: 'insensitive' } },
        { nuevoNegocio: { codigoNegocio: { contains: q, mode: 'insensitive' } } },
        { nuevoNegocio: { clienteNombre: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.ordenCargue.findMany({
        where,
        include:  INCLUDE,
        orderBy:  { createdAt: 'desc' },
        skip:     (page - 1) * pageSize,
        take:     pageSize,
      }),
      prisma.ordenCargue.count({ where }),
    ]);

    return { data: data as OrdenCargueConRelaciones[], total };
  },

  async findById(id: string): Promise<OrdenCargueConRelaciones | null> {
    return prisma.ordenCargue.findUnique({
      where:   { id },
      include: INCLUDE,
    }) as Promise<OrdenCargueConRelaciones | null>;
  },

  async create(input: CreateOrdenCargueInput): Promise<OrdenCargueConRelaciones> {
    const orden = await prisma.$transaction(async tx => {
      const numeroOrden = await generarConsecutivo(tx, 'ordenCargue', 'OC');
      return tx.ordenCargue.create({
        data: {
          numeroOrden,
          nuevoNegocioId:       input.nuevoNegocioId,
          vehiculoPlaca:        input.vehiculoPlaca       || null,
          conductorCedula:      input.conductorCedula     || null,
          estado:               input.vehiculoPlaca && input.conductorCedula ? 'ASIGNADA' : 'BORRADOR',
          fechaHoraCargue:      input.fechaHoraCargue     ? new Date(input.fechaHoraCargue) : null,
          puntoCargueDireccion: input.puntoCargueDireccion || null,
          puntoCargueMunicipio: input.puntoCargueMunicipio || null,
          puntoCargueDane:      input.puntoCargueDane      || null,
          notas:                input.notas                || null,
        },
        include: INCLUDE,
      });
    });
    return orden as OrdenCargueConRelaciones;
  },

  async update(id: string, input: UpdateOrdenCargueInput): Promise<OrdenCargueConRelaciones> {
    const data: Prisma.OrdenCargueUpdateInput = {};

    if ('vehiculoPlaca'        in input) data.vehiculo      = input.vehiculoPlaca   ? { connect: { placa:  input.vehiculoPlaca   } } : { disconnect: true };
    if ('conductorCedula'      in input) data.conductor     = input.conductorCedula ? { connect: { cedula: input.conductorCedula } } : { disconnect: true };
    if ('estado'               in input) data.estado                = input.estado;
    if ('fechaHoraCargue'      in input) data.fechaHoraCargue       = input.fechaHoraCargue ? new Date(input.fechaHoraCargue) : null;
    if ('puntoCargueDireccion' in input) data.puntoCargueDireccion  = input.puntoCargueDireccion;
    if ('puntoCargueMunicipio' in input) data.puntoCargueMunicipio  = input.puntoCargueMunicipio;
    if ('puntoCargueDane'      in input) data.puntoCargueDane       = input.puntoCargueDane;
    if ('notas'                in input) data.notas                 = input.notas;

    return prisma.ordenCargue.update({ where: { id }, data, include: INCLUDE }) as Promise<OrdenCargueConRelaciones>;
  },

  async cancel(id: string): Promise<OrdenCargueConRelaciones> {
    return prisma.ordenCargue.update({
      where:   { id },
      data:    { estado: 'CANCELADA' },
      include: INCLUDE,
    }) as Promise<OrdenCargueConRelaciones>;
  },
};
