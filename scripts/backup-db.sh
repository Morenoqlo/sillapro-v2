#!/usr/bin/env bash
# Backup semanal de la BD Supabase a un directorio local (subir a Drive/S3 aparte).
# Requiere: pg_dump instalado, .env con SUPABASE_DB_URL.

set -euo pipefail

# Cargar .env
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo "ERROR: SUPABASE_DB_URL no está en .env"
  echo "Copialo de Supabase Dashboard → Project Settings → Database → URI"
  exit 1
fi

BACKUP_DIR="backups"
TIMESTAMP=$(date -u +"%Y%m%d-%H%M%S")
BACKUP_FILE="$BACKUP_DIR/sillapro-$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "Iniciando backup hacia $BACKUP_FILE..."
pg_dump "$SUPABASE_DB_URL" \
  --no-owner --no-acl --clean --if-exists \
  | gzip > "$BACKUP_FILE"

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "✓ Backup completado: $BACKUP_FILE ($SIZE)"

# Retener solo últimos 8 backups
ls -t "$BACKUP_DIR"/sillapro-*.sql.gz 2>/dev/null | tail -n +9 | xargs -r rm
echo "✓ Backups antiguos (>8) limpiados"
