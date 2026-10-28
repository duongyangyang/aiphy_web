import { Router } from "express";
import { db, nowIso, toMs } from "../db";
import { requireAuth } from "../auth";

/**
 * Route ghi nhận sử dụng — nguồn dữ liệu cho nghiên cứu đánh giá hiệu quả.
 *
 * Mô hình thời gian:
 *   - Trình duyệt gửi heartbeat mỗi 30 giây khi tab còn mở.
 *   - Lần đầu: tạo usage_sessions với opened_at = now.
 *   - Các lần sau: delta = now - last_seen_at, cộng vào usage_module_time cho
 *     module vừa báo, cập nhật last_seen_at.
 *   - duration_seconds = last_seen_at - opened_at  ← "mở tab → đóng tab".
 *
 * Chống thổi phồng: mỗi delta bị chặn ở MAX_DELTA_MS. Nếu máy gập, mất mạng
 * hay tab bị treo rồi bật lại, khoảng trống không bị tính là thời gian học.
 */

export const trackRouter = Router();

const MAX_DELTA_MS = 90_000; // 90 giây — gấp 3 lần chu kỳ heartbeat
const MAX_PAYLOAD_BYTES = 4096;

const VALID_MODULES = new Set(["module-1", "module-2", "module-3", "module-4", "other"]);
const VALID_KINDS = new Set([
  "lesson_start",
  "lesson_complete",
  "m2_scan",
  "m3_run",
  "m4_run",
]);

function normalizeModule(value: unknown): string {
  return typeof value === "string" && VALID_MODULES.has(value) ? value : "other";
}

/**
 * POST /api/track/heartbeat
 * Body: { sessionId: string, module: string, end?: boolean }
 */
trackRouter.post("/heartbeat", requireAuth, (req, res) => {
  const { sessionId, module, end } = req.body ?? {};

  if (typeof sessionId !== "string" || sessionId.length < 8 || sessionId.length > 64) {
    res.status(400).json({ error: "sessionId không hợp lệ." });
    return;
  }

  const userId = req.user!.id;
  const now = Date.now();
  const nowStr = new Date(now).toISOString();
  const mod = normalizeModule(module);

  const existing = db
    .prepare("SELECT user_id, opened_at, last_seen_at FROM usage_sessions WHERE id = ?")
    .get(sessionId) as
    | { user_id: string; opened_at: string; last_seen_at: string }
    | undefined;

  if (!existing) {
    db.prepare(
      `INSERT INTO usage_sessions (id, user_id, opened_at, last_seen_at, beats, user_agent)
       VALUES (?, ?, ?, ?, 1, ?)`,
    ).run(
      sessionId,
      userId,
      nowStr,
      nowStr,
      (req.get("user-agent") ?? "").slice(0, 300),
    );
    db.prepare(
      `INSERT INTO usage_module_time (usage_session_id, module, seconds) VALUES (?, ?, 0)
       ON CONFLICT(usage_session_id, module) DO NOTHING`,
    ).run(sessionId, mod);
  } else if (existing.user_id !== userId) {
    // Không cho một user ghi đè phiên của user khác.
    res.status(403).json({ error: "Phiên không thuộc về bạn." });
    return;
  } else {
    const delta = Math.min(Math.max(now - toMs(existing.last_seen_at), 0), MAX_DELTA_MS);
    const deltaSeconds = Math.round(delta / 1000);

    db.prepare(
      `UPDATE usage_sessions
          SET last_seen_at = ?, beats = beats + 1,
              duration_seconds = CAST((julianday(?) - julianday(opened_at)) * 86400 AS INTEGER)
        WHERE id = ?`,
    ).run(nowStr, nowStr, sessionId);

    if (deltaSeconds > 0) {
      db.prepare(
        `INSERT INTO usage_module_time (usage_session_id, module, seconds) VALUES (?, ?, ?)
         ON CONFLICT(usage_session_id, module) DO UPDATE SET seconds = seconds + excluded.seconds`,
      ).run(sessionId, mod, deltaSeconds);
    }
  }

  if (end === true) {
    db.prepare(
      `UPDATE usage_sessions
          SET closed_at = ?,
              duration_seconds = CAST((julianday(?) - julianday(opened_at)) * 86400 AS INTEGER)
        WHERE id = ?`,
    ).run(nowStr, nowStr, sessionId);
  }

  res.json({ ok: true });
});

/**
 * POST /api/track/event
 * Body: { kind: string, module?: string, payload?: object }
 */
trackRouter.post("/event", requireAuth, (req, res) => {
  const { kind, module, payload } = req.body ?? {};

  if (typeof kind !== "string" || !VALID_KINDS.has(kind)) {
    res.status(400).json({ error: "kind không hợp lệ." });
    return;
  }

  let serialized: string | null = null;
  if (payload !== undefined && payload !== null) {
    serialized = JSON.stringify(payload);
    if (serialized.length > MAX_PAYLOAD_BYTES) {
      res.status(413).json({ error: "payload quá lớn." });
      return;
    }
  }

  db.prepare(
    `INSERT INTO events (user_id, kind, module, payload, created_at) VALUES (?, ?, ?, ?, ?)`,
  ).run(req.user!.id, kind, normalizeModule(module), serialized, nowIso());

  res.status(201).json({ ok: true });
});
