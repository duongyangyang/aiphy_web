import "dotenv/config";
import express from "express";
import http from "node:http";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Server Node cho aiphys-web — phục vụ web demo.
 *
 * HTTP routes:
 * - GET  /api/health            : health-check.
 * - POST /api/scans             : lưu một ca chụp (Module 2 MRI Simulator).
 * - GET  /api/scans             : liệt kê ca chụp (tóm tắt, không kèm ảnh).
 * - GET  /api/scans/:id         : lấy chi tiết một ca chụp.
 *
 * Static:
 * - express.static(dist/)       : phục React build (Module 1/2/3/4) + SPA fallback cho
 *                                 React Router. Khi dev, Vite (:5173) tự phục frontend,
 *                                 proxy /api + /api/ml tới các backend.
 *
 * Dữ liệu ca chụp tạm lưu trong `server/data/scans.json` (demo-scale).
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const SCANS_FILE = path.join(DATA_DIR, "scans.json");
const DIST_DIR = path.join(__dirname, "..", "dist");
const DIST_INDEX = path.join(DIST_DIR, "index.html");

const MAX_DIM = 256; // giới hạn kích thước ảnh lưu (tránh file khổng lồ)

const PORT = Number(process.env.PORT ?? 8787);

const app = express();
app.use(express.json({ limit: "8mb" }));

// ---- Health check ----
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    name: "aiphys-web",
    version: "0.1.0",
    distServed: existsSync(DIST_INDEX),
  });
});

/** Đọc toàn bộ record (khởi tạo file nếu chưa có). */
function readScans(): ScanRecord[] {
  try {
    if (!existsSync(SCANS_FILE)) return [];
    const raw = readFileSync(SCANS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ScanRecord[]) : [];
  } catch {
    return [];
  }
}

/** Ghi toàn bộ record. */
function writeScans(records: ScanRecord[]): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(SCANS_FILE, JSON.stringify(records, null, 2), "utf-8");
}

interface ScanParams {
  TR?: number;
  TE?: number;
  TI?: number | null;
  flipAngle?: number;
  matrixSize?: number;
}

interface ScanRecord {
  id: string;
  protocolId: string;
  protocolName: string;
  sequence: string;
  params: ScanParams;
  groundTruth: number[][];
  result: number[][];
  savedAt: string;
}

function isValidImage(img: unknown): img is number[][] {
  if (!Array.isArray(img)) return false;
  const rows = img.length;
  if (rows === 0 || rows > MAX_DIM) return false;
  const cols = (img[0] as number[])?.length ?? 0;
  if (cols === 0 || cols > MAX_DIM) return false;
  return img.every((row) => Array.isArray(row) && row.length === cols);
}

app.post("/api/scans", (req, res) => {
  const { protocolId, protocolName, sequence, params, groundTruth, result } = req.body ?? {};

  if (!protocolId || !params || !isValidImage(groundTruth) || !isValidImage(result)) {
    res.status(400).json({ error: "Thiếu hoặc sai định dạng: protocolId, params, groundTruth, result (mảng 2D ≤ " + MAX_DIM + "×" + MAX_DIM + ")" });
    return;
  }

  const record: ScanRecord = {
    id: randomUUID(),
    protocolId,
    protocolName: protocolName ?? protocolId,
    sequence: sequence ?? "SE",
    params,
    groundTruth,
    result,
    savedAt: new Date().toISOString(),
  };

  const records = readScans();
  records.push(record);
  writeScans(records);

  res.status(201).json({ id: record.id, savedAt: record.savedAt });
});

app.get("/api/scans", (_req, res) => {
  const summaries = readScans().map((r) => ({
    id: r.id,
    protocolId: r.protocolId,
    protocolName: r.protocolName,
    sequence: r.sequence,
    params: r.params,
    savedAt: r.savedAt,
  }));
  res.json(summaries);
});

app.get("/api/scans/:id", (req, res) => {
  const record = readScans().find((r) => r.id === req.params.id);
  if (!record) {
    res.status(404).json({ error: "Không tìm thấy ca chụp" });
    return;
  }
  res.json(record);
});

// ---- Proxy /api/ml sang Python ML service (production) ----
const ML_PORT = Number(process.env.ML_PORT ?? 8788);
app.use("/api/ml", (req, res) => {
  const options: http.RequestOptions = {
    hostname: "127.0.0.1",
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
    res.status(502).json({ error: "ML service not available. Start it with: cd ml_service && python server.py" });
  });
  req.pipe(proxy);
});

// ---- Static: phục React build (production / máy lab) ----
// Chỉ phục khi dist/index.html tồn tại (đã `npm run build`). Dev dùng Vite.
if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  // SPA fallback: mọi GET không phải /api/* → trả index.html (cho React Router).
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    if (existsSync(DIST_INDEX)) {
      res.sendFile(DIST_INDEX);
    } else {
      res.status(404).send("Chưa build frontend (chạy: npm run build).");
    }
  });
}

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[aiphys] server listening on http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`[aiphys] dist: ${existsSync(DIST_INDEX) ? "đã phục" : "chưa build (dev dùng Vite)"}`);
});
