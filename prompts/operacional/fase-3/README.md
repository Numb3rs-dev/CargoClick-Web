# 📦 Módulo Operacional — Fase 3

## Propósito

Integraciones avanzadas que requieren **trámites formales externos** previos al desarrollo. No bloquean Fase 2, pero sí requieren gestiones con entidades del Estado.

| Integración | Entidad | Trámite previo |
|-------------|---------|----------------|
| RUNT en tiempo real | RUNT (Ministerio Transporte) | Vinculación como actor RUNT |
| SIMIT (multas) | Federación Colombiana de Municipios | Acuerdo de acceso a datos |
| Transporte municipal | RNDC Ministerio Transporte | Habilitación transporte especial |
| Mercancías peligrosas | Ministerio Transporte / ICA | Habilitación según decreto |

> **Alerta:** No implementar ningún módulo de Fase 3 sin gestionar primero el trámite correspondiente.

---

## Requisitos previos por módulo

### RUNT — Tiempo real
1. La empresa debe ser un **Actor RUNT** vinculado (Empresa de Transporte de Carga)
2. Proceso en: [https://www.runt.gov.co/actores/empresas-de-transporte](https://www.runt.gov.co/actores/empresas-de-transporte)
3. Portal de pruebas: [https://www.runt.gov.co/runt/appback/portalTestBridgeApp/](https://www.runt.gov.co/runt/appback/portalTestBridgeApp/#/)
4. Tiempo estimado gestión: 2-4 semanas

### SIMIT — Multas
1. Requiere acuerdo de datos con la Federación Colombiana de Municipios
2. No existe API pública gratuita — es un servicio de pago o acuerdo institucional
3. Alternativa por ahora: scraping del portal web del SIMIT (frágil, no recomendado)

### Transporte municipal (procesoids 81/83)
1. La empresa necesita habilitación específica para **transporte especial** si aplica
2. Los manifiestos municipales usan flujos simplificados del RNDC

### Mercancías peligrosas
1. Requiere certificación ADR/IATA de vehículos y conductores
2. El conductor debe tener certificado en el RNDC
3. La remesa incluye campos adicionales: código UN, declaración RESPEL

---

## Orden de implementación

```
FASE 3-A: RUNT en tiempo real (01_BACK_RUNT_INTEGRACION.md)
  └─ Requiere: vinculación actor RUNT completada

FASE 3-B: SIMIT multas (02_BACK_SIMIT_MULTAS.md)
  └─ Requiere: acuerdo con Federación Municipios

FASE 3-C: Casos especiales (03_BACK_CASOS_ESPECIALES.md)
  └─ Transporte municipal + mercancías peligrosas
  └─ Requiere: habilitaciones específicas de la empresa
```

---

## Documentos

| # | Archivo | Alcance |
|---|---------|---------|
| 01 | [01_BACK_RUNT_INTEGRACION.md](./01_BACK_RUNT_INTEGRACION.md) | API RUNT Bridge real-time |
| 02 | [02_BACK_SIMIT_MULTAS.md](./02_BACK_SIMIT_MULTAS.md) | Consulta multas conductores y vehículos |
| 03 | [03_BACK_CASOS_ESPECIALES.md](./03_BACK_CASOS_ESPECIALES.md) | Municipal + mercancías peligrosas |
