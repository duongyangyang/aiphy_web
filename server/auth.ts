import { randomBytes, randomUUID, scrypt, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
import type { Request, Response, NextFunction } from "express";
import { db, nowIso } from "./db";

/**
 * auth — băm mật khẩu, quản lý phiên, middleware phân quyền.
 *
 * Mật khẩu: scrypt (có sẵn trong Node, không cần thư viện native) với salt
 * ngẫu nhiên 16 byte. Định dạng lưu: `scrypt$<salt hex>$<hash hex>`.
 *
 * Phiên: token ngẫu nhiên 32 byte gửi về cookie httpOnly; DB chỉ lưu
 * SHA-256 của token nên rò rỉ database không cho phép mạo danh.
 */

const scryptAsync = promisify(scrypt);

const SCRYPT_KEYLEN = 64;
export const SESSION_COOKIE = "aiphys_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 ngày

export type Role = "user" | "admin";

export interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: Role;
  created_at: string;
  last_login_at: string | null;
  is_active: number;
}

/** Người dùng đã xác thực, dạng an toàn để trả về client (không có hash). */
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export function toPublicUser(row: UserRow): PublicUser {
  return { id: row.id, email: row.email, name: row.name, role: row.role };
}

// ── Mật khẩu ──────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = (await scryptAsync(password, salt, SCRYPT_KEYLEN)) as Buffer;
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  if (expected.length !== SCRYPT_KEYLEN) return false;
  const actual = (await scryptAsync(password, salt, SCRYPT_KEYLEN)) as Buffer;
  return timingSafeEqual(actual, expected);
}

// ── Phiên ─────────────────────────────────────────────────────────────

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createSession(userId: string, req: Request, res: Response): void {
  const token = randomBytes(32).toString("hex");
  const created = Date.now();
  db.prepare(
    `INSERT INTO sessions (token_hash, user_id, created_at, expires_at, user_agent, ip)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    hashToken(token),
    userId,
    new Date(created).toISOString(),
    new Date(created + SESSION_TTL_MS).toISOString(),
    (req.get("user-agent") ?? "").slice(0, 300),
    clientIp(req),
  );

  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
}

export function destroySession(req: Request, res: Response): void {
  const token = readCookie(req, SESSION_COOKIE);
  if (token) {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
  }
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

export function destroyAllSessions(userId: string): void {
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

/** Huỷ mọi phiên của user TRỪ phiên đang dùng trong request này. */
export function destroyOtherSessions(req: Request, userId: string): void {
  const token = readCookie(req, SESSION_COOKIE);
  if (!token) {
    destroyAllSessions(userId);
    return;
  }
  db.prepare("DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?").run(
    userId,
    hashToken(token),
  );
}

/** Đọc người dùng từ cookie phiên. Trả null nếu không có/không hợp lệ/hết hạn. */
export function getUserFromRequest(req: Request): PublicUser | null {
  const token = readCookie(req, SESSION_COOKIE);
  if (!token) return null;

  const row = db
    .prepare(
      `SELECT u.id, u.email, u.name, u.role, u.is_active, s.expires_at
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ?`,
    )
    .get(hashToken(token)) as
    | { id: string; email: string; name: string; role: Role; is_active: number; expires_at: string }
    | undefined;

  if (!row) return null;
  if (row.is_active !== 1) return null;
  if (Date.parse(row.expires_at) <= Date.now()) {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
    return null;
  }
  return { id: row.id, email: row.email, name: row.name, role: row.role };
}

// ── Middleware ────────────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "Bạn cần đăng nhập để tiếp tục." });
    return;
  }
  req.user = user;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "Bạn cần đăng nhập để tiếp tục." });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Chỉ quản trị viên mới được truy cập." });
    return;
  }
  req.user = user;
  next();
}

// ── Tiện ích ─────────────────────────────────────────────────────────

export function clientIp(req: Request): string {
  const forwarded = req.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket.remoteAddress ?? "unknown";
}

function readCookie(req: Request, name: string): string | null {
  const header = req.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return null;
}

/** Tạo user mới. Ném lỗi nếu email đã tồn tại. */
export function insertUser(params: {
  email: string;
  name: string;
  passwordHash: string;
  role?: Role;
}): UserRow {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO users (id, email, name, password_hash, role, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, params.email.toLowerCase(), params.name, params.passwordHash, params.role ?? "user", nowIso());
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow;
}

export function findUserByEmail(email: string): UserRow | undefined {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase()) as
    | UserRow
    | undefined;
}
