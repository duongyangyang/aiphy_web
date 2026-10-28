import { Router } from "express";
import { db, nowIso } from "../db";
import { requireAuth } from "../auth";

/**
 * Route tiến độ học Module 1.
 *
 * Mỗi (user, lesson) có started_at và completed_at. "Hoàn thành" là hành động
 * tường minh (người dùng bấm nút) — không suy đoán từ thao tác, để số liệu
 * nghiên cứu có nghĩa rõ ràng.
 */

export const progressRouter = Router();

const LESSON_ID_RE = /^lesson-\d+-[a-z0-9-]+$/;

interface ProgressRow {
  lesson_id: string;
  started_at: string | null;
  completed_at: string | null;
}

progressRouter.get("/", requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT lesson_id, started_at, completed_at FROM lesson_progress
        WHERE user_id = ? ORDER BY lesson_id`,
    )
    .all(req.user!.id) as ProgressRow[];

  res.json({
    lessons: rows.map((r) => ({
      lessonId: r.lesson_id,
      startedAt: r.started_at,
      completedAt: r.completed_at,
    })),
  });
});

/** Đánh dấu đã bắt đầu bài. Idempotent — gọi lại không đổi started_at. */
progressRouter.post("/:lessonId/start", requireAuth, (req, res) => {
  const lessonId = req.params.lessonId;
  if (!LESSON_ID_RE.test(lessonId)) {
    res.status(400).json({ error: "lessonId không hợp lệ." });
    return;
  }

  const now = nowIso();
  db.prepare(
    `INSERT INTO lesson_progress (user_id, lesson_id, started_at)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id, lesson_id) DO UPDATE
       SET started_at = COALESCE(lesson_progress.started_at, excluded.started_at)`,
  ).run(req.user!.id, lessonId, now);

  db.prepare(
    `INSERT INTO events (user_id, kind, module, payload, created_at)
     VALUES (?, 'lesson_start', 'module-1', ?, ?)`,
  ).run(req.user!.id, JSON.stringify({ lessonId }), now);

  res.json({ ok: true });
});

/** Đánh dấu hoàn thành bài. Idempotent — gọi lại không đổi completed_at. */
progressRouter.post("/:lessonId/complete", requireAuth, (req, res) => {
  const lessonId = req.params.lessonId;
  if (!LESSON_ID_RE.test(lessonId)) {
    res.status(400).json({ error: "lessonId không hợp lệ." });
    return;
  }

  const now = nowIso();
  db.prepare(
    `INSERT INTO lesson_progress (user_id, lesson_id, started_at, completed_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, lesson_id) DO UPDATE
       SET started_at   = COALESCE(lesson_progress.started_at, excluded.started_at),
           completed_at = COALESCE(lesson_progress.completed_at, excluded.completed_at)`,
  ).run(req.user!.id, lessonId, now, now);

  db.prepare(
    `INSERT INTO events (user_id, kind, module, payload, created_at)
     VALUES (?, 'lesson_complete', 'module-1', ?, ?)`,
  ).run(req.user!.id, JSON.stringify({ lessonId }), now);

  res.json({ ok: true });
});
