"""
ML Service — FastAPI server phục vụ inference cho Module 3 & 4.

Endpoint:
  POST /api/ml/recommend-params  — Module 3: dự đoán (TR*, TE*) tối ưu
  POST /api/ml/super-resolve     — Module 4: siêu phân giải ảnh MRI
  GET  /api/ml/health            — Health check

Chạy:
  cd ml_service && python server.py
  (hoặc từ thư mục gốc: python ml_service/server.py)
"""

import io
import os
import sys
import base64
from contextlib import asynccontextmanager

import numpy as np
import torch
from PIL import Image
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.responses import JSONResponse

# ── Thêm thư mục deploy vào sys.path để import model ──────────────────
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "module3_deploy"))
sys.path.insert(0, os.path.join(ROOT, "module4_deploy"))

from models.cnn_model import MRIParamNet                 # type: ignore[import-untyped]
from model import CHARMS_Lite                             # type: ignore[import-untyped]
from inference import load_model as load_charms, super_resolve  # type: ignore[import-untyped]


def _load_mri_tensor(data: bytes) -> torch.Tensor:
    """Đọc ảnh từ bytes → tensor (1,1,H,W) chuẩn hóa [0,1]."""
    img = Image.open(io.BytesIO(data)).convert("L")
    tensor = torch.from_numpy(np.array(img, dtype=np.float32)) / 255.0
    return tensor.unsqueeze(0).unsqueeze(0)

# ── Constants ─────────────────────────────────────────────────────────
TR_MIN, TR_MAX = 30.0, 3000.0
TE_MIN, TE_MAX = 5.0, 200.0
TR_CANDIDATES = np.arange(30, 3000 + 1, 50)
TE_CANDIDATES = np.arange(5, 200 + 1, 5)

M3_CHECKPOINT = os.path.join(ROOT, "module3_deploy", "best_model.pt")
M4_CHECKPOINT = os.path.join(ROOT, "module4_deploy", "best_model_200e.pth")

# ── Global state ──────────────────────────────────────────────────────
device: torch.device
m3_model: MRIParamNet
m3_j_mean: float
m3_j_std: float
m4_model: CHARMS_Lite


# ── Lifespan: load models at startup ──────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global device, m3_model, m3_j_mean, m3_j_std, m4_model

    if torch.cuda.is_available():
        device = torch.device("cuda")
    elif torch.backends.mps.is_available():
        device = torch.device("mps")
    else:
        device = torch.device("cpu")
    print(f"[ml_service] device: {device}")

    # ── Module 3: MRIParamNet ──
    print("[ml_service] loading MRIParamNet...")
    m3_model = MRIParamNet(pretrained=False)
    ckpt3 = torch.load(M3_CHECKPOINT, map_location=device, weights_only=False)
    m3_model.load_state_dict(ckpt3["model_state_dict"])
    m3_model.to(device)
    m3_model.eval()
    m3_j_mean = ckpt3.get("j_mean", 0.0) or 0.0
    m3_j_std = ckpt3.get("j_std", 1.0) or 1.0
    print(f"[ml_service] MRIParamNet loaded (j_mean={m3_j_mean:.3f}, j_std={m3_j_std:.3f})")

    # ── Module 4: CHARMS Lite ──
    print("[ml_service] loading CHARMS-Lite...")
    m4_model = load_charms(M4_CHECKPOINT, device)
    print("[ml_service] CHARMS-Lite loaded")

    yield

    # Cleanup (no-op cho demo local)


app = FastAPI(title="aiphys-ml", version="0.1.0", lifespan=lifespan)


# ── Health ────────────────────────────────────────────────────────────
@app.get("/api/ml/health")
def health():
    return {
        "ok": True,
        "device": str(device),
        "m3_loaded": m3_model is not None,
        "m4_loaded": m4_model is not None,
    }


# ── Helpers ───────────────────────────────────────────────────────────
def _read_image(file: UploadFile) -> np.ndarray:
    """Đọc ảnh PNG upload thành numpy array grayscale [0, 255]."""
    contents = file.file.read()
    img = Image.open(io.BytesIO(contents)).convert("L")
    return np.array(img, dtype=np.float32)


def _encode_png(img: np.ndarray) -> str:
    """Encode numpy array (uint8, 2D) thành base64 PNG."""
    buf = io.BytesIO()
    Image.fromarray(img, mode="L").save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("ascii")


# ── Module 3: Recommend Params ────────────────────────────────────────
def _soft_argmax(J_grid, TR_grid, TE_grid, top_k=8, temperature=0.5):
    flat_J = J_grid.ravel()
    TR_flat, TE_flat = TR_grid.ravel(), TE_grid.ravel()
    top_idx = np.argsort(flat_J)[-top_k:]
    top_J = flat_J[top_idx]
    weights = np.exp((top_J - top_J.max()) / temperature)
    weights = weights / weights.sum()
    tr_star = float(np.sum(weights * TR_flat[top_idx]))
    te_star = float(np.sum(weights * TE_flat[top_idx]))
    j_star = float(np.sum(weights * top_J))
    return tr_star, te_star, j_star


def _quadratic_fit(J_grid, TR_grid, TE_grid, top_k=12):
    flat_J = J_grid.ravel()
    TR_flat, TE_flat = TR_grid.ravel(), TE_grid.ravel()
    top_idx = np.argsort(flat_J)[-top_k:]
    x, y, z = TR_flat[top_idx], TE_flat[top_idx], flat_J[top_idx]
    x_mean, x_std = x.mean(), x.std() + 1e-8
    y_mean, y_std = y.mean(), y.std() + 1e-8
    xn, yn = (x - x_mean) / x_std, (y - y_mean) / y_std
    A = np.stack([xn**2, yn**2, xn*yn, xn, yn, np.ones_like(xn)], axis=1)
    try:
        coeffs, *_ = np.linalg.lstsq(A, z, rcond=None)
        a, b, c, d, e, f = coeffs
        H = np.array([[2*a, c], [c, 2*b]])
        if abs(np.linalg.det(H)) < 1e-6:
            return None
        sol = np.linalg.solve(H, [-d, -e])
        xn_star, yn_star = sol
        tr_star = float(np.clip(xn_star * x_std + x_mean, x.min(), x.max()))
        te_star = float(np.clip(yn_star * y_std + y_mean, y.min(), y.max()))
        j_star = float(a*xn_star**2 + b*yn_star**2 + c*xn_star*yn_star + d*xn_star + e*yn_star + f)
        return tr_star, te_star, j_star
    except np.linalg.LinAlgError:
        return None


def _generate_heatmap(J_grid, TR_candidates, TE_candidates,
                      tr_star, te_star, tr0, te0) -> str:
    """Tạo heatmap PNG từ J_grid với vùng hiển thị động quanh điểm tối ưu."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    tr_min, tr_max = TR_candidates[0], TR_candidates[-1]
    te_min, te_max = TE_candidates[0], TE_candidates[-1]

    # Cửa sổ quanh điểm tối ưu, mở rộng để bao gồm cả anchor
    TR_WINDOW = 800.0
    TE_WINDOW = 80.0

    tr_lo = max(tr_min, min(tr_star, tr0) - TR_WINDOW)
    tr_hi = min(tr_max, max(tr_star, tr0) + TR_WINDOW)
    te_lo = max(te_min, min(te_star, te0) - TE_WINDOW)
    te_hi = min(te_max, max(te_star, te0) + TE_WINDOW)

    # Tìm chỉ số slice
    tr_idx_lo = np.searchsorted(TR_candidates, tr_lo, side="left")
    tr_idx_hi = np.searchsorted(TR_candidates, tr_hi, side="right")
    te_idx_lo = np.searchsorted(TE_candidates, te_lo, side="left")
    te_idx_hi = np.searchsorted(TE_candidates, te_hi, side="right")

    # Đảm bảo ít nhất 2 điểm
    tr_idx_hi = max(tr_idx_hi, tr_idx_lo + 2)
    te_idx_hi = max(te_idx_hi, te_idx_lo + 2)

    J_sliced = J_grid[te_idx_lo:te_idx_hi, tr_idx_lo:tr_idx_hi]
    tr_sliced = TR_candidates[tr_idx_lo:tr_idx_hi]
    te_sliced = TE_candidates[te_idx_lo:te_idx_hi]

    fig, ax = plt.subplots(figsize=(8, 6.5))
    im = ax.imshow(
        J_sliced, aspect="auto", origin="lower",
        extent=[tr_sliced[0], tr_sliced[-1], te_sliced[0], te_sliced[-1]],
        cmap="viridis",
    )
    ax.scatter([tr_star], [te_star], color="red", marker="*", s=250,
               edgecolor="white", label=f"Recommended (TR*={tr_star:.0f}, TE*={te_star:.0f})")
    ax.scatter([tr0], [te0], color="orange", marker="o", s=100,
               edgecolor="white", label=f"Anchor (TR0={tr0:.0f}, TE0={te0:.0f})")
    ax.set_xlabel("TR (ms)")
    ax.set_ylabel("TE (ms)")
    ax.set_title("Predicted J landscape (CNN surrogate)")
    fig.colorbar(im, ax=ax, label="Predicted J")
    ax.legend(loc="upper right", fontsize=8)
    fig.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format="PNG", dpi=130)
    plt.close(fig)
    return base64.b64encode(buf.getvalue()).decode("ascii")


def _recommend(image_arr: np.ndarray, tr0: float, te0: float, j0: float,
               method: str, top_k: int, temperature: float) -> dict:
    """Chạy grid scan + chọn điểm (TR*, TE*)."""
    TR_grid, TE_grid = np.meshgrid(
        TR_CANDIDATES.astype(float), TE_CANDIDATES.astype(float))
    trc_flat, tec_flat = TR_grid.ravel(), TE_grid.ravel()

    tr0_norm = (tr0 - TR_MIN) / (TR_MAX - TR_MIN)
    te0_norm = (te0 - TE_MIN) / (TE_MAX - TE_MIN)
    j0_norm = (j0 - m3_j_mean) / (m3_j_std + 1e-8)
    trc_norm = (trc_flat - TR_MIN) / (TR_MAX - TR_MIN)
    tec_norm = (tec_flat - TE_MIN) / (TE_MAX - TE_MIN)

    n = len(trc_flat)
    params_all = np.stack([
        np.full(n, tr0_norm), np.full(n, te0_norm), np.full(n, j0_norm),
        trc_norm, tec_norm,
    ], axis=1)
    params_all = torch.tensor(params_all, dtype=torch.float32)

    # Ảnh: (H, W) → (1, 1, H, W) → repeat cho batch
    img_tensor = torch.from_numpy(image_arr / 255.0).unsqueeze(0).to(device)

    preds = np.zeros(n, dtype=np.float32)
    batch_size = 512
    with torch.no_grad():
        for start in range(0, n, batch_size):
            end = min(start + batch_size, n)
            batch_img = img_tensor.unsqueeze(0).repeat(end - start, 1, 1, 1)
            batch_params = params_all[start:end].to(device)
            pred_norm = m3_model(batch_img, batch_params).cpu().numpy()
            preds[start:end] = pred_norm * m3_j_std + m3_j_mean

    J_grid = preds.reshape(TE_grid.shape)

    if method == "argmax":
        idx_te, idx_tr = np.unravel_index(np.argmax(J_grid), J_grid.shape)
        tr_star = float(TR_CANDIDATES[idx_tr])
        te_star = float(TE_CANDIDATES[idx_te])
        j_star = float(J_grid[idx_te, idx_tr])
    elif method == "soft_argmax":
        tr_star, te_star, j_star = _soft_argmax(
            J_grid, TR_grid, TE_grid, top_k, temperature)
    elif method == "quadratic":
        result = _quadratic_fit(J_grid, TR_grid, TE_grid, top_k=max(top_k, 12))
        if result is None:
            tr_star, te_star, j_star = _soft_argmax(
                J_grid, TR_grid, TE_grid, top_k, temperature)
        else:
            tr_star, te_star, j_star = result
    else:
        raise ValueError(f"Unknown method: {method}")

    # ── Ràng buộc lâm sàng ──
    tr_raw, te_raw = tr_star, te_star
    te_star = max(15.0, min(200.0, te_star))          # 15 ≤ TE ≤ 200
    tr_star = min(3000.0, max(40.0, tr_star, 2.0 * te_star))  # 40 ≤ TR ≤ 3000, TR ≥ 2×TE

    return {
        "TR_star": round(tr_star, 1),
        "TE_star": round(te_star, 1),
        "J_max": round(j_star, 4),
        "method": method,
        "J_grid": J_grid.tolist(),
        "tr_candidates": TR_CANDIDATES.tolist(),
        "te_candidates": TE_CANDIDATES.tolist(),
        "heatmap_base64": _generate_heatmap(
            J_grid, TR_CANDIDATES, TE_CANDIDATES, tr_star, te_star, tr0, te0),
        "tr0": tr0,
        "te0": te0,
        "j0": j0,
        "tr_raw": round(tr_raw, 1),
        "te_raw": round(te_raw, 1),
    }


@app.post("/api/ml/recommend-params")
async def recommend_params(
    image: UploadFile = File(...),
    tr0: float = Form(30.0),
    te0: float = Form(5.0),
    j0: float = Form(1.23),
    method: str = Form("soft_argmax"),
    top_k: int = Form(8),
    temperature: float = Form(0.5),
):
    if method not in ("argmax", "soft_argmax", "quadratic"):
        return JSONResponse({"error": f"Invalid method: {method}"}, status_code=400)

    try:
        img_arr = _read_image(image)
    except Exception as e:
        return JSONResponse({"error": f"Failed to read image: {e}"}, status_code=400)

    try:
        result = _recommend(img_arr, tr0, te0, j0, method, top_k, temperature)
        return result
    except Exception as e:
        return JSONResponse({"error": f"Inference failed: {e}"}, status_code=500)


# ── Module 4: Super Resolution ────────────────────────────────────────
def _tensor_to_base64(tensor: torch.Tensor) -> str:
    """Chuyển tensor (1,1,H,W) [0,1] → base64 PNG."""
    img = tensor.detach().cpu().squeeze().numpy()
    img = np.clip(img * 255.0, 0, 255).astype(np.uint8)
    return _encode_png(img)


def _uncertainty_to_base64(uncertainty: torch.Tensor) -> tuple[str, float, float]:
    """Chuyển uncertainty map (1,1,H,W) → (base64 PNG, min, max)."""
    u = uncertainty.detach().cpu().squeeze().numpy()
    u_min = float(u.min())
    u_max = float(u.max())
    u_norm = (u - u_min) / (u_max - u_min + 1e-8)
    u_norm = np.clip(u_norm * 255.0, 0, 255).astype(np.uint8)
    return _encode_png(u_norm), u_min, u_max


@app.post("/api/ml/super-resolve")
async def super_resolve_endpoint(
    image: UploadFile = File(...),
    hq: UploadFile | None = File(None),
):
    try:
        lq = _load_mri_tensor(image.file.read())
    except Exception as e:
        return JSONResponse({"error": f"Failed to read input image: {e}"}, status_code=400)

    hq_tensor = None
    if hq is not None:
        try:
            hq_tensor = _load_mri_tensor(hq.file.read())
        except Exception as e:
            return JSONResponse({"error": f"Failed to read HQ image: {e}"}, status_code=400)

    try:
        result = super_resolve(m4_model, lq, device, hq_tensor)
    except Exception as e:
        return JSONResponse({"error": f"Inference failed: {e}"}, status_code=500)

    uc_b64, uc_min, uc_max = _uncertainty_to_base64(result["uncertainty"])

    return {
        "sr_base64": _tensor_to_base64(result["sr"]),
        "uncertainty_base64": uc_b64,
        "uncertainty_min": round(uc_min, 8),
        "uncertainty_max": round(uc_max, 8),
        "mean_uncertainty": round(result["mean_uncertainty"], 6),
        "psnr": round(result["psnr"], 2) if result.get("psnr") is not None else None,
        "ssim": round(result["ssim"], 4) if result.get("ssim") is not None else None,
        "input_shape": [lq.shape[2], lq.shape[3]],
        "output_shape": [result["sr"].shape[2], result["sr"].shape[3]],
    }


# ── Main ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8788)