# 🎨 Sistema de Temas Material-UI

## ✅ Material-UI Instalado y Configurado

Tu aplicación ahora usa **Material-UI** - el framework de componentes UI más usado en empresas profesionales.

---

## 🎯 Cambiar Tema (3 Opciones Predefinidas)

### **Opción 1: Azul Corporativo** (Default - Activo)
Estilo profesional tipo IBM, Microsoft, Facebook

### **Opción 2: Verde Tecnológico**
Estilo moderno tipo Spotify, Android, WhatsApp  

### **Opción 3: Púrpura Elegante**
Estilo premium tipo Stripe, Twitch, Yahoo

---

## 📝 Cómo Cambiar de Tema

**Archivo:** `lib/theme/themes.ts`

**Línea 171** - Descomenta el tema que quieras:

```typescript
// ⬇️ CAMBIA AQUÍ (Línea 171)
export const theme = createTheme(corporateBlueTheme);     // <- Azul (activo)
// export const theme = createTheme(techGreenTheme);      // <- Verde
// export const theme = createTheme(elegantPurpleTheme);   // <- Púrpura
```

**Ejemplo para cambiar a Verde:**
```typescript
// export const theme = createTheme(corporateBlueTheme);
export const theme = createTheme(techGreenTheme);          // <- Ahora Verde activo
// export const theme = createTheme(elegantPurpleTheme);
```

**Guarda el archivo** y la aplicación se recargará automáticamente con el nuevo tema.

---

## 🎨 Personalizar Colores de un Tema

Edita las constantes en `lib/theme/themes.ts`:

```typescript
const corporateBlueTheme: ThemeOptions = {
  palette: {
    primary: {
      main: '#1976d2',   // <- Cambia este color
    },
    secondary: {
      main: '#dc004e',   // <- Y este
    },
  },
};
```

**Usa una herramienta de colores:**
- https://m2.material.io/design/color/the-color-system.html#tools-for-picking-colors
- https://material-ui.com/customization/palette/

---

## 🚀 Componentes MUI Implementados

✅ **DynamicInputMUI.tsx** - Todos los inputs con Material-UI:
- TextField con iconos
- DatePicker visual profesional
- ToggleButton para Si/No  
- RadioGroup mejorados
- Checkbox con bordes
- Select dropdown

✅ **ConversacionCotizacion.tsx** - Wizard con MUI:
- Container, Box, Paper
- LinearProgress bar
- Fade animations
- Alert para errores

---

## 📦 Ventajas de Material-UI

1. **Cambio de tema completo en 1 línea**
2. **60+ componentes profesionales listos**
3. **Accesibilidad garantizada (WCAG 2.1 AA)**
4. **Responsive por defecto**
5. **Usado por empresas Fortune 500**
6. **Documentación excelente**: https://mui.com/

---

## 🔧 Troubleshooting

### **El tema no cambia:**
1. Guarda el archivo `themes.ts`
2. Si usas `npm run dev`, debería recargar automáticamente
3. Si no, reinicia: `npm run dev`

### **Quiero crear mi propio tema:**
Copia uno de los temas existentes y modifica los colores:

```typescript
const miTemaCustom: ThemeOptions = {
  palette: {
    primary: { main: '#TU_COLOR' },
    secondary: { main: '#TU_COLOR' },
  },
};

export const theme = createTheme(miTemaCustom);
```

---

## 📚 Próximos Pasos

1. ✅ **Explora los 3 temas** - Cambia entre ellos para ver diferencias
2. ✅ **Personaliza colores** - Modifica un tema para tu marca
3. ✅ **Agrega más componentes MUI** cuando necesites:
   - https://mui.com/material-ui/all-components/

---

**¿Dudas? Pregúntame lo que necesites sobre Material-UI o los temas.**
