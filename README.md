# 🚀 Sistema de Cotización de Transporte B2B

Sistema backend desarrollado con **Next.js 15**, **TypeScript**, **Prisma ORM** y **PostgreSQL** siguiendo los principios de **Clean Architecture**.

## 📋 Stack Tecnológico

- **Framework:** Next.js 15.x (App Router)
- **Lenguaje:** TypeScript 5.x (strict mode)
- **ORM:** Prisma 5.x
- **Base de Datos:** PostgreSQL 16.x
- **Validación:** Zod 3.x
- **Email:** Resend
- **WhatsApp:** Ultramsg
- **IDs:** ULID (identificadores únicos lexicográficamente ordenables)

## 🏗️ Arquitectura

Este proyecto implementa **Clean Architecture** con separación clara de responsabilidades:

```
app/api/          → API Routes (Controllers)
lib/services/     → Business Logic Layer
lib/repositories/ → Data Access Layer
lib/validations/  → Zod Schemas
lib/db/           → Prisma Client
types/            → TypeScript Types
```

### Flujo de Datos

```
API Route (Controller)
    ↓
Service (Business Logic)
    ↓
Repository (Data Access)
    ↓
Prisma Client
    ↓
PostgreSQL Database
```

## ⚙️ Pre-requisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** 20 LTS o superior ([descargar](https://nodejs.org/))
- **npm** 10.0.0 o superior (incluido con Node.js)
- **PostgreSQL** 16.x o una cuenta en [Supabase](https://supabase.com) (recomendado)
- **Git** para control de versiones

### Cuentas de Servicios Externos Requeridas

1. **Resend** (envío de emails)
   - Crear cuenta: https://resend.com
   - Obtener API Key en dashboard
   - Email `onboarding@resend.dev` disponible para desarrollo

2. **Ultramsg** (envío de WhatsApp)
   - Crear cuenta: https://ultramsg.com
   - Obtener API Key e Instance ID
   - Conectar número de WhatsApp

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd sistema-cotizacion-transporte-b2b
```

### 2. Instalar dependencias

```bash
npm install
```

Esto instalará todas las dependencias listadas en `package.json`:
- Next.js, React, TypeScript
- Prisma (ORM)
- Zod (validación)
- Resend (emails)
- ULID (IDs únicos)

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y completa con tus valores reales:

**Windows:**
```bash
copy .env.example .env
```

**Linux/Mac:**
```bash
cp .env.example .env
```

Edita `.env` y completa las siguientes variables:

```env
# Base de Datos PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/cotizaciones_db

# Resend (Emails)
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=onboarding@resend.dev
EMAIL_ADMIN=tu-email@empresa.com

# Ultramsg (WhatsApp)
ULTRAMSG_API_KEY=xxxxx
ULTRAMSG_INSTANCE_ID=instance12345
WHATSAPP_ADMIN_NUMBER=573001234567

# App Config
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Opción 1: PostgreSQL Local

Si usas PostgreSQL instalado localmente:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/cotizaciones_db
```

Crear base de datos:
```bash
createdb cotizaciones_db
```

#### Opción 2: Supabase (Recomendado)

1. Crear proyecto en https://supabase.com
2. Ir a **Settings → Database**
3. Copiar **Connection string** en modo **URI**
4. Reemplazar `[YOUR-PASSWORD]` con tu password real

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

### 4. Configurar Prisma

Generar el cliente de Prisma:

```bash
npm run db:generate
```

Esto generará los tipos TypeScript basados en `prisma/schema.prisma`.

### 5. Aplicar migraciones (próximo paso)

⚠️ **NOTA:** En este momento, el schema de Prisma está vacío (solo configuración base).  
Las migraciones se ejecutarán en el **PROMPT 2: MODELO DE DATOS**.

## 🧪 Validar Instalación

Ejecuta estos comandos para verificar que todo está correctamente configurado:

### 1. Verificar compilación TypeScript

```bash
npm run type-check
```

✅ Debe completarse sin errores.

### 2. Iniciar servidor de desarrollo

```bash
npm run dev
```

✅ Servidor debe iniciar en `http://localhost:3000`

### 3. Validar conexión a base de datos

```bash
npx prisma db pull
```

✅ Prisma debe conectar correctamente (incluso si no hay tablas aún).

### 4. Abrir Prisma Studio (opcional)

```bash
npm run db:studio
```

✅ Abre interfaz visual de base de datos en `http://localhost:5555`

## 📁 Estructura del Proyecto

```
proyecto/
│
├── app/                        # Next.js App Router
│   ├── api/                    # API Routes (REST endpoints)
│   │   ├── solicitudes/
│   │   │   ├── route.ts        # POST /api/solicitudes (crear)
│   │   │   └── [id]/
│   │   │       └── route.ts    # GET, PATCH /api/solicitudes/:id
│   │   └── health/
│   │       └── route.ts        # GET /api/health (health check)
│   └── layout.tsx              # Layout principal
│
├── lib/                        # Lógica de negocio y utilidades
│   ├── db/
│   │   └── prisma.ts           # Cliente Prisma singleton
│   ├── repositories/           # Data Access Layer (se implementará en PROMPT 3)
│   ├── services/               # Business Logic Layer (se implementará en PROMPT 4)
│   ├── validations/            # Zod schemas (se implementará en PROMPT 4)
│   └── utils/                  # Funciones utilitarias
│
├── types/                      # Definiciones TypeScript globales
│   └── index.ts
│
├── prisma/
│   └── schema.prisma           # Schema de base de datos (se completará en PROMPT 2)
│
├── .env                        # Variables de entorno (NO commitear)
├── .env.example                # Template de variables de entorno
├── .gitignore                  # Archivos ignorados por Git
├── package.json                # Dependencias y scripts
├── tsconfig.json               # Configuración TypeScript
└── README.md                   # Este archivo
```

## 📝 Scripts Disponibles

### Desarrollo

```bash
npm run dev          # Iniciar servidor desarrollo (localhost:3000)
npm run build        # Compilar proyecto para producción
npm run start        # Iniciar servidor de producción
npm run lint         # Ejecutar ESLint
npm run type-check   # Validar tipos TypeScript sin compilar
```

### Base de Datos (Prisma)

```bash
npm run db:generate  # Generar cliente Prisma (después de cambios en schema)
npm run db:push      # Sincronizar schema con BD (sin migraciones)
npm run db:migrate   # Crear y aplicar migración
npm run db:studio    # Abrir Prisma Studio (GUI para BD)
```

## 🧩 Próximos Pasos

Este es el **PROMPT 1** de una serie de 6 prompts para construir el backend completo.

✅ **COMPLETADO:** Setup del proyecto  
⬜ **SIGUIENTE:** PROMPT 2 - Modelo de Datos y Prisma Schema

### Orden de Implementación

1. ✅ **Setup Proyecto** (este prompt) → Infraestructura base
2. ⬜ **Modelo de Datos** → Definir schema Prisma
3. ⬜ **Capa Repositorio** → Data Access Layer
4. ⬜ **Capa Servicios** → Business Logic
5. ⬜ **Integraciones Externas** → Email y WhatsApp
6. ⬜ **Capa API** → REST Endpoints

Consulta `prompts/BACK_README.md` para más detalles.

## 🛠️ Troubleshooting

### Error: "Cannot find module '@/lib/...'"

**Causa:** Problema con path aliases de TypeScript.

**Solución:** Verifica que `tsconfig.json` tiene:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Error: "Prisma Client not generated"

**Causa:** Cliente Prisma no se generó después de cambios en schema.

**Solución:**
```bash
npm run db:generate
```

### Error: "Database connection failed"

**Causa:** `DATABASE_URL` incorrecta o PostgreSQL no está ejecutándose.

**Solución:**
1. Verifica `DATABASE_URL` en `.env`
2. Si es local, inicia PostgreSQL:
   ```bash
   # Linux
   sudo systemctl start postgresql
   
   # Mac
   brew services start postgresql
   
   # Windows
   # Usar pgAdmin o Services
   ```
3. Si es Supabase, verifica project status en dashboard

### Error: "Port 3000 already in use"

**Causa:** Otro proceso usa el puerto 3000.

**Solución:**
```bash
# Usar otro puerto
PORT=3001 npm run dev

# O matar proceso en puerto 3000 (Linux/Mac)
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

## 📚 Recursos

### Documentación Oficial

- [Next.js 15 Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zod Documentation](https://zod.dev)
- [Resend API Docs](https://resend.com/docs)

### Guías del Proyecto

- `docs/proyecto/DEFINICION_FUNCIONAL.md` - Requerimientos de negocio
- `docs/proyecto/DEFINICION_TECNICA.md` - Especificaciones técnicas
- `prompts/BACK_README.md` - Guía completa de implementación backend

## 🤝 Contribuir

Este proyecto sigue los principios de:
- ✅ Clean Architecture
- ✅ SOLID Principles
- ✅ TypeScript Strict Mode
- ✅ JSDoc para documentación
- ✅ Repository Pattern
- ✅ Service Layer Pattern

## 📄 Licencia

[Especificar licencia]

---

**Desarrollado con:** Next.js 15 + TypeScript + Prisma + PostgreSQL

¿Dudas o problemas? Consulta la documentación en `prompts/BACK_README.md`
