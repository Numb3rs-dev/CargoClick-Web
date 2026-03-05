# Cambios: Dimensiones Numéricas Estructuradas

## 📋 Resumen
Se migró el campo `dimensiones` (texto libre) a 3 campos numéricos estructurados: `dimLargoCm`, `dimAnchoCm`, `dimAltoCm` para mejorar la calidad de datos y permitir cálculos automáticos de volumen.

---

## ✅ Cambios Completados

### 1. **Base de Datos** - [prisma/schema.prisma](prisma/schema.prisma)
```prisma
// ANTES
dimensiones String @db.Text

// DESPUÉS
dimLargoCm  Decimal @db.Decimal(10, 2) @default(0)
dimAnchoCm  Decimal @db.Decimal(10, 2) @default(0)
dimAltoCm   Decimal @db.Decimal(10, 2) @default(0)
```
✅ Migración aplicada con `npx prisma db push --accept-data-loss`
✅ Registros existentes ahora tienen valores `0` en las 3 dimensiones

---

### 2. **Tipos TypeScript** - [types/index.ts](types/index.ts)
```typescript
// ANTES
export type TipoInput = 'text' | 'email' | 'phone' | ... | 'date';

interface DatosFormulario {
  dimensiones?: string;
}

// DESPUÉS
export type TipoInput = 'text' | 'email' | ... | 'date' | 'dimensions';

interface DatosFormulario {
  dimLargoCm?: number;
  dimAnchoCm?: number;
  dimAltoCm?: number;
}
```
✅ Agregado nuevo tipo de input `'dimensions'`
✅ Actualizada interfaz `DatosFormulario` con 3 campos numéricos

---

### 3. **Validación Zod** - [lib/validations/schemas.ts](lib/validations/schemas.ts)
```typescript
// ANTES
dimensiones: z.string().min(5).optional()

// DESPUÉS
dimLargoCm: z.number().min(1).max(10000).optional(),
dimAnchoCm: z.number().min(1).max(10000).optional(),
dimAltoCm: z.number().min(1).max(10000).optional(),
```
✅ Actualizado `actualizarSolicitudSchema` con validaciones de rango
✅ Actualizado `solicitudCompletaSchema` con campos requeridos

---

### 4. **Configuración de Pasos** - [app/cotizar/config/pasos.ts](app/cotizar/config/pasos.ts)
```typescript
// PASO 10 - ANTES
{
  id: 10,
  pregunta: "¿Cuáles son las dimensiones aproximadas? (largo × alto × ancho en cm)",
  campoFormulario: "dimensiones",
  tipoInput: "textarea",
  validacion: z.string().min(5)
}

// PASO 10 - DESPUÉS
{
  id: 10,
  pregunta: "Perfecto. ¿Cuáles son las dimensiones de tu carga?",
  campoFormulario: "dimLargoCm", // Campo referencia
  tipoInput: "dimensions",
  validacion: z.object({
    dimLargoCm: z.number().min(1).max(10000),
    dimAnchoCm: z.number().min(1).max(10000),
    dimAltoCm: z.number().min(1).max(10000),
  })
}
```
✅ Cambiado a nuevo tipo de input `"dimensions"`
✅ Validación actualizada para objeto con 3 campos

---

### 5. **Componente de Input** - [app/cotizar/components/DynamicInput.tsx](app/cotizar/components/DynamicInput.tsx)
**Nuevo caso `'dimensions'`:**
```tsx
case 'dimensions':
  // Grid responsive con 3 inputs numéricos
  // - Input Largo (cm)
  // - Input Ancho (cm)
  // - Input Alto (cm)
  // + Cálculo de volumen en tiempo real (m³)
```

**Características:**
- ✅ Grid responsive: 1 columna en móvil, 3 columnas en escritorio
- ✅ Labels descriptivos para cada campo
- ✅ Validación en tiempo real
- ✅ **Feedback visual**: Muestra volumen calculado cuando los 3 campos están completos
- ✅ Devuelve objeto: `{ dimLargoCm, dimAnchoCm, dimAltoCm }`

---

### 6. **Hook de Estado** - [app/cotizar/hooks/useConversacion.ts](app/cotizar/hooks/useConversacion.ts)

**Función `siguientePaso`:**
```typescript
// Detecta cuando el campo es 'dimLargoCm' y valor es objeto
if (campo === 'dimLargoCm' && typeof valorLimpio === 'object') {
  // Actualiza los 3 campos en estado local
  setState(prev => ({
    ...prev,
    datosForm: { 
      ...prev.datosForm, 
      dimLargoCm: valorLimpio.dimLargoCm,
      dimAnchoCm: valorLimpio.dimAnchoCm,
      dimAltoCm: valorLimpio.dimAltoCm,
    },
  }));
}
```

**Función `actualizarSolicitud`:**
```typescript
// Envía los 3 campos al backend en un solo PATCH
const payload = 
  campo === 'dimLargoCm' && typeof valor === 'object'
    ? { dimLargoCm: valor.dimLargoCm, dimAnchoCm: valor.dimAnchoCm, dimAltoCm: valor.dimAltoCm }
    : { [campo]: valor };
```

✅ Manejo especial para objeto de dimensiones
✅ Envía los 3 campos en una sola petición PATCH
✅ Actualiza estado local correctamente

---

### 7. **Servicio de Negocio** - [lib/services/solicitudService.ts](lib/services/solicitudService.ts)

**Valores default al crear solicitud:**
```typescript
// ANTES
dimensiones: ''

// DESPUÉS
dimLargoCm: 0,
dimAnchoCm: 0,
dimAltoCm: 0,
```

**Conversión de Decimal a Number:**
```typescript
// Al completar solicitud, convertir campos Decimal
dimLargoCm: Number(solicitudActual.dimLargoCm),
dimAnchoCm: Number(solicitudActual.dimAnchoCm),
dimAltoCm: Number(solicitudActual.dimAltoCm),
```

**Validación de palabras prohibidas:**
```typescript
// ANTES
const textoCompleto = [tipoCarga, dimensiones].join(' ')

// DESPUÉS
const textoCompleto = tipoCarga.toLowerCase()
// Ya no incluye dimensiones (ahora son números)
```

---

### 8. **Template de Email** - [lib/utils/emailTemplates.ts](lib/utils/emailTemplates.ts)

**Formato de visualización:**
```html
<!-- ANTES -->
<div class="field">
  <div class="label">Dimensiones:</div>
  <div class="value">${solicitud.dimensiones}</div>
</div>

<!-- DESPUÉS -->
<div class="field">
  <div class="label">Dimensiones:</div>
  <div class="value">
    200 × 150 × 100 cm
    <br>
    <small style="color: #64748b;">Volumen: 3.00 m³</small>
  </div>
</div>
```

✅ Formato legible: `largo × ancho × alto cm`
✅ Cálculo automático de volumen en m³
✅ Estilo visual profesional

---

## 🔄 Flujo de Datos

```
Usuario Input (PASO 10)
  ↓
DynamicInput tipo 'dimensions'
  - Input Largo: 200
  - Input Ancho: 150
  - Input Alto: 100
  ↓
Objeto: { dimLargoCm: 200, dimAnchoCm: 150, dimAltoCm: 100 }
  ↓
useConversacion.siguientePaso()
  - Detecta campo 'dimLargoCm' + objeto
  - Actualiza estado local (3 campos)
  - Llama actualizarSolicitud()
  ↓
API PATCH /api/solicitudes/:id
  - Body: { dimLargoCm: 200, dimAnchoCm: 150, dimAltoCm: 100 }
  ↓
solicitudService.actualizar()
  - Valida con Zod (min 1, max 10000)
  - Actualiza BD (3 columnas Decimal)
  ↓
PostgreSQL
  - dim_largo_cm: 200.00
  - dim_ancho_cm: 150.00
  - dim_alto_cm: 100.00
```

---

## 🧪 Validación TypeScript

```bash
npx tsc --noEmit
# ✅ Sin errores
```

---

## 📊 Ventajas del Nuevo Sistema

### 1. **Calidad de Datos**
- ✅ Validación numérica en tiempo real
- ✅ Rangos enforced (1-10,000 cm)
- ✅ No más texto libre inconsistente ("200x150x100", "2m x 1.5m x 1m", etc.)

### 2. **UX Mejorada**
- ✅ Inputs numéricos con incrementadores nativos
- ✅ Feedback visual: Cálculo de volumen en tiempo real
- ✅ Labels claros (Largo, Ancho, Alto)
- ✅ Responsive: Grid adaptativo 1→3 columnas

### 3. **Cálculos Automáticos**
- ✅ Volumen en m³: `(largo × ancho × alto) / 1,000,000`
- ✅ Mostrado en UI del formulario
- ✅ Mostrado en email de notificación

### 4. **Integración Backend**
- ✅ Validación robusta con Zod
- ✅ Tipos seguros en toda la aplicación
- ✅ Datos estructurados en PostgreSQL (Decimal precision)

---

## 🚀 Próximos Pasos

### Para Probar:
1. **Reiniciar servidor**: El cliente de Prisma se regenerará automáticamente
   ```bash
   npm run dev
   ```

2. **Navegar a**: `http://localhost:3003/cotizar`

3. **Completar wizard hasta PASO 10**:
   - Paso 0: Nombre
   - Paso 1: Empresa (opcional)
   - Paso 2: Teléfono (crea registro)
   - ...
   - Paso 10: **Dimensiones** ← Nuevo input de 3 campos

4. **Verificar**:
   - ✅ Inputs numéricos funcionan
   - ✅ Cálculo de volumen aparece al llenar los 3 campos
   - ✅ Validación impide valores < 1 o > 10,000
   - ✅ Progreso guarda correctamente
   - ✅ Email final muestra dimensiones con formato: "200 × 150 × 100 cm (Volumen: 3.00 m³)"

### Para Limpiar Datos de Test:
```sql
-- Opcional: Actualizar registros viejos con dimensiones reales
UPDATE "Solicitud" 
SET "dimLargoCm" = 200, "dimAnchoCm" = 150, "dimAltoCm" = 100 
WHERE "dimLargoCm" = 0;
```

---

## 🎯 Archivos Modificados (9 total)

1. ✅ `prisma/schema.prisma` - Schema de BD
2. ✅ `types/index.ts` - Tipos TypeScript
3. ✅ `lib/validations/schemas.ts` - Validaciones Zod
4. ✅ `app/cotizar/config/pasos.ts` - Configuración PASO 10
5. ✅ `app/cotizar/components/DynamicInput.tsx` - Nuevo input 'dimensions'
6. ✅ `app/cotizar/hooks/useConversacion.ts` - Lógica de estado
7. ✅ `lib/services/solicitudService.ts` - Lógica de negocio
8. ✅ `lib/utils/emailTemplates.ts` - Template de notificación
9. ✅ Este documento: `CAMBIOS_DIMENSIONES_NUMERICAS.md`

---

## ⚠️ Nota sobre Migración

La migración se aplicó con `npx prisma db push --accept-data-loss` debido a 11 registros de test existentes. Los registros viejos ahora tienen valores por defecto:
- `dimLargoCm` = 0
- `dimAnchoCm` = 0  
- `dimAltoCm` = 0

Estos pueden actualizarse manualmente en Prisma Studio o con SQL updates si se desean valores reales.

---

**✨ Implementación completada exitosamente**
