# PROMPT 2: MODELO DE DATOS Y PRISMA SCHEMA

## CONTEXTO DE NEGOCIO
**Problema**: Necesitamos definir el esquema de base de datos PostgreSQL que almacenará todas las solicitudes de cotización con sus 15+ campos, validaciones a nivel de BD y relaciones futuras.

**Usuarios**: Desarrolladores backend que necesitan persistir datos de solicitudes de transporte con información completa de servicio, carga y cliente.

**Valor**: Tener un esquema de datos robusto, normalizado y con constraints que garantice integridad de datos desde la capa de persistencia.

## ESPECIFICACIÓN FUNCIONAL

### Funcionalidad Principal
Definir modelo Prisma completo para tabla `solicitudes` que incluya:
- Todos los campos de negocio (empresa, contacto, servicio, carga, etc.)
- Tipos de datos apropiados (String, Decimal, DateTime, Enum, Json)
- Enumeraciones para tipos controlados (TipoServicio, TipoCarga, EstadoSolicitud)
- Constraints de base de datos (NOT NULL, CHECK, DEFAULT)
- Índices para consultas frecuentes
- Timestamps automáticos (createdAt, updatedAt)

### Casos de Uso
1. **Insertar solicitud completa**: Crear registro con todos los campos obligatorios
2. **Actualizar solicitud parcial**: Modificar uno o más campos (guardado progresivo)
3. **Consultar por ID**: Buscar solicitud específica por ULID
4. **Consultar por estado**: Filtrar solicitudes PENDIENTE, COTIZADO, etc.
5. **Consultar por email**: Buscar todas las solicitudes de un cliente
6. **Consultas recientes**: Ordenar por fecha de creación descendente

### Criterios de Aceptación
- ✅ Modelo `Solicitud` con 18 campos definidos según especificación técnica
- ✅ Enums `TipoServicio`, `TipoCarga`, `EstadoSolicitud` definidos
- ✅ Campo `id` tipo String (para ULID de 26 caracteres)
- ✅ Campos `Decimal` para peso y valor asegurado (precisión monetaria)
- ✅ Campo `Json` para condicionesCargue (array de strings)
- ✅ Índices en: estado, fechaCreacion, email, empresa
- ✅ Defaults: estado = PENDIENTE, revisionEspecial = false
- ✅ Timestamps automáticos (createdAt, updatedAt)
- ✅ Comando `npx prisma migrate dev` genera migración sin errores
- ✅ Cliente Prisma regenerado con tipos TypeScript correctos

## ARQUITECTURA TÉCNICA

### Stack Tecnológico
- Prisma ORM 5.x
- PostgreSQL 16.x
- TypeScript 5.x (para tipos generados)

### Schema Prisma Completo

**Archivo:** `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// ENUMERACIONES
// ============================================

enum TipoServicio {
  URBANO     @map("urbano")
  NACIONAL   @map("nacional")
}

enum TipoCarga {
  MERCANCIA_EMPRESARIAL  @map("mercancia_empresarial")
  MAQUINARIA             @map("maquinaria")  
  MUEBLES_EMBALADOS      @map("muebles_embalados")
}

enum EstadoSolicitud {
  EN_PROGRESO  @map("en_progreso")
  COMPLETADA   @map("completada")
  PENDIENTE    @map("pendiente")
  COTIZADO     @map("cotizado")
  RECHAZADO    @map("rechazado")
  CERRADO      @map("cerrado")
}

// ============================================
// MODELO PRINCIPAL
// ============================================

model Solicitud {
  // === IDENTIFICACIÓN ===
  id              String   @id @default(cuid())  // ULID se generará en código
  
  // === DATOS DEL SERVICIO ===
  tipoServicio    TipoServicio
  origen          String   @db.VarChar(200)
  destino         String?  @db.VarChar(200)     // Opcional: solo si tipo = NACIONAL
  
  // === DATOS DE LA CARGA ===
  tipoCarga       TipoCarga
  pesoKg          Decimal  @db.Decimal(10, 2)   // Máx 99,999,999.99 kg
  dimensiones     String   @db.Text             // Formato libre: "200×150×100" o JSON
  valorAsegurado  Decimal  @db.Decimal(15, 2)   // Máx $9,999,999,999,999.99
  
  // === CONDICIONES Y FECHAS ===
  condicionesCargue Json                        // Array: ["muelle", "montacargas", "manual"]
  fechaRequerida    DateTime @db.Date           // Solo fecha, sin hora
  
  // === DATOS DEL CLIENTE ===
  empresa         String   @db.VarChar(200)
  contacto        String   @db.VarChar(200)
  telefono        String   @db.VarChar(20)
  email           String   @db.VarChar(100)
  
  // === ESTADO Y FLAGS ===
  estado          EstadoSolicitud @default(PENDIENTE)
  revisionEspecial Boolean  @default(false)     // Automático si peso > 10 toneladas
  
  // === TIMESTAMPS ===
  createdAt       DateTime @default(now())      @map("created_at")
  updatedAt       DateTime @updatedAt           @map("updated_at")
  
  // === ÍNDICES ===
  @@index([estado])
  @@index([createdAt(sort: Desc)])
  @@index([email])
  @@index([empresa])
  
  @@map("solicitudes")
}
```

### Explicación de Decisiones Técnicas

#### 1. Tipo de ID: String (para ULID)
**Razón**: ULID (26 caracteres) en lugar de UUID para:
- IDs ordenables lexicográficamente por tiempo de creación
- Más cortos que UUID (26 vs 36 caracteres)
- Mejor rendimiento en índices

**Implementación**: Se generará con librería `ulid` en código antes de insertar:
```typescript
import { ulid } from 'ulid';
const id = ulid(); // "01JXX2Y3Z4A5B6C7D8E9F0G1H2"
```

#### 2. Decimal en lugar de Float
**Razón**: Para `pesoKg` y `valorAsegurado`:
- Precisión exacta (sin errores de redondeo)
- Esencial para valores monetarios
- PostgreSQL `NUMERIC` es ideal para esto

**Precisión**:
- `Decimal(10, 2)` para peso: hasta 99,999,999.99 kg (99 mil toneladas)
- `Decimal(15, 2)` para valor: hasta $9,999,999,999,999.99

#### 3. Json para condicionesCargue
**Razón**: Múltiples selecciones de un conjunto fijo
**Formato almacenado**: `["muelle", "montacargas", "manual"]`
**Alternativa descartada**: Tabla muchos-a-muchos (overkill para MVP)

#### 4. DateTime vs Date
**fechaRequerida**: `@db.Date` → Solo fecha (2026-03-01)  
**createdAt/updatedAt**: `DateTime` → Timestamp completo (2026-02-19T15:30:00Z)

#### 5. Campos Opcionales
Solo `destino` es opcional (`String?`) porque es condicional:
- Si tipoServicio = URBANO → destino = null
- Si tipoServicio = NACIONAL → destino requerido (validado en capa de negocio)

### Índices y Performance

#### Índice en `estado`
**Query optimizada**: 
```sql
SELECT * FROM solicitudes WHERE estado = 'PENDIENTE';
```
**Frecuencia**: Alta (panel admin)

#### Índice en `createdAt` (descendente)
**Query optimizada**:
```sql
SELECT * FROM solicitudes ORDER BY created_at DESC LIMIT 10;
```
**Frecuencia**: Alta (listar recientes)

#### Índice en `email`
**Query optimizada**:
```sql
SELECT * FROM solicitudes WHERE email = 'cliente@empresa.com';
```
**Frecuencia**: Media (historial de cliente)

#### Índice en `empresa`
**Query optimizada**:
```sql
SELECT * FROM solicitudes WHERE empresa LIKE '%ACME%';
```
**Frecuencia**: Media (búsqueda en panel admin)

### Mapeo de Nombres

**Convención**: 
- Prisma: camelCase (tipoServicio)
- PostgreSQL: snake_case (tipo_servicio)

**Razón**: Seguir convenciones de cada tecnología
- TypeScript/JavaScript: camelCase
- SQL: snake_case

**Implementación**: `@map()` en enums y campos, `@@map()` en modelo

### Constraints a Nivel de Base de Datos

**Implícitos en Prisma (generados en migración):**
- NOT NULL en todos los campos sin `?`
- DEFAULT 'pendiente' en estado
- DEFAULT false en revisionEspecial
- DEFAULT NOW() en createdAt
- UPDATE trigger para updatedAt

**A validar en capa de negocio (NO en BD):**
- Peso > 0 y < 50,000 kg
- Valor asegurado > 0
- Email formato válido
- Teléfono formato internacional
- Fecha requerida >= hoy
- Destino obligatorio si tipo = NACIONAL

## RESTRICCIONES Y CALIDAD

### Performance
- Índices en campos de filtrado frecuente
- ULID permite ordenamiento sin timestamp adicional
- Evitar full table scans

### Seguridad
- Migración usa DATABASE_URL de .env (nunca hardcoded)
- Campos de texto con límites de tamaño (prevenir ataques)

### Testing de Migración
Validar después de crear migración:
```bash
npx prisma migrate dev --name init_solicitudes
npx prisma generate
npx prisma studio  # Inspeccionar esquema visualmente
```

### Estándares de Código
- Nombres de modelos: PascalCase singular (Solicitud)
- Nombres de campos: camelCase (fechaRequerida)
- Nombres de enums: PascalCase (TipoServicio)
- Valores de enums: UPPER_SNAKE_CASE (MERCANCIA_EMPRESARIAL)

## ENTREGABLES

### Checklist de Completitud
- [ ] Schema Prisma completo en `prisma/schema.prisma`
- [ ] Migración generada con `npx prisma migrate dev --name init_solicitudes`
- [ ] Cliente Prisma regenerado (`npx prisma generate`)
- [ ] Tipos TypeScript generados en `node_modules/.prisma/client`
- [ ] Validación de esquema en Prisma Studio
- [ ] Archivo de migración SQL en `prisma/migrations/`

### Tipos TypeScript Generados

Prisma generará automáticamente:

```typescript
// En node_modules/.prisma/client/index.d.ts

export type TipoServicio = 'URBANO' | 'NACIONAL';
export type TipoCarga = 'MERCANCIA_EMPRESARIAL' | 'MAQUINARIA' | 'MUEBLES_EMBALADOS';
export type EstadoSolicitud = 'EN_PROGRESO' | 'COMPLETADA' | 'PENDIENTE' | 'COTIZADO' | 'RECHAZADO' | 'CERRADO';

export type Solicitud = {
  id: string;
  tipoServicio: TipoServicio;
  origen: string;
  destino: string | null;
  tipoCarga: TipoCarga;
  pesoKg: Prisma.Decimal;
  dimensiones: string;
  valorAsegurado: Prisma.Decimal;
  condicionesCargue: Prisma.JsonValue;
  fechaRequerida: Date;
  empresa: string;
  contacto: string;
  telefono: string;
  email: string;
  estado: EstadoSolicitud;
  revisionEspecial: boolean;
  createdAt: Date;
  updatedAt: Date;
};
```

### Comandos de Validación
```bash
# Generar y aplicar migración
npx prisma migrate dev --name init_solicitudes

# Regenerar cliente Prisma
npx prisma generate

# Validar esquema
npx prisma validate

# Inspeccionar en UI
npx prisma studio

# Ver SQL generado
cat prisma/migrations/*/migration.sql
```

### Ejemplo de Inserción (para testing manual)
```typescript
// En Prisma Studio o script de seed:
{
  id: "01JXX2Y3Z4A5B6C7D8E9F0G1H2",  // ULID generado
  tipoServicio: "NACIONAL",
  origen: "Bogotá",
  destino: "Medellín",
  tipoCarga: "MERCANCIA_EMPRESARIAL",
  pesoKg: 5000.50,
  dimensiones: "200×150×100 cm",
  valorAsegurado: 25000000.00,
  condicionesCargue: ["muelle", "montacargas"],
  fechaRequerida: new Date("2026-03-01"),
  empresa: "ACME Transport",
  contacto: "Juan Pérez",
  telefono: "+573001234567",
  email: "juan@acme.com",
  estado: "PENDIENTE",
  revisionEspecial: false
}
```

## NOTAS IMPORTANTES

### ⚠️ NO IMPLEMENTAR EN ESTA FASE
- ❌ Repositorios (siguiente prompt)
- ❌ Servicios de negocio
- ❌ Generación de ULID (se hará en servicio)
- ❌ Validaciones de negocio (se harán con Zod)
- ❌ Seeds de datos de prueba (opcional, no crítico)

### ✅ SÍ HACER EN ESTA FASE
- ✅ Definir schema Prisma completo
- ✅ Generar migración inicial
- ✅ Regenerar cliente Prisma con tipos
- ✅ Validar esquema en Prisma Studio
- ✅ Verificar que tipos TypeScript estén disponibles

### Próximo Paso
Una vez completado este prompt, continuar con **PROMPT 3: CAPA DE REPOSITORIO (DATA ACCESS LAYER)**.

### Troubleshooting Común

**Error**: "Can't reach database server"  
**Solución**: Validar DATABASE_URL en .env, verificar que PostgreSQL esté corriendo

**Error**: "Unique constraint failed"  
**Solución**: ULID debe generarse antes de insertar, no usar IDs duplicados

**Error**: "Invalid DateTime"  
**Solución**: Usar objetos Date nativos de JavaScript o strings ISO 8601

---

**Objetivo Final**: Esquema de base de datos completo y listo para operaciones CRUD desde código.
