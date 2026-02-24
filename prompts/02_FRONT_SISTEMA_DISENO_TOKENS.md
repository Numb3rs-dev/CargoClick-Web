# PROMPT 02: SISTEMA DE DISEÑO Y TOKENS CSS

## CONTEXTO DE NEGOCIO
Necesitamos un sistema de diseño **escalable y personalizable** que permita cambiar toda la identidad visual del sistema modificando únicamente variables CSS, sin tocar el código de componentes.

**Valor de negocio:** 
- Permitir personalización para clientes corporativos en < 30 minutos
- Mantener consistencia visual automática en todos los componentes
- Facilitar A/B testing de diferentes esquemas de color

## ESPECIFICACIÓN FUNCIONAL

### Requisitos de Personalización
1. **Colores corporativos cambiables:** Primario, secundario, acentos
2. **Colores del chat:** Burbujas bot y usuario independientes
3. **Tipografía corporativa:** Familia de fuentes configurable
4. **Espaciado:** Sistema de spacing consistente (4px, 8px, 16px, 24px, 32px)
5. **Border radius:** Controlar "curvatura" de elementos (plano vs redondeado)

### Experiencia de Personalización Esperada
```
Cambiar de azul corporativo a verde:
1. Editar variable --primary en globals.css
2. Guardar archivo
3. ✅ TODOS los botones, links, burbujas de usuario se actualizan
```

## ARQUITECTURA TÉCNICA

### Tecnología: CSS Custom Properties (Variables CSS)

**Por qué CSS Variables y no Sass/Less:**
- ✅ Dinámicas: Pueden cambiarse en runtime vía JavaScript
- ✅ Sin compilación: Cambios instantáneos
- ✅ Soporte nativo: Todos los navegadores modernos
- ✅ Tailwind compatible: Se integran perfectamente con theme.extend

### Estructura de Archivos

```
app/
├── globals.css                    # Variables CSS principales
├── layout.tsx                     # Inyecta variables en :root
└── cotizar/
    └── components/
        └── styles/
            └── chat.css           # Estilos específicos del chat
```

## DEFINICIÓN DE TOKENS (CSS CUSTOM PROPERTIES)

### Archivo: app/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* ============================================
       COLORES CORPORATIVOS (Personalizable)
       Cambiar estos valores para adaptar marca
       ============================================ */
    
    /* Color primario (botones, links, CTA) */
    --primary: 220 90% 56%;              /* Azul #3B82F6 */
    --primary-foreground: 210 40% 98%;   /* Texto sobre primario */
    
    /* Color secundario (badges, acciones secundarias) */
    --secondary: 142 76% 36%;            /* Verde #10B981 */
    --secondary-foreground: 355 7% 97%;  /* Texto sobre secundario */
    
    /* Color de acento (alertas, highlights) */
    --accent: 24 95% 53%;                /* Naranja #F59E0B */
    --accent-foreground: 26 83% 14%;     /* Texto sobre acento */
    
    /* Color destructivo (errores, validaciones) */
    --destructive: 0 84% 60%;            /* Rojo #EF4444 */
    --destructive-foreground: 210 40% 98%;
    
    /* ============================================
       COLORES FUNCIONALES DEL SISTEMA
       ============================================ */
    
    /* Fondo y texto principal */
    --background: 0 0% 100%;             /* Blanco */
    --foreground: 222 47% 11%;           /* Gris oscuro texto */
    
    /* Cards y contenedores */
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    
    /* Elementos desactivados/muted */
    --muted: 210 40% 96%;                /* Gris muy claro */
    --muted-foreground: 215 16% 47%;     /* Gris medio */
    
    /* Bordes e inputs */
    --border: 214 32% 91%;               /* Gris claro bordes */
    --input: 214 32% 91%;                /* Fondo inputs */
    --ring: 221 83% 53%;                 /* Focus ring */
    
    /* ============================================
       COLORES ESPECÍFICOS DEL CHAT
       (Independientes para máxima flexibilidad)
       ============================================ */
    
    /* Burbujas de preguntas (bot) */
    --chat-bot-bg: 220 13% 91%;          /* Gris #E5E7EB */
    --chat-bot-text: 222 47% 11%;        /* Texto oscuro */
    --chat-bot-border: 220 13% 85%;      /* Borde opcional */
    
    /* Burbujas de respuestas (usuario) */
    --chat-user-bg: var(--primary);      /* Usa color primario */
    --chat-user-text: var(--primary-foreground);
    --chat-user-border: 220 90% 50%;     /* Borde más oscuro */
    
    /* Contenedor del chat */
    --chat-container-bg: 0 0% 98%;       /* Fondo ligeramente gris */
    
    /* ============================================
       SISTEMA DE ESPACIADO
       ============================================ */
    
    --spacing-xs: 0.25rem;    /* 4px */
    --spacing-sm: 0.5rem;     /* 8px */
    --spacing-md: 1rem;       /* 16px */
    --spacing-lg: 1.5rem;     /* 24px */
    --spacing-xl: 2rem;       /* 32px */
    --spacing-2xl: 3rem;      /* 48px */
    --spacing-3xl: 4rem;      /* 64px */
    
    /* ============================================
       BORDER RADIUS (Curvatura)
       ============================================ */
    
    --radius-sm: 0.25rem;     /* 4px - Poco redondeado */
    --radius-md: 0.5rem;      /* 8px - Medio */
    --radius-lg: 1rem;        /* 16px - Bastante redondeado */
    --radius-xl: 1.5rem;      /* 24px - Muy redondeado */
    --radius-full: 9999px;    /* Completamente redondo */
    
    /* Radius por defecto del sistema */
    --radius: var(--radius-md);
    
    /* ============================================
       TIPOGRAFÍA
       ============================================ */
    
    --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
    --font-mono: 'Fira Code', 'Courier New', monospace;
    
    /* Tamaños de fuente */
    --text-xs: 0.75rem;       /* 12px */
    --text-sm: 0.875rem;      /* 14px */
    --text-base: 1rem;        /* 16px */
    --text-lg: 1.125rem;      /* 18px */
    --text-xl: 1.25rem;       /* 20px */
    --text-2xl: 1.5rem;       /* 24px */
    --text-3xl: 2rem;         /* 32px */
    
    /* Pesos de fuente */
    --font-normal: 400;
    --font-medium: 500;
    --font-semibold: 600;
    --font-bold: 700;
    
    /* ============================================
       SOMBRAS
       ============================================ */
    
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    
    /* ============================================
       TIEMPOS DE ANIMACIÓN
       ============================================ */
    
    --duration-fast: 150ms;
    --duration-normal: 300ms;
    --duration-slow: 500ms;
    
    --ease-in: cubic-bezier(0.4, 0, 1, 1);
    --ease-out: cubic-bezier(0, 0, 0.2, 1);
    --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  /* ============================================
     TEMA OSCURO (Opcional - Fase futura)
     ============================================ */
  
  .dark {
    --background: 222 47% 11%;
    --foreground: 210 40% 98%;
    
    --card: 222 47% 11%;
    --card-foreground: 210 40% 98%;
    
    --chat-container-bg: 222 47% 8%;
    --chat-bot-bg: 222 47% 15%;
    --chat-bot-text: 210 40% 98%;
    
    /* Burbujas de usuario mantienen color primario */
    --chat-user-bg: var(--primary);
    --chat-user-text: var(--primary-foreground);
  }
}

/* ============================================
   CLASES UTILITARIAS CUSTOM
   ============================================ */

@layer components {
  /* Contenedor principal del chat */
  .chat-container {
    background-color: hsl(var(--chat-container-bg));
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    box-shadow: var(--shadow-md);
  }
  
  /* Burbuja de mensaje del bot */
  .bot-message {
    background-color: hsl(var(--chat-bot-bg));
    color: hsl(var(--chat-bot-text));
    border-radius: var(--radius-xl);
    padding: var(--spacing-md);
    max-width: 80%;
    align-self: flex-start;
    animation: fadeInUp var(--duration-normal) var(--ease-out);
  }
  
  /* Burbuja de mensaje del usuario */
  .user-message {
    background-color: hsl(var(--chat-user-bg));
    color: hsl(var(--chat-user-text));
    border-radius: var(--radius-xl);
    padding: var(--spacing-md);
    max-width: 80%;
    align-self: flex-end;
    animation: fadeInLeft var(--duration-normal) var(--ease-out);
  }
  
  /* Botón primario */
  .btn-primary {
    background-color: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
    padding: var(--spacing-md) var(--spacing-xl);
    border-radius: var(--radius);
    font-weight: var(--font-semibold);
    transition: all var(--duration-fast) var(--ease-in-out);
  }
  
  .btn-primary:hover {
    filter: brightness(0.95);
    box-shadow: var(--shadow-md);
  }
  
  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

/* ============================================
   ANIMACIONES
   ============================================ */

@layer utilities {
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeInLeft {
    from {
      opacity: 0;
      transform: translateX(10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .animate-fadeInUp {
    animation: fadeInUp var(--duration-normal) var(--ease-out);
  }
  
  .animate-fadeInLeft {
    animation: fadeInLeft var(--duration-normal) var(--ease-out);
  }
}
```

## INTEGRACIÓN CON TAILWIND

### Archivo: tailwind.config.ts

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Aliasing de CSS variables a clases de Tailwind
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        
        // Colores específicos del chat
        chatBot: {
          DEFAULT: "hsl(var(--chat-bot-bg))",
          text: "hsl(var(--chat-bot-text))",
        },
        chatUser: {
          DEFAULT: "hsl(var(--chat-user-bg))",
          text: "hsl(var(--chat-user-text))",
        },
        chatContainer: "hsl(var(--chat-container-bg))",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-full)",
      },
      spacing: {
        xs: "var(--spacing-xs)",
        sm: "var(--spacing-sm)",
        md: "var(--spacing-md)",
        lg: "var(--spacing-lg)",
        xl: "var(--spacing-xl)",
        "2xl": "var(--spacing-2xl)",
        "3xl": "var(--spacing-3xl)",
      },
    },
  },
  plugins: [],
};

export default config;
```

## USO EN COMPONENTES

### Ejemplo: BotMessage.tsx
```tsx
export function BotMessage({ texto }: { texto: string }) {
  return (
    <div className="bot-message">
      {/* Usa clase definida en globals.css */}
      <p className="text-base font-normal">{texto}</p>
    </div>
  );
}
```

### Ejemplo: UserMessage.tsx
```tsx
export function UserMessage({ texto }: { texto: string }) {
  return (
    <div className="user-message">
      {/* Usa clase definida en globals.css */}
      <p className="text-base font-medium">{texto}</p>
    </div>
  );
}
```

### Ejemplo: Button con Tailwind
```tsx
export function ContinueButton({ onClick, loading }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="bg-primary text-primary-foreground px-xl py-md rounded-lg font-semibold hover:brightness-95 disabled:opacity-50"
    >
      {loading ? "Guardando..." : "Continuar"}
    </button>
  );
}
```

## PERSONALIZACIÓN: 3 MÉTODOS

### Método 1: Edición Directa de globals.css ⭐ (Recomendado para MVP)

**Pasos:**
1. Abrir `app/globals.css`
2. Modificar valores en `:root`
3. Guardar → ¡Cambios instantáneos!

**Ejemplo - Cambiar de azul a verde corporativo:**
```css
:root {
  /* ANTES */
  --primary: 220 90% 56%;  /* Azul */
  
  /* DESPUÉS */
  --primary: 142 76% 36%;  /* Verde */
}
```

### Método 2: Variables de Entorno (Fase 2)

**Archivo:** `.env.local`
```env
NEXT_PUBLIC_PRIMARY_COLOR=142 76% 36%
NEXT_PUBLIC_CHAT_BOT_BG=220 13% 91%
```

**Archivo:** `app/layout.tsx`
```tsx
export default function RootLayout({ children }: Props) {
  return (
    <html 
      lang="es"
      style={{
        '--primary': process.env.NEXT_PUBLIC_PRIMARY_COLOR,
        '--chat-bot-bg': process.env.NEXT_PUBLIC_CHAT_BOT_BG,
      } as React.CSSProperties}
    >
      <body>{children}</body>
    </html>
  );
}
```

### Método 3: API + Base de Datos (Fase 3 - Panel Admin)

**Flujo:**
1. Panel admin → Seleccionar colores con color picker
2. Guardar en BD: `settings { primary_color, secondary_color, ... }`
3. API `/api/theme` retorna colores
4. `layout.tsx` carga colores dinámicamente
5. ✅ Cambios sin rebuild ni acceso a código

## GUÍA DE COLORES CORPORATIVOS

### Formato HSL: ¿Por qué no HEX?

**Ventajas de HSL:**
- **H (Hue):** Tono base (0-360°) - Rojo=0, Verde=120, Azul=240
- **S (Saturation):** Saturación (0-100%) - 0=gris, 100=color puro
- **L (Lightness):** Luminosidad (0-100%) - 0=negro, 50=normal, 100=blanco

**Facilita:**
- Crear variantes claras/oscuras: `220 90% 40%` → `220 90% 60%` (más claro)
- Mantener el tono consistente
- Calcular contraste para accesibilidad

### Paleta de Ejemplo (MVP)

| Elemento | HSL | HEX | Uso |
|----------|-----|-----|-----|
| **Primary** | 220 90% 56% | #3B82F6 | Botones, links, burbujas usuario |
| **Secondary** | 142 76% 36% | #10B981 | Success, completado |
| **Accent** | 24 95% 53% | #F59E0B | Warnings, alertas |
| **Destructive** | 0 84% 60% | #EF4444 | Errores |
| **Chat Bot** | 220 13% 91% | #E5E7EB | Preguntas |
| **Background** | 0 0% 100% | #FFFFFF | Fondo |

## CRITERIOS DE ACEPTACIÓN

### ✅ Sistema de Diseño
- [ ] Todas las variables CSS están definidas en `globals.css`
- [ ] Variables agrupadas lógicamente con comentarios
- [ ] Integración Tailwind funcional (clases como `bg-primary` funcionan)
- [ ] Clases utilitarias custom creadas (`.bot-message`, `.user-message`)

### ✅ Personalización
- [ ] Cambiar `--primary` actualiza todos los elementos que lo usan
- [ ] Cambiar `--chat-bot-bg` actualiza burbujas del bot
- [ ] Sin necesidad de recompilar (hot reload funciona)
- [ ] Documentación clara de cómo personalizar

### ✅ Consistencia
- [ ] Todos los componentes usan tokens, NO valores hardcodeados
- [ ] Espaciado consistente (usando `--spacing-*`)
- [ ] Border radius consistente (usando `--radius`)
- [ ] Tipografía consistente (usando `--font-sans`)

## PROHIBICIONES

### ❌ NO Hacer
- NO hardcodear colores en componentes (`bg-blue-500`)
- NO usar valores mágicos (`padding: 13px`)
- NO duplicar definiciones de colores
- NO mezclar HSL con RGB/HEX en variables

### ✅ SÍ Hacer
- Usar siempre variables CSS o clases de Tailwind
- Documentar propósito de cada variable
- Mantener consistencia en formato (siempre HSL)
- Comentar cada sección de variables

## DEFINICIÓN DE "TERMINADO"

Este prompt está completo cuando:
1. **globals.css** contiene todas las variables necesarias
2. **tailwind.config.ts** integra variables correctamente
3. **Documentación** clara de cómo personalizar
4. **Ejemplos** de uso en componentes
5. **3 métodos** de personalización están especificados
6. **Guía visual** de colores por defecto está lista

---

**¿Este sistema de diseño proporciona suficiente flexibilidad y claridad para la personalización? ¿Hay tokens o variables adicionales que consideres necesarios?**
