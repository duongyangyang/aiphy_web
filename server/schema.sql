-- Schema cho aiphys-web — SQLite.
-- Chạy idempotent (CREATE ... IF NOT EXISTS) mỗi lần server khởi động.
-- Thời gian lưu dạng ISO-8601 UTC (TEXT) để đọc/ghi trực tiếp bằng JS Date.

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ── Người dùng ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,      -- luôn lowercase
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,             -- scrypt: "scrypt$N$salt$hash"
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at    TEXT NOT NULL,
  last_login_at TEXT,
  is_active     INTEGER NOT NULL DEFAULT 1
);

-- ── Phiên đăng nhập ───────────────────────────────────────────────────
-- Chỉ lưu SHA-256 của token; token gốc nằm trong cookie httpOnly của trình duyệt.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  user_agent TEXT,
  ip         TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- ── Phiên sử dụng (mở tab → đóng tab) ─────────────────────────────────
-- opened_at: lần heartbeat đầu tiên. last_seen_at: heartbeat gần nhất.
-- duration_seconds chốt khi nhận cờ end, hoặc được tính động từ
-- (last_seen_at - opened_at) nếu tab bị đóng đột ngột không kịp gửi.
CREATE TABLE IF NOT EXISTS usage_sessions (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opened_at        TEXT NOT NULL,
  last_seen_at     TEXT NOT NULL,
  closed_at        TEXT,
  duration_seconds INTEGER,
  beats            INTEGER NOT NULL DEFAULT 0,
  user_agent       TEXT
);
CREATE INDEX IF NOT EXISTS idx_usage_user_time ON usage_sessions(user_id, opened_at);

-- ── Thời gian theo module trong mỗi phiên ─────────────────────────────
-- module: 'module-1' | 'module-2' | 'module-3' | 'module-4' | 'other'
CREATE TABLE IF NOT EXISTS usage_module_time (
  usage_session_id TEXT NOT NULL REFERENCES usage_sessions(id) ON DELETE CASCADE,
  module           TEXT NOT NULL,
  seconds          INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (usage_session_id, module)
);

-- ── Tiến độ Module 1 ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id    TEXT NOT NULL,
  started_at   TEXT,
  completed_at TEXT,
  PRIMARY KEY (user_id, lesson_id)
);

-- ── Nhật ký sự kiện học tập ───────────────────────────────────────────
-- kind: 'login' | 'lesson_start' | 'lesson_complete' | 'm2_scan' | 'm3_run' | 'm4_run'
CREATE TABLE IF NOT EXISTS events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL,
  module     TEXT,
  payload    TEXT,                          -- JSON, giới hạn kích thước ở tầng route
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_user_time ON events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_events_kind_time ON events(kind, created_at);
