# BACK-03-F3 — Casos Especiales: Transporte Municipal y Mercancías Peligrosas

## Contexto

Este prompt cubre dos variantes del flujo de carga que requieren tratamiento diferente al manifiesto estándar:

1. **Transporte municipal** — usa procesoids 81 y 83 del RNDC (en lugar de 4 y 7)
2. **Mercancías peligrosas** — agrega campos especiales a la remesa (código UN, declaración RESPEL)

---

## Parte 1: Transporte Municipal

### Diferencias con transporte interdepartamental

| Aspecto | Interdepartamental | Municipal |
|---------|-------------------|-----------|
| Procesoid registro manifiesto | 4 | 81 |
| Procesoid cumplido | 7 | 83 |
| Ámbito | Entre municipios (DANE) | Dentro de un mismo municipio |
| Tarifa SICE-TAC | Sí | No aplica |
| Distancia típica | > 50 km | < 50 km |

### Schema — extensión

Agregar campo en el modelo `Manifiesto` (Fase 1):

```prisma
tipoManifiesto  TipoManifiesto  @default(NACIONAL)
```

```prisma
enum TipoManifiesto {
  NACIONAL      // procesoids 4 / 7 — entre municipios distintos
  MUNICIPAL     // procesoids 81 / 83 — dentro del mismo municipio
  INTERNACIONAL // para futuro — TIR, CIM, etc.
}
```

### XML Procesoid 81 — Registro manifiesto municipal

```typescript
/**
 * Registra un manifiesto de transporte municipal en el RNDC.
 * procesoid=81, tipo=1
 * Similar al procesoid 4 pero con campos simplificados (sin SICE-TAC).
 */
export function buildXmlManifiestoMunicipal(datos: ManifiestoInput): string {
  return `<?xml version="1.0" encoding="ISO-8859-1"?>
<RNDC>
  <solicitud>
    <tipo>1</tipo>
    <procesoid>81</procesoid>
    <usuario>${process.env.RNDC_USUARIO_EFECTIVO}</usuario>
    <clave>${process.env.RNDC_CLAVE_EFECTIVA}</clave>
  </solicitud>
  <documento>
    <NITEMPRESA>'${datos.nitEmpresa}'</NITEMPRESA>
    <PLACA>'${datos.placa}'</PLACA>
    <CONDUCTORCEDULA>'${datos.cedulaConductor}'</CONDUCTORCEDULA>
    <MUNICIPIO>'${datos.municipioDane}'</MUNICIPIO>
    <FECHASALIDA>'${datos.fechaSalida}'</FECHASALIDA>
    <REMESAS>
      ${datos.remesas.map(r => `<REMESA><NUMERO>'${r.numero}'</NUMERO></REMESA>`).join('\n      ')}
    </REMESAS>
  </documento>
</RNDC>`;
}
```

### XML Procesoid 83 — Cumplido manifiesto municipal

```typescript
/**
 * Registra cumplido de un manifiesto municipal.
 * procesoid=83, tipo=1
 */
export function buildXmlCumplidoMunicipal(
  manifiestoNumero: string,
  fechaLlegada: string
): string {
  return `<?xml version="1.0" encoding="ISO-8859-1"?>
<RNDC>
  <solicitud>
    <tipo>1</tipo>
    <procesoid>83</procesoid>
    <usuario>${process.env.RNDC_USUARIO_EFECTIVO}</usuario>
    <clave>${process.env.RNDC_CLAVE_EFECTIVA}</clave>
  </solicitud>
  <documento>
    <MANIFESTOID>'${manifiestoNumero}'</MANIFESTOID>
    <FECHALLEGADA>'${fechaLlegada}'</FECHALLEGADA>
  </documento>
</RNDC>`;
}
```

### Lógica de selección en el servicio de manifiestos

```typescript
// En manifiestoService.ts — seleccionar procesoid según tipo
async function registrarManifiestoRndc(manifiesto: Manifiesto) {
  if (manifiesto.tipoManifiesto === 'MUNICIPAL') {
    return await enviarXmlRndc(buildXmlManifiestoMunicipal(manifiesto));
  } else {
    return await enviarXmlRndc(buildXmlManifiesto(manifiesto)); // procesoid 4
  }
}

async function registrarCumplidoRndc(manifiesto: Manifiesto, fechaLlegada: string) {
  if (manifiesto.tipoManifiesto === 'MUNICIPAL') {
    return await enviarXmlRndc(buildXmlCumplidoMunicipal(manifiesto.numeroManifiesto, fechaLlegada));
  } else {
    return await enviarXmlRndc(buildXmlCumplido(manifiesto.numeroManifiesto, fechaLlegada)); // procesoid 7
  }
}
```

---

## Parte 2: Mercancías Peligrosas

### Requisitos previos

1. Los vehículos deben tener habilitación de transporte de carga peligrosa en el RNDC
2. Los conductores deben tener certificado de manejo de materiales peligrosos (MATPEL)
3. La empresa debe estar habilitada por subcontrato o propia habilitación

### Campos adicionales en el modelo `Remesa`

Agregar al schema (nueva migración):

```prisma
// Mercancías peligrosas (opcionales)
esMercPeligrosa   Boolean   @default(false)
codigoUN          String?   // ej. 'UN1203' para gasolina
claseRiesgo       String?   // '1'-'9' según clasificación ONU
grupoEmbalaje?    String?   // I, II o III
declaracionRespel Boolean   @default(false)  // si aplica decreto RESPEL (residuos peligrosos)
nombreTecnico     String?   // nombre técnico del material
cantidadKg        Decimal?  @db.Decimal(10,2)
```

### XML — Campos adicionales en procesoid 2 (remesa)

Cuando `esMercPeligrosa = true`, agregar al XML de la remesa:

```typescript
function buildXmlRemesaMercPeligrosa(remesa: Remesa): string {
  const camposMerc = remesa.esMercPeligrosa ? `
    <MERCANCIAPELIGROSA>'1'</MERCANCIAPELIGROSA>
    <NUMEROUN>'${remesa.codigoUN}'</NUMEROUN>
    <CLASEMERCANCIAPELIGROSA>'${remesa.claseRiesgo}'</CLASEMERCANCIAPELIGROSA>
    ${remesa.grupoEmbalaje ? `<GRUPOEMBALAJE>'${remesa.grupoEmbalaje}'</GRUPOEMBALAJE>` : ''}
    ${remesa.declaracionRespel ? `<RESPEL>'1'</RESPEL>` : ''}
    <NOMBRETECNICO>'${escapeXml(remesa.nombreTecnico ?? '')}'</NOMBRETECNICO>
    <CANTIDADKGMERCANCIAPELIGROSA>'${remesa.cantidadKg}'</CANTIDADKGMERCANCIAPELIGROSA>
  ` : '';

  // Combinar con el XML base de remesa (procesoid 2)
  return buildXmlRemesaBase(remesa, camposMerc);
}
```

### Códigos UN más comunes en transporte de carga colombiana

| Código UN | Material |
|-----------|---------|
| UN1203 | Gasolina |
| UN1267 | Petróleo crudo |
| UN1789 | Ácido clorhídrico |
| UN1993 | Líquidos inflamables n.e.p. |
| UN3077 | Sustancias peligrosas para el medio ambiente (sólido) |
| UN3082 | Sustancias peligrosas para el medio ambiente (líquido) |

### Validación en el formulario de cotización/remesa

```typescript
// lib/validations/remesaSchema.ts — Zod
const remesaMercPeligrosaSchema = z.object({
  esMercPeligrosa: z.literal(true),
  codigoUN:        z.string().regex(/^UN\d{4}$/, 'Formato: UN seguido de 4 dígitos'),
  claseRiesgo:     z.enum(['1','1.4','1.5','1.6','2.1','2.2','2.3','3','4.1','4.2','4.3','5.1','5.2','6.1','6.2','7','8','9']),
  grupoEmbalaje:   z.enum(['I', 'II', 'III']).optional(),
  nombreTecnico:   z.string().min(3),
  cantidadKg:      z.number().positive(),
  declaracionRespel: z.boolean(),
});
```

---

## Extensión del formulario de cotización

En el flujo de cotización/nueva remesa, agregar sección condicional:

```typescript
// Cuando el usuario activa toggle mercancía peligrosa:
<Switch
  checked={esMercPeligrosa}
  onCheckedChange={setEsMercPeligrosa}
/>
<Label>¿Mercancía peligrosa?</Label>

{esMercPeligrosa && (
  <div className="border rounded-lg p-4 space-y-3 bg-yellow-50">
    <p className="text-sm font-medium text-yellow-800">⚠️ Información de mercancía peligrosa</p>
    <CodigoUNInput value={codigoUN} onChange={setCodigoUN} />
    <ClaseRiesgoSelect value={claseRiesgo} onChange={setClaseRiesgo} />
    <GrupoEmbalajeSelect value={grupoEmbalaje} onChange={setGrupoEmbalaje} />
    <Input placeholder="Nombre técnico del material" ... />
    <Switch label="Aplica declaración RESPEL" ... />
  </div>
)}
```

---

## Nota sobre habilitaciones

Antes de activar este módulo, verificar con el área operativa:
1. ¿Los vehículos de la empresa tienen habilitación RNDC para carga peligrosa?
2. ¿Los conductores tienen certificado MATPEL vigente?
3. ¿La empresa tiene póliza adicional para mercancías peligrosas?

Estos datos deben estar en los modelos `Vehiculo` y `Conductor` antes de activar el flujo.
