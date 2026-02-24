# PROMPT 1: CONFIGURACIÓN INICIAL DEL PROYECTO BACKEND

## CONTEXTO DE NEGOCIO
**Problema**: Necesitamos configurar la infraestructura base de un sistema de cotización de transporte B2B que captura solicitudes, las persiste en PostgreSQL y envía notificaciones.

**Usuarios**: Desarrolladores backend que implementarán las capas de servicios y APIs.

**Valor**: Tener un proyecto Next.js correctamente estructurado con todas las dependencias, configuraciones y estructura de carpetas necesaria para implementar Clean Architecture.

## ESPECIFICACIÓN FUNCIONAL

### Funcionalidad Principal
Configurar proyecto Next.js 15 con:
- TypeScript estricto
- Prisma ORM conectado a PostgreSQL
- Estructura de carpetas siguiendo Clean Architecture
- Variables de entorno configuradas
- Dependencias instaladas

### Casos de Uso
1. **Instalación de dependencias**: Instalar todas las librerías necesarias del stack tecnológico
2. **Configuración de TypeScript**: Configurar tsconfig.json con modo estricto
3. **Inicialización de Prisma**: Configurar Prisma con provider PostgreSQL
4. **Estructura de carpetas**: Crear estructura completa de carpetas según arquitectura
5. **Variables de entorno**: Crear archivos .env.example con todas las variables necesarias

### Criterios de Aceptación
- ✅ Proyecto Next.js 15.x inicializado con TypeScript
- ✅ Todas las dependencias del stack instaladas (ver lista)
- ✅ Prisma inicializado con proveedor PostgreSQL
- ✅ Estructura de carpetas completa creada (lib/, types/, etc.)
- ✅ Archivo .env.example con todas las variables documentadas
- ✅ tsconfig.json configurado con strict mode
- ✅ Comando `npm run dev` ejecuta sin errores
- ✅ Git inicializado con .gitignore apropiado

## ARQUITECTURA TÉCNICA

### Stack Tecnológico Completo
**Frontend/Framework:**
- Next.js 15.x (App Router)
- React 19.x
- TypeScript 5.x

**Backend:**
- Next.js API Routes
- Prisma 5.x (ORM)
- Zod 3.x (validación)
- ulid (generación IDs únicos)

**Base de Datos:**
- PostgreSQL 16.x (Supabase o local)

**Servicios Externos:**
- Resend (emails)
- Ultramsg (WhatsApp)

**Styling (opcional en esta fase):**
- Tailwind CSS 4.x
- shadcn/ui

### Estructura de Carpetas Requerida
```
proyecto/
├── app/
│   ├── api/
│   │   ├── solicitudes/
│   │   │   ├── route.ts           (POST, GET list)
│   │   │   └── [id]/
│   │   │       └── route.ts       (GET, PATCH)
│   │   └── health/
│   │       └── route.ts           (Health check)
│   └── layout.tsx
├── lib/
│   ├── db/
│   │   └── prisma.ts              (Prisma client singleton)
│   ├── repositories/
│   │   └── solicitudRepository.ts
│   ├── services/
│   │   ├── solicitudService.ts
│   │   ├── notificacionService.ts
│   │   ├── emailService.ts
│   │   └── whatsappService.ts
│   ├── validations/
│   │   └── schemas.ts             (Zod schemas)
│   └── utils/
│       ├── errors.ts
│       └── logger.ts
├── types/
│   └── index.ts                   (Type definitions globales)
├── prisma/
│   └── schema.prisma
├── .env.example
├── .env
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

### Dependencias a Instalar

**Producción:**
```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@prisma/client": "^5.0.0",
    "zod": "^3.22.0",
    "ulid": "^2.3.0",
    "resend": "^3.0.0"
  }
}
```

**Desarrollo:**
```json
{
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "typescript": "^5.0.0",
    "prisma": "^5.0.0"
  }
}
```

### Configuración TypeScript (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### Variables de Entorno Requeridas (.env.example)
```env
# Base de Datos
DATABASE_URL=postgresql://user:password@localhost:5432/cotizaciones_db

# Email Service (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=notificaciones@tuempresa.com
EMAIL_ADMIN=admin@tuempresa.com

# WhatsApp Service (Ultramsg)
ULTRAMSG_API_KEY=xxxxxxxxxxxxx
ULTRAMSG_INSTANCE_ID=instance12345
WHATSAPP_ADMIN_NUMBER=+573001234567

# Configuración de App
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## RESTRICCIONES Y CALIDAD

### Performance
- Startup de desarrollo < 10 segundos
- Prisma client debe usar singleton pattern (evitar múltiples instancias)

### Seguridad
- `.env` DEBE estar en `.gitignore`
- `.env.example` SIN valores reales (solo placeholders)
- TypeScript strict mode habilitado (prevenir errores en tiempo compilación)

### Testing
- Proyecto debe compilar sin errores TypeScript
- `npm run dev` debe iniciar correctamente
- Prisma debe conectar a base de datos (validar con `npx prisma db pull` o similar)

### Estándares de Código
- ESLint configurado por defecto de Next.js
- Prettier (opcional pero recomendado)
- Convención de nombres:
  - Archivos: camelCase (solicitudService.ts)
  - Tipos: PascalCase (Solicitud, SolicitudDTO)
  - Funciones: camelCase (crearSolicitud)

## ENTREGABLES

### Checklist de Completitud
- [ ] Proyecto Next.js 15 inicializado
- [ ] package.json con todas las dependencias listadas
- [ ] Dependencias instaladas (node_modules/)
- [ ] Estructura de carpetas completa creada (carpetas vacías con .gitkeep si es necesario)
- [ ] Prisma inicializado (carpeta prisma/ con schema.prisma base)
- [ ] Archivo .env.example creado con todas las variables documentadas
- [ ] Archivo .gitignore con .env, node_modules, .next, etc.
- [ ] tsconfig.json configurado con strict mode
- [ ] README.md con instrucciones de setup
- [ ] Git inicializado con commit inicial

### Archivos a Crear

**1. prisma/schema.prisma (base inicial)**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Modelo completo se definirá en siguiente prompt
```

**2. lib/db/prisma.ts (Singleton client)**
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**3. README.md (Instrucciones de setup)**
Incluir:
- Pre-requisitos (Node 20+, PostgreSQL)
- Pasos de instalación
- Configuración de .env
- Comandos útiles (dev, build, prisma)

### Validación de Completitud
Ejecutar estos comandos para validar setup:
```bash
npm install          # Instala dependencias sin errores
npm run dev          # Inicia servidor en puerto 3000
npx prisma generate  # Genera cliente Prisma sin errores
npx tsc --noEmit     # Valida TypeScript sin errores de compilación
```

## NOTAS IMPORTANTES

### ⚠️ NO IMPLEMENTAR EN ESTA FASE
- ❌ Modelo de datos completo de Prisma (siguiente prompt)
- ❌ Lógica de servicios
- ❌ Endpoints de API
- ❌ Validaciones con Zod
- ❌ Integraciones con servicios externos

### ✅ SÍ HACER EN ESTA FASE
- ✅ Instalar todas las dependencias
- ✅ Configurar estructura de carpetas
- ✅ Inicializar Prisma (sin modelo completo aún)
- ✅ Configurar variables de entorno
- ✅ Validar que el proyecto compila y arranca

### Próximo Paso
Una vez completado este prompt, continuar con **PROMPT 2: MODELO DE DATOS Y PRISMA SCHEMA**.

---

**Objetivo Final**: Base del proyecto lista para comenzar desarrollo de capas de arquitectura.
