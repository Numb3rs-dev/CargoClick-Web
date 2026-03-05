# 📦 Módulo Operacional — Fase 2

## Propósito

Extiende el módulo operacional (Fase 1) con integraciones avanzadas:
- **SICE-TAC en tiempo real** vía RNDC web service (procesoid 26)
- **Corrección de remesas** (procesoid 38)
- **Aceptación electrónica del conductor** (procesoids 73 y 75)
- **Monitoreo de flota GPS** y novedades (procesoids 45, 46)
- **Factura Electrónica de Transporte** (procesoid 86 al RNDC + integración DIAN)

> **Prerequisito:** Fase 1 completada y en producción.

---

## Orden de implementación

```
FASE 2-A: SCHEMA (BACK-01-F2)
  └─ Nuevos modelos: FacturaElectronica, AceptacionConductor, NovedadGPS

FASE 2-B: RNDC — NUEVOS PROCESOIDS (BACK-02-F2)
  └─ XML builders: procesoid 26, 38, 73, 75, 45, 46, 86

FASE 2-C: SERVICIOS (BACK-03-F2)
  └─ SicetacService, CorreccionRemesaService, AceptacionConductorService,
     GpsService, FacturaElectronicaService

FASE 2-D: API ENDPOINTS (BACK-04-F2)
  └─ Nuevas rutas para cada servicio

FASE 2-E: UI — ACEPTACIÓN CONDUCTOR (FRONT-01-F2)
  └─ Flujo de firma electrónica del conductor

FASE 2-F: UI — FACTURA ELECTRÓNICA (FRONT-02-F2)
  └─ Emisión, estados y visualización de facturas

FASE 2-G: UI — GPS Y MONITOREO (FRONT-03-F2)
  └─ Mapa de flota + novedades + tiempos logísticos
```

---

## Documentos

| # | Archivo | Capa | Alcance |
|---|---------|------|---------|
| BACK-01-F2 | [01_BACK_SCHEMA_F2.md](./01_BACK_SCHEMA_F2.md) | DB | 3 modelos nuevos + enums Fase 2 |
| BACK-02-F2 | [02_BACK_SERVICIO_RNDC_F2.md](./02_BACK_SERVICIO_RNDC_F2.md) | SOAP | Procesoids 26, 38, 73, 75, 45, 46, 86 |
| BACK-03-F2 | [03_BACK_SERVICIOS_F2.md](./03_BACK_SERVICIOS_F2.md) | Services | Lógica de negocio Fase 2 |
| BACK-04-F2 | [04_BACK_API_ENDPOINTS_F2.md](./04_BACK_API_ENDPOINTS_F2.md) | API | Endpoints Fase 2 |
| FRONT-01-F2 | [05_FRONT_ACEPTACION_CONDUCTOR.md](./05_FRONT_ACEPTACION_CONDUCTOR.md) | UI | Firma electrónica del conductor |
| FRONT-02-F2 | [06_FRONT_FACTURA_ELECTRONICA.md](./06_FRONT_FACTURA_ELECTRONICA.md) | UI | Emisión y gestión de facturas |
| FRONT-03-F2 | [07_FRONT_GPS_MONITOREO.md](./07_FRONT_GPS_MONITOREO.md) | UI | Mapa flota + novedades GPS |

---

## Nuevos procesoids RNDC

| procesoid | Operación | Tipo XML |
|-----------|-----------|----------|
| 26 | Consulta tarifas SICE-TAC en tiempo real | tipo=6 (consulta maestros especiales) |
| 38 | Corrección de remesa | tipo=1 (registro) |
| 73 | Consulta aceptación electrónica por manifiesto | tipo=3 (consulta) |
| 75 | Registrar aceptación electrónica del conductor | tipo=1 (registro) |
| 45 | Registrar novedad GPS (inicio viaje, llegada, etc.) | tipo=1 (registro) |
| 46 | Consultar novedades GPS de un manifiesto | tipo=3 (consulta) |
| 86 | Registrar factura electrónica de transporte | tipo=1 (registro) |

---

## Variables de entorno adicionales (Fase 2)

```env
# Integración DIAN (factura electrónica)
# Proveedor de facturación electrónica certificado por DIAN
DIAN_FACTURACION_URL=https://api.miproveedor.com/v1
DIAN_FACTURACION_API_KEY=xxx
DIAN_EMPRESA_NIT=900000000
DIAN_AMBIENTE=2   # 1=produccion DIAN, 2=habilitacion DIAN
```

> La integración DIAN requiere habilitación formal de la empresa como facturador electrónico.
> El procesoid 86 del RNDC solo se puede usar después de que la DIAN apruebe la factura.
