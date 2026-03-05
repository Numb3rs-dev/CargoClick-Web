import { prisma } from '@/lib/db/prisma';
import type { Cliente, SucursalCliente, Prisma } from '@prisma/client';

/* ─────────────────────────────────────────────────────────────────────────────
   TIPOS
───────────────────────────────────────────────────────────────────────────── */

export type ClienteConSucursales = Cliente & {
  sucursales: SucursalCliente[];
};

export interface FindClientesOptions {
  q?:       string;
  activo?:  boolean;
  page?:    number;
  pageSize?: number;
}

export interface CreateClienteInput {
  tipoId:      string;
  numeroId:    string;
  razonSocial: string;
  /** Nombres propios combinados (persona natural) — NOMIDTERCERO del RNDC */
  nombres?:         string;
  /** Primer apellido (persona natural) — PRIMERAPELLIDOIDTERCERO del RNDC */
  primerApellido?:  string;
  /** Segundo apellido (persona natural) — SEGUNDOAPELLIDOIDTERCERO del RNDC */
  segundoApellido?: string;
  email?:      string;
  telefono?:   string;
  notas?:      string;
  /** Si no se pasa, se crea automáticamente una sucursal "Casa Matriz" con codSede="1" */
  sucursales?: {
    codSede:      string;
    nombre:       string;
    municipio?:   string;
    daneMunicipio?: string;
    direccion?:   string;
    telefono?:    string;
    email?:       string;
  }[];
}

export interface UpdateClienteInput {
  tipoId?:          string;
  numeroId?:        string;
  razonSocial?:     string;
  nombres?:         string;
  primerApellido?:  string;
  segundoApellido?: string;
  email?:           string;
  telefono?:        string;
  activo?:          boolean;
  notas?:           string;
}

export interface UpsertSucursalInput {
  codSede:        string;
  nombre:         string;
  municipio?:     string;
  daneMunicipio?: string;
  direccion?:     string;
  telefono?:      string;
  email?:         string;
  activo?:        boolean;
  /** Coordenada GPS latitud (Nominatim / RNDC) */
  latitud?:       number;
  /** Coordenada GPS longitud (Nominatim / RNDC) */
  longitud?:      number;
}

/* ─────────────────────────────────────────────────────────────────────────────
   REPOSITORY
───────────────────────────────────────────────────────────────────────────── */

export const clienteRepository = {

  /* ── Listado paginado ─────────────────────────────────────────────────── */
  async findAll({ q, activo = true, page = 1, pageSize = 30 }: FindClientesOptions = {}) {
    const where: Prisma.ClienteWhereInput = {
      ...(activo !== undefined && { activo }),
      ...(q && {
        OR: [
          { razonSocial: { contains: q, mode: 'insensitive' } },
          { numeroId:    { contains: q, mode: 'insensitive' } },
        ],
      }),
    };

    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        include: { sucursales: { where: { activo: true }, orderBy: { codSede: 'asc' } } },
        orderBy: { razonSocial: 'asc' },
        skip,
        take: pageSize,
      }),
      prisma.cliente.count({ where }),
    ]);

    return { data, total };
  },

  /* ── Búsqueda rápida para autocompletado ─────────────────────────────── */
  async search(q: string, limit = 10): Promise<ClienteConSucursales[]> {
    return prisma.cliente.findMany({
      where: {
        activo: true,
        OR: [
          { razonSocial: { contains: q, mode: 'insensitive' } },
          { numeroId:    { contains: q, mode: 'insensitive' } },
        ],
      },
      include: { sucursales: { where: { activo: true }, orderBy: { codSede: 'asc' } } },
      orderBy: { razonSocial: 'asc' },
      take: limit,
    });
  },

  /* ── Obtener uno por id ───────────────────────────────────────────────── */
  async findById(id: string): Promise<ClienteConSucursales | null> {
    return prisma.cliente.findUnique({
      where: { id },
      include: { sucursales: { orderBy: { codSede: 'asc' } } },
    });
  },

  /* ── Verificar si ya existe un cliente con ese tipoId + numeroId ──────── */
  async existsByNumeroId(tipoId: string, numeroId: string, excludeId?: string) {
    return prisma.cliente.findFirst({
      where: {
        tipoId,
        numeroId,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
  },

  /* ── Crear cliente con sucursales ────────────────────────────────────── */
  async create(input: CreateClienteInput): Promise<ClienteConSucursales> {
    const sucursales = input.sucursales?.length
      ? input.sucursales
      : [{ codSede: '1', nombre: 'Casa Matriz' }];

    return prisma.cliente.create({
      data: {
        tipoId:          input.tipoId,
        numeroId:         input.numeroId,
        razonSocial:      input.razonSocial,
        nombres:          input.nombres,
        primerApellido:   input.primerApellido,
        segundoApellido:  input.segundoApellido,
        email:            input.email,
        telefono:         input.telefono,
        notas:            input.notas,
        sucursales: {
          create: sucursales,
        },
      },
      include: { sucursales: { orderBy: { codSede: 'asc' } } },
    });
  },

  /* ── Actualizar datos del cliente (sin tocar sucursales) ─────────────── */
  async update(id: string, input: UpdateClienteInput): Promise<ClienteConSucursales> {
    return prisma.cliente.update({
      where: { id },
      data: input,
      include: { sucursales: { orderBy: { codSede: 'asc' } } },
    });
  },

  /* ── Crear o actualizar una sucursal ─────────────────────────────────── */
  async upsertSucursal(clienteId: string, input: UpsertSucursalInput): Promise<SucursalCliente> {
    return prisma.sucursalCliente.upsert({
      where: { clienteId_codSede: { clienteId, codSede: input.codSede } },
      create: { clienteId, ...input },
      update: { ...input },
    });
  },

  /* ── Desactivar (soft-delete) cliente ────────────────────────────────── */
  async deactivate(id: string) {
    return prisma.cliente.update({
      where: { id },
      data: { activo: false },
    });
  },

  /* ── Desactivar una sucursal ─────────────────────────────────────────── */
  async deactivateSucursal(sucursalId: string) {
    return prisma.sucursalCliente.update({
      where: { id: sucursalId },
      data: { activo: false },
    });
  },
};
