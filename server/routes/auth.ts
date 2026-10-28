import { Router } from "express";
import { db, nowIso } from "../db";
import {
  createSession,
  destroyOtherSessions,
  destroySession,
  findUserByEmail,
  getUserFromRequest,
  hashPassword,
  insertUser,
  requireAuth,
  toPublicUser,
  verifyPassword,
  type UserRow,
} from "../auth";
import { rateLimit, recordFailure, resetRateLimit } from "../rateLimit";

/**
 * Route xác thực: đăng ký, đăng nhập, đăng xuất, lấy phiên hiện tại, đổi mật khẩu.
 *
 * Nguyên tắc bảo mật:
 * - Đăng nhập sai luôn trả cùng một thông báo, không phân biệt email có tồn
 *   tại hay không (chống dò email).
 * - Giới hạn tần suất đăng ký/đăng nhập theo IP.
 */

export const authRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

/** Cửa sổ và hạn mức cho đăng nhập/đăng ký: 10 lần sai / 15 phút / IP. */
const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_MAX_FAILURES = 10;
const authLimiter = rateLimit({ windowMs: AUTH_WINDOW_MS, max: AUTH_MAX_FAILURES });

function validateCredentials(email: unknown, password: unknown): string | null {
  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return "Email không hợp lệ.";
  }
  if (typeof password !== "string" || password.length < MIN_PASSWORD) {
    return `Mật khẩu phải có ít nhất ${MIN_PASSWORD} ký tự.`;
  }
  return null;
}

/** Ghi sự kiện đăng nhập để dashboard đếm được số lần truy cập. */
function logLogin(userId: string): void {
  db.prepare(
    `INSERT INTO events (user_id, kind, module, payload, created_at)
     VALUES (?, 'login', NULL, NULL, ?)`,
  ).run(userId, nowIso());
}

authRouter.post(
  "/register",
  authLimiter,
  async (req, res) => {
    const { email, name, password } = req.body ?? {};

    const invalid = validateCredentials(email, password);
    if (invalid) {
      recordFailure(req, AUTH_WINDOW_MS);
      res.status(400).json({ error: invalid });
      return;
    }
    if (typeof name !== "string" || name.trim().length < 2) {
      recordFailure(req, AUTH_WINDOW_MS);
      res.status(400).json({ error: "Tên phải có ít nhất 2 ký tự." });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (findUserByEmail(normalizedEmail)) {
      recordFailure(req, AUTH_WINDOW_MS);
      res.status(409).json({ error: "Email này đã được đăng ký." });
      return;
    }

    const passwordHash = await hashPassword(String(password));
    let user: UserRow;
    try {
      user = insertUser({ email: normalizedEmail, name: String(name).trim(), passwordHash });
    } catch {
      // Hai request đăng ký đồng thời cùng email — UNIQUE bắt được.
      recordFailure(req, AUTH_WINDOW_MS);
      res.status(409).json({ error: "Email này đã được đăng ký." });
      return;
    }

    resetRateLimit(req);
    createSession(user.id, req, res);
    db.prepare("UPDATE users SET last_login_at = ? WHERE id = ?").run(nowIso(), user.id);
    logLogin(user.id);
    res.status(201).json({ user: toPublicUser(user) });
  },
);

authRouter.post(
  "/login",
  authLimiter,
  async (req, res) => {
    const { email, password } = req.body ?? {};

    const invalid = validateCredentials(email, password);
    if (invalid) {
      // Vẫn trả lỗi chung: không tiết lộ lỗi nào là do email hay mật khẩu.
      recordFailure(req, AUTH_WINDOW_MS);
      res.status(401).json({ error: "Email hoặc mật khẩu không đúng." });
      return;
    }

    const user = findUserByEmail(String(email));
    // Luôn chạy verifyPassword kể cả khi không tìm thấy user, để thời gian phản
    // hồi không tiết lộ email nào tồn tại.
    const hash = user?.password_hash ?? "scrypt$00$00";
    const ok = await verifyPassword(String(password), hash);

    if (!user || !ok) {
      recordFailure(req, AUTH_WINDOW_MS);
      res.status(401).json({ error: "Email hoặc mật khẩu không đúng." });
      return;
    }
    if (user.is_active !== 1) {
      recordFailure(req, AUTH_WINDOW_MS);
      res.status(403).json({ error: "Tài khoản này đã bị vô hiệu hoá. Liên hệ quản trị viên." });
      return;
    }

    resetRateLimit(req);
    createSession(user.id, req, res);
    db.prepare("UPDATE users SET last_login_at = ? WHERE id = ?").run(nowIso(), user.id);
    logLogin(user.id);
    res.json({ user: toPublicUser(user) });
  },
);

authRouter.post("/logout", (req, res) => {
  destroySession(req, res);
  res.json({ ok: true });
});

authRouter.get("/me", (req, res) => {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "Chưa đăng nhập." });
    return;
  }
  res.json({ user });
});

authRouter.post("/password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};

  if (typeof newPassword !== "string" || newPassword.length < MIN_PASSWORD) {
    res.status(400).json({ error: `Mật khẩu mới phải có ít nhất ${MIN_PASSWORD} ký tự.` });
    return;
  }

  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user!.id) as UserRow | undefined;
  if (!row) {
    res.status(401).json({ error: "Chưa đăng nhập." });
    return;
  }

  const ok = await verifyPassword(String(currentPassword ?? ""), row.password_hash);
  if (!ok) {
    res.status(403).json({ error: "Mật khẩu hiện tại không đúng." });
    return;
  }

  const passwordHash = await hashPassword(newPassword);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(passwordHash, row.id);

  // Giữ phiên hiện tại, huỷ mọi phiên khác (thiết bị lạ).
  destroyOtherSessions(req, row.id);

  res.json({ ok: true });
});
