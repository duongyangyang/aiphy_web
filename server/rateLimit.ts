import type { Request, Response, NextFunction } from "express";
import { clientIp } from "./auth";

/**
 * rateLimit — chặn dò mật khẩu bằng bộ đếm trong bộ nhớ.
 *
 * QUAN TRỌNG: chỉ đếm lần THẤT BẠI. Nếu đếm mọi request, một lớp học 30 sinh
 * viên dùng chung một IP (NAT của trường) sẽ bị khoá sau 10 lần đăng nhập
 * thành công. Cách đúng: middleware chỉ *kiểm tra* hạn mức; route gọi
 * `recordFailure(req)` khi xác thực sai và `resetRateLimit(req)` khi thành công.
 *
 * Đủ cho quy mô một nhóm nghiên cứu nhỏ (một tiến trình Node, không cần Redis).
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function keyFor(req: Request): string {
  return `${clientIp(req)}:${req.baseUrl}${req.path}`;
}

function getBucket(key: string): Bucket | undefined {
  const bucket = buckets.get(key);
  if (!bucket) return undefined;
  if (bucket.resetAt <= Date.now()) {
    buckets.delete(key);
    return undefined;
  }
  return bucket;
}

/** Dọn entry hết hạn khi map phình to (chỉ chạy khi thật sự cần). */
function pruneIfNeeded(): void {
  if (buckets.size <= 5000) return;
  const now = Date.now();
  for (const [k, v] of buckets) {
    if (v.resetAt <= now) buckets.delete(k);
  }
}

/**
 * Middleware: từ chối nếu số lần thất bại đã vượt hạn mức.
 * Không tự tăng bộ đếm — route quyết định điều đó qua `recordFailure`.
 */
export function rateLimit(opts: { windowMs: number; max: number }) {
  return (req: Request, res: Response, next: NextFunction): void => {
    pruneIfNeeded();
    const bucket = getBucket(keyFor(req));
    if (bucket && bucket.count >= opts.max) {
      const retryAfter = Math.ceil((bucket.resetAt - Date.now()) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({
        error: `Quá nhiều lần thử sai. Vui lòng đợi ${Math.ceil(retryAfter / 60)} phút rồi thử lại.`,
      });
      return;
    }
    next();
  };
}

/** Ghi nhận một lần xác thực thất bại. */
export function recordFailure(req: Request, windowMs: number): void {
  const key = keyFor(req);
  const existing = getBucket(key);
  if (existing) {
    existing.count += 1;
    return;
  }
  buckets.set(key, { count: 1, resetAt: Date.now() + windowMs });
}

/** Xoá bộ đếm sau khi xác thực thành công. */
export function resetRateLimit(req: Request): void {
  buckets.delete(keyFor(req));
}
