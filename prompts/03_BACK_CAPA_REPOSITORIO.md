# PROMPT 3: CAPA DE REPOSITORIO (DATA ACCESS LAYER)

## CONTEXTO DE NEGOCIO
**Problema**: Necesitamos una capa de abstracción entre la lógica de negocio y Prisma ORM que encapsule todas las operaciones CRUD sobre solicitudes, permitiendo cambiar la implementación de persistencia sin afectar capas superiores.

**Usuarios**: Servicios de negocio (SolicitudService) que necesitan persistir, consultar y actualizar solicitudes sin conocer detalles de Prisma.

**Valor**: Separación de responsabilidades (Clean Architecture), testabilidad (mock del repositorio), y flexibilidad para cambiar ORM en el futuro.

## ESPECIFICACIÓN FUNCIONAL

### Funcionalidad Principal
Implementar repositorio `SolicitudRepository` que exponga operaciones de acceso a datos:
- Guardar solicitud nueva (INSERT)
- Actualizar solicitud existente (UPDATE)
- Obtener solicitud por ID (SELECT WHERE id)
- Listar solicitudes por estado (SELECT WHERE estado)
- Listar solicitudes recientes (SELECT ORDER BY)
- Buscar por email de cliente (SELECT WHERE email)
- Contar solicitudes por estado (COUNT)

### Casos de Uso
1. **Guardar solicitud nueva**: Insertar registro completo en tabla solicitudes
2. **Actualizar campos parcialmente**: Modificar solo campos enviados (guardado progresivo)
3. **Consultar por ID único**: Buscar una solicitud específica por ULID
4. **Filtrar por estado**: Obtener lista de solicitudes con estado específico
5. **Listar recientes**: Obtener últimas N solicitudes ordenadas por fecha de creación
6. **Historial de cliente**: Buscar todas las solicitudes de un email
7. **Métricas**: Contar solicitudes por estado (dashboard)

### Criterios de Aceptación
- ✅ Clase `SolicitudRepository` con 8 métodos públicos
- ✅ Todos los métodos retornan Promises
- ✅ Uso correcto de Prisma client (operaciones `create`, `findUnique`, `findMany`, `update`, `count`)
- ✅ Manejo de null safety (TypeScript strict)
- ✅ Propagación de errores de Prisma sin modificar
- ✅ **SIN lógica de negocio** (solo operaciones de datos)
- ✅ Queries optimizadas con `select` cuando no se necesitan todos los campos
- ✅ Uso de índices definidos en schema (WHERE en campos indexados)
- ✅ Documentación JSDoc en cada método
- ✅ Tipos TypeScript correctos importados de Prisma

## ARQUITECTURA TÉCNICA

### Stack Tecnológico
- Prisma Client 5.x
- TypeScript 5.x (strict mode)
- Tipos generados por Prisma

### Principios de Diseño del Repositorio

#### Separation of Concerns
- Repositorio SOLO maneja persistencia
- NO contiene validaciones de negocio (eso va en servicios)
- NO contiene lógica de transformación (eso va en servicios)

#### Single Responsibility
- Una única razón para cambiar: cambios en modelo de datos

#### Dependency Inversion
- Servicios dependen de interfaz del repositorio, no de implementación concreta
- Permite crear mocks para testing

### Estructura de Archivos
```
lib/
├── repositories/
│   ├── solicitudRepository.ts      (implementación)
│   └── types.ts                    (tipos auxiliares)
└── db/
    └── prisma.ts                   (ya existe)
```

## IMPLEMENTACIÓN

### Archivo: `lib/repositories/solicitudRepository.ts`

```typescript
/**
 * Repositorio para operaciones CRUD sobre la entidad Solicitud
 * 
 * Responsabilidades:
 * - Abstracción de Prisma ORM
 * - Operaciones de lectura/escritura en tabla solicitudes
 * - Queries optimizadas con índices
 * 
 * NO incluye:
 * - Lógica de negocio (va en servicios)
 * - Validaciones (va en schemas Zod)
 * - Transformaciones de datos
 * 
 * @module SolicitudRepository
 */

import { prisma } from '@/lib/db/prisma';
import { Solicitud, Prisma } from '@prisma/client';

/**
 * Tipo para datos de creación de solicitud
 * Excluye campos automáticos (createdAt, updatedAt)
 */
export type CrearSolicitudInput = Omit<Prisma.SolicitudCreateInput, 'createdAt' | 'updatedAt'>;

/**
 * Tipo para actualización parcial de solicitud
 */
export type ActualizarSolicitudInput = Prisma.SolicitudUpdateInput;

/**
 * Clase que encapsula todas las operaciones de acceso a datos de Solicitudes
 */
export class SolicitudRepository {
  /**
   * Guarda una nueva solicitud en la base de datos
   * 
   * @param data - Datos completos de la solicitud
   * @returns Solicitud creada con timestamps generados
   * @throws Error si la inserción falla (violación de constraint, DB down, etc.)
   * 
   * @example
   * const solicitud = await repo.guardar({
   *   id: ulid(),
   *   empresa: "ACME",
   *   contacto: "Juan Pérez",
   *   email: "juan@acme.com",
   *   // ... resto de campos
   * });
   */
  async guardar(data: CrearSolicitudInput): Promise<Solicitud> {
    return await prisma.solicitud.create({
      data,
    });
  }

  /**
   * Obtiene una solicitud por su ID único
   * 
   * @param id - ULID de 26 caracteres
   * @returns Solicitud encontrada o null si no existe
   * 
   * @example
   * const solicitud = await repo.obtenerPorId('01JXX2Y3Z4A5B6C7D8E9F0G1H2');
   * if (!solicitud) {
   *   throw new Error('Solicitud no encontrada');
   * }
   */
  async obtenerPorId(id: string): Promise<Solicitud | null> {
    return await prisma.solicitud.findUnique({
      where: { id },
    });
  }

  /**
   * Actualiza campos específicos de una solicitud existente
   * 
   * @param id - ULID de la solicitud a actualizar
   * @param data - Campos a actualizar (parcial)
   * @returns Solicitud actualizada
   * @throws Error si el ID no existe
   * 
   * @example
   * // Guardado progresivo: actualizar solo email
   * const solicitud = await repo.actualizar('01JXX...', {
   *   email: 'nuevo@email.com'
   * });
   */
  async actualizar(id: string, data: ActualizarSolicitudInput): Promise<Solicitud> {
    return await prisma.solicitud.update({
      where: { id },
      data,
    });
  }

  /**
   * Lista solicitudes filtradas por estado
   * 
   * Usa índice en campo `estado` para performance
   * 
   * @param estado - Estado a filtrar (PENDIENTE, COTIZADO, etc.)
   * @param limit - Número máximo de resultados (default: sin límite)
   * @returns Array de solicitudes ordenadas por fecha descendente
   * 
   * @example
   * const pendientes = await repo.listarPorEstado('PENDIENTE', 10);
   */
  async listarPorEstado(
    estado: Prisma.EnumEstadoSolicitudFilter,
    limit?: number
  ): Promise<Solicitud[]> {
    return await prisma.solicitud.findMany({
      where: { estado },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Obtiene las solicitudes más recientes
   * 
   * Usa índice en `createdAt` (descendente) para performance
   * 
   * @param limit - Número máximo de resultados (default: 10)
   * @returns Array de solicitudes más recientes
   * 
   * @example
   * const recientes = await repo.listarRecientes(5);
   */
  async listarRecientes(limit: number = 10): Promise<Solicitud[]> {
    return await prisma.solicitud.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Busca todas las solicitudes de un cliente por email
   * 
   * Usa índice en campo `email` para performance
   * 
   * @param email - Email del cliente
   * @returns Array de solicitudes del cliente ordenadas por fecha descendente
   * 
   * @example
   * const historial = await repo.buscarPorEmail('juan@acme.com');
   */
  async buscarPorEmail(email: string): Promise<Solicitud[]> {
    return await prisma.solicitud.findMany({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Cuenta el número de solicitudes con un estado específico
   * 
   * Útil para métricas y dashboard
   * 
   * @param estado - Estado a contar
   * @returns Número de solicitudes
   * 
   * @example
   * const pendientes = await repo.contarPorEstado('PENDIENTE');
   * console.log(`Hay ${pendientes} solicitudes pendientes`);
   */
  async contarPorEstado(estado: Prisma.EnumEstadoSolicitudFilter): Promise<number> {
    return await prisma.solicitud.count({
      where: { estado },
    });
  }

  /**
   * Obtiene métricas agregadas de solicitudes
   * 
   * @returns Objeto con conteos por estado
   * 
   * @example
   * const metricas = await repo.obtenerMetricas();
   * // { pendiente: 5, cotizado: 10, rechazado: 2, cerrado: 15 }
   */
  async obtenerMetricas(): Promise<{
    pendiente: number;
    enProgreso: number;
    completada: number;
    cotizado: number;
    rechazado: number;
    cerrado: number;
  }> {
    const [pendiente, enProgreso, completada, cotizado, rechazado, cerrado] = await Promise.all([
      this.contarPorEstado('PENDIENTE'),
      this.contarPorEstado('EN_PROGRESO'),
      this.contarPorEstado('COMPLETADA'),
      this.contarPorEstado('COTIZADO'),
      this.contarPorEstado('RECHAZADO'),
      this.contarPorEstado('CERRADO'),
    ]);

    return {
      pendiente,
      enProgreso,
      completada,
      cotizado,
      rechazado,
      cerrado,
    };
  }
}

// Exportar instancia única (singleton)
export const solicitudRepository = new SolicitudRepository();
```

### Patrón Singleton vs Factory

**Opción elegida: Singleton**
```typescript
export const solicitudRepository = new SolicitudRepository();
```

**Razón**: 
- Repositorio no tiene estado mutable
- Prisma client ya es singleton
- Simplifica imports en servicios

**Uso en servicios:**
```typescript
import { solicitudRepository } from '@/lib/repositories/solicitudRepository';

// Usar directamente
const solicitud = await solicitudRepository.obtenerPorId(id);
```

### Manejo de Errores

**Estrategia**: Propagar errores de Prisma sin modificar

**Errores comunes de Prisma:**
- `P2002`: Unique constraint violation
- `P2025`: Record not found (en update/delete)
- `P2003`: Foreign key constraint violation
- `P1001`: Can't reach database

**Handling en capa superior (servicios):**
```typescript
// En SolicitudService
try {
  return await solicitudRepository.guardar(data);
} catch (error) {
  if (error.code === 'P2002') {
    throw new Error('Ya existe una solicitud con ese ID');
  }
  if (error.code === 'P2025') {
    throw new Error('Solicitud no encontrada');
  }
  // Propagar otros errores
  throw error;
}
```

### Performance y Optimizaciones

#### 1. Uso de Índices
Todas las queries WHERE usan campos indexados:
- `WHERE id` → Primary key (index automático)
- `WHERE estado` → Índice explícito en schema
- `WHERE email` → Índice explícito en schema
- `ORDER BY createdAt DESC` → Índice explícito en schema

#### 2. Limit en Queries
```typescript
listarPorEstado(estado, limit?: number)
listarRecientes(limit: number = 10)
```
**Razón**: Evitar cargar tablas completas en memoria

#### 3. Select Específico (para futuras optimizaciones)
```typescript
// Si en el futuro solo necesitas algunos campos:
async listarIdsRecientes(limit: number): Promise<string[]> {
  const solicitudes = await prisma.solicitud.findMany({
    select: { id: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return solicitudes.map(s => s.id);
}
```

#### 4. Queries en Paralelo
```typescript
// obtenerMetricas() usa Promise.all para ejecutar
// 6 COUNT queries en paralelo en lugar de secuencial
await Promise.all([
  this.contarPorEstado('PENDIENTE'),
  this.contarPorEstado('COTIZADO'),
  // ...
]);
```

## RESTRICCIONES Y CALIDAD

### Performance
- Queries SIEMPRE usan índices definidos
- Evitar N+1 queries (usar include/select cuando sea apropiado)
- Límites por defecto en listas (max 100 registros)

### Seguridad
- NO construir queries SQL raw (solo Prisma methods)
- NO exponer errores de BD al cliente (manejar en servicios)

### Testing
Validar cada método con casos:
- Happy path (inserción/consulta exitosa)
- Not found (consulta de ID inexistente)
- Error de constraint (ID duplicado)

### Estándares de Código
- JSDoc en todos los métodos públicos
- Nombres descriptivos (obtenerPorId, no get)
- Async/await (no callbacks ni .then())
- Tipos explícitos en returns

## ENTREGABLES

### Checklist de Completitud
- [ ] Archivo `lib/repositories/solicitudRepository.ts` creado
- [ ] 8 métodos públicos implementados correctamente
- [ ] JSDoc completo en cada método
- [ ] Tipos TypeScript correctos (importados de Prisma)
- [ ] Singleton exportado como `solicitudRepository`
- [ ] Sin errores de TypeScript (validar con `npx tsc --noEmit`)

### Métodos Implementados
1. ✅ `guardar(data)` → INSERT
2. ✅ `obtenerPorId(id)` → SELECT WHERE id
3. ✅ `actualizar(id, data)` → UPDATE WHERE id
4. ✅ `listarPorEstado(estado, limit?)` → SELECT WHERE estado
5. ✅ `listarRecientes(limit)` → SELECT ORDER BY createdAt
6. ✅ `buscarPorEmail(email)` → SELECT WHERE email
7. ✅ `contarPorEstado(estado)` → COUNT WHERE estado
8. ✅ `obtenerMetricas()` → Agregación de múltiples COUNT

### Validación Manual (en script de testing)

```typescript
// test/repository.test.ts (opcional)
import { solicitudRepository } from '@/lib/repositories/solicitudRepository';
import { ulid } from 'ulid';

async function testRepository() {
  // 1. Guardar
  const nuevaSolicitud = await solicitudRepository.guardar({
    id: ulid(),
    empresa: 'Test Corp',
    contacto: 'Test User',
    email: 'test@test.com',
    telefono: '+573001234567',
    tipoServicio: 'URBANO',
    origen: 'Bogotá',
    tipoCarga: 'MERCANCIA_EMPRESARIAL',
    pesoKg: 1000,
    dimensiones: '100x100x100',
    valorAsegurado: 5000000,
    condicionesCargue: ['muelle'],
    fechaRequerida: new Date('2026-03-01'),
    estado: 'PENDIENTE',
    revisionEspecial: false,
  });
  console.log('✅ Solicitud guardada:', nuevaSolicitud.id);

  // 2. Obtener por ID
  const obtenida = await solicitudRepository.obtenerPorId(nuevaSolicitud.id);
  console.log('✅ Solicitud obtenida:', obtenida?.empresa);

  // 3. Actualizar
  const actualizada = await solicitudRepository.actualizar(nuevaSolicitud.id, {
    estado: 'COTIZADO',
  });
  console.log('✅ Estado actualizado:', actualizada.estado);

  // 4. Listar por estado
  const cotizadas = await solicitudRepository.listarPorEstado('COTIZADO', 5);
  console.log('✅ Solicitudes cotizadas:', cotizadas.length);

  // 5. Métricas
  const metricas = await solicitudRepository.obtenerMetricas();
  console.log('✅ Métricas:', metricas);
}

testRepository().catch(console.error);
```

## NOTAS IMPORTANTES

### ⚠️ NO IMPLEMENTAR EN ESTA FASE
- ❌ Servicios de negocio (siguiente prompt)
- ❌ Validaciones con Zod
- ❌ Generación de ULID (se hará en servicios)
- ❌ Transformaciones de datos
- ❌ Logging estructurado
- ❌ Tests unitarios formales (opcional)

### ✅ SÍ HACER EN ESTA FASE
- ✅ Implementar todos los métodos del repositorio
- ✅ Documentar con JSDoc
- ✅ Validar tipos TypeScript
- ✅ Exportar singleton
- ✅ Probar manualmente con script (opcional)

### Próximo Paso
Una vez completado este prompt, continuar con **PROMPT 4: CAPA DE SERVICIOS (BUSINESS LOGIC LAYER)**.

### Troubleshooting Común

**Error**: "Type 'Prisma.Decimal' is not assignable to type 'number'"  
**Solución**: Usar `Prisma.Decimal` para pesoKg y valorAsegurado

**Error**: "Property 'solicitud' does not exist on type 'PrismaClient'"  
**Solución**: Ejecutar `npx prisma generate` para regenerar tipos

**Error**: "Cannot find module '@/lib/db/prisma'"  
**Solución**: Validar que tsconfig.json tenga `paths: { "@/*": ["./*"] }`

---

**Objetivo Final**: Capa de acceso a datos completa y lista para ser consumida por servicios de negocio.
