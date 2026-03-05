# PROMPT 4: CAPA DE SERVICIOS (BUSINESS LOGIC LAYER)

## CONTEXTO DE NEGOCIO
**Problema**: Necesitamos implementar toda la lógica de negocio para gestionar solicitudes de cotización, incluyendo validaciones complejas, reglas de negocio (peso > 10 ton, destino obligatorio para NACIONAL, rechazo de mudanzas), generación de IDs únicos, y orquestación de notificaciones.

**Usuarios**: Endpoints de API que necesitan ejecutar operaciones de negocio completas (crear solicitud validada, actualizar con reglas aplicadas, cambiar estados según workflow).

**Valor**: Centralización de lógica de negocio en una capa testeable, mantenible y reutilizable, independiente de la capa de presentación (APIs) y persistencia (repositorio).

## ESPECIFICACIÓN FUNCIONAL

### Funcionalidad Principal
Implementar servicios que encapsulen toda la lógica de negocio:
- `SolicitudService`: Operaciones CRUD con validaciones y reglas de negocio
- `NotificacionService`: Orquestación de envío de emails y WhatsApp (sin bloquear flujo)

### Casos de Uso - SolicitudService

1. **Crear solicitud inicial (paso 0)**: Crear registro con solo `empresa`, estado EN_PROGRESO
2. **Actualizar solicitud progresivamente (pasos 1-12)**: Modificar campos uno a uno
3. **Completar solicitud (paso 13)**: Actualizar a estado COMPLETADA y disparar notificaciones
4. **Obtener solicitud por ID**: Consultar solicitud existente
5. **Listar por estado**: Filtrar solicitudes PENDIENTE, COTIZADO, etc.
6. **Cambiar estado**: Actualizar estado validando transiciones permitidas

### Reglas de Negocio (Business Rules)

**RN-01**: Si `tipoServicio` = NACIONAL, `destino` es **obligatorio**  
**RN-02**: Si `tipoCarga` contiene palabras "hogar" o "mudanza" → **rechazar**  
**RN-03**: `pesoKg` debe estar entre 0.01 y 50,000 kg  
**RN-04**: `fechaRequerida` debe ser >= fecha actual (sin hora)  
**RN-05**: Si `pesoKg` > 10,000 kg → activar `revisionEspecial = true` automáticamente  
**RN-06**: Validación completa solo al completar (estado COMPLETADA)  
**RN-07**: Transiciones de estado controladas (PENDIENTE → COTIZADO, no al revés)

### Criterios de Aceptación
- ✅ Clase `SolicitudService` con 6 métodos públicos
- ✅ Todas las reglas de negocio implementadas
- ✅ Validación con Zod schemas en operaciones críticas
- ✅ Generación de ULID para IDs únicos
- ✅ Cálculo automático de `revisionEspecial` según peso
- ✅ Manejo de errores con mensajes claros
- ✅ Clase `NotificacionService` con método `enviarTodasLasNotificaciones`
- ✅ Notificaciones NO bloquean flujo principal (try-catch sin propagar)
- ✅ Logging de errores de notificaciones
- ✅ JSDoc completo en todos los métodos

## ARQUITECTURA TÉCNICA

### Stack Tecnológico
- TypeScript 5.x (strict mode)
- Zod 3.x (validación de schemas)
- ulid 2.x (generación de IDs)
- Prisma Client (vía repositorio)

### Principios de Diseño

#### Single Responsibility
- SolicitudService: Lógica de solicitudes
- NotificacionService: Orquestación de notificaciones (delega en EmailService y WhatsAppService)

#### Dependency Injection
- Servicios reciben repositorio como dependencia
- Facilita testing con mocks

#### Fail Fast
- Validar lo antes posible
- Lanzar errores descriptivos inmediatamente

### Estructura de Archivos
```
lib/
├── services/
│   ├── solicitudService.ts         (lógica de solicitudes)
│   ├── notificacionService.ts      (orquestación notificaciones)
│   └── types.ts                    (tipos auxiliares)
├── validations/
│   └── schemas.ts                  (Zod schemas)
└── repositories/
    └── solicitudRepository.ts      (ya existe)
```

## IMPLEMENTACIÓN

### Archivo: `lib/validations/schemas.ts`

```typescript
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
 */
const fechaRequeridaSchema = z
  .date()
  .refine(
    (date) => {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fecha = new Date(date);
      fecha.setHours(0, 0, 0, 0);
      return fecha >= hoy;
    },
    { message: 'La fecha requerida no puede ser en el pasado' }
  );

/**
 * Schema para crear solicitud inicial (paso 0)
 * Solo requiere empresa
 */
export const crearSolicitudInicialSchema = z.object({
  empresa: z.string().min(3, 'Nombre de empresa muy corto').max(200).trim(),
});

/**
 * Schema para actualización progresiva
 * Todos los campos son opcionales
 */
export const actualizarSolicitudSchema = z.object({
  contacto: z.string().min(3).max(200).trim().optional(),
  email: emailSchema.optional(),
  telefono: telefonoSchema.optional(),
  tipoServicio: z.enum(['URBANO', 'NACIONAL']).optional(),
  origen: z.string().min(3).max(200).trim().optional(),
  destino: z.string().min(3).max(200).trim().optional(),
  tipoCarga: z.enum(['MERCANCIA_EMPRESARIAL', 'MAQUINARIA', 'MUEBLES_EMBALADOS']).optional(),
  pesoKg: z.number().min(0.01, 'Peso debe ser mayor a 0').max(50000, 'Peso máximo: 50,000 kg').optional(),
  dimensiones: z.string().min(5).optional(),
  valorAsegurado: z.number().min(0.01, 'Valor asegurado debe ser mayor a 0').optional(),
  condicionesCargue: z
    .array(z.enum(['muelle', 'montacargas', 'manual']))
    .min(1, 'Seleccione al menos una condición')
    .optional(),
  fechaRequerida: fechaRequeridaSchema.optional(),
});

/**
 * Schema para solicitud completa (validación final)
 * Incluye validaciones cruzadas y reglas de negocio
 */
export const solicitudCompletaSchema = z
  .object({
    empresa: z.string().min(3).max(200).trim(),
    contacto: z.string().min(3).max(200).trim(),
    email: emailSchema,
    telefono: telefonoSchema,
    tipoServicio: z.enum(['URBANO', 'NACIONAL']),
    origen: z.string().min(3).max(200).trim(),
    destino: z.string().min(3).max(200).trim().optional(),
    tipoCarga: z.enum(['MERCANCIA_EMPRESARIAL', 'MAQUINARIA', 'MUEBLES_EMBALADOS']),
    pesoKg: z.number().min(0.01).max(50000),
    dimensiones: z.string().min(5),
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
```

---

### Archivo: `lib/services/solicitudService.ts`

```typescript
/**
 * Servicio de lógica de negocio para Solicitudes
 * 
 * Responsabilidades:
 * - Aplicar reglas de negocio
 * - Validar datos con Zod
 * - Generar IDs únicos (ULID)
 * - Calcular campos derivados (revisionEspecial)
 * - Orquestar operaciones con repositorio
 * - Coordinar notificaciones (sin bloquear)
 * 
 * NO incluye:
 * - Operaciones de persistencia directas (usa repositorio)
 * - Envío directo de notificaciones (usa NotificacionService)
 * 
 * @module SolicitudService
 */

import { ulid } from 'ulid';
import { Solicitud } from '@prisma/client';
import { solicitudRepository } from '@/lib/repositories/solicitudRepository';
import {
  crearSolicitudInicialSchema,
  actualizarSolicitudSchema,
  solicitudCompletaSchema,
  type CrearSolicitudInicialInput,
  type ActualizarSolicitudInput,
} from '@/lib/validations/schemas';

export class SolicitudService {
  /**
   * Crea una solicitud inicial con estado EN_PROGRESO (paso 0 del flujo conversacional)
   * 
   * @param input - Solo requiere nombre de empresa
   * @returns Solicitud recién creada con ID generado
   * @throws Error si validación falla
   * 
   * @example
   * const solicitud = await service.crearSolicitudInicial({
   *   empresa: 'ACME Transport'
   * });
   * // solicitud.id = "01JXX..."
   * // solicitud.estado = "EN_PROGRESO"
   */
  async crearSolicitudInicial(input: CrearSolicitudInicialInput): Promise<Solicitud> {
    // Validar con Zod
    const datosValidados = crearSolicitudInicialSchema.parse(input);

    // Generar ID único
    const id = ulid();

    // Guardar en BD
    return await solicitudRepository.guardar({
      id,
      empresa: datosValidados.empresa,
      contacto: '', // Se completará en pasos posteriores
      email: '',
      telefono: '',
      tipoServicio: 'URBANO', // Default, se actualizará
      origen: '',
      tipoCarga: 'MERCANCIA_EMPRESARIAL', // Default
      pesoKg: 0,
      dimensiones: '',
      valorAsegurado: 0,
      condicionesCargue: [],
      fechaRequerida: new Date(),
      estado: 'EN_PROGRESO',
      revisionEspecial: false,
    });
  }

  /**
   * Actualiza campos de una solicitud existente (guardado progresivo)
   * 
   * Aplica reglas de negocio:
   * - RN-05: Si pesoKg > 10,000 → revisionEspecial = true
   * 
   * @param id - ULID de la solicitud
   * @param input - Campos a actualizar (parcial)
   * @returns Solicitud actualizada
   * @throws Error si ID no existe o validación falla
   * 
   * @example
   * const actualizada = await service.actualizarSolicitud('01JXX...', {
   *   contacto: 'Juan Pérez',
   *   email: 'juan@acme.com'
   * });
   */
  async actualizarSolicitud(id: string, input: ActualizarSolicitudInput): Promise<Solicitud> {
    // Validar con Zod (solo campos enviados)
    const datosValidados = actualizarSolicitudSchema.parse(input);

    // Preparar datos para actualización
    const dataUpdate: any = { ...datosValidados };

    // RN-05: Calcular revisionEspecial si se actualiza peso
    if (datosValidados.pesoKg !== undefined) {
      dataUpdate.revisionEspecial = datosValidados.pesoKg > 10000;
    }

    // Actualizar en BD
    return await solicitudRepository.actualizar(id, dataUpdate);
  }

  /**
   * Completa una solicitud y dispara notificaciones (paso final)
   * 
   * Valida solicitud completa con todas las reglas de negocio:
   * - RN-01: Destino obligatorio si tipo = NACIONAL
   * - RN-02: Rechaza mudanzas de hogar
   * - RN-03: Peso en rango válido
   * - RN-04: Fecha no en el pasado
   * 
   * @param id - ULID de la solicitud
   * @param camposFinales - Últimos campos a completar
   * @returns Solicitud completada con estado COMPLETADA
   * @throws Error si validación completa falla
   * 
   * @example
   * const completa = await service.completarSolicitud('01JXX...', {
   *   fechaRequerida: new Date('2026-03-01')
   * });
   * // Se dispararon notificaciones (email + WhatsApp)
   */
  async completarSolicitud(
    id: string,
    camposFinales: Partial<ActualizarSolicitudInput>
  ): Promise<Solicitud> {
    // Obtener solicitud actual
    const solicitudActual = await solicitudRepository.obtenerPorId(id);
    if (!solicitudActual) {
      throw new Error('Solicitud no encontrada');
    }

    // Combinar datos actuales con campos finales
    const solicitudCompleta = {
      ...solicitudActual,
      ...camposFinales,
      // Convertir Prisma.Decimal a number para validación
      pesoKg: Number(solicitudActual.pesoKg),
      valorAsegurado: Number(solicitudActual.valorAsegurado),
    };

    // RN-02: Rechazar si contiene palabras prohibidas
    const textoCompleto = [
      solicitudCompleta.tipoCarga,
      solicitudCompleta.dimensiones,
    ].join(' ').toLowerCase();

    if (textoCompleto.includes('hogar') || textoCompleto.includes('mudanza')) {
      throw new Error(
        'No procesamos mudanzas de hogar. Nuestro servicio es exclusivo para transporte empresarial.'
      );
    }

    // Validar solicitud completa con Zod
    const datosValidados = solicitudCompletaSchema.parse(solicitudCompleta);

    // RN-05: Verificar revisionEspecial
    const revisionEspecial = datosValidados.pesoKg > 10000;

    // Actualizar a estado COMPLETADA
    const solicitudFinal = await solicitudRepository.actualizar(id, {
      ...camposFinales,
      estado: 'COMPLETADA',
      revisionEspecial,
    });

    // Disparar notificaciones (asíncrono, no bloqueante)
    // Nota: NotificacionService se implementará en siguiente sección
    this.dispararNotificaciones(solicitudFinal);

    return solicitudFinal;
  }

  /**
   * Obtiene una solicitud por su ID
   * 
   * @param id - ULID de la solicitud
   * @returns Solicitud encontrada
   * @throws Error si no existe
   */
  async obtenerPorId(id: string): Promise<Solicitud> {
    const solicitud = await solicitudRepository.obtenerPorId(id);
    if (!solicitud) {
      throw new Error('Solicitud no encontrada');
    }
    return solicitud;
  }

  /**
   * Lista solicitudes por estado
   * 
   * @param estado - Estado a filtrar
   * @param limit - Máximo de resultados
   * @returns Array de solicitudes
   */
  async listarPorEstado(estado: 'PENDIENTE' | 'COTIZADO' | 'RECHAZADO' | 'CERRADO', limit?: number): Promise<Solicitud[]> {
    return await solicitudRepository.listarPorEstado(estado, limit);
  }

  /**
   * Cambia el estado de una solicitud validando transiciones permitidas
   * 
   * Transiciones válidas:
   * - PENDIENTE → COTIZADO
   * - PENDIENTE → RECHAZADO
   * - COTIZADO → CERRADO
   * - COTIZADO → RECHAZADO
   * 
   * @param id - ULID de la solicitud
   * @param nuevoEstado - Estado destino
   * @returns Solicitud actualizada
   * @throws Error si transición no permitida
   */
  async cambiarEstado(
    id: string,
    nuevoEstado: 'PENDIENTE' | 'COTIZADO' | 'RECHAZADO' | 'CERRADO'
  ): Promise<Solicitud> {
    const solicitud = await this.obtenerPorId(id);

    // Validar transición de estado (RN-07)
    const transicionesValidas: Record<string, string[]> = {
      PENDIENTE: ['COTIZADO', 'RECHAZADO'],
      COTIZADO: ['CERRADO', 'RECHAZADO'],
      RECHAZADO: [], // Estado terminal
      CERRADO: [], // Estado terminal
    };

    const estadosPermitidos = transicionesValidas[solicitud.estado] || [];
    if (!estadosPermitidos.includes(nuevoEstado)) {
      throw new Error(
        `Transición no permitida: ${solicitud.estado} → ${nuevoEstado}`
      );
    }

    return await solicitudRepository.actualizar(id, { estado: nuevoEstado });
  }

  /**
   * Dispara notificaciones de forma asíncrona (no bloqueante)
   * 
   * @param solicitud - Solicitud completada
   * @private
   */
  private dispararNotificaciones(solicitud: Solicitud): void {
    // Importación dinámica para evitar dependencia circular
    // Se ejecuta en background, no bloquea respuesta al cliente
    import('@/lib/services/notificacionService').then(({ notificacionService }) => {
      notificacionService.enviarTodasLasNotificaciones(solicitud).catch((error) => {
        console.error('Error al enviar notificaciones:', error);
        // No propagar error, las notificaciones son secundarias
      });
    });
  }
}

// Exportar instancia única
export const solicitudService = new SolicitudService();
```

---

### Archivo: `lib/services/notificacionService.ts`

```typescript
/**
 * Servicio de orquestación de notificaciones
 * 
 * Responsabilidades:
 * - Enviar email al cliente (confirmación)
 * - Enviar email al administrador (notificación interna)
 * - Enviar WhatsApp al administrador (alerta)
 * - Manejar fallos parciales sin interrumpir flujo
 * 
 * Importante: Las notificaciones NO deben bloquear el flujo principal
 * Si alguna falla, se loguea el error pero NO se lanza excepción
 * 
 * @module NotificacionService
 */

import { Solicitud } from '@prisma/client';

export class NotificacionService {
  /**
   * Envía todas las notificaciones relacionadas con una solicitud completada
   * 
   * Ejecuta en paralelo:
   * 1. Email al cliente (confirmación)
   * 2. Email al administrador (notificación)
   * 3. WhatsApp al administrador (alerta)
   * 
   * Si alguna falla, se loguea pero no se interrumpe el flujo
   * 
   * @param solicitud - Solicitud completada
   * @returns Promise<void>
   * 
   * @example
   * await notificacionService.enviarTodasLasNotificaciones(solicitud);
   * // Notificaciones enviadas en paralelo
   * // Si alguna falla, se loguea pero no se propaga error
   */
  async enviarTodasLasNotificaciones(solicitud: Solicitud): Promise<void> {
    const promesas = [
      this.enviarEmailCliente(solicitud),
      this.enviarEmailAdmin(solicitud),
      this.enviarWhatsAppAdmin(solicitud),
    ];

    // Ejecutar en paralelo y capturar errores individuales
    const resultados = await Promise.allSettled(promesas);

    // Loguear errores pero no lanzar excepción
    resultados.forEach((resultado, index) => {
      if (resultado.status === 'rejected') {
        const tipo = ['Email Cliente', 'Email Admin', 'WhatsApp Admin'][index];
        console.error(`❌ Error al enviar ${tipo}:`, resultado.reason);
      } else {
        const tipo = ['Email Cliente', 'Email Admin', 'WhatsApp Admin'][index];
        console.log(`✅ ${tipo} enviado correctamente`);
      }
    });
  }

  /**
   * Envía email de confirmación al cliente
   * 
   * @param solicitud - Solicitud completada
   * @throws Error si falla envío (capturado por enviarTodasLasNotificaciones)
   */
  private async enviarEmailCliente(solicitud: Solicitud): Promise<void> {
    // Implementación en PROMPT 5 (servicios externos)
    // Por ahora, solo log
    console.log('📧 Enviando email al cliente:', solicitud.email);
    
    // Simular envío
    // const emailService = await import('@/lib/services/emailService');
    // await emailService.enviarEmailCliente(solicitud);
  }

  /**
   * Envía email de notificación al administrador
   * 
   * @param solicitud - Solicitud completada
   * @throws Error si falla envío
   */
  private async enviarEmailAdmin(solicitud: Solicitud): Promise<void> {
    // Implementación en PROMPT 5
    console.log('📧 Enviando email al administrador');
    
    // Simular envío
    // const emailService = await import('@/lib/services/emailService');
    // await emailService.enviarEmailAdmin(solicitud);
  }

  /**
   * Envía mensaje de WhatsApp al administrador
   * 
   * @param solicitud - Solicitud completada
   * @throws Error si falla envío
   */
  private async enviarWhatsAppAdmin(solicitud: Solicitud): Promise<void> {
    // Implementación en PROMPT 5
    console.log('📱 Enviando WhatsApp al administrador');
    
    // Simular envío
    // const whatsappService = await import('@/lib/services/whatsappService');
    // await whatsappService.enviarWhatsAppAdmin(solicitud);
  }
}

// Exportar instancia única
export const notificacionService = new NotificacionService();
```

## RESTRICCIONES Y CALIDAD

### Performance
- Validaciones con Zod (rápidas, sincrónicas)
- Notificaciones en paralelo (Promise.all)
- No bloquear respuesta al cliente esperando notificaciones

### Seguridad
- Validar TODOS los datos con Zod antes de persistir
- Sanitizar strings (trim, toLowerCase)
- NO exponer stack traces al cliente

### Testing
Casos de prueba críticos:
- ✅ Crear solicitud inicial válida
- ❌ Crear con empresa vacía (debe fallar)
- ✅ Actualizar peso < 10 ton (revisionEspecial = false)
- ✅ Actualizar peso > 10 ton (revisionEspecial = true)
- ❌ Completar sin destino en Nacional (debe fallar)
- ❌ Completar con palabra "mudanza" (debe fallar)
- ❌ Completar con fecha pasada (debe fallar)
- ✅ Cambiar estado PENDIENTE → COTIZADO (permitido)
- ❌ Cambiar estado RECHAZADO → PENDIENTE (no permitido)

### Estándares de Código
- JSDoc completo en métodos públicos
- Mensajes de error descriptivos y user-friendly
- Logging estructurado (console.log temporalmente, luego usar Winston/Pino)
- Tipos TypeScript explícitos

## ENTREGABLES

### Checklist de Completitud
- [ ] Archivo `lib/validations/schemas.ts` con 3 schemas Zod
- [ ] Archivo `lib/services/solicitudService.ts` con 6 métodos públicos
- [ ] Archivo `lib/services/notificacionService.ts` con 1 método público
- [ ] Todas las reglas de negocio (RN-01 a RN-07) implementadas
- [ ] Generación de ULID funcionando
- [ ] Manejo de errores correcto
- [ ] Sin errores de TypeScript (`npx tsc --noEmit`)

### Métodos Implementados - SolicitudService
1. ✅ `crearSolicitudInicial(input)` → Crea con estado EN_PROGRESO
2. ✅ `actualizarSolicitud(id, input)` → Guardado progresivo
3. ✅ `completarSolicitud(id, camposFinales)` → Validación completa + notificaciones
4. ✅ `obtenerPorId(id)` → Consulta solicitud
5. ✅ `listarPorEstado(estado, limit)` → Filtrar por estado
6. ✅ `cambiarEstado(id, nuevoEstado)` → Transiciones controladas

### Métodos Implementados - NotificacionService
1. ✅ `enviarTodasLasNotificaciones(solicitud)` → Orquesta 3 notificaciones en paralelo

## NOTAS IMPORTANTES

### ⚠️ NO IMPLEMENTAR EN ESTA FASE
- ❌ Envío real de emails (siguiente prompt)
- ❌ Envío real de WhatsApp (siguiente prompt)
- ❌ Endpoints de API (prompt 6)
- ❌ Tests unitarios formales (opcional)

### ✅ SÍ HACER EN ESTA FASE
- ✅ Implementar todos los servicios
- ✅ Aplicar todas las reglas de negocio
- ✅ Validaciones con Zod
- ✅ Generación de ULID
- ✅ Manejo de errores
- ✅ JSDoc completo

### Próximo Paso
Una vez completado este prompt, continuar con **PROMPT 5: INTEGRACIONES EXTERNAS (Email y WhatsApp)**.

### Troubleshooting Común

**Error**: "Cannot find module 'ulid'"  
**Solución**: `npm install ulid`

**Error**: "ZodError: Invalid type"  
**Solución**: Validar que los tipos de datos coincidan con el schema Zod

**Error**: "Property 'destino' is missing"  
**Solución**: Destino es opcional en actualizaciones parciales, obligatorio solo en validación completa

---

**Objetivo Final**: Lógica de negocio completa y lista para ser consumida por API Routes.
