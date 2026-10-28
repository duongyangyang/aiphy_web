import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

/**
 * vite.config — dùng cho dev local (`npm run dev`).
 *
 * Production (Render, VPS, Docker) KHÔNG dùng Vite: `npm run build` tạo `dist/`,
 * rồi `npm run server` để Express phục cả file tĩnh lẫn API trên một cổng.
 * Vite dev trên PaaS sẽ proxy /api sang :8787 — cổng đó không tồn tại ở đó, nên
 * gây ECONNREFUSED.
 *
 * `PORT`: nền tảng PaaS cấp cổng động; `host: true` để proxy của nền tảng vào được.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: Number(process.env.PORT ?? 5173),
    host: true,
    // Vite chặn tên miền lạ theo mặc định ("Blocked request. This host ...").
    allowedHosts: [".onrender.com", ".railway.app", ".up.railway.app", ".fly.dev"],
    proxy: {
      // /api/ml → Python ML service (phải đứng trước /api chung)
      "/api/ml": {
        target: "http://localhost:8788",
        changeOrigin: true,
      },
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
  build: {
    target: "es2022",
  },
});
