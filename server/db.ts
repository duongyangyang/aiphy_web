import Database from "better-sqlite3";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * db — kết nối SQLite dùng chung cho toàn bộ server.
 *
 * Một kết nối duy nhất mở suốt vòng đời tiến trình (better-sqlite3 là đồng bộ
 * nên không cần pool). Schema được chạy lại mỗi lần khởi động nhưng toàn bộ
 * DDL là `CREATE ... IF NOT EXISTS` nên an toàn khi chạy nhiều lần.
 *
 * Đường dẫn DB: `DB_PATH` (Docker trỏ vào volume `/data/app.db`), mặc định
 * `server/data/app.db` khi chạy local.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DB_PATH =
  process.env.DB_PATH ?? path.join(__dirname, "data", "app.db");

mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);

// WAL cho phép đọc trong khi ghi — quan trọng vì heartbeat ghi liên tục.
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
// Chờ tối đa 5 giây khi file bị khoá thay vì ném lỗi SQLITE_BUSY ngay.
db.pragma("busy_timeout = 5000");

const schema = readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
db.exec(schema);

/** Thời điểm hiện tại dạng ISO-8601 UTC — chuẩn lưu cho mọi cột thời gian. */
export function nowIso(): string {
  return new Date().toISOString();
}

/** ISO cách đây `ms` mili-giây. */
export function isoAgo(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

/** Chuyển ISO → mili-giây, trả 0 nếu giá trị rỗng/hỏng. */
export function toMs(iso: string | null | undefined): number {
  if (!iso) return 0;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : 0;
}
