import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import http from "node:http";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { DB_PATH } from "./db";
import { requireAuth } from "./auth";
import { authRouter } from "./routes/auth";
import { trackRouter } from "./routes/track";
import { progressRouter } from "./routes/progress";
import { adminRouter } from "./routes/admin";

/**
 * Server Node cho aiphys-web — phục vụ web + API + proxy ML.
 *
 * HTTP routes:
 * - GET  /api/health            : health-check (công khai).
 * - /api/auth/*                 : đăng ký, đăng nhập, đăng xuất, đổi mật khẩu.
 * - /api/track/*                : heartbeat thời lượng + sự kiện học tập.
 * - /api/progress/*             : tiến độ Module 1 (bắt buộc đăng nhập).
 * - /api/admin/*                : dashboard + xuất CSV (chỉ admin).
 * - /api/ml/*                   : proxy sang Python ML (bắt buộc đăng nhập).
 *
 * Static:
 * - express.static(dist/)       : phục React build + SPA fallback.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, "..", "dist");
const DIST_INDEX = path.join(DIST_DIR, "index.html");

const PORT = Number(process.env.PORT ?? 8787);
const ML_HOST = process.env.ML_HOST ?? "127.0.0.1";
const ML_PORT = Number(process.env.ML_PORT ?? 8788);
const APP_ORIGIN = process.env.APP_ORIGIN ?? "";

const app = express();

// Chạy sau Caddy trong Docker: cần tin X-Forwarded-* để rate-limit theo IP thật.
app.set("trust proxy", 1);

// ── Header bảo mật ────────────────────────────────────────────────────
// Viết thủ công thay vì thêm helmet: chỉ cần vài header cố định.
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      // Vite inject script inline khi dev; production build cần 'unsafe-inline'
      // cho style của React/Katex.
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  );
  next();
});

app.use(express.json({ limit: "256kb" }));
app.use(cookieParser());

// ── Chống CSRF: kiểm tra Origin trên mọi request ghi dữ liệu ──────────
// Kết hợp với cookie sameSite=lax, đủ chặn form cross-site ở quy mô này.
app.use((req, res, next) => {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    next();
    return;
  }
  const origin = req.get("origin");
  if (!origin) {
    // Không có Origin: request same-origin của trình duyệt cũ, hoặc công cụ
    // dòng lệnh. Cookie sameSite=lax vẫn bảo vệ; cho qua.
    next();
    return;
  }
  const allowed = APP_ORIGIN ? [APP_ORIGIN] : [];
  const host = req.get("host");
  if (host) {
    allowed.push(`http://${host}`, `https://${host}`);
  }
  if (!allowed.includes(origin)) {
    res.status(403).json({ error: "Origin không được phép." });
    return;
  }
  next();
});

// ── Health check (công khai) ──────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    name: "aiphys-web",
    version: "0.2.0",
    distServed: existsSync(DIST_INDEX),
  });
});

// ── API ───────────────────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/track", trackRouter);
app.use("/api/progress", progressRouter);
app.use("/api/admin", adminRouter);

// ── Proxy /api/ml → Python ML service (bắt buộc đăng nhập) ────────────
// Inference tốn CPU/RAM nên phải chặn sau xác thực, không để công khai.
app.use("/api/ml", requireAuth, (req, res) => {
  const options: http.RequestOptions = {
    hostname: ML_HOST,
    port: ML_PORT,
    path: req.originalUrl,
    method: req.method,
    headers: { ...req.headers, host: undefined },
  };
  const proxy = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode ?? 500, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxy.on("error", () => {
    res.status(502).json({
      error: "Dịch vụ ML chưa sẵn sàng. Chạy: npm run ml (hoặc docker compose up ml).",
    });
  });
  req.pipe(proxy);
});

// ── Static: phục React build ──────────────────────────────────────────
if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR, { index: false }));
  // SPA fallback: mọi GET không phải /api/* → trả index.html cho React Router.
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    if (existsSync(DIST_INDEX)) {
      res.sendFile(DIST_INDEX);
    } else {
      res.status(404).send("Chưa build frontend (chạy: npm run build).");
    }
  });
}

app.listen(PORT, () => {
  console.log(`[aiphys] server listening on http://localhost:${PORT}`);
  console.log(`[aiphys] database: ${DB_PATH}`);
  console.log(`[aiphys] dist: ${existsSync(DIST_INDEX) ? "đã phục" : "chưa build (dev dùng Vite)"}`);
});
