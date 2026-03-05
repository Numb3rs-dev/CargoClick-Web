# 🧪 GUÍA DE TESTING CON POSTMAN

## 📋 Descripción General

Esta guía explica cómo usar la colección de Postman para probar todos los endpoints del Sistema de Solicitudes de Transporte B2B.

---

## 🚀 Configuración Inicial

### 1. Importar Colección y Environment en Postman

1. Abre Postman
2. Click en **Import** (arriba a la izquierda)
3. Arrastra o selecciona **AMBOS** archivos:
   - `Postman_Collection_Solicitudes.json`
   - `Postman_Environment_Local.json`
4. La colección aparecerá como **"Sistema Solicitudes - API REST"**
5. El environment aparecerá como **"Solicitudes API - Local Development"**

### 2. Activar Environment

1. Click en el **selector de Environment** (esquina superior derecha)
2. Selecciona **"Solicitudes API - Local Development"**
3. Verifica que aparezca el icono de ✓ (check) al lado del nombre

**Variables incluidas:**

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `base_url` | `http://localhost:3000` | URL base del servidor local |
| `solicitud_id` | (vacío) | Se llena automáticamente al crear solicitud |

**NOTA:** La variable `solicitud_id` se guarda **automáticamente** cuando ejecutas el request "POST - Crear Solicitud Exitosa" gracias a un script de test incluido en el collection.

### 3. Iniciar Servidor

Antes de probar, asegúrate de que el servidor esté corriendo:

```bash
# Terminal 1: Iniciar base de datos PostgreSQL (si es local)
# Windows con PostgreSQL instalado:
# El servicio ya debe estar corriendo

# Terminal 2: Iniciar servidor Next.js
cd G:\DEV\Workspace\Personales\Aplicacion-web-rapida
npm run dev
```

**Verificar que veas:**
```
✓ Ready in Xms
○ Local:   http://localhost:3000
```

---

## 🎯 Flujo de Testing Recomendado

### Flujo Completo End-to-End (Happy Path)

Ejecuta los requests en este orden para probar el flujo completo:

#### 1. **Health Check**
- Carpeta: `1. Health Check`
- Request: `Health Check - Success`
- Verifica conectividad del sistema

**✅ Expected:** Status 200, `"database": "connected"`

---

#### 2. **Crear Solicitud Inicial**
- Carpeta: `2. Crear Solicitud Inicial`
- Request: `POST - Crear Solicitud Exitosa`
- Crea nueva solicitud

**✅ Expected:** Status 201, estado `"EN_PROGRESO"`
**📝 NOTA IMPORTANTE:** El ID se guarda automáticamente en `{{solicitud_id}}`

---

#### 3. **Actualizar Progresivamente (12 pasos)**
- Carpeta: `3. Actualizar Solicitud Progresivamente`
- Ejecutar **EN ORDEN** todos los requests:

1. `PATCH - Actualizar Contacto`
2. `PATCH - Actualizar Email`
3. `PATCH - Actualizar Teléfono`
4. `PATCH - Actualizar Tipo Servicio y Origen`
5. `PATCH - Actualizar Destino`
6. `PATCH - Actualizar Tipo Carga y Peso`
7. `PATCH - Actualizar Dimensiones`
8. `PATCH - Actualizar Valor Asegurado`
9. `PATCH - Actualizar Condiciones Cargue`

**✅ Expected:** Cada request retorna status 200 con solicitud actualizada

---

#### 4. **Completar Solicitud**
- Carpeta: `4. Completar Solicitud`
- Request: `PATCH - Completar Solicitud (envía notificaciones)`
- Finaliza solicitud y dispara notificaciones

**✅ Expected:** 
- Status 200
- Estado cambia a `"COMPLETADA"`
- Mensaje: `"Solicitud completada. Notificaciones enviadas."`

**📧 Verificar en consola del servidor:**
```
[NotificacionService] Enviando notificaciones...
[EmailService] Email al cliente enviado exitosamente
[EmailService] Email al admin enviado exitosamente
[WhatsAppService] WhatsApp enviado exitosamente
```

---

#### 5. **Obtener Solicitud Completada**
- Carpeta: `5. Obtener Solicitud`
- Request: `GET - Obtener Solicitud por ID`
- Consulta solicitud completada

**✅ Expected:** Status 200 con todos los datos completos

---

## 🧪 Testing de Casos de Error

### Errores de Validación (400)

#### 1. Empresa Vacía
- Carpeta: `2. Crear Solicitud Inicial`
- Request: `POST - Error Empresa Vacía`
- **Expected:** Status 400, error Zod con detalles

#### 2. ID Inválido
- Carpeta: `5. Obtener Solicitud`
- Request: `GET - Error ID Inválido (400)`
- **Expected:** Status 400, "ID inválido"

#### 3. Mudanza Rechazada (RN-02)
- Carpeta: `4. Completar Solicitud`
- Request: `PATCH - Error Mudanza Rechazada (RN-02)`
- **Expected:** Status 400, mensaje sobre mudanzas no permitidas

#### 4. Destino Faltante (RN-01)
- Carpeta: `6. Casos Avanzados`
- Request: `PATCH - Completar con Destino Faltante (RN-01)`
- **Expected:** Status 400, validación Zod sobre destino obligatorio

---

### Errores 404 (Not Found)

#### Solicitud No Existe
- Carpeta: `5. Obtener Solicitud`
- Request: `GET - Error ID No Existe (404)`
- **Expected:** Status 404, "Solicitud no encontrada"

---

## 🎓 Casos Avanzados

### Revisión Especial (RN-05)

- Carpeta: `6. Casos Avanzados`
- Request: `PATCH - Peso Alto (revisionEspecial = true)`
- Prueba cálculo automático de `revisionEspecial` cuando peso > 10,000 kg

**✅ Expected:** 
- `pesoKg`: 15000
- `revisionEspecial`: true

---

## 🔄 Ejecutar Todo el Flujo Automáticamente

Postman permite ejecutar toda la colección en secuencia:

### Opción 1: Collection Runner

1. Click derecho en la colección **"Sistema Solicitudes - API REST"**
2. Seleccionar **"Run collection"**
3. Configurar:
   - Iterations: 1
   - Delay: 500ms (para dar tiempo entre requests)
   - Save responses: ✓
4. Click **"Run Sistema Solicitudes - API REST"**

**Resultado:** Verás dashboard con todos los tests ejecutados y % de éxito.

### Opción 2: CLI con Newman

Si tienes Newman instalado:

```bash
newman run Postman_Collection_Solicitudes.json
```

---

## 📊 Verificaciones Post-Testing

### En Postman

✅ Todos los tests automáticos deben pasar (verde)  
✅ Variables de environment deben tener `solicitud_id` lleno  
✅ Responses deben seguir estructura estandarizada  

### En Consola del Servidor

✅ Logs de creación y actualización de solicitudes  
✅ Logs de validaciones Zod  
✅ Logs de envío de notificaciones  
✅ No debe haber errores no controlados  

### En Base de Datos (Opcional)

Puedes verificar directamente en PostgreSQL:

```sql
-- Ver todas las solicitudes
SELECT id, empresa, estado, "createdAt" 
FROM "Solicitud" 
ORDER BY "createdAt" DESC;

-- Ver solicitud específica
SELECT * 
FROM "Solicitud" 
WHERE id = '01JXX...'; -- Reemplazar con ID real
```

O usando Prisma Studio:

```bash
npx prisma studio
```

---

## 🐛 Troubleshooting

### Error: "ECONNREFUSED"
**Causa:** Servidor Next.js no está corriendo  
**Solución:** 
```bash
npm run dev
```

### Error: "Database connection failed"
**Causa:** PostgreSQL no está corriendo o DATABASE_URL incorrecta  
**Solución:**
1. Verifica PostgreSQL está corriendo
2. Revisa `.env` tiene `DATABASE_URL` correcta
3. Ejecuta `GET /api/health` para verificar conexión

### Error: "solicitud_id is not defined"
**Causa:** Variable no se guardó al crear solicitud  
**Solución:**
1. Ejecuta `POST - Crear Solicitud Exitosa` primero
2. Verifica que el script de test se ejecutó (tab "Test Results")
3. Manualmente copia el ID del response y úsalo en los PATCH

### Error: "Solicitud no encontrada" en PATCH
**Causa:** Intentando actualizar solicitud que no existe  
**Solución:**
1. Ejecuta `POST - Crear Solicitud Exitosa` primero
2. El ID debe estar en la variable `{{solicitud_id}}`
3. Si no funciona, copia el ID manualmente del response

---

## 📝 Personalización de Tests

### Modificar Datos de Prueba

Puedes cambiar los datos en los request bodies:

```json
// Ejemplo: Cambiar nombre de empresa
{
  "empresa": "Tu Empresa Test S.A.S."
}

// Ejemplo: Cambiar destino
{
  "destino": "Cali"
}
```

### Agregar Nuevos Tests

En la tab "Tests" de cada request, puedes agregar:

```javascript
// Validar campo específico
pm.test('Campo X tiene valor Y', function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data.campoX).to.eql('valorY');
});

// Validar performance
pm.test('Response time menor a 500ms', function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});
```

---

## 🎉 Checklist de Validación Completa

Al finalizar el testing, verifica:

- [ ] Health check retorna 200
- [ ] POST crea solicitud exitosamente (201)
- [ ] Todas las actualizaciones progresivas funcionan (200)
- [ ] Completar solicitud dispara notificaciones
- [ ] GET retorna solicitud correctamente
- [ ] Errores 400 funcionan correctamente
- [ ] Errores 404 funcionan correctamente
- [ ] Validación de mudanzas rechaza correctamente (RN-02)
- [ ] Peso alto activa revisionEspecial (RN-05)
- [ ] Destino obligatorio para NACIONAL (RN-01)
- [ ] Logs del servidor son claros y completos

---

## 📚 Recursos Adicionales

- **Documentación API:** Ver archivos en `app/api/*/route.ts`
- **Reglas de Negocio:** `docs/proyecto/DEFINICION_FUNCIONAL.md`
- **Arquitectura Técnica:** `docs/proyecto/DEFINICION_TECNICA.md`
- **Prompts Backend:** `prompts/BACK_README.md`

---

## 💡 Tips Profesionales

### 1. **Usa Variables de Environment**
Facilita testing en diferentes entornos (local, staging, producción)

### 2. **Guarda Requests de Ejemplo**
En Postman, cada request puede tener múltiples "Examples" guardados

### 3. **Automatiza con Newman**
Integra testing en tu CI/CD pipeline

### 4. **Logs Detallados**
Siempre revisa la consola del servidor durante testing

### 5. **Cleanup Después de Tests**
Considera crear solicitudes de prueba y eliminarlas después

---

¡Listo para hacer testing! 🚀

Cualquier pregunta, revisa la documentación en `prompts/06_BACK_CAPA_API_ENDPOINTS.md`
