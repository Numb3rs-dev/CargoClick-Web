# Estrategia SEO Técnico — CargoClick

> **Objetivo:** Posicionar cargoclick.com.co en Google Colombia para búsquedas B2B de transporte de carga terrestre, generando leads orgánicos sin depender exclusivamente de pauta pagada.

---

## Estado Actual del Sitio

| Elemento | Estado |
|---|---|
| Dominio | `cargoclick.com.co` ✅ |
| HTTPS / SSL | ✅ (Railway + Let's Encrypt) |
| Meta tags OG | ✅ (definidos en `app/home/page.tsx`) |
| `sitemap.xml` | ❌ Pendiente |
| `robots.txt` | ❌ Pendiente |
| Schema.org JSON-LD | ❌ Pendiente |
| Google Search Console | ❌ Pendiente |
| Google Analytics 4 | ❌ Pendiente |
| Core Web Vitals | ⏳ Por medir |
| Páginas de servicios indexables | ❌ Solo hay Home |

---

## Fase 1 — Fundamentos Técnicos (Semana 1)

Estas acciones no requieren contenido nuevo. Son configuraciones que habilitan que Google **encuentre, entienda y confíe** en el sitio.

### 1.1 `sitemap.xml` dinámico

Next.js App Router genera el sitemap automáticamente con un archivo `app/sitemap.ts`.

**Páginas que debe incluir el sitemap:**
- `/home`
- `/cotizar`
- Futuras páginas de servicios

**Implementación:** Crear `app/sitemap.ts` → Next.js lo sirve en `cargoclick.com.co/sitemap.xml`.

---

### 1.2 `robots.txt`

Instrucciones para los crawlers de Google (y otros bots).

**Reglas mínimas:**
- Permitir indexación de `/home` y `/cotizar`
- Bloquear `/api/*`, `/sign-in`, `/solicitudes` (área privada)
- Apuntar a la URL del sitemap

**Implementación:** Crear `app/robots.ts` → Next.js lo sirve en `cargoclick.com.co/robots.txt`.

---

### 1.3 Schema.org JSON-LD

Le dice a Google exactamente qué es el sitio y qué servicios ofrece. Aparece en los resultados enriquecidos (rich snippets).

**Schemas a implementar:**

**`Organization`** — en el layout global:
```json
{
  "@type": "Organization",
  "name": "CargoClick",
  "url": "https://cargoclick.com.co",
  "logo": "https://cargoclick.com.co/assets/CargoClickLogo.jpeg",
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "info@cargoclick.com.co",
    "contactType": "customer service",
    "areaServed": "CO"
  }
}
```

**`Service`** — en la home:
```json
{
  "@type": "Service",
  "name": "Transporte de Carga Terrestre",
  "provider": { "@type": "Organization", "name": "CargoClick" },
  "areaServed": "Colombia",
  "description": "Servicio de transporte de carga terrestre con respaldo operativo nacional."
}
```

**Implementación:** Componente `<JsonLd />` insertado en `app/layout.tsx` y `app/home/page.tsx`.

---

### 1.4 Meta tags faltantes

Además de OG, Google usa:
- `<meta name="geo.region" content="CO" />` — señal de localización Colombia
- `<meta name="geo.placename" content="Bogotá" />`
- `<link rel="canonical" />` — en cada página para evitar contenido duplicado
- `<html lang="es-CO">` — verificar que esté configurado

---

## Fase 2 — Medición (Semana 1-2)

Sin datos no hay estrategia. Antes de crear contenido, hay que saber qué está pasando.

### 2.1 Google Search Console

**Pasos:**
1. Ir a [search.google.com/search-console](https://search.google.com/search-console)
2. Agregar propiedad con dominio `cargoclick.com.co`
3. Verificar via registro TXT en Cloudflare DNS
4. Enviar `sitemap.xml` manualmente
5. Solicitar indexación de `/home` y `/cotizar`

**Qué nos dará:**
- Qué palabras clave generan impresiones (aunque no clics todavía)
- Errores de indexación
- Core Web Vitals reales

### 2.2 Google Analytics 4 (GA4)

**Eventos clave a rastrear desde el inicio:**
- `page_view` en `/home` y `/cotizar`
- `click` en botón "Solicitar Cotización"
- `form_submit` en el formulario de cotización
- `scroll_depth` — ¿hasta dónde leen la home?

**Implementación:** Google Tag Manager (GTM) como capa intermedia, permite agregar eventos sin tocar código después.

---

## Fase 3 — Palabras Clave Target

### Búsquedas con intención de compra (prioridad alta)

| Keyword | Volumen estimado Colombia | Dificultad |
|---|---|---|
| transporte de carga Colombia | Alto | Alta |
| fletes terrestres Colombia | Medio | Media |
| empresa de transporte de carga terrestre | Medio | Media |
| cotización flete Bogotá Medellín | Medio | Baja |
| cotización flete Bogotá Cali | Medio | Baja |
| transporte de carga para empresas | Medio | Baja |
| servicio de cargue descargue Bogotá | Bajo | Baja |

### Búsquedas long-tail (ganar rápido)

Estas tienen menos competencia y una intención muy específica:

- "cómo contratar transporte de carga en Colombia"
- "precio flete por tonelada Colombia 2025"
- "transporte carga refrigerada FMCG Colombia"
- "empresa transporte INVIMA carga controlada"

---

## Fase 4 — Contenido SEO (Semana 3-6)

El sitio actualmente es una **single page app comercial**. Para posicionar en Google hace falta contenido indexable por keyword.

### Páginas de servicios (prioridad 1)

Cada página = una intención de búsqueda específica.

| URL | Keyword objetivo |
|---|---|
| `/servicios/carga-general` | transporte de carga general Colombia |
| `/servicios/carga-masiva` | transporte carga masiva empresas |
| `/servicios/rutas-nacionales` | rutas transporte terrestre Colombia |

### Blog / Recursos (prioridad 2)

Artículos que atraen al decisor de compra B2B:

- "Cómo reducir costos de logística en tu empresa"
- "Qué documentos necesitas para transportar carga en Colombia (RNDC)"
- "Guía de fletes terrestres: cómo funciona el precio"
- "Diferencias entre empresa de transporte y intermediario logístico"

### Página "Quiénes Somos" (prioridad 1)

Google penaliza sitios sin entidad. Una página con la historia, el equipo y el respaldo de Transportes Nuevo Mundo S.A.S. genera **E-E-A-T** (Experience, Expertise, Authority, Trust) — señal crítica de rankings.

---

## Fase 5 — Link Building Local (Semana 4+)

Los links externos son votos de confianza para Google.

### Acciones concretas para Colombia B2B:

1. **Google Business Profile** — crear perfil de empresa en Google Maps para CargoClick / Transportes Nuevo Mundo. Esto activa el panel de Knowledge Graph en búsquedas de marca.

2. **Directorios de empresas colombianas:**
   - Páginas Amarillas Colombia
   - Kompass Colombia
   - Colombia.com directorio empresarial

3. **Cámara de Comercio de Bogotá** — perfil en su directorio online

4. **Asociaciones logísticas** — ASOCOLDE, Logyca — menciones o listados

5. **Prensa / notas de prensa** — un comunicado de lanzamiento en portales como La República o Portafolio (versión gratuita en PR Newswire Colombia)

---

## Checklist de Implementación

### Semana 1 — Código
- [ ] Crear `app/sitemap.ts`
- [ ] Crear `app/robots.ts`
- [ ] Crear componente `<JsonLd />` con Schema Organization + Service
- [ ] Agregar `lang="es-CO"` en `app/layout.tsx`
- [ ] Agregar meta `geo.region` y `canonical` en layout
- [ ] Instalar Google Tag Manager en el layout

### Semana 1 — Plataformas
- [ ] Verificar dominio en Google Search Console
- [ ] Enviar sitemap.xml en Search Console
- [ ] Crear cuenta GA4 + conectar via GTM
- [ ] Crear Google Business Profile para CargoClick

### Semana 2 — Medición
- [ ] Confirmar indexación de `/home` y `/cotizar` en Search Console
- [ ] Verificar que eventos GA4 se disparan correctamente
- [ ] Hacer test de schema.org en [schema.org/validator](https://validator.schema.org)
- [ ] Hacer test de Core Web Vitals en PageSpeed Insights

### Semana 3-4 — Contenido
- [ ] Escribir página "Quiénes Somos"
- [ ] Escribir primera página de servicio (`/servicios/carga-general`)
- [ ] Escribir primer artículo de blog

### Semana 4+ — Link Building
- [ ] Google Business Profile verificado
- [ ] Listado en 3 directorios empresariales colombianos
- [ ] Comunicado de lanzamiento publicado

---

## KPIs de Seguimiento

| Métrica | Herramienta | Meta Mes 1 | Meta Mes 3 |
|---|---|---|---|
| Páginas indexadas | Search Console | 2+ | 6+ |
| Impresiones orgánicas | Search Console | 100+ | 1,000+ |
| Clics orgánicos | Search Console | 5+ | 80+ |
| Posición promedio | Search Console | < 50 | < 20 |
| Sesiones web | GA4 | - | 200+/mes |
| Formularios enviados (orgánico) | GA4 | - | 5+/mes |

---

## Notas Técnicas (Stack Next.js / Railway)

- **`app/sitemap.ts`** — Next.js 15 genera `/sitemap.xml` automáticamente, incluye `lastModified` y `changeFrequency`
- **`app/robots.ts`** — genera `/robots.txt` listo para production
- **JSON-LD** — inyectado via `<script type="application/ld+json">` en `<head>`, no afecta rendimiento
- **GTM** — se instala via `@next/third-parties` (paquete oficial Next.js, optimizado para Core Web Vitals)
- **Canonical** — usar `alternates.canonical` en el objeto `metadata` de cada page.tsx

---

*Documento creado: Febrero 2026 — CargoClick*
