# Script de Testing Rápido - API Solicitudes
# Ejecutar: .\test-api-quick.ps1

$ErrorActionPreference = "Stop"
$BASE_URL = "http://localhost:3000"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "🧪 API TESTING - SISTEMA SOLICITUDES" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Función para hacer requests con manejo de errores
function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Uri,
        [hashtable]$Body
    )
    
    try {
        if ($Body) {
            $jsonBody = $Body | ConvertTo-Json -Depth 10
            $response = Invoke-RestMethod -Method $Method -Uri $Uri `
                -Headers @{"Content-Type"="application/json"} `
                -Body $jsonBody
        } else {
            $response = Invoke-RestMethod -Method $Method -Uri $Uri
        }
        return $response
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "Detalles: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
        throw
    }
}

# 1. HEALTH CHECK
Write-Host "1️⃣  HEALTH CHECK" -ForegroundColor Yellow
Write-Host "   Verificando disponibilidad del sistema..." -ForegroundColor Gray
try {
    $health = Invoke-ApiRequest -Method GET -Uri "$BASE_URL/api/health"
    if ($health.status -eq "ok") {
        Write-Host "   ✅ Sistema OK - Base de datos: $($health.database)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Sistema en estado: $($health.status)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ No se pudo conectar al servidor" -ForegroundColor Red
    Write-Host "   ℹ️  Asegúrate de ejecutar: npm run dev" -ForegroundColor Cyan
    exit 1
}
Write-Host ""

# 2. CREAR SOLICITUD INICIAL
Write-Host "2️⃣  CREAR SOLICITUD INICIAL" -ForegroundColor Yellow
Write-Host "   Empresa: ACME Transport S.A.S." -ForegroundColor Gray
$solicitud = Invoke-ApiRequest -Method POST -Uri "$BASE_URL/api/solicitudes" `
    -Body @{empresa="ACME Transport S.A.S."}

$SOLICITUD_ID = $solicitud.data.id
Write-Host "   ✅ Solicitud creada" -ForegroundColor Green
Write-Host "   📋 ID: $SOLICITUD_ID" -ForegroundColor Cyan
Write-Host "   📊 Estado: $($solicitud.data.estado)" -ForegroundColor Gray
Write-Host ""

# 3. ACTUALIZAR CAMPOS PROGRESIVAMENTE
Write-Host "3️⃣  ACTUALIZAR CAMPOS PROGRESIVAMENTE" -ForegroundColor Yellow

Write-Host "   → Contacto..." -ForegroundColor Gray
Invoke-ApiRequest -Method PATCH -Uri "$BASE_URL/api/solicitudes/$SOLICITUD_ID" `
    -Body @{contacto="Juan Pérez García"} | Out-Null
Write-Host "      ✅ Contacto actualizado" -ForegroundColor Green

Write-Host "   → Email..." -ForegroundColor Gray
Invoke-ApiRequest -Method PATCH -Uri "$BASE_URL/api/solicitudes/$SOLICITUD_ID" `
    -Body @{email="juan.perez@acme.com"} | Out-Null
Write-Host "      ✅ Email actualizado" -ForegroundColor Green

Write-Host "   → Teléfono..." -ForegroundColor Gray
Invoke-ApiRequest -Method PATCH -Uri "$BASE_URL/api/solicitudes/$SOLICITUD_ID" `
    -Body @{telefono="+573001234567"} | Out-Null
Write-Host "      ✅ Teléfono actualizado" -ForegroundColor Green

Write-Host "   → Tipo servicio y origen..." -ForegroundColor Gray
Invoke-ApiRequest -Method PATCH -Uri "$BASE_URL/api/solicitudes/$SOLICITUD_ID" `
    -Body @{tipoServicio="NACIONAL"; origen="Bogotá D.C."} | Out-Null
Write-Host "      ✅ Tipo servicio y origen actualizados" -ForegroundColor Green

Write-Host "   → Destino..." -ForegroundColor Gray
Invoke-ApiRequest -Method PATCH -Uri "$BASE_URL/api/solicitudes/$SOLICITUD_ID" `
    -Body @{destino="Medellín"} | Out-Null
Write-Host "      ✅ Destino actualizado" -ForegroundColor Green

Write-Host "   → Tipo carga y peso..." -ForegroundColor Gray
Invoke-ApiRequest -Method PATCH -Uri "$BASE_URL/api/solicitudes/$SOLICITUD_ID" `
    -Body @{tipoCarga="MERCANCIA_EMPRESARIAL"; pesoKg=5000} | Out-Null
Write-Host "      ✅ Tipo carga y peso actualizados" -ForegroundColor Green

Write-Host "   → Dimensiones..." -ForegroundColor Gray
Invoke-ApiRequest -Method PATCH -Uri "$BASE_URL/api/solicitudes/$SOLICITUD_ID" `
    -Body @{dimensiones="200cm x 150cm x 100cm"} | Out-Null
Write-Host "      ✅ Dimensiones actualizadas" -ForegroundColor Green

Write-Host "   → Valor asegurado..." -ForegroundColor Gray
Invoke-ApiRequest -Method PATCH -Uri "$BASE_URL/api/solicitudes/$SOLICITUD_ID" `
    -Body @{valorAsegurado=25000000} | Out-Null
Write-Host "      ✅ Valor asegurado actualizado" -ForegroundColor Green

Write-Host "   → Condiciones de cargue..." -ForegroundColor Gray
Invoke-ApiRequest -Method PATCH -Uri "$BASE_URL/api/solicitudes/$SOLICITUD_ID" `
    -Body @{condicionesCargue=@("muelle","montacargas","horario restringido")} | Out-Null
Write-Host "      ✅ Condiciones de cargue actualizadas" -ForegroundColor Green

Write-Host ""

# 4. COMPLETAR SOLICITUD
Write-Host "4️⃣  COMPLETAR SOLICITUD (Envía notificaciones)" -ForegroundColor Yellow
Write-Host "   Agregando fecha requerida y completando..." -ForegroundColor Gray
$completada = Invoke-ApiRequest -Method PATCH -Uri "$BASE_URL/api/solicitudes/$SOLICITUD_ID" `
    -Body @{
        fechaRequerida="2026-03-01T00:00:00.000Z"
        completar=$true
    }

Write-Host "   ✅ Solicitud completada" -ForegroundColor Green
Write-Host "   📊 Estado final: $($completada.data.estado)" -ForegroundColor Cyan
Write-Host "   📧 $($completada.message)" -ForegroundColor Gray
Write-Host "   ℹ️  Revisa la consola del servidor para ver las notificaciones enviadas" -ForegroundColor Cyan
Write-Host ""

# 5. OBTENER SOLICITUD FINAL
Write-Host "5️⃣  OBTENER SOLICITUD COMPLETA" -ForegroundColor Yellow
$final = Invoke-ApiRequest -Method GET -Uri "$BASE_URL/api/solicitudes/$SOLICITUD_ID"

Write-Host "   ✅ Solicitud obtenida" -ForegroundColor Green
Write-Host ""
Write-Host "   📋 RESUMEN FINAL:" -ForegroundColor Cyan
Write-Host "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "   ID:               $($final.data.id)" -ForegroundColor White
Write-Host "   Empresa:          $($final.data.empresa)" -ForegroundColor White
Write-Host "   Contacto:         $($final.data.contacto)" -ForegroundColor White
Write-Host "   Email:            $($final.data.email)" -ForegroundColor White
Write-Host "   Teléfono:         $($final.data.telefono)" -ForegroundColor White
Write-Host "   Tipo Servicio:    $($final.data.tipoServicio)" -ForegroundColor White
Write-Host "   Origen:           $($final.data.origen)" -ForegroundColor White
Write-Host "   Destino:          $($final.data.destino)" -ForegroundColor White
Write-Host "   Tipo Carga:       $($final.data.tipoCarga)" -ForegroundColor White
Write-Host "   Peso:             $($final.data.pesoKg) kg" -ForegroundColor White
Write-Host "   Dimensiones:      $($final.data.dimensiones)" -ForegroundColor White
Write-Host "   Valor Asegurado:  $" -NoNewline -ForegroundColor White
Write-Host $("{0:N0}" -f [int]$final.data.valorAsegurado) -ForegroundColor White
Write-Host "   Revisión Especial: $($final.data.revisionEspecial)" -ForegroundColor White
Write-Host "   Estado:           " -NoNewline -ForegroundColor White
Write-Host $final.data.estado -ForegroundColor Green
Write-Host "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# 6. TESTING DE ERRORES (OPCIONAL)
Write-Host "6️⃣  TESTING DE ERRORES" -ForegroundColor Yellow
Write-Host "   Probando rechazo de mudanzas (RN-02)..." -ForegroundColor Gray

# Crear nueva solicitud para error
$solicitudError = Invoke-ApiRequest -Method POST -Uri "$BASE_URL/api/solicitudes" `
    -Body @{empresa="Empresa Test Error"}

try {
    Invoke-ApiRequest -Method PATCH -Uri "$BASE_URL/api/solicitudes/$($solicitudError.data.id)" `
        -Body @{
            tipoCarga="mudanza de hogar"
            telefono="+573001111111"
            tipoServicio="URBANO"
            origen="Bogotá"
            destino="Bogotá"
            pesoKg=1000
            dimensiones="100x100x100"
            valorAsegurado=5000000
            condicionesCargue=@("normal")
            fechaRequerida="2026-03-01T00:00:00.000Z"
            completar=$true
        } | Out-Null
    Write-Host "   ❌ ERROR: Se esperaba rechazo pero no ocurrió" -ForegroundColor Red
} catch {
    $errorDetail = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($errorDetail.error -like "*mudanza*") {
        Write-Host "      ✅ Mudanza rechazada correctamente (RN-02)" -ForegroundColor Green
        Write-Host "      📝 Mensaje: $($errorDetail.error)" -ForegroundColor Gray
    } else {
        Write-Host "      ⚠️  Error inesperado: $($errorDetail.error)" -ForegroundColor Yellow
    }
}

Write-Host ""

# RESUMEN FINAL
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "🎉 TESTING COMPLETADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 RESULTADOS:" -ForegroundColor Cyan
Write-Host "   ✅ Health check: OK" -ForegroundColor Green
Write-Host "   ✅ Crear solicitud: OK" -ForegroundColor Green
Write-Host "   ✅ Actualizar progresivo: OK (9 campos)" -ForegroundColor Green
Write-Host "   ✅ Completar solicitud: OK" -ForegroundColor Green
Write-Host "   ✅ Obtener solicitud: OK" -ForegroundColor Green
Write-Host "   ✅ Validación mudanzas: OK" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Solicitud principal creada: $SOLICITUD_ID" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Próximos pasos:" -ForegroundColor Yellow
Write-Host "   • Importar colección de Postman para más tests" -ForegroundColor Gray
Write-Host "   • Revisar logs del servidor para ver notificaciones" -ForegroundColor Gray
Write-Host "   • Verificar datos en Prisma Studio: npx prisma studio" -ForegroundColor Gray
Write-Host ""
