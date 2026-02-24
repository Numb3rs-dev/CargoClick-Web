# 🧪 EJEMPLOS DE TESTING CON CURL

## Quick Testing desde Terminal

### Variables de Entorno
```bash
# Configurar variables (Windows PowerShell)
$BASE_URL = "http://localhost:3000"
$SOLICITUD_ID = ""  # Se llenará después de crear solicitud

# Linux/Mac (Bash)
export BASE_URL="http://localhost:3000"
export SOLICITUD_ID=""
```

---

## 1. Health Check

```bash
# Windows PowerShell
curl http://localhost:3000/api/health

# Linux/Mac/GitBash
curl http://localhost:3000/api/health
```

**Response esperado:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-19T...",
  "database": "connected",
  "version": "1.0.0"
}
```

---

## 2. Crear Solicitud Inicial

```bash
# Windows PowerShell
curl -Method POST `
  -Uri "http://localhost:3000/api/solicitudes" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"empresa":"ACME Transport S.A.S."}'

# Linux/Mac/GitBash
curl -X POST http://localhost:3000/api/solicitudes \
  -H "Content-Type: application/json" \
  -d '{"empresa":"ACME Transport S.A.S."}'
```

**Response esperado (201):**
```json
{
  "success": true,
  "data": {
    "id": "01JXX2Y3Z4A5B6C7D8E9F0G1H2",  ← COPIAR ESTE ID
    "empresa": "ACME Transport S.A.S.",
    "estado": "EN_PROGRESO",
    ...
  },
  "message": "Solicitud creada correctamente"
}
```

**📝 Guardar ID en variable:**
```bash
# PowerShell (reemplazar con ID real)
$SOLICITUD_ID = "01JXX2Y3Z4A5B6C7D8E9F0G1H2"

# Bash
export SOLICITUD_ID="01JXX2Y3Z4A5B6C7D8E9F0G1H2"
```

---

## 3. Actualizar Campos Progresivamente

### Paso 1: Actualizar Contacto
```bash
# PowerShell
curl -Method PATCH `
  -Uri "http://localhost:3000/api/solicitudes/$SOLICITUD_ID" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"contacto":"Juan Pérez García"}'

# Bash
curl -X PATCH http://localhost:3000/api/solicitudes/$SOLICITUD_ID \
  -H "Content-Type: application/json" \
  -d '{"contacto":"Juan Pérez García"}'
```

### Paso 2: Actualizar Email
```bash
# PowerShell
curl -Method PATCH `
  -Uri "http://localhost:3000/api/solicitudes/$SOLICITUD_ID" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"juan.perez@acme.com"}'

# Bash
curl -X PATCH http://localhost:3000/api/solicitudes/$SOLICITUD_ID \
  -H "Content-Type: application/json" \
  -d '{"email":"juan.perez@acme.com"}'
```

### Paso 3: Actualizar Teléfono
```bash
# PowerShell
curl -Method PATCH `
  -Uri "http://localhost:3000/api/solicitudes/$SOLICITUD_ID" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"telefono":"+573001234567"}'

# Bash
curl -X PATCH http://localhost:3000/api/solicitudes/$SOLICITUD_ID \
  -H "Content-Type: application/json" \
  -d '{"telefono":"+573001234567"}'
```

### Paso 4-5: Tipo Servicio y Origen
```bash
# PowerShell
curl -Method PATCH `
  -Uri "http://localhost:3000/api/solicitudes/$SOLICITUD_ID" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"tipoServicio":"NACIONAL","origen":"Bogotá D.C."}'

# Bash
curl -X PATCH http://localhost:3000/api/solicitudes/$SOLICITUD_ID \
  -H "Content-Type: application/json" \
  -d '{"tipoServicio":"NACIONAL","origen":"Bogotá D.C."}'
```

### Paso 6: Destino
```bash
# PowerShell
curl -Method PATCH `
  -Uri "http://localhost:3000/api/solicitudes/$SOLICITUD_ID" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"destino":"Medellín"}'

# Bash
curl -X PATCH http://localhost:3000/api/solicitudes/$SOLICITUD_ID \
  -H "Content-Type: application/json" \
  -d '{"destino":"Medellín"}'
```

### Paso 7-8: Tipo Carga y Peso
```bash
# PowerShell
curl -Method PATCH `
  -Uri "http://localhost:3000/api/solicitudes/$SOLICITUD_ID" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"tipoCarga":"MERCANCIA_EMPRESARIAL","pesoKg":5000}'

# Bash
curl -X PATCH http://localhost:3000/api/solicitudes/$SOLICITUD_ID \
  -H "Content-Type: application/json" \
  -d '{"tipoCarga":"MERCANCIA_EMPRESARIAL","pesoKg":5000}'
```

### Paso 9: Dimensiones
```bash
# PowerShell
curl -Method PATCH `
  -Uri "http://localhost:3000/api/solicitudes/$SOLICITUD_ID" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"dimensiones":"200cm x 150cm x 100cm"}'

# Bash
curl -X PATCH http://localhost:3000/api/solicitudes/$SOLICITUD_ID \
  -H "Content-Type: application/json" \
  -d '{"dimensiones":"200cm x 150cm x 100cm"}'
```

### Paso 10: Valor Asegurado
```bash
# PowerShell
curl -Method PATCH `
  -Uri "http://localhost:3000/api/solicitudes/$SOLICITUD_ID" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"valorAsegurado":25000000}'

# Bash
curl -X PATCH http://localhost:3000/api/solicitudes/$SOLICITUD_ID \
  -H "Content-Type: application/json" \
  -d '{"valorAsegurado":25000000}'
```

### Paso 11: Condiciones Cargue
```bash
# PowerShell
curl -Method PATCH `
  -Uri "http://localhost:3000/api/solicitudes/$SOLICITUD_ID" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"condicionesCargue":["muelle","montacargas","horario restringido"]}'

# Bash
curl -X PATCH http://localhost:3000/api/solicitudes/$SOLICITUD_ID \
  -H "Content-Type: application/json" \
  -d '{"condicionesCargue":["muelle","montacargas","horario restringido"]}'
```

---

## 4. Completar Solicitud (Envía Notificaciones)

```bash
# PowerShell
curl -Method PATCH `
  -Uri "http://localhost:3000/api/solicitudes/$SOLICITUD_ID" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"fechaRequerida":"2026-03-01T00:00:00.000Z","completar":true}'

# Bash
curl -X PATCH http://localhost:3000/api/solicitudes/$SOLICITUD_ID \
  -H "Content-Type: application/json" \
  -d '{"fechaRequerida":"2026-03-01T00:00:00.000Z","completar":true}'
```

**Response esperado (200):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "estado": "COMPLETADA",
    ...
  },
  "message": "Solicitud completada. Notificaciones enviadas."
}
```

**📧 Verificar en logs del servidor:**
- Email al cliente enviado
- Email al admin enviado
- WhatsApp al admin enviado

---

## 5. Obtener Solicitud Completada

```bash
# PowerShell
curl -Uri "http://localhost:3000/api/solicitudes/$SOLICITUD_ID"

# Bash
curl http://localhost:3000/api/solicitudes/$SOLICITUD_ID
```

---

## 🧪 Testing de Errores

### Error 400 - Empresa Vacía
```bash
# Bash
curl -X POST http://localhost:3000/api/solicitudes \
  -H "Content-Type: application/json" \
  -d '{"empresa":""}'
```

**Response esperado (400):**
```json
{
  "success": false,
  "error": "Datos inválidos",
  "details": [...]
}
```

### Error 400 - ID Inválido
```bash
# Bash
curl http://localhost:3000/api/solicitudes/123
```

### Error 404 - ID No Existe
```bash
# Bash
curl http://localhost:3000/api/solicitudes/01INVALID0000000000000000
```

### Error 400 - Mudanza Rechazada (RN-02)
```bash
# Bash
curl -X PATCH http://localhost:3000/api/solicitudes/$SOLICITUD_ID \
  -H "Content-Type: application/json" \
  -d '{"tipoCarga":"mudanza de hogar","completar":true}'
```

**Response esperado (400):**
```json
{
  "success": false,
  "error": "No procesamos mudanzas de hogar. Nuestro servicio es exclusivo para transporte empresarial."
}
```

---

## 🚀 Script Completo de Flujo End-to-End

### Bash Script (Linux/Mac/GitBash)

Crea archivo `test-api.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

echo "🧪 Testing API - Sistema Solicitudes"
echo "===================================="
echo ""

# 1. Health Check
echo "1️⃣  Health Check..."
curl -s $BASE_URL/api/health | jq
echo ""

# 2. Crear Solicitud
echo "2️⃣  Creando solicitud..."
RESPONSE=$(curl -s -X POST $BASE_URL/api/solicitudes \
  -H "Content-Type: application/json" \
  -d '{"empresa":"ACME Transport S.A.S."}')

echo $RESPONSE | jq
SOLICITUD_ID=$(echo $RESPONSE | jq -r '.data.id')
echo "✅ ID: $SOLICITUD_ID"
echo ""

# 3. Actualizar Contacto
echo "3️⃣  Actualizando contacto..."
curl -s -X PATCH $BASE_URL/api/solicitudes/$SOLICITUD_ID \
  -H "Content-Type: application/json" \
  -d '{"contacto":"Juan Pérez"}' | jq '.data.contacto'
echo ""

# 4. Actualizar Email
echo "4️⃣  Actualizando email..."
curl -s -X PATCH $BASE_URL/api/solicitudes/$SOLICITUD_ID \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@acme.com"}' | jq '.data.email'
echo ""

# 5. Completar
echo "5️⃣  Completando solicitud..."
curl -s -X PATCH $BASE_URL/api/solicitudes/$SOLICITUD_ID \
  -H "Content-Type: application/json" \
  -d '{
    "telefono":"+573001234567",
    "tipoServicio":"NACIONAL",
    "origen":"Bogotá",
    "destino":"Medellín",
    "tipoCarga":"MERCANCIA_EMPRESARIAL",
    "pesoKg":5000,
    "dimensiones":"200x150x100",
    "valorAsegurado":25000000,
    "condicionesCargue":["muelle"],
    "fechaRequerida":"2026-03-01T00:00:00.000Z",
    "completar":true
  }' | jq '.data.estado'
echo ""

# 6. Obtener
echo "6️⃣  Obteniendo solicitud..."
curl -s $BASE_URL/api/solicitudes/$SOLICITUD_ID | jq '.data | {id, empresa, estado}'
echo ""

echo "🎉 Testing completado!"
```

**Ejecutar:**
```bash
chmod +x test-api.sh
./test-api.sh
```

**Requisito:** `jq` instalado para formatear JSON

---

### PowerShell Script (Windows)

Crea archivo `test-api.ps1`:

```powershell
$BASE_URL = "http://localhost:3000"

Write-Host "🧪 Testing API - Sistema Solicitudes" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# 1. Health Check
Write-Host "1️⃣  Health Check..." -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$BASE_URL/api/health"
$response | ConvertTo-Json
Write-Host ""

# 2. Crear Solicitud
Write-Host "2️⃣  Creando solicitud..." -ForegroundColor Yellow
$body = @{empresa="ACME Transport S.A.S."} | ConvertTo-Json
$response = Invoke-RestMethod -Method POST -Uri "$BASE_URL/api/solicitudes" `
  -Headers @{"Content-Type"="application/json"} -Body $body
$SOLICITUD_ID = $response.data.id
Write-Host "✅ ID: $SOLICITUD_ID" -ForegroundColor Green
Write-Host ""

# 3. Actualizar Contacto
Write-Host "3️⃣  Actualizando contacto..." -ForegroundColor Yellow
$body = @{contacto="Juan Pérez"} | ConvertTo-Json
$response = Invoke-RestMethod -Method PATCH -Uri "$BASE_URL/api/solicitudes/$SOLICITUD_ID" `
  -Headers @{"Content-Type"="application/json"} -Body $body
Write-Host "Contacto: $($response.data.contacto)"
Write-Host ""

# Continuar con más actualizaciones...

Write-Host "🎉 Testing completado!" -ForegroundColor Green
```

**Ejecutar:**
```powershell
.\test-api.ps1
```

---

## 💡 Tips

### Formatear JSON en PowerShell
```powershell
$response | ConvertTo-Json -Depth 10
```

### Formatear JSON en Bash (con jq)
```bash
curl ... | jq '.'
```

### Ver Solo Campos Específicos
```bash
# Solo ID y estado
curl http://localhost:3000/api/solicitudes/$SOLICITUD_ID | jq '.data | {id, estado}'
```

### Guardar Response en Archivo
```bash
curl http://localhost:3000/api/solicitudes/$SOLICITUD_ID > solicitud.json
```

---

## 🐛 Troubleshooting

### "Connection refused"
- Servidor no está corriendo → `npm run dev`

### "Database connection failed"
- PostgreSQL no está corriendo
- DATABASE_URL incorrecta en `.env`

### "Solicitud no encontrada"
- ID incorrecto en variable `$SOLICITUD_ID`
- Crear nueva solicitud primero

---

¡Listo para testing con curl! 🚀
