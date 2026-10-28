import { Router } from "express";
import { randomBytes } from "node:crypto";
import { db, nowIso } from "../db";
import { hashPassword, requireAdmin, type Role } from "../auth";

/**
 * Route quản trị — nguồn dữ liệu cho dashboard và xuất CSV phục vụ nghiên cứu.
 *
 * Mọi route đều sau `requireAdmin`. Thời lượng được tính từ usage_sessions:
 *   duration = COALESCE(duration_seconds, last_seen_at - opened_at)
 * để phiên bị đóng đột ngột (không kịp gửi cờ end) vẫn được tính.
 */

export const adminRouter = Router();

adminRouter.use(requireAdmin);

const TOTAL_LESSONS = 11;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Biểu thức SQL tính thời lượng (giây) của một usage_session. */
const DURATION_EXPR = `CAST(
  COALESCE(duration_seconds,
    (julianday(last_seen_at) - julianday(opened_at)) * 86400)
  AS INTEGER)`;

// ── Tổng quan ─────────────────────────────────────────────────────────

adminRouter.get("/overview", (_req, res) => {
  const now = Date.now();
  const todayStart = new Date(now - DAY_MS).toISOString();
  const weekStart = new Date(now - 7 * DAY_MS).toISOString();

  const totals = db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM users) AS users,
         (SELECT COUNT(*) FROM users WHERE is_active = 1) AS active_users,
         (SELECT COUNT(DISTINCT user_id) FROM usage_sessions WHERE opened_at >= ?) AS active_today,
         (SELECT COUNT(DISTINCT user_id) FROM usage_sessions WHERE opened_at >= ?) AS active_week,
         (SELECT COALESCE(SUM(${DURATION_EXPR}), 0) FROM usage_sessions) AS total_seconds,
         (SELECT COUNT(*) FROM usage_sessions) AS session_count,
         (SELECT COUNT(*) FROM lesson_progress WHERE completed_at IS NOT NULL) AS completed_lessons,
         (SELECT COUNT(*) FROM lesson_progress) AS started_lessons`,
    )
    .get(todayStart, weekStart) as {
    users: number;
    active_users: number;
    active_today: number;
    active_week: number;
    total_seconds: number;
    session_count: number;
    completed_lessons: number;
    started_lessons: number;
  };

  // Tỉ lệ hoàn thành khoá = tổng bài đã hoàn thành / (số user × 11 bài).
  const courseCompletion = totals.users > 0 ? totals.completed_lessons / (totals.users * TOTAL_LESSONS) : 0;

  // Chuỗi 30 ngày: số user hoạt động + số giây học mỗi ngày.
  const dailyRows = db
    .prepare(
      `SELECT substr(opened_at, 1, 10) AS day,
              COUNT(DISTINCT user_id) AS users,
              COALESCE(SUM(${DURATION_EXPR}), 0) AS seconds
         FROM usage_sessions
        WHERE opened_at >= ?
        GROUP BY day ORDER BY day`,
    )
    .all(new Date(now - 29 * DAY_MS).toISOString()) as {
    day: string;
    users: number;
    seconds: number;
  }[];

  const byDay = new Map(dailyRows.map((r) => [r.day, r]));
  const daily: { day: string; users: number; seconds: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = new Date(now - i * DAY_MS).toISOString().slice(0, 10);
    const row = byDay.get(day);
    daily.push({ day, users: row?.users ?? 0, seconds: row?.seconds ?? 0 });
  }

  // Phân bố thời gian theo module.
  const moduleRows = db
    .prepare(
      `SELECT module, COALESCE(SUM(seconds), 0) AS seconds
         FROM usage_module_time GROUP BY module ORDER BY seconds DESC`,
    )
    .all() as { module: string; seconds: number }[];

  // Phân bố số bài đã hoàn thành (histogram 0..11) — biết khoá học có "rơi rụng" ở đâu.
  const perUserCompleted = db
    .prepare(
      `SELECT completed AS n, COUNT(*) AS users FROM (
         SELECT u.id, (SELECT COUNT(*) FROM lesson_progress p
                        WHERE p.user_id = u.id AND p.completed_at IS NOT NULL) AS completed
           FROM users u
       ) GROUP BY completed ORDER BY completed`,
    )
    .all() as { n: number; users: number }[];

  res.json({
    totals: {
      users: totals.users,
      activeUsers: totals.active_users,
      activeToday: totals.active_today,
      activeWeek: totals.active_week,
      totalSeconds: totals.total_seconds,
      sessionCount: totals.session_count,
      avgSessionSeconds:
        totals.session_count > 0 ? Math.round(totals.total_seconds / totals.session_count) : 0,
      completedLessons: totals.completed_lessons,
      startedLessons: totals.started_lessons,
      courseCompletion,
      totalLessons: TOTAL_LESSONS,
    },
    daily,
    modules: moduleRows,
    completionHistogram: perUserCompleted,
  });
});

// ── Danh sách người dùng ──────────────────────────────────────────────

const SORTABLE = {
  name: "u.name",
  email: "u.email",
  created: "u.created_at",
  lastLogin: "u.last_login_at",
  totalSeconds: "total_seconds",
  completed: "completed",
} as const;

adminRouter.get("/users", (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";
  const sortKey = typeof req.query.sort === "string" && req.query.sort in SORTABLE
    ? (req.query.sort as keyof typeof SORTABLE)
    : "created";
  const dir = req.query.dir === "asc" ? "ASC" : "DESC";
  const page = Math.max(1, Number(req.query.page) || 1);
  const perPage = Math.min(100, Math.max(5, Number(req.query.perPage) || 25));
  const offset = (page - 1) * perPage;

  const where = q ? "WHERE lower(u.email) LIKE ? OR lower(u.name) LIKE ?" : "";
  const params = q ? [`%${q}%`, `%${q}%`] : [];

  const total = (
    db.prepare(`SELECT COUNT(*) AS n FROM users u ${where}`).get(...params) as { n: number }
  ).n;

  const rows = db
    .prepare(
      `SELECT u.id, u.email, u.name, u.role, u.created_at, u.last_login_at, u.is_active,
              COALESCE((SELECT SUM(${DURATION_EXPR}) FROM usage_sessions s WHERE s.user_id = u.id), 0) AS total_seconds,
              (SELECT COUNT(*) FROM lesson_progress p WHERE p.user_id = u.id AND p.completed_at IS NOT NULL) AS completed,
              (SELECT COUNT(*) FROM lesson_progress p WHERE p.user_id = u.id) AS started,
              (SELECT MAX(opened_at) FROM usage_sessions s WHERE s.user_id = u.id) AS last_seen
         FROM users u ${where}
        ORDER BY ${SORTABLE[sortKey]} ${dir}
        LIMIT ? OFFSET ?`,
    )
    .all(...params, perPage, offset) as {
    id: string;
    email: string;
    name: string;
    role: Role;
    created_at: string;
    last_login_at: string | null;
    is_active: number;
    total_seconds: number;
    completed: number;
    started: number;
    last_seen: string | null;
  }[];

  res.json({
    users: rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      role: r.role,
      createdAt: r.created_at,
      lastLoginAt: r.last_login_at,
      lastSeenAt: r.last_seen,
      isActive: r.is_active === 1,
      totalSeconds: r.total_seconds,
      completedLessons: r.completed,
      startedLessons: r.started,
    })),
    page,
    perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  });
});

// ── Chi tiết một người dùng ───────────────────────────────────────────

adminRouter.get("/users/:id", (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id) as
    | {
        id: string;
        email: string;
        name: string;
        role: Role;
        created_at: string;
        last_login_at: string | null;
        is_active: number;
      }
    | undefined;

  if (!user) {
    res.status(404).json({ error: "Không tìm thấy người dùng." });
    return;
  }

  const lessons = db
    .prepare(
      `SELECT lesson_id, started_at, completed_at FROM lesson_progress
        WHERE user_id = ? ORDER BY lesson_id`,
    )
    .all(user.id) as { lesson_id: string; started_at: string | null; completed_at: string | null }[];

  const sessions = db
    .prepare(
      `SELECT id, opened_at, last_seen_at, closed_at, ${DURATION_EXPR} AS duration_seconds, beats
         FROM usage_sessions WHERE user_id = ? ORDER BY opened_at DESC LIMIT 50`,
    )
    .all(user.id) as {
    id: string;
    opened_at: string;
    last_seen_at: string;
    closed_at: string | null;
    duration_seconds: number;
    beats: number;
  }[];

  const moduleTime = db
    .prepare(
      `SELECT m.module, SUM(m.seconds) AS seconds
         FROM usage_module_time m
         JOIN usage_sessions s ON s.id = m.usage_session_id
        WHERE s.user_id = ? GROUP BY m.module ORDER BY seconds DESC`,
    )
    .all(user.id) as { module: string; seconds: number }[];

  const events = db
    .prepare(
      `SELECT kind, module, payload, created_at FROM events
        WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`,
    )
    .all(user.id) as {
    kind: string;
    module: string | null;
    payload: string | null;
    created_at: string;
  }[];

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
      isActive: user.is_active === 1,
    },
    lessons: lessons.map((l) => ({
      lessonId: l.lesson_id,
      startedAt: l.started_at,
      completedAt: l.completed_at,
    })),
    sessions: sessions.map((s) => ({
      id: s.id,
      openedAt: s.opened_at,
      lastSeenAt: s.last_seen_at,
      closedAt: s.closed_at,
      durationSeconds: s.duration_seconds,
      beats: s.beats,
    })),
    moduleTime,
    events: events.map((e) => ({
      kind: e.kind,
      module: e.module,
      payload: e.payload ? (JSON.parse(e.payload) as unknown) : null,
      createdAt: e.created_at,
    })),
  });
});

// ── Đổi vai trò / vô hiệu hoá ─────────────────────────────────────────

adminRouter.patch("/users/:id", (req, res) => {
  const target = db.prepare("SELECT id, role FROM users WHERE id = ?").get(req.params.id) as
    | { id: string; role: Role }
    | undefined;
  if (!target) {
    res.status(404).json({ error: "Không tìm thấy người dùng." });
    return;
  }

  const { role, isActive } = req.body ?? {};

  if (role !== undefined) {
    if (role !== "user" && role !== "admin") {
      res.status(400).json({ error: "role phải là 'user' hoặc 'admin'." });
      return;
    }
    // Không cho admin tự hạ quyền chính mình — tránh khoá mình ra ngoài hệ thống.
    if (target.id === req.user!.id && role !== "admin") {
      res.status(400).json({ error: "Bạn không thể tự hạ quyền chính mình." });
      return;
    }
    db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, target.id);
  }

  if (isActive !== undefined) {
    if (typeof isActive !== "boolean") {
      res.status(400).json({ error: "isActive phải là true/false." });
      return;
    }
    if (target.id === req.user!.id && isActive === false) {
      res.status(400).json({ error: "Bạn không thể tự vô hiệu hoá tài khoản của mình." });
      return;
    }
    db.prepare("UPDATE users SET is_active = ? WHERE id = ?").run(isActive ? 1 : 0, target.id);
    if (!isActive) {
      db.prepare("DELETE FROM sessions WHERE user_id = ?").run(target.id);
    }
  }

  res.json({ ok: true });
});

/** Sinh mật khẩu tạm và trả về một lần duy nhất (không có email trong hệ thống). */
adminRouter.post("/users/:id/reset-password", async (req, res) => {
  const target = db.prepare("SELECT id FROM users WHERE id = ?").get(req.params.id) as
    | { id: string }
    | undefined;
  if (!target) {
    res.status(404).json({ error: "Không tìm thấy người dùng." });
    return;
  }

  // 12 ký tự từ bảng chữ không gây nhầm lẫn (bỏ 0/O, 1/l/I).
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(12);
  const tempPassword = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");

  const passwordHash = await hashPassword(tempPassword);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(passwordHash, target.id);
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(target.id);

  res.json({ tempPassword });
});

// ── Xuất CSV ──────────────────────────────────────────────────────────

type Dataset = "users" | "sessions" | "lessons" | "events";

/** Bọc một ô CSV: nhân đôi dấu nháy, bao bằng nháy nếu chứa ký tự đặc biệt. */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(header: string[], rows: unknown[][]): string {
  // BOM để Excel nhận đúng UTF-8 và hiển thị tiếng Việt có dấu.
  const lines = [header.map(csvCell).join(",")];
  for (const row of rows) lines.push(row.map(csvCell).join(","));
  return "﻿" + lines.join("\r\n") + "\r\n";
}

adminRouter.get("/export.csv", (req, res) => {
  const dataset = String(req.query.dataset ?? "users") as Dataset;
  const stamp = new Date().toISOString().slice(0, 10);

  let header: string[];
  let rows: unknown[][];

  switch (dataset) {
    case "users": {
      header = [
        "user_id", "email", "name", "role", "is_active", "created_at",
        "last_login_at", "total_seconds", "total_minutes", "sessions",
        "lessons_started", "lessons_completed", "course_completion",
      ];
      const data = db
        .prepare(
          `SELECT u.id, u.email, u.name, u.role, u.is_active, u.created_at, u.last_login_at,
                  COALESCE((SELECT SUM(${DURATION_EXPR}) FROM usage_sessions s WHERE s.user_id = u.id), 0) AS total_seconds,
                  (SELECT COUNT(*) FROM usage_sessions s WHERE s.user_id = u.id) AS sessions,
                  (SELECT COUNT(*) FROM lesson_progress p WHERE p.user_id = u.id) AS started,
                  (SELECT COUNT(*) FROM lesson_progress p WHERE p.user_id = u.id AND p.completed_at IS NOT NULL) AS completed
             FROM users u ORDER BY u.created_at`,
        )
        .all() as {
        id: string; email: string; name: string; role: string; is_active: number;
        created_at: string; last_login_at: string | null; total_seconds: number;
        sessions: number; started: number; completed: number;
      }[];
      rows = data.map((r) => [
        r.id, r.email, r.name, r.role, r.is_active, r.created_at, r.last_login_at,
        r.total_seconds, (r.total_seconds / 60).toFixed(1), r.sessions,
        r.started, r.completed, (r.completed / TOTAL_LESSONS).toFixed(3),
      ]);
      break;
    }

    case "sessions": {
      header = [
        "usage_session_id", "user_id", "email", "name", "opened_at", "last_seen_at",
        "closed_at", "duration_seconds", "duration_minutes", "beats", "closed_cleanly",
      ];
      const data = db
        .prepare(
          `SELECT s.id, s.user_id, u.email, u.name, s.opened_at, s.last_seen_at, s.closed_at,
                  ${DURATION_EXPR} AS duration_seconds, s.beats
             FROM usage_sessions s JOIN users u ON u.id = s.user_id
            ORDER BY s.opened_at`,
        )
        .all() as {
        id: string; user_id: string; email: string; name: string; opened_at: string;
        last_seen_at: string; closed_at: string | null; duration_seconds: number; beats: number;
      }[];
      rows = data.map((r) => [
        r.id, r.user_id, r.email, r.name, r.opened_at, r.last_seen_at, r.closed_at,
        r.duration_seconds, (r.duration_seconds / 60).toFixed(2), r.beats,
        r.closed_at ? "yes" : "no",
      ]);
      break;
    }

    case "lessons": {
      header = ["user_id", "email", "name", "lesson_id", "started_at", "completed_at", "completed"];
      const data = db
        .prepare(
          `SELECT p.user_id, u.email, u.name, p.lesson_id, p.started_at, p.completed_at
             FROM lesson_progress p JOIN users u ON u.id = p.user_id
            ORDER BY u.email, p.lesson_id`,
        )
        .all() as {
        user_id: string; email: string; name: string; lesson_id: string;
        started_at: string | null; completed_at: string | null;
      }[];
      rows = data.map((r) => [
        r.user_id, r.email, r.name, r.lesson_id, r.started_at, r.completed_at,
        r.completed_at ? "yes" : "no",
      ]);
      break;
    }

    case "events": {
      header = ["event_id", "user_id", "email", "kind", "module", "payload", "created_at"];
      const data = db
        .prepare(
          `SELECT e.id, e.user_id, u.email, e.kind, e.module, e.payload, e.created_at
             FROM events e JOIN users u ON u.id = e.user_id
            ORDER BY e.created_at`,
        )
        .all() as {
        id: number; user_id: string; email: string; kind: string;
        module: string | null; payload: string | null; created_at: string;
      }[];
      rows = data.map((r) => [r.id, r.user_id, r.email, r.kind, r.module, r.payload, r.created_at]);
      break;
    }

    default:
      res.status(400).json({ error: "dataset phải là users | sessions | lessons | events." });
      return;
  }

  const csv = toCsv(header, rows);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${dataset}-${stamp}.csv"`);
  res.send(csv);
});

// ── Bảo trì ───────────────────────────────────────────────────────────

/** Xoá phiên đăng nhập đã hết hạn. Gọi từ cron hoặc thủ công. */
adminRouter.post("/maintenance/purge-sessions", (_req, res) => {
  const result = db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(nowIso());
  res.json({ deleted: result.changes });
});
