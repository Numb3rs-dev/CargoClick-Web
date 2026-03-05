# 🎯 PATRONES DE PROMPTS EFECTIVOS PARA JAVA EXPERT

## 🚀 CÓMO USAR EL MODO JAVA EXPERT SIN PERDER CONTEXTO

### ❌ **PROMPTS QUE CAUSAN PÉRDIDA DE CONTEXTO**
```
"Crea un servicio para gestionar usuarios"
"Implementa CRUD de productos"
"Haz validaciones para el formulario"
"Agrega logging al proyecto"
```

### ✅ **PROMPTS QUE MANTIENEN CONTEXTO EFECTIVAMENTE**

## 📋 **PATRÓN 1: ESPECIFICACIONES TÉCNICAS DIRECTAS**
```
JAVA EXPERT - ESPECIFICACIONES TÉCNICAS:

MÉTODO: createUser(CreateUserDTO dto)
ENTRADA: 
- CreateUserDTO { String email, String password, String username }
- Validaciones: email único, password >=8 chars, username alfanumérico
SALIDA: UserResponseDTO { Long id, String email, String username, LocalDateTime createdAt }
EXCEPCIONES: EmailAlreadyExistsException, InvalidPasswordException
PRUEBAS: 
1. Usuario válido → retorna UserResponseDTO con ID generado
2. Email duplicado → lanza EmailAlreadyExistsException
3. Password corto → lanza InvalidPasswordException
INTEGRACIÓN: Usar UserRepository existente y BCryptPasswordEncoder
```

## 🎯 **PATRÓN 2: PROBLEMA-SOLUCIÓN-VALIDACIÓN**
```
JAVA EXPERT - IMPLEMENTACIÓN REQUERIDA:

PROBLEMA: Los usuarios no pueden recuperar contraseñas olvidadas
SOLUCIÓN TÉCNICA: 
- Método: requestPasswordReset(String email)
- Generar token único con expiración 24h
- Enviar email con link de reset
- Método: resetPassword(String token, String newPassword)
VALIDACIÓN: 
- Token válido y no expirado → password actualizado
- Token inválido → lanza InvalidTokenException
- Token expirado → lanza ExpiredTokenException
CONTEXTO: Integrar con EmailService existente y TokenRepository
```

## 🔧 **PATRÓN 3: ESPECIFICACIÓN DE ENDPOINT REST**
```
JAVA EXPERT - ENDPOINT REST EXACTO:

ENDPOINT: POST /api/products
CONTROLLER: ProductController.createProduct()
REQUEST BODY: CreateProductDTO
{
  "name": "string (required, 2-100 chars)",
  "description": "string (optional, max 500 chars)",
  "price": "BigDecimal (required, >0)",
  "categoryId": "Long (required, debe existir)"
}
RESPONSE: ProductResponseDTO
{
  "id": "Long",
  "name": "string",
  "description": "string",
  "price": "BigDecimal",
  "category": "CategoryDTO",
  "createdAt": "LocalDateTime"
}
VALIDACIONES:
- Nombre único por categoría
- Precio mayor que cero
- Categoría debe existir
CASOS DE PRUEBA:
1. Producto válido → 201 Created con ProductResponseDTO
2. Nombre duplicado en categoría → 400 Bad Request
3. Categoría inexistente → 404 Not Found
```

## 🏗️ **PATRÓN 4: MÓDULO COMÚN ESPECÍFICO**
```
JAVA EXPERT - CREAR MÓDULO COMÚN:

FUNCIONALIDAD: Validador de documentos (DNI, RUC, Pasaporte)
UBICACIÓN: common/validators/DocumentValidator
MÉTODOS REQUERIDOS:
- boolean isValidDNI(String dni)
- boolean isValidRUC(String ruc) 
- boolean isValidPassport(String passport)
- void validateDocumentAndThrow(String document, DocumentType type)
CRITERIOS DE COMMONALITY:
- Será usado por UserService, CustomerService, EmployeeService
- Lógica independiente del dominio de negocio
- Reglas de validación estándar gubernamentales
PRUEBAS ESPECÍFICAS:
1. DNI válido "12345678" → true
2. DNI inválido "1234567" → false
3. RUC válido empresarial → true
4. Documento inválido con validateDocumentAndThrow → InvalidDocumentException
```

## 🚨 **PATRÓN 5: RESOLUCIÓN DE ERROR ESPECÍFICO**
```
JAVA EXPERT - SOLUCIONAR BUG:

ERROR DETECTADO: NullPointerException en UserService.getUserProfile()
CAUSA RAÍZ: Optional<User> no está siendo manejado correctamente
CÓDIGO PROBLEMÁTICO: 
```java
User user = userRepository.findById(id).get(); // NPE aquí
```
SOLUCIÓN REQUERIDA:
- Manejar Optional correctamente
- Retornar Optional<UserProfileDTO> en lugar de UserProfileDTO
- Lanzar UserNotFoundException si no existe
- Mantener toda la funcionalidad actual
VALIDACIÓN:
- Crear test que reproduzca el NPE
- Verificar que la solución lo previene
- Confirmar que casos válidos siguen funcionando
```

## 🧪 **PATRÓN 6: TESTING ESPECÍFICO**
```
JAVA EXPERT - IMPLEMENTAR PRUEBAS:

CLASE A PROBAR: OrderService.processOrder()
CASOS DE PRUEBA ESPECÍFICOS:
1. Orden válida con stock suficiente:
   - Entrada: OrderDTO con productId=1, quantity=2
   - Mock: Product stock=10, price=100.00
   - Esperado: OrderResponseDTO con total=200.00, status=CONFIRMED
2. Orden con stock insuficiente:
   - Entrada: OrderDTO con productId=1, quantity=15
   - Mock: Product stock=10
   - Esperado: InsufficientStockException
3. Producto inexistente:
   - Entrada: OrderDTO con productId=999
   - Mock: ProductRepository.findById() retorna empty
   - Esperado: ProductNotFoundException
MOCKS REQUERIDOS:
- ProductRepository, InventoryService, PaymentService
COBERTURA: >90% líneas y >80% branches
```

## 📝 **PALABRAS CLAVE QUE ACTIVAN PROTOCOLOS**

### 🔥 TRIGGERS DE VALIDACIÓN ESTRICTA:
- **"implementar"** → Exigir especificaciones técnicas exactas
- **"crear"** → Solicitar nombres de métodos y parámetros específicos
- **"servicio"** → Validar contratos e integración con código existente
- **"endpoint"** → Requerir especificación completa de REST API
- **"validar"** → Definir reglas específicas y casos de prueba

### 🔍 TRIGGERS DE ANÁLISIS DE CÓDIGO:
- **"usar código existente"** → Explorar proyecto para reutilización
- **"integrar con"** → Analizar componentes disponibles
- **"extender"** → Buscar clases base para heredar/componer

### 🚨 TRIGGERS DE RESOLUCIÓN DE ERRORES:
- **"error"** → Nunca comentar, siempre solucionar completamente
- **"bug"** → Identificar causa raíz y implementar fix
- **"excepción"** → Manejar apropiadamente sin romper funcionalidad

## 🎯 **FÓRMULAS DE ÉXITO**

### FÓRMULA PARA IMPLEMENTACIÓN:
```
JAVA EXPERT + [MÉTODO ESPECÍFICO] + [PARÁMETROS EXACTOS] + [CASOS DE PRUEBA] = IMPLEMENTACIÓN EXITOSA
```

### FÓRMULA PARA INTEGRACIÓN:
```
JAVA EXPERT + [ANALIZAR CÓDIGO EXISTENTE] + [ESPECIFICAR INTEGRACIÓN] + [REUTILIZAR COMPONENTES] = INTEGRACIÓN SÓLIDA
```

### FÓRMULA PARA RESOLUCIÓN:
```
JAVA EXPERT + [ERROR ESPECÍFICO] + [CAUSA RAÍZ] + [SOLUCIÓN COMPLETA] = BUG RESUELTO
```

## 🚀 **COMANDOS DE ACTIVACIÓN OPTIMIZADOS**

### MODO ESTRICTO (para implementaciones):
```
JAVA EXPERT - MODO ESTRICTO
[Tu especificación detallada aquí]
```

### MODO ANÁLISIS (para explorar código):
```
JAVA EXPERT - ANALIZAR CÓDIGO
[Qué necesitas explorar/integrar]
```

### MODO SOLUCIÓN (para bugs):
```
JAVA EXPERT - SOLUCIONAR BUG
[Error específico y contexto]
```

---

**💡 TIP CLAVE:** El modo v3.0 está optimizado para **rechazar automáticamente** prompts vagos. Usa estos patrones para **mantener contexto** y obtener **implementaciones completas** sin pérdida de memoria de trabajo.