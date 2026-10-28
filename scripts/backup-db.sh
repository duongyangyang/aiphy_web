#!/usr/bin/env bash
#
# backup-db.sh — sao lưu database SQLite và giữ 30 bản gần nhất.
#
# Dùng `sqlite3 .backup` thay vì copy file: an toàn kể cả khi server đang ghi
# (chế độ WAL), tránh bản sao lưu bị hỏng giữa chừng.
#
# Cài cron chạy hằng ngày lúc 2:30 sáng:
#   crontab -e
#   30 2 * * * /duong/dan/den/scripts/backup-db.sh >> /var/log/aiphys-backup.log 2>&1
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Tìm database theo thứ tự: biến môi trường → data/ (Docker) → server/data/ (dev).
if [ -n "${DB_PATH:-}" ]; then
  DB_FILE="$DB_PATH"
elif [ -f "$PROJECT_DIR/data/app.db" ]; then
  DB_FILE="$PROJECT_DIR/data/app.db"
else
  DB_FILE="$PROJECT_DIR/server/data/app.db"
fi

BACKUP_DIR="${BACKUP_DIR:-$(dirname "$DB_FILE")/backups}"
KEEP=30

if [ ! -f "$DB_FILE" ]; then
  echo "[$(date -Iseconds)] Không tìm thấy database: $DB_FILE" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

STAMP="$(date +%Y-%m-%d)"
TARGET="$BACKUP_DIR/app-$STAMP.db"

if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$DB_FILE" ".backup '$TARGET'"
else
  # Không có sqlite3 CLI: dùng cách copy kèm checkpoint WAL.
  # Chạy được vì bản sao lưu hằng ngày không cần tuyệt đối chính xác đến từng
  # giao dịch đang mở.
  sqlite3_missing=1
  cp "$DB_FILE" "$TARGET"
  [ -f "$DB_FILE-wal" ] && cp "$DB_FILE-wal" "$TARGET-wal"
  [ -f "$DB_FILE-shm" ] && cp "$DB_FILE-shm" "$TARGET-shm"
  echo "[$(date -Iseconds)] Cảnh báo: không có sqlite3 CLI, dùng cp (kém an toàn hơn)." >&2
fi

echo "[$(date -Iseconds)] Đã sao lưu → $TARGET ($(du -h "$TARGET" | cut -f1))"

# Xoá bản cũ, chỉ giữ $KEEP bản gần nhất.
ls -1t "$BACKUP_DIR"/app-*.db 2>/dev/null | tail -n +$((KEEP + 1)) | while read -r old; do
  rm -f "$old" "$old-wal" "$old-shm"
  echo "[$(date -Iseconds)] Đã xoá bản cũ: $old"
done

echo "[$(date -Iseconds)] Xong. Hiện có $(ls -1 "$BACKUP_DIR"/app-*.db 2>/dev/null | wc -l | tr -d ' ') bản."
