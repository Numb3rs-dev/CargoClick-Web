/**
 * Schemas de validación con Zod
 * 
 * Validaciones de nivel de negocio:
 * - Formatos correctos (email, teléfono)
 * - Rangos válidos (peso, valores)
 * - Reglas de negocio (destino condicional, rechazo de mudanzas)
 * 
 * @module Schemas
 */

import { z } from 'zod';

/**
 * Validación de email
 */
const emailSchema = z
  .string()
  .email('Email inválido')
  .max(100, 'Email demasiado largo')
  .transform(val => val.toLowerCase().trim());

/**
 * Validación de teléfono (formato internacional)
 * Acepta: +573001234567, +12025551234
 */
const telefonoSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Formato de teléfono inválido. Use formato internacional: +573001234567')
  .max(20, 'Teléfono demasiado largo');

/**
 * Validación de fecha requerida (no puede ser en el pasado)
 * Acepta string ISO o Date y lo transforma a Date
 */
const fechaRequeridaSchema = z
  .union([
    z.string().datetime({ message: 'Formato de fecha inválido. Use formato ISO: 2026-03-01T00:00:00.000Z' }),
    z.date()
  ])
  .transform((val) => (typeof val === 'string' ? new Date(val) : val))
  .refine(
    (date) => {
      // Colombia = UTC-5 fijo (sin horario de verano)
      // El servidor Railway corre en UTC — calculamos "hoy" en hora Bogotá
      const BOGOTA_OFFSET_MS = 5 * 60 * 60 * 1000;
      const ahoraEnBogota = new Date(Date.now() - BOGOTA_OFFSET_MS);
      ahoraEnBogota.setUTCHours(0, 0, 0, 0); // medianoche Bogotá expresada en UTC

      const fechaEnviada = new Date(date);
      fechaEnviada.setUTCHours(0, 0, 0, 0);

      return fechaEnviada.getTime() >= ahoraEnBogota.getTime();
    },
    { message: 'La fecha requerida no puede ser en el pasado' }
  );

/**
 * Schema para crear solicitud inicial (paso 2)
 * Requiere teléfono (primer dato verificable) + datos previos
 */
export const crearSolicitudInicialSchema = z.object({
  telefono: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Formato de teléfono inválido. Use formato internacional: +573001234567')
    .max(20, 'Teléfono demasiado largo'),
  contacto: z.string().min(2, 'Nombre muy corto').max(200, 'Nombre muy largo').trim(),
  empresa: z.string().max(200, 'Nombre de empresa muy largo').optional().or(z.literal('')),
});

/**
 * Schema para actualización progresiva
 * Todos los campos son opcionales
 */
export const actualizarSolicitudSchema = z.object({
  empresa: z.string().max(200).trim().optional().or(z.literal('')),
  telefonoEmpresa: z.string().max(50).trim().optional().or(z.literal('')),
  contacto: z.string().min(2).max(200).trim().optional(),
  email: emailSchema.optional().or(z.literal('')),
  telefono: telefonoSchema.optional(),
  tipoServicio: z.enum(['URBANO', 'NACIONAL']).optional(),
  origen: z.string().min(3).max(200).trim().optional(),
  destino: z.string().min(3).max(200).trim().optional(),
  tipoCarga: z.enum(['CARGA_GENERAL', 'GRANEL_SOLIDO', 'GRANEL_LIQUIDO']).optional(),
  pesoKg: z.number().min(0.01, 'Peso debe ser mayor a 0').max(50000, 'Peso máximo: 50,000 kg').optional(),
  dimLargoCm: z.number().min(1, 'Largo debe ser mayor a 0').max(10000, 'Largo máximo: 10,000 cm').optional(),
  dimAnchoCm: z.number().min(1, 'Ancho debe ser mayor a 0').max(10000, 'Ancho máximo: 10,000 cm').optional(),
  dimAltoCm: z.number().min(1, 'Alto debe ser mayor a 0').max(10000, 'Alto máximo: 10,000 cm').optional(),
  valorAsegurado: z.number().min(0.01, 'Valor asegurado debe ser mayor a 0').optional(),
  condicionesCargue: z
    .array(z.enum(['muelle', 'montacargas', 'manual']))
    .min(1, 'Seleccione al menos una condición')
    .optional(),
  fechaRequerida: fechaRequeridaSchema.optional(),
  // Enriquecimiento paso 6
  observaciones:            z.string().max(2000).optional().or(z.literal('')),
  servicioExpreso:          z.boolean().optional(),
  cargaPeligrosa:           z.boolean().optional(),
  detalleCargaPeligrosa:    z.string().max(1000).optional().or(z.literal('')),
  ayudanteCargue:           z.boolean().optional(),
  ayudanteDescargue:        z.boolean().optional(),
  cargaFragil:              z.boolean().optional(),
  necesitaEmpaque:          z.boolean().optional(),
  multiplesDestinosEntrega: z.boolean().optional(),
  detalleMultiplesDestinos: z.string().max(1000).optional().or(z.literal('')),
  requiereEscolta:          z.boolean().optional(),
  accesosDificiles:         z.boolean().optional(),
  detalleAccesosDificiles:  z.string().max(1000).optional().or(z.literal('')),
  cargaSobredimensionada:   z.boolean().optional(),
  detalleSobredimensionada: z.string().max(1000).optional().or(z.literal('')),
  // Campos calculados — ruta (paso 2)
  distanciaKm:              z.number().optional(),
  tramoDistancia:           z.string().max(20).optional(),
  tiempoTransitoDesc:       z.string().max(100).optional(),
  // Campos calculados — carga (paso 4)
  volumenM3:                z.number().nullable().optional(),
  vehiculoSugeridoId:       z.string().max(50).nullable().optional(),
  vehiculoSugeridoNombre:   z.string().max(200).nullable().optional(),
});

/**
 * Schema para solicitud completa (validación final)
 * Incluye validaciones cruzadas y reglas de negocio
 */
export const solicitudCompletaSchema = z
  .object({
    empresa: z.string().max(200).trim().optional().or(z.literal('')),
    contacto: z.string().min(2).max(200).trim(),
    email: emailSchema,
    telefono: telefonoSchema,
    tipoServicio: z.enum(['URBANO', 'NACIONAL']),
    origen: z.string().min(3).max(200).trim(),
    destino: z.string().min(3).max(200).trim().optional(),
    tipoCarga: z.enum(['CARGA_GENERAL', 'GRANEL_SOLIDO', 'GRANEL_LIQUIDO']),
    pesoKg: z.number().min(0.01).max(50000),
    dimLargoCm: z.number().min(1, 'Largo debe ser mayor a 0').max(10000, 'Largo máximo: 10,000 cm'),
    dimAnchoCm: z.number().min(1, 'Ancho debe ser mayor a 0').max(10000, 'Ancho máximo: 10,000 cm'),
    dimAltoCm: z.number().min(1, 'Alto debe ser mayor a 0').max(10000, 'Alto máximo: 10,000 cm'),
    valorAsegurado: z.number().min(0.01),
    condicionesCargue: z.array(z.enum(['muelle', 'montacargas', 'manual'])).min(1),
    fechaRequerida: fechaRequeridaSchema,
  })
  .refine(
    (data) => {
      // RN-01: Si tipo = NACIONAL, destino es obligatorio
      if (data.tipoServicio === 'NACIONAL' && !data.destino) {
        return false;
      }
      return true;
    },
    {
      message: 'Destino es obligatorio para servicio nacional',
      path: ['destino'],
    }
  );

/**
 * Tipos de TypeScript inferidos de schemas
 */
export type CrearSolicitudInicialInput = z.infer<typeof crearSolicitudInicialSchema>;
export type ActualizarSolicitudInput = z.infer<typeof actualizarSolicitudSchema>;
export type SolicitudCompletaInput = z.infer<typeof solicitudCompletaSchema>;
