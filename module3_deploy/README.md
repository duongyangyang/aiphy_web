# MRI Parameter Recommendation — Standalone

Gói độc lập, tách từ project MRI POME. Chỉ chứa các file tối thiểu để chạy chức năng
**recommend params**: dự đoán bộ (TR*, TE*) tối ưu từ ảnh MRI đầu vào.

## Cấu trúc thư mục

```
recommend_standalone/
├── recommend_params.py   ← Script chính (CLI)
├── best_model.pt          ← Model weights (~135 MB)
├── models/
│   ├── __init__.py
│   └── cnn_model.py       ← Kiến trúc MRIParamNet
└── README.md
```

## Cài đặt

```bash
pip install torch torchvision numpy pillow matplotlib
```

## Cách dùng

### 1. Dòng lệnh (CLI)

```bash
python recommend_params.py \
    --image /path/to/anchor_image.png \
    --tr0 200 --te0 10 --j0 1.23 \
    --method soft_argmax
```

### 2. Python API

```python
from recommend_params import load_model, load_image, recommend

device = "cpu"  # hoặc "cuda" / "mps"
model, j_mean, j_std = load_model("best_model.pt", device)
img = load_image("/path/to/anchor_image.png")

result = recommend(
    model, img, device,
    tr0=200.0, te0=10.0, j0=1.23,
    j_mean=j_mean, j_std=j_std,
    method="soft_argmax",   # "argmax" | "soft_argmax" | "quadratic"
    top_k=8, temperature=0.5,
)

print(f"TR*={result['TR_star']:.0f} ms, TE*={result['TE_star']:.0f} ms")
```

## Tham số

| Flag | Mặc định | Ý nghĩa |
|------|----------|---------|
| `--image` | (bắt buộc) | Ảnh MRI anchor (grayscale PNG) |
| `--tr0` | (bắt buộc) | TR của ảnh đã chụp (ms) |
| `--te0` | (bắt buộc) | TE của ảnh đã chụp (ms) |
| `--j0` | `1.23` | J tại điểm anchor (từ CNR đo trên ảnh) |
| `--checkpoint` | `best_model.pt` | Đường dẫn file model weights |
| `--method` | `soft_argmax` | `argmax` / `soft_argmax` / `quadratic` |
| `--top_k` | `8` | Số điểm top dùng để chọn |
| `--temperature` | `0.5` | Độ mượt của soft_argmax |
| `--device` | auto-detect | `cpu` / `cuda` / `mps` |
| `--out_dir` | `recommendations` | Thư mục output (heatmap + txt) |

## Ba phương pháp chọn (TR*, TE*)

| Phương pháp | Mô tả |
|-------------|-------|
| `argmax` | Lấy điểm cao nhất trên lưới (baseline, nhạy nhiễu) |
| `soft_argmax` | Trung bình có trọng số softmax của top-k điểm (**khuyến nghị**) |
| `quadratic` | Fit mặt bậc 2 qua top-k, tìm đỉnh giải tích (chính xác nhất nếu vùng lõm đều) |

## Normalisation range

- TR: 200 – 4000 ms
- TE: 10 – 200 ms
- Ảnh: grayscale [0, 255] → [0, 1]

## Yêu cầu model checkpoint

File `best_model.pt` phải chứa các key:
- `model_state_dict` — state dict của `MRIParamNet`
- `j_mean` / `j_std` — thống kê chuẩn hóa của J (tính từ tập train)