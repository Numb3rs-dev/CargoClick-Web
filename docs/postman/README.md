# 📬 Testing API - Recursos Postman

Recursos completos para testing del backend REST API del sistema de solicitudes de transporte B2B.

## 📂 Archivos

### 🔧 Collections y Scripts
- **`Postman_Collection_Solicitudes.json`** - Collection completa con 20+ requests organizados
  - Health check
  - CRUD de solicitudes
  - Validaciones y reglas de negocio
  - Tests automáticos con Postman scripts

- **`Postman_Environment_Local.json`** - Environment para desarrollo local
  - Variable `base_url`: http://localhost:3000
  - Variable `solicitud_id`: Se guarda automáticamente al crear solicitud

- **`test-api-quick.ps1`** - Script PowerShell para testing automatizado
  - Ejecuta flujo completo de 13 pasos
  - Validación progresiva de campos
  - Reporte de resultados en consola

### 📖 Documentación
- **`SETUP_RAPIDO_POSTMAN.md`** - 🚀 **EMPIEZA AQUÍ** - Setup en 5 minutos
  - Importar collection y environment
  - Activar variables
  - Primera prueba rápida

- **`TESTING_README.md`** - Guía principal de testing completa
  - Overview de estrategia de testing
  - Índice de todos los recursos
  - Guía de inicio rápido

- **`GUIA_TESTING_POSTMAN.md`** - Tutorial paso a paso de Postman
  - Importar collection
  - Configurar variables de entorno
  - Ejecutar requests individuales y en secuencia
  - Interpretar responses

- **`EJEMPLOS_CURL.md`** - Comandos curl para terminal
  - Formato para PowerShell (Windows)
  - Formato para Bash (Linux/Mac)
  - Ejemplos de todos los endpoints

## 🚀 Inicio Rápido (5 minutos)

### Opción 1: Usar Postman (Recomendado)
```bash
1. Abrir Postman
2. Import → Arrastrar estos 2 archivos:
   ✓ Postman_Collection_Solicitudes.json
   ✓ Postman_Environment_Local.json
3. Activar environment (selector superior derecho)
4. Ejecutar "Health Check - Success"
```

**👉 Guía detallada:** [SETUP_RAPIDO_POSTMAN.md](./SETUP_RAPIDO_POSTMAN.md)

### Opción 2: Usar PowerShell
```powershell
# Asegúrate de que el servidor esté corriendo (npm run dev)
.\test-api-quick.ps1
```

### Opción 3: Usar curl (comandos individuales)
```powershell
# Ver comandos completos en EJEMPLOS_CURL.md
Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method GET -UseBasicParsing
```

---

```
┌─────────────────────────┐
│ 1. Health Check         │ → Verifica DB conectada
├─────────────────────────┤
│ 2. POST /solicitudes    │ → Crea solicitud (solo empresa)
├─────────────────────────┤
│ 3-12. PATCH progresivo  │ → Actualiza campos uno por uno
│    - contacto           │
│    - email              │
│    - telefono           │
│    - tipoServicio       │
│    - origen/destino     │
│    - tipoCarga          │
│    - peso/dimensiones   │
│    - condicionesCargue  │
│    - fechaRequerida     │
├─────────────────────────┤
│ 13. PATCH completar     │ → Valida completo + notificaciones
├─────────────────────────┤
│ 14. GET /solicitudes/:id│ → Verifica estado COMPLETADA
└─────────────────────────┘
```

## ✅ Tests Incluidos

### Validaciones Funcionales
- ✅ Campos obligatorios (RN-03)
- ✅ Formatos (email, teléfono, fecha ISO)
- ✅ Rangos (peso max 50,000 kg)
- ✅ Enums (tipoServicio, tipoCarga, condicionesCargue)

### Reglas de Negocio
- ✅ RN-01: Destino obligatorio para NACIONAL
- ✅ RN-02: Rechazo de mudanzas de hogar
- ✅ RN-03: Todos los campos requeridos para completar
- ✅ RN-05: Revisión especial si peso > 10,000 kg

### States & Transitions
- ✅ Estado inicial: EN_PROGRESO
- ✅ Completar: EN_PROGRESO → COMPLETADA
- ✅ Notificaciones disparadas al completar

## 🛠️ Troubleshooting

### Error: Cannot connect to server
```bash
# Verifica que el servidor esté corriendo
npm run dev
```

### Error: Database connection failed
```bash
# Verifica que PostgreSQL esté corriendo
# Revisa variables de entorno en .env
```

### Error: 400 Bad Request en fechaRequerida
```bash
# Usar formato ISO 8601 completo
"fechaRequerida": "2026-03-01T00:00:00.000Z"
```

### Error: 400 en condicionesCargue
```bash
# Valores válidos: "muelle", "montacargas", "manual"
# Usar ConvertTo-Json en PowerShell
$json = @{ condicionesCargue = @("muelle","montacargas") } | ConvertTo-Json
```

## 📚 Más Información

- **Backend API:** `/app/api/`
- **Schemas Zod:** `/lib/validations/schemas.ts`
- **Services:** `/lib/services/solicitudService.ts`
- **Especificaciones:** `/prompts-backend/06_CAPA_API_ENDPOINTS.md`

---

**Stack:** Next.js 15 + TypeScript + Prisma + PostgreSQL  
**Estado:** ✅ API completa y testeada
