/**
 * Configuración de los 6 Pasos del Flujo Conversacional — Nacional
 *
 *  Paso 0: ruta (origen + destino)
 *  Paso 1: tipo de carga
 *  Paso 2: peso + dimensiones
 *  Paso 3: fecha requerida
 *  Paso 4: datos del contacto + empresa (fusionados) ← AQUÍ se crea la solicitud en BD
 *  Paso 5: confirmación + enriquecimiento (observaciones + checklist) — ÚLTIMO
 */

import { z } from 'zod';
import type { PasoConfig } from '@/types';

export const PASOS: PasoConfig[] = [

  // ── PASO 0: Ruta ─────────────────────────────────────────────────────────────────────
  {
    id: 0,
    pregunta: '¿Desde qué ciudad sale el envío y hacia dónde va?',
    campoFormulario: 'origen',
    tipoInput: 'origin-destination',
    validacion: z.object({
      origen:  z.string().min(5, 'Selecciona la ciudad de origen'),
      destino: z.string().min(5, 'Selecciona la ciudad de destino'),
    }),
  },

  // ── PASO 1: Tipo de carga ──────────────────────────────────────────────────────────────
  {
    id: 1,
    pregunta: '¿Qué tipo de carga vas a transportar?',
    campoFormulario: 'tipoCarga',
    tipoInput: 'buttons',
    opciones: [
      {
        label: 'Mercancía general',
        value: 'CARGA_GENERAL',
        icon: '📦',
        subtexto: 'Cajas, pallets, bultos, maquinaria, muebles, repuestos...',
        descripcion: 'Es la opción más común. Aplica cuando tu carga va empacada, embalada o en estibas y no necesita frío ni es un líquido o polvo a granel.',
        ejemplos: 'Cajas de electrodomésticos, costales de papa, sacos de café, muebles embalados, maquinaria en estiba, materiales de construcción empacados, repuestos industriales, medicamentos sin nevera, ropa y calzado.',
        checklist: [
          'Tu carga va en cajas, sacos, bolsas, estibas o embalada',
          'No necesita temperatura controlada durante el viaje',
          'No viaja dentro de un contenedor marítimo sellado',
          'No es arena, carbón o material que se descarga directamente al suelo',
        ],
      },
      {
        label: 'Carga refrigerada',
        value: 'REFRIGERADA',
        icon: '❄️',
        subtexto: 'Alimentos frescos, medicamentos, flores — necesita frío',
        descripcion: 'Aplica cuando tu carga se daña si no se mantiene fría durante el trayecto. El vehículo asignado es un furgón frigorífico con sistema de refrigeración.',
        ejemplos: 'Carnes, lácteos, frutas y verduras frescas, mariscos, flores para exportación, vacunas e insulinas, helados y congelados, jugos y bebidas que deben ir en frío.',
        checklist: [
          'Tu producto tiene fecha de vencimiento corta y se deteriora sin frío',
          'Necesitas cadena de frío durante todo el transporte',
          'No aplica si el producto ya está enlatado, deshidratado o empacado al vacío sin requerir frío',
        ],
      },
      {
        label: 'Contenedor',
        value: 'CONTENEDOR',
        icon: '🚢',
        subtexto: 'Contenedor sellado de importación o exportación (20\'  / 40\')',
        descripcion: 'Aplica cuando tu mercancía viaja dentro de un contenedor metálico estándar, el tipo que se usa en barcos y puertos. El camión transporta el contenedor completo.',
        ejemplos: 'Importaciones que llegan al puerto en contenedor y hay que llevarlas al almacén, exportaciones que se llevan al puerto, cargas consolidadas con varios clientes, contenedor propio de 20 o 40 pies.',
        checklist: [
          'Tu carga llegó o va a un puerto marítimo en contenedor',
          'Tienes un contenedor ya asignado con número de booking',
          'No aplica si tu carga va en un camión corriente aunque sea para exportar (eso es Mercancía general)',
        ],
      },
      {
        label: 'Granel sólido',
        value: 'GRANEL_SOLIDO',
        icon: '🪨',
        subtexto: 'Arena, carbón, granos, escombros — material suelto sin empacar',
        descripcion: 'Aplica cuando el material no va empacado — se carga directamente en el platón, volco o tolva del camión y se descarga volcando o con banda.',
        ejemplos: 'Arena, gravilla, recebo, tierra, piedra triturada, carbón suelto, escombros, granos de maíz o soya sin ensacar, sal, cemento a granel, cal.',
        checklist: [
          'Tu material se vierte directamente al camión sin bolsa ni caja',
          'Se descarga volcando el camión o con cintas transportadoras',
          'Ojo: si tus granos van en costales o sacos, eso es Mercancía general, no granel sólido',
        ],
      },
      {
        label: 'Granel líquido',
        value: 'GRANEL_LIQUIDO',
        icon: '🛢️',
        subtexto: 'Aceites, combustibles, químicos o líquidos en cisterna',
        descripcion: 'Aplica cuando transportas líquidos a granel, sin botella ni envase, directamente en el tanque de un camión cisterna.',
        ejemplos: 'Combustibles (ACPM, gasolina), aceite de palma, aceites industriales, ácidos, solventes, asfalto líquido, agua potable a granel, leche cruda, jugo de fruta sin envasar.',
        checklist: [
          'Tu líquido va en cisterna (tanque del camión), no en botella, garrafón ni envase',
          'El líquido se bombea para cargar y descargar',
          'Ojo: si tu producto va en bidones, garrafas o cajas, eso es Mercancía general',
        ],
      },
    ],
    validacion: z.enum(
      ['CARGA_GENERAL', 'REFRIGERADA', 'CONTENEDOR', 'GRANEL_SOLIDO', 'GRANEL_LIQUIDO'],
      { errorMap: () => ({ message: 'Selecciona un tipo de carga' }) }
    ),
  },

  // ── PASO 2: Peso + Dimensiones — identifica vehículo mínimo ────────────────────────
  {
    id: 2,
    pregunta: 'Cuéntame sobre el tamaño de tu carga: ¿cuánto pesa y cuáles son sus dimensiones?',
    campoFormulario: 'pesoKg',
    tipoInput: 'weight-dimensions',
    validacion: z.object({
      pesoKg:     z.number({ invalid_type_error: 'Ingresa el peso' }).int('Sin decimales').min(1, 'Debe ser mayor a 0').max(34999, 'Máximo 34.999 kg'),
      dimLargoCm: z.number({ invalid_type_error: 'Ingresa el largo' }).min(1, 'Largo debe ser mayor a 0').max(10000),
      dimAnchoCm: z.number({ invalid_type_error: 'Ingresa el ancho' }).min(1, 'Ancho debe ser mayor a 0').max(10000),
      dimAltoCm:  z.number({ invalid_type_error: 'Ingresa el alto'  }).min(1, 'Alto debe ser mayor a 0' ).max(10000),
    }),
  },

  // ── PASO 3: Fecha requerida ────────────────────────────────────────
  {
    id: 3,
    pregunta: '¿Para qué fecha necesitas el servicio?',
    campoFormulario: 'fechaRequerida',
    tipoInput: 'date',
    validacion: z.date({ required_error: 'Selecciona una fecha' }),
  },

  // ── PASO 4: Datos de contacto + empresa (fusionados) ← AQUÍ se crea la solicitud ───
  {
    id: 4,
    pregunta: '¡Ya casi! ¿A nombre de quién va esta solicitud?',
    campoFormulario: 'contacto',
    tipoInput: 'client-company-data',
    validacion: z.object({
      contacto: z.string().min(2, 'Mínimo 2 caracteres').max(200),
      telefono: z.string().min(1, 'Ingresa tu número de celular'),
    }),
  },

  // ── PASO 5 (ÚLTIMO): Confirmación + enriquecimiento opcional ──────────────────────
  {
    id: 5,
    pregunta: '¿Quieres agregar algo más a tu solicitud?',
    campoFormulario: 'observaciones',
    tipoInput: 'confirmation-extras',
    validacion: z.object({
      observaciones:     z.string().optional(),
      cargaPeligrosa:    z.boolean().optional(),
      ayudanteCargue:    z.boolean().optional(),
      ayudanteDescargue: z.boolean().optional(),
      cargaFragil:       z.boolean().optional(),
      necesitaEmpaque:   z.boolean().optional(),
      skip:              z.boolean().optional(),
    }).optional(),
  },

];

/**
 * Obtiene configuración de un paso por su ID
 */
export function obtenerPasoConfig(pasoId: number): PasoConfig {
  const paso = PASOS.find(p => p.id === pasoId);
  if (!paso) {
    throw new Error(`Paso ${pasoId} no encontrado en configuración`);
  }
  return paso;
}

export const TOTAL_PASOS = PASOS.length;   // 6
export const ULTIMO_PASO = PASOS.length - 1; // 5
