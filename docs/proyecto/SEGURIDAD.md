# Auditoría de Seguridad — CargoClick

**Fecha de auditoría:** 23 febrero 2026  
**Stack:** Next.js 15 · TypeScript · Prisma 5 · PostgreSQL · Clerk Auth  
**Estado:** Documento de trabajo — vulnerabilidades priorizadas por severidad

---

## Resumen Ejecutivo

| Severidad | Cantidad | Estado |
|-----------|----------|--------|
| 🔴 Crítica | 2 | Pendiente |
| 🟠 Alta | 3 | Pendiente |
| 🟡 Media | 4 | Pendiente |
| 🟢 Baja | 4 | Pendiente |

---

## 🔴 CRÍTICAS — Implementar antes de producción

---

### C-1: API pública `/api/solicitudes` bloqueada por Clerk

**Archivo afectado:** `middleware.ts`

**Descripción:**  
El flujo de cotización para clientes (`/cotizar`) realiza llamadas a `/api/solicitudes` (POST)
y `/api/solicitudes/[id]` (PATCH) desde el navegador **sin autenticación**.  
El middleware actual solo marca como pública `/api/health` — el resto de las APIs
requieren sesión de Clerk. Esto rompe el flujo de cotización para usuarios anónimos
(clientes) en producción.

**Impacto:** El formulario de cotización falla en producción con error 307 (redirect a sign-in).

**Solución:**
```ts
// middleware.ts — agregar rutas de API pública del flujo de cotización
const isPublicRoute = createRouteMatcher([
  '/',
  '/home(.*)',
  '/cotizar(.*)',
  '/sign-in(.*)',
  '/api/health(.*)',
  '/api/solicitudes',              // POST — crear solicitud (flujo público)
  '/api/solicitudes/:id',          // GET/PATCH — guardado progresivo del wizard
])
```

> ⚠️ Las rutas internas como `/api/solicitudes/[id]/cotizar`, `/api/ajustes-comerciales`
> y `/api/solicitudes/[id]/ajuste-comercial` deben permanecer protegidas.

---

### C-2: Sin rate limiting en endpoints públicos

**Archivos afectados:** `app/api/solicitudes/route.ts`, `app/api/solicitudes/[id]/route.ts`

**Descripción:**  
No existe ningún mecanismo de rate limiting. Cualquier persona puede hacer miles de
peticiones POST a `/api/solicitudes`, generando spam en la base de datos, aumentando
costos de Supabase/Railway/Resend y bloqueando el servicio.

**Impacto:** DoS económico, abuso del plan de Resend, spam en base de datos.

**Solución — opción A (recomendada, sin dependencias extra con Vercel):**
```ts
// next.config.js
module.exports = {
  async headers() {
    return [{
      source: '/api/:path*',
      headers: [{ key: 'X-RateLimit-Policy', value: '20;w=60' }],
    }]
  },
}
// Configurar rate limiting en el dashboard de Vercel (Build & Deploy > Rate Limiting)
// O usar Vercel Edge Middleware con `@upstash/ratelimit` + Redis
```

**Solución — opción B (con Upstash, gratis tier disponible):**
```bash
npm install @upstash/ratelimit @upstash/redis
```
```ts
// lib/ratelimit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, '60 s'), // 20 req / minuto
})

// En cada API route pública:
const { success } = await ratelimit.limit(request.ip ?? 'anonymous')
if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
```

---

## 🟠 ALTAS — Implementar en el primer sprint de producción

---

### A-1: Headers de seguridad HTTP ausentes

**Archivo afectado:** `next.config.js`

**Descripción:**  
No hay headers de seguridad configurados. Un atacante puede:
- Embeber la app en un iframe para ataques de clickjacking (`X-Frame-Options`)
- Inyectar scripts externos (`Content-Security-Policy`)
- Explotar MIME sniffing (`X-Content-Type-Options`)
- Forzar conexiones HTTP sin cifrado en producción (`Strict-Transport-Security`)

**Solución:**
```js
// next.config.js
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control',   value: 'on' },
  { key: 'X-Frame-Options',          value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options',   value: 'nosniff' },
  { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',  // Solo en producción
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.accounts.dev https://*.clerk.accounts.dev",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://img.clerk.com",
      "font-src 'self'",
      "connect-src 'self' https://*.clerk.accounts.dev https://api.clerk.dev",
      "frame-ancestors 'self'",
    ].join('; ')
  },
]

module.exports = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
  // ...resto de config
}
```

---

### A-2: Health check expone información interna

**Archivo afectado:** `app/api/health/route.ts`

**Descripción:**  
El endpoint `/api/health` es público y devuelve la versión del paquete:
```json
{ "status": "ok", "version": "1.0.0", "database": "connected" }
```
La versión exacta del software ayuda a atacantes a identificar vulnerabilidades conocidas.

**Solución:**
```ts
// Eliminar el campo version de la respuesta pública
return NextResponse.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
  database: 'connected',
  // version removida
})
```

---

### A-3: Sanitización de HTML en templates de email

**Archivos afectados:** `lib/utils/emailTemplates.ts`, campos de texto libre en schemas

**Descripción:**  
Los campos `observaciones`, `empresa`, `contacto`, `detalleCargaPeligrosa` y similares
se insertan directamente en HTML de emails sin sanitización. Un usuario malicioso podría
inyectar HTML en el email del administrador.

**Ejemplo de ataque:**
```
empresa: <script>alert(1)</script><img src=x onerror="...">
```

**Solución:**
```bash
npm install dompurify @types/dompurify
# Para Node.js (server-side):
npm install isomorphic-dompurify
```
```ts
import DOMPurify from 'isomorphic-dompurify'

// En emailTemplates.ts — sanitizar TODOS los campos de usuario
const safe = (str: string | null) =>
  DOMPurify.sanitize(str ?? '', { ALLOWED_TAGS: [] }) // Solo texto plano

// Usar safe() al interpolar en el template HTML
`<p>${safe(solicitud.empresa)}</p>`
```

---

## 🟡 MEDIAS — Próximo sprint

---

### M-1: CORS no configurado explícitamente

**Descripción:**  
Next.js no configura CORS por defecto. Las APIs solo son accesibles desde el mismo origen
por el comportamiento por defecto del browser, pero llamadas server-to-server o desde
herramientas como Postman no tienen restricción de origen.

**Solución:**
```ts
// lib/utils/cors.ts
export function withCors(response: NextResponse): NextResponse {
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL!,
    'http://localhost:3000',
  ]
  response.headers.set('Access-Control-Allow-Origin', allowedOrigins.join(','))
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}
```

---

### M-2: Logs con stack traces completos en producción

**Archivos afectados:** Todos los `route.ts` de `/app/api/`

**Descripción:**  
Todos los `catch` hacen `console.error('[API] Error:', error)` pasando el objeto `error`
completo. En producción (Vercel/Railway), estos logs incluyen stack traces con rutas de
archivo, nombres de módulos y detalles de Prisma que no deberían ser visibles en logs
de acceso compartidos.

**Solución:**
```ts
// lib/utils/logger.ts
export const logger = {
  error: (context: string, error: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${context}]`, error)
    } else {
      // En prod: solo mensaje, sin stack trace en logs públicos
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[${context}] ${message}`)
      // Aquí integrar Sentry, Logtail, etc. en el futuro
    }
  }
}

// Reemplazar en todos los route.ts:
// ❌ console.error('[API] Error:', error)
// ✅ logger.error('API solicitudes', error)
```

---

### M-3: Audit trail — acciones internas sin trazabilidad

**Descripción:**  
Cuando un usuario interno (logueado con Clerk) crea/modifica un `AjusteComercial` o
cambia el estado de una solicitud, no se guarda **quién** hizo la acción. El `userId`
de Clerk no se asocia a los registros.

**Solución:**
```ts
// En los route.ts internos protegidos, leer el userId de Clerk:
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest, ...) {
  const { userId } = await auth()

  await prisma.ajusteComercial.create({
    data: {
      ...data,
      creadoPor: userId,  // Agregar campo al schema Prisma
    }
  })
}
```
```prisma
// prisma/schema.prisma — agregar a AjusteComercial y otros modelos internos
creadoPor   String?   // Clerk userId
```

---

### M-4: Validación de tamaño de body no explícita

**Descripción:**  
No hay límite explícito de tamaño en el body de las requests. Next.js tiene un default
de 1MB por request body, pero no hay validación explícita en rutas críticas.

**Solución:**
```ts
// En route.ts — validar antes de parsear
const contentLength = request.headers.get('content-length')
if (contentLength && parseInt(contentLength) > 50_000) { // 50KB máximo
  return NextResponse.json({ error: 'Payload demasiado grande' }, { status: 413 })
}
```

---

## 🟢 BAJAS — Backlog de seguridad

---

### B-1: Vulnerabilidades en dependencias de desarrollo

**Hallazgo de `npm audit`:**
- `ajv < 6.14.0` — ReDoS moderado (solo en eslint, no producción)
- `minimatch < 10.2.1` — ReDoS alto (solo en herramientas de linting)

**Impacto:** Bajo — solo afectan el entorno de desarrollo, no el bundle de producción.  
**Acción:** `npm audit fix` (sin --force para no romper ESLint).

---

### B-2: Timing attacks en validación de IDs

**Descripción:**  
La API devuelve 404 con texto "Solicitud no encontrada" vs. 400 con "ID inválido"
en tiempos distintos. Un atacante sofisticado podría medir tiempos de respuesta para
enumerar IDs válidos.

**Impacto:** Muy bajo con ULIDs (26 chars alfanumérico + timestamp = espacio enorme).  
**Acción:** Normalizar tiempos de respuesta error con `await new Promise(r => setTimeout(r, Math.random() * 50))` en respuestas de error.

---

### B-3: Rotación de claves de Clerk en caso de exposición

**Descripción:**  
Las claves `CLERK_SECRET_KEY` y `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` aparecieron en
un contexto de conversación con herramienta de IA. Aunque el `.env` está en `.gitignore`,
es buena práctica rotar claves cuando se comparten en canales externos.

**Acción:**  
- clerk.com → API Keys → **"Roll key"** para revocar la actual y generar nueva
- Actualizar `.env` local y variables de entorno en producción

---

### B-4: Sin mecanismo de logout forzado por sesión sospechosa

**Descripción:**  
Clerk soporta revocar sesiones específicas desde el dashboard o via API, pero no hay
código en la app que lo active ante comportamientos sospechosos (múltiples IPs, etc.).

**Acción (futuro):**  
Integrar Clerk webhooks para detectar eventos de seguridad y notificar al admin vía email.

---

## Plan de implementación sugerido

### Sprint 0 — Antes de abrir a producción (1-2 días)
- [ ] **C-1** Corregir rutas públicas de API en middleware
- [ ] **C-2** Implementar rate limiting básico
- [ ] **A-1** Agregar security headers en next.config.js
- [ ] **A-2** Limpiar health check
- [ ] **B-3** Rotar clave de Clerk

### Sprint 1 — Semana 1 de producción (2-3 días)
- [ ] **A-3** Sanitización HTML en emails (instalar isomorphic-dompurify)
- [ ] **M-1** Configurar CORS explícito
- [ ] **M-2** Centralizar logger con niveles

### Sprint 2 — Estabilización (a demanda)
- [ ] **M-3** Audit trail con userId de Clerk
- [ ] **M-4** Límites explícitos de body size
- [ ] **B-1** npm audit fix
- [ ] **B-2** Timing normalization

---

## Recursos de referencia

- [OWASP Top 10 para APIs](https://owasp.org/www-project-api-security/)
- [Next.js Security Headers](https://nextjs.org/docs/app/api-reference/next-config-js/headers)
- [Clerk: Protecting API Routes](https://clerk.com/docs/references/nextjs/auth)
- [Upstash Rate Limiting](https://upstash.com/docs/oss/sdks/ts/ratelimit/gettingstarted)
- [GHSA-3ppc-4f35-3m26 (minimatch)](https://github.com/advisories/GHSA-3ppc-4f35-3m26)

---

*Documento generado en auditoría manual + análisis estático del código fuente.*  
*Actualizar este documento cada vez que se implemente un control o se descubra una nueva vulnerabilidad.*
