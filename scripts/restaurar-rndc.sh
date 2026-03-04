#!/bin/bash
# ============================================================================
# RESTAURAR DATOS RNDC EN UAT/PROD
# ============================================================================
# Este script carga los datos históricos RNDC (vehiculos, conductores,
# manifiestos, remesas) en la base de datos de destino.
#
# PRERREQUISITOS:
#   1. Las tablas ya deben existir (correr `prisma migrate deploy` antes)
#   2. Las tablas deben estar VACIAS (primera instalación)
#   3. Tener acceso a psql o a la conexión de la DB
#
# USO:
#   # Opción 1: Contra una DB remota directamente
#   psql "postgresql://user:pass@host:5432/dbname" < scripts/rndc-data.sql
#
#   # Opción 2: Desde Railway CLI
#   railway run psql $DATABASE_URL < scripts/rndc-data.sql
#
#   # Opción 3: Copiar al servidor y ejecutar
#   scp scripts/rndc-data.sql user@server:/tmp/
#   ssh user@server "psql \$DATABASE_URL < /tmp/rndc-data.sql"
#
# CONTENIDO DEL DUMP (exportado 2026-03-01):
#   - vehiculos:              2,265 registros
#   - conductores:            2,061 registros
#   - manifiestos_operativos: 9,293 registros
#   - remesas:               31,663 registros
#   - TOTAL:                 45,282 registros (~59 MB)
#
# NOTAS:
#   - Usa --disable-triggers para manejar FKs circulares en manifiestos
#   - Es IDEMPOTENTE si las tablas están vacías
#   - NO ejecutar dos veces (fallará por unique constraints)
#   - Si necesitas re-importar, limpia las tablas primero:
#       DELETE FROM remesas;
#       DELETE FROM manifiestos_operativos;
#       DELETE FROM conductores;
#       DELETE FROM vehiculos;
# ============================================================================

echo "=== Restaurando datos RNDC ==="
echo "Archivo: scripts/rndc-data.sql"
echo ""

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL no está definida"
  echo "Uso: DATABASE_URL=postgresql://... bash scripts/restaurar-rndc.sh"
  exit 1
fi

echo "Verificando tablas vacías..."
COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM vehiculos;" 2>/dev/null | tr -d ' ')
if [ "$COUNT" != "0" ] && [ -n "$COUNT" ]; then
  echo "⚠️  La tabla vehiculos ya tiene $COUNT registros."
  echo "    Si deseas re-importar, limpia las tablas primero."
  read -p "    ¿Continuar de todos modos? (s/N): " confirm
  if [ "$confirm" != "s" ] && [ "$confirm" != "S" ]; then
    echo "Cancelado."
    exit 0
  fi
fi

echo "Importando datos (esto puede tardar ~1 minuto)..."
psql "$DATABASE_URL" < scripts/rndc-data.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Datos RNDC restaurados exitosamente."
  echo ""
  psql "$DATABASE_URL" -c "
    SELECT 'vehiculos' as tabla, COUNT(*) as registros FROM vehiculos
    UNION ALL SELECT 'conductores', COUNT(*) FROM conductores
    UNION ALL SELECT 'manifiestos', COUNT(*) FROM manifiestos_operativos
    UNION ALL SELECT 'remesas', COUNT(*) FROM remesas;
  "
else
  echo "❌ Error al restaurar datos. Revisa la conexión y las tablas."
  exit 1
fi
