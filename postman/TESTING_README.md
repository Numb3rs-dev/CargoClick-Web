# 🧪 TESTING - SISTEMA SOLICITUDES API

## 📦 Recursos de Testing Incluidos

Este proyecto incluye múltiples recursos para testing del backend:

| Recurso | Descripción | Uso |
|---------|-------------|-----|
| `Postman_Collection_Solicitudes.json` | Colección completa de Postman | Importar en Postman |
| `GUIA_TESTING_POSTMAN.md` | Guía detallada de testing con Postman | Referencia |
| `EJEMPLOS_CURL.md` | Comandos curl para terminal | Copiar/pegar |
| `test-api-quick.ps1` | Script automatizado PowerShell | Ejecutar directamente |

---

## 🚀 Quick Start (Opción Más Rápida)

### Opción 1: Script PowerShell Automatizado ⚡

**Mejor para:** Testing rápido y validación end-to-end

```powershell
# Asegúrate de tener el servidor corriendo
npm run dev

# En otra terminal:
.\test-api-quick.ps1
```

**Resultado:** Script ejecuta todo el flujo automáticamente y muestra resumen.

---

### Opción 2: Postman (Recomendado para desarrollo) 🎯

**Mejor para:** Testing interactivo, debugging, guardar responses

1. **Importar colección:**
   - Abrir Postman
   - Import → Seleccionar `Postman_Collection_Solicitudes.json`

2. **Configurar environment (opcional):**
   - Crear environment "Solicitudes - Local"
   - Variable: `base_url` = `http://localhost:3000`

3. **Ejecutar flujo:**
   - Ejecutar requests en orden
   - O usar Collection Runner para automatizar

4. **Ver guía completa:** `GUIA_TESTING_POSTMAN.md`

---

### Opción 3: curl en Terminal 💻

**Mejor para:** Testing desde terminal, scripts, CI/CD

1. **Ver ejemplos:** Abrir `EJEMPLOS_CURL.md`
2. **Copiar comandos** según tu sistema operativo
3. **Ejecutar** en terminal (PowerShell, Bash, GitBash)

---

## 📋 Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/health` | Health check + DB connection |
| POST | `/api/solicitudes` | Crear solicitud inicial |
| GET | `/api/solicitudes/:id` | Obtener solicitud por ID |
| PATCH | `/api/solicitudes/:id` | Actualizar/Completar solicitud |

---

## 🎯 Flujo de Testing Recomendado

### Flujo Básico (Happy Path)

1. **Health Check** → Verificar sistema OK
2. **POST crear solicitud** → Guardar ID retornado
3. **PATCH actualizar campos** → 9 actualizaciones progresivas
4. **PATCH completar** → Con flag `completar: true`
5. **GET obtener** → Verificar solicitud completada

### Testing de Validaciones

- ❌ Empresa vacía → 400
- ❌ ID inválido → 400
- ❌ ID no existe → 404
- ❌ Mudanza rechazada → 400 (RN-02)
- ❌ Destino faltante → 400 (RN-01)
- ✅ Peso alto → revisionEspecial = true (RN-05)

---

## 🔧 Prerrequisitos

### Antes de Testing

1. **Servidor corriendo:**
   ```bash
   npm run dev
   ```

2. **Base de datos activa:**
   ```bash
   # Verificar PostgreSQL está corriendo
   # Verificar DATABASE_URL en .env
   ```

3. **Migraciones aplicadas:**
   ```bash
   npx prisma migrate dev
   ```

4. **Health check OK:**
   ```bash
   curl http://localhost:3000/api/health
   # Debe retornar: "database": "connected"
   ```

---

## 📊 Validación de Resultados

### En la Response

✅ **Success:**
- Status code correcto (200, 201)
- `success: true`
- `data` con todos los campos
- Estado cambia correctamente

✅ **Errores esperados:**
- Status code correcto (400, 404, 500)
- `success: false`
- `error` con mensaje descriptivo
- `details` con errores de validación (si aplica)

### En Logs del Servidor

Verifica en la consola donde corre `npm run dev`:

```
[SolicitudService] Creando solicitud inicial con datos: {...}
[SolicitudService] Solicitud creada exitosamente: 01JXX...
[NotificacionService] Enviando notificaciones...
[EmailService] Email al cliente enviado exitosamente
[WhatsAppService] WhatsApp enviado exitosamente
```

### En Base de Datos

```bash
# Opción 1: Prisma Studio
npx prisma studio

# Opción 2: SQL directo
# Conectar a PostgreSQL y ejecutar:
SELECT id, empresa, estado, "createdAt" 
FROM "Solicitud" 
ORDER BY "createdAt" DESC;
```

---

## 🎓 Recursos Educativos

### Nuevos en Testing de APIs

1. **Empieza con:** `test-api-quick.ps1` (automatizado)
2. **Luego aprende:** Postman con `GUIA_TESTING_POSTMAN.md`
3. **Finalmente domina:** curl con `EJEMPLOS_CURL.md`

### Desarrolladores Experimentados

- **Postman:** Para desarrollo iterativo
- **curl + scripts:** Para automatización
- **Newman:** Para CI/CD pipeline

---

## 🐛 Troubleshooting

### "Connection refused" / "ECONNREFUSED"

**Causa:** Servidor no está corriendo

**Solución:**
```bash
npm run dev
```

### "Database connection failed"

**Causa:** PostgreSQL no disponible o DATABASE_URL incorrecta

**Solución:**
1. Verificar PostgreSQL corriendo
2. Validar `.env` tiene `DATABASE_URL` correcta
3. Ejecutar: `npx prisma generate`

### "Solicitud no encontrada" (404)

**Causa:** Intentando acceder a ID que no existe

**Solución:**
1. Ejecutar POST para crear solicitud primero
2. Copiar ID del response
3. Usar ese ID en requests subsecuentes

### "ID inválido" (400)

**Causa:** ID no tiene formato ULID (26 caracteres)

**Solución:**
- ULIDs válidos: `01JXX2Y3Z4A5B6C7D8E9F0G1H2`
- IDs inválidos: `123`, `abc`, `01JXX`

### Script PowerShell no ejecuta

**Causa:** Política de ejecución de Windows

**Solución:**
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\test-api-quick.ps1
```

---

## 📈 Testing Avanzado

### Collection Runner en Postman

Ejecuta toda la colección automáticamente:

1. Click derecho en colección
2. "Run collection"
3. Configurar iterations y delay
4. Review resultados

### Newman (CLI de Postman)

```bash
# Instalar Newman
npm install -g newman

# Ejecutar colección
newman run Postman_Collection_Solicitudes.json
```

### Scripts Personalizados

Crea tus propios scripts basados en `test-api-quick.ps1`:

```powershell
# test-custom.ps1
$response = Invoke-RestMethod -Method POST `
  -Uri "http://localhost:3000/api/solicitudes" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"empresa":"Mi Empresa"}'

Write-Host $response.data.id
```

---

## 📚 Documentación Adicional

### Arquitectura del Backend

- **Definición Funcional:** `definicion-FuncionalyTecnica/DEFINICION_FUNCIONAL.md`
- **Definición Técnica:** `definicion-FuncionalyTecnica/DEFINICION_TECNICA.md`
- **Prompts Backend:** `prompts/BACK_README.md`

### Código Fuente

- **API Routes:** `app/api/*/route.ts`
- **Servicios:** `lib/services/solicitudService.ts`
- **Repositorios:** `lib/repositories/solicitudRepository.ts`
- **Validaciones:** `lib/validations/schemas.ts`

---

## ✅ Checklist de Testing Completo

Antes de considerar el backend "listo":

### Funcional
- [ ] Health check retorna 200
- [ ] POST crea solicitud (201)
- [ ] PATCH actualiza campos progresivamente (200 × 9)
- [ ] PATCH completa solicitud (200)
- [ ] GET retorna solicitud (200)
- [ ] Notificaciones se envían (revisar logs)

### Validaciones
- [ ] Empresa vacía rechazada (400)
- [ ] ID inválido rechazado (400)
- [ ] ID no existe retorna 404
- [ ] Mudanzas rechazadas (400, RN-02)
- [ ] Destino obligatorio para NACIONAL (RN-01)
- [ ] Peso > 10,000 activa revisionEspecial (RN-05)

### Performance
- [ ] Responses < 500ms (promedio)
- [ ] No errores en logs
- [ ] Base de datos responde correctamente

### Datos
- [ ] Solicitudes se guardan en BD
- [ ] Estados transicionan correctamente
- [ ] Campos calculados correctos (revisionEspecial)

---

## 🎉 Listo para Producción

Una vez pasados todos los tests:

1. ✅ Backend completamente funcional
2. ✅ Validaciones robustas
3. ✅ Notificaciones operativas
4. ✅ Error handling completo
5. ✅ Listo para conectar con frontend

**Próximos pasos:**
- Implementar frontend
- Deploy a Vercel/producción
- Configurar monitoring

---

## 💡 Tips Profesionales

### Durante Desarrollo

- Usa Postman para testing iterativo
- Guarda examples de responses
- Tests automáticos en Postman
- Variables para reutilizar IDs

### Para CI/CD

- Scripts automatizados (.ps1, .sh)
- Newman en pipeline
- Tests de regresión
- Health check en deploy

### Para Debugging

- Logs detallados en servidor
- Console.log en servicios
- Prisma Studio para ver datos
- Tests de carga con Artillery/k6

---

**¿Dudas?** Revisa `GUIA_TESTING_POSTMAN.md` o `EJEMPLOS_CURL.md`

¡Feliz testing! 🚀
