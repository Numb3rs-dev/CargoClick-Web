# EJEMPLO PRÁCTICO: TRANSFORMACIÓN DE IDEA A PROMPT ESTRUCTURADO

## ESCENARIO: DE CONCEPTO VAGO A PROMPT PERFECTO

### 📝 IDEA INICIAL (Usuario)
*"Necesito un sistema de usuarios para mi aplicación"*

---

### 🏗️ ANÁLISIS DEL PROMPT ARCHITECT

**🔍 PRIMERA EVALUACIÓN:**
Esta idea es demasiado vaga para el Java Expert Developer. Falta:
- Contexto de negocio específico
- Casos de uso definidos  
- Restricciones técnicas
- Criterios de aceptación medibles

**❓ SESIÓN DE INTERROGATORIO:**

**Prompt Architect pregunta:**
1. ¿Qué tipo de aplicación es? (web, móvil, desktop, API)
2. ¿Qué operaciones específicas necesitan los usuarios? (registro, login, perfiles, roles)
3. ¿Cuántos usuarios concurrentes esperas?
4. ¿Necesitas autenticación externa? (Google, Facebook, LDAP)
5. ¿Qué información debe almacenar cada usuario?
6. ¿Existen diferentes tipos de usuarios o roles?

**👤 RESPUESTAS DEL USUARIO:**
- Aplicación web de gestión de proyectos
- Usuarios necesitan: registro, login, gestión de perfiles, asignación de roles
- Expectativa: 100-500 usuarios concurrentes
- Autenticación: JWT + posible integración con Google
- Info usuario: email, nombre, empresa, rol, fecha registro
- Roles: Admin, Project Manager, Developer, Viewer

---

### 🎯 PROMPT RESULTANTE (Listo para Java Expert Developer)

```markdown
# REQUERIMIENTO: SISTEMA DE GESTIÓN DE USUARIOS PARA APLICACIÓN DE GESTIÓN DE PROYECTOS

## CONTEXTO DE NEGOCIO
**Problema**: Necesidad de autenticación, autorización y gestión de usuarios en una aplicación web de gestión de proyectos empresariales
**Usuarios**: Equipos de desarrollo, project managers y administradores empresariales
**Valor**: Seguridad, control de acceso granular y gestión centralizada de usuarios por proyecto

## ESPECIFICACIÓN FUNCIONAL

### Funcionalidad Principal
Sistema completo de autenticación y autorización con gestión de roles y perfiles de usuario

### Casos de Uso Principales
1. **Registro de Usuario**
   - Usuario se registra con email, nombre, empresa
   - Validación de email obligatoria
   - Asignación de rol por defecto (Viewer)

2. **Autenticación**
   - Login con email/password
   - Login con Google OAuth 2.0
   - Generación y validación de JWT tokens
   - Refresh token automático

3. **Gestión de Perfiles**
   - Visualización y edición de perfil propio
   - Cambio de contraseña
   - Subida de avatar (opcional)

4. **Administración de Usuarios** (Solo Admin)
   - Listar todos los usuarios
   - Asignar/cambiar roles
   - Activar/desactivar usuarios
   - Ver estadísticas de uso

### Casos de Error
- Email duplicado en registro
- Credenciales inválidas
- Token JWT expirado
- Acceso no autorizado por rol
- Conexión fallida con Google OAuth

### Criterios de Aceptación
- ✅ Registro exitoso genera email de confirmación
- ✅ Login válido retorna JWT con expiración de 24h
- ✅ Roles restringen acceso a endpoints específicos
- ✅ Password debe cumplir: mín 8 caracteres, 1 mayúscula, 1 número
- ✅ Integración Google OAuth funcional
- ✅ Sistema soporta 500 usuarios concurrentes
- ✅ Tiempo de respuesta < 200ms para autenticación
- ✅ Logs de auditoría para cambios de roles

## ARQUITECTURA TÉCNICA

### Stack Tecnológico
- **Backend**: Spring Boot 3.x, Spring Security 6.x
- **Base de Datos**: PostgreSQL con JPA/Hibernate
- **Autenticación**: JWT + Spring Security OAuth2
- **Validación**: Bean Validation (JSR-303)
- **Testing**: JUnit 5, Mockito, TestContainers

### Patrones Arquitectónicos
- **Clean Architecture**: Controllers, Services, Repositories
- **SOLID Principles**: Especialmente ISP y DIP para roles
- **DTO Pattern**: Para transferencia de datos de usuario
- **Factory Pattern**: Para creación de diferentes tipos de usuario
- **Observer Pattern**: Para eventos de cambio de estado de usuario

### Estructura de Entidades
```java
User {
  id: UUID
  email: String (unique)
  password: String (encrypted)
  firstName: String
  lastName: String
  company: String
  role: UserRole (enum)
  active: Boolean
  emailVerified: Boolean
  createdAt: LocalDateTime
  lastLoginAt: LocalDateTime
}

UserRole: ADMIN, PROJECT_MANAGER, DEVELOPER, VIEWER
```

### Endpoints Principales
- POST /auth/register
- POST /auth/login
- POST /auth/google
- GET /auth/me
- PUT /users/profile
- GET /admin/users (ADMIN only)
- PUT /admin/users/{id}/role (ADMIN only)

### Integraciones
- **Google OAuth 2.0**: Para login social
- **Email Service**: Para confirmaciones y notificaciones
- **Audit Log**: Para tracking de cambios críticos

## RESTRICCIONES Y CALIDAD

### Performance
- Tiempo de respuesta login: < 200ms
- Soporte para 500 usuarios concurrentes
- Cache de roles en memoria (Redis opcional)

### Seguridad
- Passwords encriptados con BCrypt
- JWT tokens firmados con RS256
- Rate limiting: 5 intentos login/minuto por IP
- HTTPS obligatorio en producción
- Validación de entrada en todos los endpoints

### Testing
- Cobertura mínima: 85%
- Tests unitarios para servicios
- Tests de integración para controllers
- Tests de seguridad para endpoints protegidos

### Documentación
- OpenAPI/Swagger para documentación de API
- Diagramas de arquitectura
- Guía de deployment

## ENTREGABLES

### Código
- [ ] Entidades JPA (User, UserRole)
- [ ] DTOs (UserRegistrationDTO, UserProfileDTO, etc.)
- [ ] Controllers (AuthController, UserController, AdminController)
- [ ] Services (UserService, AuthService, EmailService)
- [ ] Repositories (UserRepository)
- [ ] Configuración Spring Security
- [ ] Configuración JWT
- [ ] Integración Google OAuth

### Testing
- [ ] Tests unitarios completos
- [ ] Tests de integración API
- [ ] Tests de seguridad
- [ ] Datos de prueba (TestContainers)

### Documentación
- [ ] Documentación API (Swagger)
- [ ] Diagramas de arquitectura
- [ ] Scripts de base de datos
- [ ] Guía de configuración OAuth

### Configuración
- [ ] application.yml con perfiles
- [ ] Scripts de migración DB
- [ ] Docker Compose para desarrollo
- [ ] Configuración CI/CD

## INFORMACIÓN ADICIONAL

### Consideraciones de Escalabilidad
- Preparado para múltiples instancias (stateless)
- Cache distribuido para roles si es necesario
- Base de datos optimizada con índices

### Roadmap Futuro
- Autenticación multifactor (2FA)
- Integración con más proveedores OAuth
- Gestión avanzada de permisos por proyecto
```

---

### ✅ VALIDACIÓN FINAL DEL PROMPT ARCHITECT

**🔴 Contexto de Negocio**: ✅ COMPLETO
- Problema específico definido
- Usuarios objetivo identificados
- Valor de negocio claro

**🟡 Especificaciones Técnicas**: ✅ COMPLETO  
- Stack tecnológico definido
- Arquitectura detallada
- Patrones específicos

**🟢 Criterios de Calidad**: ✅ COMPLETO
- Performance medible
- Seguridad específica
- Testing con cobertura

**RESULTADO**: ✅ Prompt APROBADO para Java Expert Developer

---

## 📊 COMPARACIÓN: ANTES VS DESPUÉS

| Aspecto | Idea Original | Prompt Final |
|---------|---------------|--------------|
| **Claridad** | "sistema de usuarios" | Sistema autenticación/autorización con roles específicos |
| **Contexto** | Ninguno | Aplicación gestión proyectos empresariales |
| **Tecnología** | No especificada | Spring Boot 3.x, PostgreSQL, JWT, OAuth2 |
| **Validación** | 🔴 RECHAZADO | 🟢 APROBADO |
| **Tiempo estimado** | Imposible estimar | Claramente scopeable |

**TRANSFORMACIÓN**: De 7 palabras vagas a especificación completa de 150+ líneas con todos los detalles técnicos y de negocio necesarios.