# 🚀 Guía Rápida - Setup Postman (5 minutos)

## ✅ Paso 1: Importar Archivos

1. **Abrir Postman**
2. Click en botón **"Import"** (esquina superior izquierda)
3. Arrastra o selecciona **estos 2 archivos**:
   ```
   ✓ Postman_Collection_Solicitudes.json
   ✓ Postman_Environment_Local.json
   ```
4. Click **"Import"**

**✅ Resultado esperado:**
- Collection: "Sistema Solicitudes - API REST" (en panel izquierdo)
- Environment: "Solicitudes API - Local Development" (en selector superior derecho)

---

## ✅ Paso 2: Activar Environment

1. Click en **selector de Environment** (esquina superior derecha)
2. Selecciona: **"Solicitudes API - Local Development"**
3. Verifica que aparezca **checkmark ✓** al lado del nombre

**✅ Variables configuradas automáticamente:**
```
base_url = http://localhost:3000
solicitud_id = (se llena automáticamente al crear solicitud)
```

---

## ✅ Paso 3: Iniciar Servidor

Antes de ejecutar requests, inicia el servidor:

```powershell
# En tu terminal
npm run dev
```

**✅ Verifica que veas:**
```
✓ Ready in 7.4s
○ Local:   http://localhost:3000
```

---

## ✅ Paso 4: Probar Health Check

1. En Postman, abre collection **"Sistema Solicitudes - API REST"**
2. Expande carpeta **"1. Health Check"**
3. Click en request **"Health Check - Success"**
4. Click botón azul **"Send"**

**✅ Response esperado (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2026-02-19T...",
  "database": "connected",
  "version": "0.1.0"
}
```

---

## ✅ Paso 5: Ejecutar Flujo Completo

**Opción A: Ejecutar Collection Runner (Recomendado)**

1. Click derecho en "Sistema Solicitudes - API REST"
2. Click **"Run collection"**
3. Selecciona el environment **"Solicitudes API - Local Development"**
4. Click **"Run Sistema Solicitudes..."**
5. ⏳ Espera que se ejecuten todos los requests (~15 segundos)
6. ✅ Revisa resultados (todos deben estar en verde)

**Opción B: Ejecutar requests individuales**

Sigue este orden (flujo end-to-end):

```
1. Health Check - Success
2. POST - Crear Solicitud Exitosa          (guarda ID automáticamente)
3. PATCH - Actualizar Contacto
4. PATCH - Actualizar Email
5. PATCH - Actualizar Teléfono
6. PATCH - Actualizar Tipo Servicio
7. PATCH - Actualizar Origen
8. PATCH - Actualizar Destino
9. PATCH - Actualizar Tipo Carga
10. PATCH - Actualizar Peso
11. PATCH - Actualizar Dimensiones
12. PATCH - Actualizar Valor Asegurado
13. PATCH - Actualizar Condiciones Cargue
14. PATCH - Actualizar Fecha Requerida
15. PATCH - Completar Solicitud           (envía notificaciones)
16. GET - Obtener Solicitud por ID        (verifica estado COMPLETADA)
```

---

## 🎯 Tests Automáticos Incluidos

Cada request tiene **tests automáticos** que validan:

- ✅ Status codes correctos (200, 201, 400, 404)
- ✅ Estructura de response correcta
- ✅ Campos obligatorios presentes
- ✅ Estados de solicitud válidos
- ✅ Guardado automático de `solicitud_id`

**Ver resultados:**
- Panel **"Test Results"** (abajo) después de cada request
- En Collection Runner: resumen visual de todos los tests

---

## 🐛 Troubleshooting

### ❌ Error: "Could not get any response"
**Causa:** Servidor no está corriendo
**Solución:**
```powershell
npm run dev
```

### ❌ Error: Variables {{base_url}} no resuelta
**Causa:** Environment no seleccionado
**Solución:** Verificar selector superior derecho → "Solicitudes API - Local Development"

### ❌ Error: "solicitud_id is not defined"
**Causa:** No has ejecutado "POST - Crear Solicitud Exitosa" primero
**Solución:** Ejecutar request de creación antes de los PATCH/GET

### ❌ Error 400: "fechaRequerida invalid"
**Causa:** Formato de fecha incorrecto
**Solución:** Usar formato ISO 8601: `"2026-03-01T00:00:00.000Z"`

### ❌ Error 400: "condicionesCargue invalid"
**Causa:** Valor no válido en array
**Solución:** Usar solo: `"muelle"`, `"montacargas"`, `"manual"`

---

## 📚 Siguiente Paso

✅ Setup completo → Continúa con:
- **GUIA_TESTING_POSTMAN.md** - Guía detallada de todos los endpoints
- **TESTING_README.md** - Documentación completa de testing

---

**¿Todo funcionando?** 🎉 Ya puedes testear toda la API desde Postman!
