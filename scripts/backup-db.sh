#!/usr/bin/env bash
# Sao lưu database SQLite hằng ngày trên VPS, giữ 30 bản.
# Cài cron: 30 2 * * * /opt/aiphys/app/scripts/backup-db.sh >> /var/log/aiphys-backup.log 2>&1
set -euo pipefail

DB_FILE="${DB_PATH:-/opt/aiphys/app/server/data/app.db}"
BACKUP_DIR="${BACKUP_DIR:-/opt/aiphys/backups}"
KEEP=30

[ -f "$DB_FILE" ] || { echo "[$(date -Iseconds)] Không thấy DB: $DB_FILE" >&2; exit 1; }
mkdir -p "$BACKUP_DIR"

STAMP="$(date +%Y-%m-%d)"
TARGET="$BACKUP_DIR/app-$STAMP.db"

if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$DB_FILE" ".backup '$TARGET'"
else
  cp "$DB_FILE" "$TARGET"
  [ -f "$DB_FILE-wal" ] && cp "$DB_FILE-wal" "$TARGET-wal" || true
fi

echo "[$(date -Iseconds)] Đã sao lưu → $TARGET ($(du -h "$TARGET" | cut -f1))"

ls -1t "$BACKUP_DIR"/app-*.db 2>/dev/null | tail -n +$((KEEP + 1)) | while read -r old; do
  rm -f "$old" "$old-wal"
  echo "[$(date -Iseconds)] Đã xoá bản cũ: $old"
done
