# Hướng dẫn cài đặt & chạy từ số 0 — Ciying Zhixi

Tài liệu này hướng dẫn cài đặt toàn bộ môi trường để chạy nền tảng MRI education **từ một máy tính trần** (chưa có gì). Mọi thao tác được viết cho macOS, có ghi chú thêm cho Windows/Linux khi cần.

---

## Mục lục

1. [Cài Node.js và npm](#1-cài-nodejs-và-npm)
2. [Cài Python và pip](#2-cài-python-và-pip)
3. [Tải mã nguồn](#3-tải-mã-nguồn)
4. [Cài đặt dependencies](#4-cài-đặt-dependencies)
5. [Chạy ứng dụng](#5-chạy-ứng-dụng)
6. [Triển khai phòng lab](#6-triển-khai-phòng-lab)
7. [Xử lý lỗi thường gặp](#7-xử-lý-lỗi-thường-gặp)
8. [Triển khai VPS (có tên miền + HTTPS)](#8-triển-khai-vps-có-tên-miền--https)

---

## 1. Cài Node.js và npm

Node.js là môi trường chạy JavaScript bên ngoài trình duyệt, cần cho frontend (Vite/React) và backend (Express).

### macOS

**Cách 1 — Homebrew (khuyên dùng):**

```bash
# Cài Homebrew nếu chưa có
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Cài Node.js
brew install node
```

**Cách 2 — Tải trực tiếp:**

Vào [nodejs.org](https://nodejs.org), tải bản **LTS** (≥ 18), mở `.pkg` và làm theo hướng dẫn.

### Windows

Vào [nodejs.org](https://nodejs.org), tải bản **LTS**, chạy `.msi`, tích chọn **"Automatically install the necessary tools"** khi được hỏi.

### Linux (Ubuntu/Debian)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Kiểm tra

```bash
node --version   # phải ≥ 18
npm --version    # phải ≥ 9
```

---

## 2. Cài Python và pip

Python và pip cần cho ML service (Module 3 & 4 — PyTorch inference).

### macOS

```bash
# Cài Python 3.12 qua Homebrew (khuyên dùng)
brew install python@3.12

# Hoặc tải từ python.org nếu không dùng Homebrew
# https://www.python.org/downloads/
```

Python cài qua Homebrew đã có sẵn pip. Kiểm tra:

```bash
python3 --version   # phải ≥ 3.10
pip3 --version      # phải ≥ 23
```

### Windows

1. Vào [python.org](https://www.python.org/downloads/), tải Python ≥ 3.10
2. Chạy `.exe`, **tích chọn "Add Python to PATH"** ở màn hình đầu tiên
3. Mở **Command Prompt** hoặc **PowerShell**, kiểm tra:

```cmd
python --version
pip --version
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install -y python3 python3-pip python3-venv
```

### Kiểm tra

```bash
python3 --version   # phải ≥ 3.10
pip3 --version      # phải ≥ 23
```

---

## 3. Tải mã nguồn

```bash
git clone https://gitee.com/yangd_74/prv_web.git
cd prv_web
```

> Nếu chưa cài git: `brew install git` (macOS) hoặc tải từ [git-scm.com](https://git-scm.com).

---

## 4. Cài đặt dependencies

### 4.1. Node dependencies

```bash
npm install
```

Lệnh này tải tất cả thư viện JavaScript cần thiết (React, Vite, Express, Chart.js, KaTeX, …) vào thư mục `node_modules/`. Tốn khoảng 2–5 phút tùy tốc độ mạng.

### 4.2. Python dependencies

**Tạo virtual environment (khuyên dùng):**

```bash
python3 -m venv ml_venv
```

**Kích hoạt venv:**

```bash
# macOS / Linux
source ml_venv/bin/activate

# Windows
ml_venv\Scripts\activate
```

Khi thấy `(ml_venv)` xuất hiện ở đầu dòng lệnh là được.

**Cài thư viện:**

```bash
pip install -r ml_service/requirements.txt
```

Danh sách thư viện cần cài:

| Thư viện | Mục đích |
|----------|----------|
| `torch` | PyTorch — chạy model deep learning |
| `torchvision` | Tiện ích ảnh cho PyTorch |
| `fastapi` | Web framework cho ML service |
| `uvicorn` | ASGI server chạy FastAPI |
| `python-multipart` | Xử lý upload file |
| `pillow` | Đọc/ghi ảnh |
| `numpy` | Tính toán ma trận |
| `matplotlib` | Vẽ biểu đồ heatmap |

> **Lưu ý:** PyTorch (~700MB–2GB tùy hệ điều hành) sẽ tự động tải về. Lần đầu cài đặt có thể mất 5–15 phút.

---

## 5. Chạy ứng dụng

### 5.1. Chạy tất cả cùng lúc (dev mode)

```bash
# Đảm bảo đã kích hoạt venv
source ml_venv/bin/activate   # macOS/Linux
# ml_venv\Scripts\activate    # Windows

npm run dev:all
```

Lệnh này chạy đồng thời 3 service:

| Service | Cổng | Vai trò |
|---------|------|---------|
| Vite | 5173 | Frontend React (hot reload) |
| Express | 8787 | API lưu ca chụp + proxy ML |
| Python ML | 8788 | Inference Module 3 & 4 |

Mở trình duyệt, vào **http://localhost:5173**.

### 5.2. Chạy từng service riêng

Nếu cần debug từng phần:

```bash
# Terminal 1 — Frontend
npm run dev

# Terminal 2 — Express API
npm run server

# Terminal 3 — Python ML (phải activate venv trước)
source ml_venv/bin/activate
npm run ml
```

---

## 6. Triển khai phòng lab

Dành cho máy tính trong phòng thí nghiệm — không cần hot reload, chỉ cần chạy ổn định.

```bash
# 1. Build frontend (tạo thư mục dist/)
npm run build

# 2. Kích hoạt venv
source ml_venv/bin/activate

# 3. Chạy Express (phục vụ static files + API)
npm run server

# 4. Terminal khác — Chạy ML service
source ml_venv/bin/activate
npm run ml
```

Mở trình duyệt, vào **http://localhost:8787**.

> **Mẹo:** Để tự động khởi động khi bật máy, thêm 2 lệnh `npm run server` và `npm run ml` vào script khởi động của hệ điều hành (LaunchAgent trên macOS, Task Scheduler trên Windows, systemd trên Linux).

---

## 7. Xử lý lỗi thường gặp

### "command not found: node"

Node.js chưa được cài hoặc chưa có trong PATH. Làm lại bước 1.

### "command not found: python3"

Python chưa được cài hoặc chưa có trong PATH. Làm lại bước 2.

### "Error: Cannot find module '...'"

Chạy lại `npm install` trong thư mục dự án.

### "ML service not available" khi dùng Module 3 hoặc 4

Python ML service chưa chạy. Kiểm tra:

```bash
# Đã activate venv chưa?
source ml_venv/bin/activate

# Service có chạy không?
curl http://localhost:8788/api/ml/health
```

Nếu `curl` không trả về JSON, chạy `npm run ml` trong terminal khác.

### "No module named 'torch'"

PyTorch chưa được cài. Đảm bảo đã activate venv và chạy:

```bash
pip install -r ml_service/requirements.txt
```

### Port 5173 / 8787 / 8788 đã bị chiếm

```bash
# macOS / Linux — tìm process đang dùng cổng
lsof -i :5173
lsof -i :8787
lsof -i :8788

# Kill process
kill -9 <PID>

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Module 3 không vẽ được heatmap

Thiếu `matplotlib`:

```bash
pip install matplotlib
```

### Build frontend bị lỗi TypeScript

Chạy typecheck để xem chi tiết lỗi:

```bash
npm run typecheck
```

### Tường lửa chặn kết nối (Windows)

Khi chạy lần đầu, Windows Firewall có thể bật popup hỏi có cho phép Node.js/Python truy cập mạng không. Chọn **"Allow access"** (chỉ cần cho mạng nội bộ/private).

---

## Tóm tắt nhanh

```bash
# Cài đặt lần đầu
git clone https://gitee.com/yangd_74/prv_web.git
cd prv_web
npm install
python3 -m venv ml_venv
source ml_venv/bin/activate
pip install -r ml_service/requirements.txt

# Chạy
npm run dev:all
# → Mở http://localhost:5173
```

---

## 8. Triển khai VPS (có tên miền + HTTPS)

Phần này dành cho khi bạn muốn đưa website lên internet để nhiều người truy cập. Website chạy trong 3 container Docker: `app` (Node + React), `ml` (Python + PyTorch), `caddy` (tự động HTTPS).

### 8.1. Cần mua gì

| Thứ | Yêu cầu | Giá tham khảo |
|-----|---------|---------------|
| **VPS** | 2 vCPU, **4 GB RAM**, 40 GB SSD, Ubuntu 24.04 | Hetzner CX22 ~€4.5/tháng · DigitalOcean ~$12/tháng |
| **Tên miền** | Bất kỳ (.com, .vn, .edu.vn…) | ~250.000đ/năm |

> **Vì sao cần 4 GB RAM:** Module 3 và 4 load 2 model PyTorch (~60 MB weights nhưng cần thêm RAM cho inference). Với 2 GB, tiến trình ML có thể bị hệ điều hành kill giữa chừng.

**Không cần** GPU, không cần thuê thêm database — SQLite nằm ngay trên VPS.

### 8.2. Trỏ tên miền về VPS

1. Mua VPS, ghi lại **địa chỉ IP** (dạng `123.45.67.89`).
2. Vào trang quản lý tên miền → phần **DNS** → thêm bản ghi:
   - Type: `A`
   - Name: `@` (hoặc tên miền con nếu muốn, ví dụ `mri`)
   - Value: `IP của VPS`
3. Đợi 5–30 phút. Kiểm tra bằng:

```bash
ping your-domain.com
```

Nếu thấy đúng IP của VPS là được.

### 8.3. Cài Docker trên VPS

SSH vào VPS (thay `root@IP` bằng thông tin nhà cung cấp gửi cho bạn):

```bash
ssh root@123.45.67.89
```

Chạy 5 lệnh sau để cài Docker:

```bash
apt update && apt upgrade -y
apt install -y curl git ufw
curl -fsSL https://get.docker.com | sh
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable
```

Kiểm tra:

```bash
docker --version
docker compose version
```

### 8.4. Lấy mã nguồn và cấu hình

```bash
cd /opt
git clone https://gitee.com/yangd_74/prv_web.git aiphys
cd aiphys
```

> **Lưu ý:** hai file model `module3_deploy/best_model.pt` (~43 MB) và `module4_deploy/best_model_200e.pth` (~17 MB) phải có trong repo. Nếu clone về thiếu, chép chúng lên bằng `scp` từ máy của bạn.

Tạo file cấu hình:

```bash
cp .env.production.example .env
nano .env
```

Sửa **2 dòng**, dùng đúng tên miền của bạn (không có `https://` ở dòng đầu):

```
DOMAIN=mri.example.com
APP_ORIGIN=https://mri.example.com
```

Lưu lại: `Ctrl+O`, `Enter`, `Ctrl+X`.

### 8.5. Khởi động

```bash
docker compose up -d --build
```

Lần đầu mất **10–20 phút** vì phải tải PyTorch và build frontend. Xem tiến trình:

```bash
docker compose logs -f
```

Khi thấy dòng `server listening on http://localhost:8787` là xong. Nhấn `Ctrl+C` để thoát khỏi chế độ xem log (container vẫn chạy).

Kiểm tra cả 3 service đều chạy:

```bash
docker compose ps
```

Mở trình duyệt vào `https://your-domain.com` — chứng chỉ HTTPS được Caddy tự xin trong ~30 giây đầu.

### 8.6. Tạo tài khoản quản trị đầu tiên

Hệ thống không gửi email nên admin đầu tiên phải tạo từ dòng lệnh trên VPS:

```bash
docker compose exec app npx tsx scripts/create-admin.ts --email ban@example.com --name "Tên bạn"
```

Kết quả in ra một **mật khẩu ngẫu nhiên** — chỉ hiện một lần, lưu lại ngay.

Sau đó đăng nhập bằng tài khoản này, vào menu tên → **Bảng điều khiển**.

### 8.7. Các lệnh thường dùng

| Việc cần làm | Lệnh |
|---|---|
| Xem log | `docker compose logs -f app` (hoặc `ml`, `caddy`) |
| Khởi động lại web | `docker compose restart app` |
| Cập nhật code mới | `git pull && docker compose up -d --build` |
| Dừng toàn bộ | `docker compose down` |
| Kiểm tra sức khoẻ | `docker compose ps` (cột STATUS phải là `healthy`) |

### 8.8. Sao lưu dữ liệu (quan trọng)

Toàn bộ dữ liệu nghiên cứu nằm trong **một file**: `/opt/aiphys/data/app.db`.

Cài cron sao lưu hằng ngày:

```bash
chmod +x /opt/aiphys/scripts/backup-db.sh
crontab -e
```

Thêm dòng sau (sao lưu 2:30 sáng mỗi ngày, giữ 30 bản):

```
30 2 * * * /opt/aiphys/scripts/backup-db.sh >> /var/log/aiphys-backup.log 2>&1
```

Bản sao lưu nằm ở `/opt/aiphys/data/backups/`.

**Nên làm thêm:** định kỳ tải bản sao lưu về máy của bạn, phòng khi VPS hỏng:

```bash
# Chạy trên máy cá nhân, không phải trên VPS
scp root@123.45.67.89:/opt/aiphys/data/backups/app-2026-10-28.db ./backup.db
```

**Phục hồi khi có sự cố:**

```bash
cd /opt/aiphys
docker compose down
cp data/backups/app-2026-10-27.db data/app.db
rm -f data/app.db-wal data/app.db-shm
docker compose up -d
```

### 8.9. Xuất dữ liệu phục vụ nghiên cứu

Đăng nhập bằng tài khoản admin → **Bảng điều khiển** → mục **Xuất dữ liệu**:

| File | Nội dung |
|------|----------|
| `users-*.csv` | Mỗi người dùng: tổng thời gian, số phiên, số bài đã xong, tỉ lệ hoàn thành khoá |
| `sessions-*.csv` | Từng phiên sử dụng: thời điểm mở, đóng, thời lượng, số heartbeat |
| `lessons-*.csv` | Từng bài học của từng người: bắt đầu lúc nào, xong lúc nào |
| `events-*.csv` | Sự kiện Module 2/3/4: tham số đã dùng, kết quả mô hình |

File CSV có BOM UTF-8 nên mở bằng Excel hiển thị đúng tiếng Việt có dấu.

### 8.10. Xử lý lỗi thường gặp khi triển khai

**"Chứng chỉ HTTPS không lấy được"**

Tên miền chưa trỏ đúng về IP, hoặc cổng 80/443 bị chặn. Kiểm tra:

```bash
ping your-domain.com          # phải ra IP của VPS
ufw status                    # phải thấy 80/tcp và 443/tcp là ALLOW
docker compose logs caddy | tail -30
```

**"502 Bad Gateway"**

Container `app` chưa sẵn sàng. Kiểm tra:

```bash
docker compose ps
docker compose logs app | tail -30
```

**Module 3/4 báo "Dịch vụ ML chưa sẵn sàng"**

Container `ml` đang load model (mất 30–60 giây sau khi khởi động) hoặc bị hết RAM:

```bash
docker compose logs ml | tail -20
free -h                       # xem còn bao nhiêu RAM trống
```

Nếu RAM đầy: nâng cấu hình VPS hoặc giảm `mem_limit` của service `ml` trong `docker-compose.yml`.

**Build thất bại ở bước `npm ci`**

`package-lock.json` bị lệch so với `package.json`. Chạy `npm install` ở máy local rồi commit lại `package-lock.json`.

**Đã đổi tên miền nhưng vẫn ra tên miền cũ**

Sửa `.env` rồi `docker compose up -d` (không cần `--build`).

---

*Cập nhật: 2026-10-28*