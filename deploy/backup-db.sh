#!/usr/bin/env bash
# Ежедневный дамп базы. Бэкап хостера защищает от падения диска,
# этот — от собственной ошибки в миграции.
set -euo pipefail
DIR=/home/deploy/backups
mkdir -p "$DIR"
FILE="$DIR/matrix-$(date +%F).sql.gz"
docker exec matrix-postgres pg_dump -U matrix matrix | gzip > "$FILE"
# Держим две недели
find "$DIR" -name 'matrix-*.sql.gz' -mtime +14 -delete
echo "OK $FILE"
