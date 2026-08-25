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

*Cập nhật: 2025-08-25*