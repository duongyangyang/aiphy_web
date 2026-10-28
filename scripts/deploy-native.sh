#!/bin/bash
# Cài đặt aiphys-web trên Alibaba Cloud Linux 3 (VPS 2 vCPU / 2 GB).
# Chạy: bash deploy-native.sh
exec > >(tee /tmp/deploy-native.log) 2>&1
set -x

APP_DIR=/opt/aiphys/app
REPO=https://github.com/duongyangyang/aiphy_web.git
IP=139.224.80.87

echo "=== [1/8] Cài gói hệ thống ==="
dnf install -y nodejs nginx git policycoreutils-python-utils
node --version
nginx -v

echo "=== [2/8] Tạo user riêng cho ứng dụng ==="
id aiphys >/dev/null 2>&1 || useradd -r -m -d /opt/aiphys -s /sbin/nologin aiphys
mkdir -p /opt/aiphys

echo "=== [3/8] Clone mã nguồn ==="
rm -rf "$APP_DIR"
git clone --depth 1 "$REPO" "$APP_DIR"
cd "$APP_DIR"

echo "=== [4/8] Cài dependencies (npm mirror nội địa) ==="
npm config set registry https://registry.npmmirror.com
npm ci --no-audit --no-fund

echo "=== [5/8] Build frontend ==="
npm run build
ls -la dist/index.html

echo "=== [6/8] File cấu hình .env ==="
mkdir -p "$APP_DIR/server/data"
cat > "$APP_DIR/.env" <<ENV
NODE_ENV=production
PORT=8787
DB_PATH=$APP_DIR/server/data/app.db
ML_ENABLED=false
APP_ORIGIN=http://$IP
ENV
cat "$APP_DIR/.env"

echo "=== [7/8] systemd service ==="
cat > /etc/systemd/system/aiphys.service <<'UNIT'
[Unit]
Description=aiphys-web (MRI education platform)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=aiphys
WorkingDirectory=/opt/aiphys/app
EnvironmentFile=/opt/aiphys/app/.env
ExecStart=/usr/bin/node /opt/aiphys/app/node_modules/tsx/dist/cli.mjs server/index.ts
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
UNIT
chown -R aiphys:aiphys /opt/aiphys
systemctl daemon-reload
systemctl enable aiphys
systemctl restart aiphys
sleep 6
systemctl is-active aiphys

echo "=== [8/8] nginx reverse proxy ==="
cat > /etc/nginx/nginx.conf <<'NGINX'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /run/nginx.pid;

events { worker_connections 1024; }

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    access_log    /var/log/nginx/access.log;
    sendfile      on;
    keepalive_timeout 65;
    client_max_body_size 12m;

    server {
        listen 80 default_server;
        server_name _;

        location / {
            proxy_pass http://127.0.0.1:8787;
            proxy_http_version 1.1;
            proxy_set_header Host              $host;
            proxy_set_header X-Real-IP         $remote_addr;
            proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 300s;
        }
    }
}
NGINX

# SELinux chặn nginx kết nối ra localhost theo mặc định.
setsebool -P httpd_can_network_connect 1 2>/dev/null || echo "setsebool skipped"

nginx -t
systemctl enable nginx
systemctl restart nginx
systemctl is-active nginx

echo "=== KIỂM TRA ==="
curl -s -o /dev/null -w "app :8787  -> %{http_code}\n" http://127.0.0.1:8787/api/health
curl -s -o /dev/null -w "nginx :80  -> %{http_code}\n" http://127.0.0.1:80/
echo "=== XONG ==="
