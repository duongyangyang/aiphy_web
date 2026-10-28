# ── Stage 1: build frontend ───────────────────────────────────────────
FROM node:22-slim AS build

WORKDIR /app

# Cài dependencies trước để tận dụng cache layer khi chỉ đổi source.
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json vite.config.ts index.html ./
COPY public ./public
COPY src ./src

RUN npm run build


# ── Stage 2: runtime ──────────────────────────────────────────────────
FROM node:22-slim AS runtime

WORKDIR /app

# better-sqlite3 là native module; cần python3/make/g++ khi không có prebuilt
# cho nền tảng này. Debian slim trên amd64/arm64 đều có prebuilt nên thường
# không cần, nhưng giữ lại để build không gãy.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server ./server
COPY scripts ./scripts
COPY --from=build /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=8787
ENV DB_PATH=/data/app.db

# Thư mục dữ liệu — mount volume ở docker-compose.
RUN mkdir -p /data
VOLUME ["/data"]

EXPOSE 8787

# tsx chạy trực tiếp TypeScript, không cần bước biên dịch riêng cho server.
CMD ["npx", "tsx", "server/index.ts"]
