# 磁影智析 · Ciying Zhixi

An interactive MRI education platform that turns operating an MRI scanner into browser-based lessons — drag parameters, watch the signal, understand the physics.

一个把 MRI 扫描仪操作流程变成浏览器互动课程的 MRI 教育平台——拖动参数、观察信号、理解物理。

> English, Chinese and Vietnamese are supported (switch via the flag button in the header).
>
> 支持英语、中文和越南语（通过头部的切换按钮切换）。

---

## Prerequisites

| Tool | Minimum version | Check |
|------|----------------|-------|
| **Node.js** | ≥ 18 | `node --version` |
| **npm** | ≥ 9 | `npm --version` |
| **Python** | ≥ 3.10 | `python3 --version` |
| **pip** | ≥ 23 | `pip --version` |

> **macOS note:** The ML service supports MPS (Apple Silicon GPU) automatically. On Intel Macs / Linux / Windows, it falls back to CPU.

---

## Quick start

```bash
# 1. Install Node dependencies
npm install

# 2. Install Python ML dependencies (use a virtual environment)
python3 -m venv ml_venv
source ml_venv/bin/activate        # macOS/Linux
# ml_venv\Scripts\activate         # Windows
pip install -r ml_service/requirements.txt

# 3. Start all services (web + API + ML)
npm run dev:all
```

Open **http://localhost:5173** in your browser.

---

## What runs where

| Service | Port | Command | Description |
|---------|------|---------|-------------|
| **Vite dev server** | 5173 | `npm run dev` | React frontend with hot reload |
| **Express API** | 8787 | `npm run server` | Auth, usage tracking, progress, admin, ML proxy, SQLite |
| **Python ML** | 8788 | `npm run ml` | Module 3 (MRIParamNet) + Module 4 (CHARMS-Lite) inference |

The Vite dev server proxies `/api/*` → `localhost:8787` and `/api/ml/*` → `localhost:8788` automatically — no CORS issues in development.

---

## Accounts & data

The platform requires login. Two roles:

| Role | Can do |
|------|--------|
| `user` | Learn Module 1 (progress saved), run Modules 2–4 |
| `admin` | Everything above + `/admin` dashboard, user management, CSV export |

Users self-register at `/register`. There is no email service, so password
reset is done by an admin from the dashboard.

### Creating the first admin

```bash
npm run admin:create -- --email you@example.com --name "Your name"
```

A random password is printed **once**. Add `--password ...` to set your own.

### Where data lives

Everything is in one SQLite file — `server/data/app.db` in development,
`/data/app.db` in Docker. Tables:

| Table | Purpose |
|-------|---------|
| `users` | Accounts (scrypt password hashes) |
| `sessions` | Login sessions (SHA-256 of the cookie token only) |
| `usage_sessions` | One row per browser tab session — opened/last-seen/closed, duration |
| `usage_module_time` | Seconds per module within each usage session |
| `lesson_progress` | Module 1 progress per user |
| `events` | Module 2/3/4 runs with their parameters and results |

**Usage time** is measured from tab open to tab close: the browser sends a
heartbeat every 30 s while the tab is visible, and the server sums
`last_seen_at − opened_at`. Gaps longer than 90 s (sleep, network loss) are not
counted, so the numbers stay honest.

Back up the whole file:

```bash
npm run build && ./scripts/backup-db.sh
```

---

## Production / lab deployment

For a classroom or lab machine where you want a single static build:

```bash
# 1. Build frontend
npm run build

# 2. Start Express (serves static files + API proxy)
npm run server

# 3. Start ML service (in another terminal, with venv activated)
source ml_venv/bin/activate
npm run ml
```

Open **http://localhost:8787** — the Express server serves the built React app from `dist/`.

For a public deployment with a domain name and automatic HTTPS, see the
**Triển khai VPS** chapter in [deploy.md](deploy.md) — it uses Docker Compose
with two containers (`app`, `caddy`). The ML container is optional and off by
default (`ML_ENABLED=false`): Modules 3 and 4 still render their full theory and
UI, but pressing "run model" shows a "not supported on this server / hardware
limit" dialog instead of calling the model.

---

## Model checkpoints

Two model files are required for Modules 3 & 4:

| Module | File | Size | Purpose |
|--------|------|------|---------|
| 3 | `module3_deploy/best_model.pt` | ~43 MB | MRIParamNet — near-optimal parameter prediction |
| 4 | `module4_deploy/best_model_200e.pth` | ~17 MB | CHARMS-Lite — MRI super-resolution |

These files are tracked in the repository. If you cloned a shallow copy or the files are missing, download them from the original source or ask a teammate.

### Swapping models

To replace a model with your own:

1. **For Module 3** — Replace `module3_deploy/best_model.pt` with your checkpoint. The file must contain a dict with keys `model_state_dict`, `j_mean`, `j_std`. The model architecture is defined in `module3_deploy/models/cnn_model.py`.

2. **For Module 4** — Replace `module4_deploy/best_model_200e.pth` with your checkpoint. The model architecture is defined in `module4_deploy/model.py`. Update the checkpoint path in `ml_service/server.py` (`M4_CHECKPOINT` variable) if using a different filename.

3. Edit `ml_service/server.py` to adjust `M3_CHECKPOINT` or `M4_CHECKPOINT` paths if needed.

---

## Project structure

```
src/
├─ routes/            pages (HomePage, Module1Page, Module2Page, Module3Page, Module4Page, AdminDashboardPage, …)
├─ components/        layout (Header/UserMenu/Footer), learning (LabLayout, ParamSlider…), charts, admin, ui
├─ data/              registries (modules, lessons, knowledge boxes, site info)
├─ auth/              session store, API client, route guards
├─ tracking/          usage heartbeat + learning event helpers
├─ progress/          Module 1 progress store (synced with server)
├─ ml-service/        typed fetch client for the Python ML backend
├─ mri-sim/           phantom + colormap + signal computation
├─ simulations/       closed-form physics (deterministic pseudo-noise)
├─ i18n/              store + useT hook + locale dictionaries (vi/en/zh)
└─ stores/            Zustand stores (module2 scan session)
server/               Express API (auth, tracking, progress, admin) + SQLite schema
scripts/              create-admin.ts, backup-db.sh
ml_service/           Python FastAPI — ML inference for Modules 3 & 4
module3_deploy/       MRIParamNet model + checkpoint
module4_deploy/       CHARMS-Lite model + checkpoint
```

---

## All scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start Vite dev server (web). |
| `npm run server` | Start Express API. |
| `npm run ml` | Start Python ML service (Modules 3 & 4). |
| `npm run admin:create` | Create an admin account (prints a password once). |
| `npm run dev:all` | Run web + api + ml concurrently. |
| `npm run typecheck` | `tsc --noEmit` — type-check without emitting. |
| `npm run build` | Type-check then build to `dist/`. |
| `npm run preview` | Preview the production build. |
| `npm run sim:phantom` | Print ASCII preview of the tube phantom. |

---

## Troubleshooting

### "ML service not available" on Module 3 or 4

1. Make sure the Python ML service is running: `npm run ml` (with venv activated).
2. Check it's healthy: `curl http://localhost:8788/api/ml/health`.
3. If the service fails to start, check PyTorch is installed: `python3 -c "import torch; print(torch.__version__)"`.

### Port already in use

```bash
# Find what's using the port
lsof -i :8787    # Express
lsof -i :8788    # ML service
lsof -i :5173    # Vite

# Kill it
kill -9 <PID>
```

### Module 3 heatmap not rendering

The Python ML service requires `matplotlib`. If you see import errors:
```bash
pip install matplotlib
```

### Python version mismatch

If `pip install` fails with version conflicts, try:
```bash
python3 -m venv ml_venv --clear   # fresh venv
source ml_venv/bin/activate
pip install --upgrade pip
pip install -r ml_service/requirements.txt
```

### Frontend builds but pages are blank

Check that `dist/index.html` exists after `npm run build`. If `npm run build` fails, run `npm run typecheck` first to see TypeScript errors.

---

## Tech stack

- **Frontend:** Vite + React 18 + TypeScript, react-router-dom v6, Chart.js, KaTeX.
- **State / i18n:** Zustand. Lightweight hand-written i18n layer (VI / EN / ZH).
- **Backend:** Node + Express (`GET /api/health`, `POST /api/scans`, proxy to Python ML). Python FastAPI for model inference.

---

## Where things live

- **Content is data-driven.** Lessons, modules, site info, and knowledge boxes are registries in `src/data/*.ts` — edit data, not components.
- **i18n has two tiers:** short UI chrome via `t("key")` (dictionaries in `src/i18n/locales/{vi,en,zh}.ts`, `vi` is the master key source); structured educational content via `LocalizedString = {vi,en,zh}` resolved with `tr()`.
- **Design specs at repo root** (`overall-design.md`, `module1-thiet-ke.md`, `module2-thiet-ke.md`, `module3-thiet-ke.md`) are the source of truth for content and physics — read them before changing lessons or formulas.

## Conventions

- Math = LaTeX/KaTeX everywhere (`\(…\)` inline, `$$…$$` block). Do **not** use Unicode math characters (γ, ω₀, θ, Δ, ×, ⁻¹, …).
- Use CSS variables (`var(--color-*)`) from `src/styles/tokens.css`, not hard-coded hex.
- Accessibility: touch targets ≥ 44px, `:focus-visible` amber, respect `prefers-reduced-motion`.
- Vietnamese is the default locale; keep the educational register ("Bảng điều khiển", "Kết quả thời gian thực", …).

---

*Built by 智影寰宇 / Zhiying Huanyu — four people, four countries, four fields.*