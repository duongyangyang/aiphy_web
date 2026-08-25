"""
Parameter Recommendation (Anchor-based model)
==========================================================
f(image, TR0, TE0, J0, TRc, TEc) -> Jc_predicted

3 phương án chọn (TR*, TE*) từ bề mặt J_pred(TR,TE):
  - argmax        : lấy đúng điểm cao nhất (baseline, nhạy nhiễu)
  - soft_argmax   : trung bình có trọng số softmax của top-k điểm (khuyến nghị mặc định)
  - quadratic     : fit mặt bậc 2 qua top-k, tìm đỉnh giải tích (chính xác nhất nếu vùng lõm đều)

Chạy:
    python recommend_params.py \
        --image ../dataset/images_full/p0000_tr0200_te010.png \
        --tr0 200 --te0 10 --j0 1.23 --method soft_argmax
"""
import os
import sys
import argparse
import numpy as np
import torch
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from PIL import Image

from models.cnn_model import MRIParamNet

# ------------------------------------------------------------------
# Normalisation constants (inline — no external dependency)
# ------------------------------------------------------------------
TR_MIN, TR_MAX = 200.0, 4000.0
TE_MIN, TE_MAX = 10.0, 200.0

TR_CANDIDATES = np.arange(200, 4000 + 1, 50)
TE_CANDIDATES = np.arange(10, 200 + 1, 5)


def _default_device():
    if torch.cuda.is_available():
        return "cuda"
    if torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def load_model(checkpoint_path: str, device: str):
    model = MRIParamNet(pretrained=False)
    checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=False)
    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
        state_dict = checkpoint["model_state_dict"]
        j_mean = checkpoint.get("j_mean")
        j_std = checkpoint.get("j_std")
    else:
        state_dict = checkpoint
        j_mean, j_std = None, None
    model.load_state_dict(state_dict)
    model.to(device)
    model.eval()
    return model, j_mean, j_std


def load_image(image_path: str) -> torch.Tensor:
    img = np.array(Image.open(image_path).convert("L"), dtype=np.float32) / 255.0
    return torch.from_numpy(img).unsqueeze(0)  # (1, H, W)


# ------------------------------------------------------------------
# Các phương án chọn (TR*, TE*) từ bề mặt J_pred(TR,TE)
# ------------------------------------------------------------------
def soft_argmax_recommend(J_grid, TR_grid, TE_grid, top_k=8, temperature=0.5):
    """
    Thay vì lấy đúng 1 điểm argmax cứng (dễ bị lệch do nhiễu dự đoán của model),
    lấy trung bình có trọng số (softmax) của top-k điểm J_pred cao nhất.
    Làm mượt sai số ngoại suy của model, tận dụng việc model thường định vị
    ĐÚNG VÙNG lân cận đỉnh dù chưa chắc đúng CHÍNH XÁC điểm đỉnh.

    temperature nhỏ  -> gần giống argmax cứng (ít làm mượt)
    temperature lớn  -> gần giống trung bình đều của top-k (làm mượt nhiều)
    """
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


def quadratic_fit_recommend(J_grid, TR_grid, TE_grid, top_k=12):
    """
    Fit 1 mặt bậc 2 (quadratic surface) qua top-k điểm J_pred cao nhất bằng
    least-squares, tìm đỉnh giải tích của mặt đó. Cho ra 1 điểm liên tục
    (không giới hạn bởi độ phân giải lưới). Trả về None nếu fit thất bại
    (ma trận suy biến) -- lúc đó nên fallback sang soft_argmax_recommend.
    """
    flat_J = J_grid.ravel()
    TR_flat, TE_flat = TR_grid.ravel(), TE_grid.ravel()
    top_idx = np.argsort(flat_J)[-top_k:]

    x, y, z = TR_flat[top_idx], TE_flat[top_idx], flat_J[top_idx]

    x_mean, x_std = x.mean(), x.std() + 1e-8
    y_mean, y_std = y.mean(), y.std() + 1e-8
    xn, yn = (x - x_mean) / x_std, (y - y_mean) / y_std

    # z = a*x^2 + b*y^2 + c*x*y + d*x + e*y + f
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


def recommend(model, image_tensor: torch.Tensor, device: str,
               tr0: float, te0: float, j0: float, j_mean: float, j_std: float,
               tr_candidates=TR_CANDIDATES, te_candidates=TE_CANDIDATES,
               batch_size: int = 512, method: str = "soft_argmax",
               top_k: int = 8, temperature: float = 0.5):
    """
    Quét toàn bộ lưới candidate (TRc, TEc), giữ cố định (image, TR0, TE0, J0),
    dự đoán Jc cho từng candidate, rồi chọn (TR*, TE*) theo `method`.
    """
    TR_grid, TE_grid = np.meshgrid(tr_candidates.astype(float), te_candidates.astype(float))
    trc_flat, tec_flat = TR_grid.ravel(), TE_grid.ravel()

    tr0_norm = (tr0 - TR_MIN) / (TR_MAX - TR_MIN)
    te0_norm = (te0 - TE_MIN) / (TE_MAX - TE_MIN)
    j0_norm = (j0 - j_mean) / (j_std + 1e-8)
    trc_norm = (trc_flat - TR_MIN) / (TR_MAX - TR_MIN)
    tec_norm = (tec_flat - TE_MIN) / (TE_MAX - TE_MIN)

    n = len(trc_flat)
    params_all = np.stack([
        np.full(n, tr0_norm), np.full(n, te0_norm), np.full(n, j0_norm),
        trc_norm, tec_norm,
    ], axis=1)
    params_all = torch.tensor(params_all, dtype=torch.float32)

    preds = np.zeros(n, dtype=np.float32)
    with torch.no_grad():
        for start in range(0, n, batch_size):
            end = min(start + batch_size, n)
            batch_img = image_tensor.unsqueeze(0).repeat(end - start, 1, 1, 1).to(device)
            batch_params = params_all[start:end].to(device)
            pred_norm = model(batch_img, batch_params).cpu().numpy()
            preds[start:end] = pred_norm * j_std + j_mean

    J_grid = preds.reshape(TE_grid.shape)

    if method == "argmax":
        idx_te, idx_tr = np.unravel_index(np.argmax(J_grid), J_grid.shape)
        tr_star, te_star, j_star = float(tr_candidates[idx_tr]), float(te_candidates[idx_te]), float(J_grid[idx_te, idx_tr])
    elif method == "soft_argmax":
        tr_star, te_star, j_star = soft_argmax_recommend(J_grid, TR_grid, TE_grid, top_k, temperature)
    elif method == "quadratic":
        result = quadratic_fit_recommend(J_grid, TR_grid, TE_grid, top_k=max(top_k, 12))
        if result is None:
            print("WARNING: quadratic fit thất bại (ma trận suy biến), fallback sang soft_argmax")
            tr_star, te_star, j_star = soft_argmax_recommend(J_grid, TR_grid, TE_grid, top_k, temperature)
        else:
            tr_star, te_star, j_star = result
    else:
        raise ValueError(f"method không hợp lệ: {method}")

    return {
        "TR_grid": TR_grid, "TE_grid": TE_grid, "J_grid": J_grid,
        "TR_star": tr_star, "TE_star": te_star, "J_max": j_star,
        "method": method,
    }


def plot_recommendation(result, tr0, te0, out_path):
    fig, ax = plt.subplots(figsize=(8, 6.5))
    im = ax.imshow(
        result["J_grid"], aspect="auto", origin="lower",
        extent=[TR_CANDIDATES.min(), TR_CANDIDATES.max(), TE_CANDIDATES.min(), TE_CANDIDATES.max()],
        cmap="viridis",
    )
    ax.scatter([result["TR_star"]], [result["TE_star"]], color="red", marker="*", s=250,
               edgecolor="white",
               label=f"Recommended [{result['method']}] (TR*={result['TR_star']:.0f}, TE*={result['TE_star']:.0f})")
    ax.scatter([tr0], [te0], color="orange", marker="o", s=100,
               edgecolor="white", label=f"Anchor (TR0={tr0:.0f}, TE0={te0:.0f})")
    ax.set_xlabel("TR (ms)")
    ax.set_ylabel("TE (ms)")
    ax.set_title("Predicted J landscape (CNN surrogate, anchor-based)")
    fig.colorbar(im, ax=ax, label="Predicted J")
    ax.legend(loc="upper right", fontsize=8)
    fig.tight_layout()
    fig.savefig(out_path, dpi=130)
    plt.close(fig)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", required=True, help="Path to anchor MRI image (png)")
    parser.add_argument("--tr0", type=float, required=True, help="TR of the acquired image")
    parser.add_argument("--te0", type=float, required=True, help="TE of the acquired image")
    parser.add_argument("--j0", type=float, default=1.23,
                         help="J tại điểm anchor (tính từ CNR đo trên ảnh đã segment)")
    parser.add_argument("--checkpoint", default="best_model.pt")
    parser.add_argument("--device", default=_default_device())
    parser.add_argument("--out_dir", default="recommendations")
    parser.add_argument("--method", default="soft_argmax", choices=["argmax", "soft_argmax", "quadratic"])
    parser.add_argument("--top_k", type=int, default=8)
    parser.add_argument("--temperature", type=float, default=0.5)
    args = parser.parse_args()

    os.makedirs(args.out_dir, exist_ok=True)

    model, j_mean, j_std = load_model(args.checkpoint, args.device)
    if j_mean is None:
        raise ValueError("Checkpoint không chứa j_mean/j_std -- cần train lại bằng training/train.py mới")

    image_tensor = load_image(args.image)
    result = recommend(model, image_tensor, args.device, args.tr0, args.te0, args.j0, j_mean, j_std,
                        method=args.method, top_k=args.top_k, temperature=args.temperature)

    print(f"[{args.method}] Recommended: TR*={result['TR_star']:.0f} ms, TE*={result['TE_star']:.0f} ms, "
          f"predicted J={result['J_max']:.4f}")

    base_name = os.path.splitext(os.path.basename(args.image))[0]
    plot_path = os.path.join(args.out_dir, f"{base_name}_{args.method}_recommendation.png")
    plot_recommendation(result, args.tr0, args.te0, plot_path)
    print(f"Heatmap saved to {plot_path}")

    with open(os.path.join(args.out_dir, f"{base_name}_{args.method}_recommendation.txt"), "w") as f:
        f.write(f"image: {args.image}\nmethod: {args.method}\n")
        f.write(f"TR0: {args.tr0}\nTE0: {args.te0}\nJ0: {args.j0}\n")
        f.write(f"TR_star: {result['TR_star']}\nTE_star: {result['TE_star']}\n")
        f.write(f"predicted_J_max: {result['J_max']}\n")


if __name__ == "__main__":
    main()