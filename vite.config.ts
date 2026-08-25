import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Khởi tạo Vite cho ứng dụng React học MRI.
// Dev server gọi tới API Node qua proxy để /api/* chạy được khi phát triển.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // /api/ml → Python ML service (must be before general /api)
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
