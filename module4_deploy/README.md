# CHARMS MRI Super-Resolution — Inference

Brain MRI super-resolution (×2) dùng CHARMS-Lite.
Paper: *Sensors 2026, 26, 738 — Li et al.*

## Files

| File | Vai trò |
|------|---------|
| `model.py` | Kiến trúc CHARMS-Lite (để sửa nếu cần) |
| `inference.py` | Load model + weights, predict ảnh mới |
| `best_model_200e.pth` | Weights đã train (PSNR ~31.2 dB) |

## Requirements

```
torch>=2.0.0
torchvision>=0.15.0
pillow>=9.0.0
numpy>=1.24.0
```

## Usage

```bash
# Cơ bản
python inference.py --input mri_lowres.png --output mri_sr.png

# Kèm ground truth để tính PSNR/SSIM
python inference.py --input mri_lowres.png --output mri_sr.png --hq mri_hq.png

# Checkpoint khác
python inference.py --input mri_lowres.png --output mri_sr.png --checkpoint /path/to/weights.pth
```

## Dùng trong code

```python
import torch
from model import CHARMS_Lite
from inference import load_model, load_image, super_resolve, save_image

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = load_model('best_model_200e.pth', device)
lq = load_image('mri.png')

result = super_resolve(model, lq, device)
# result['sr']              — ảnh SR (1,1,H*2,W*2)
# result['uncertainty']     — uncertainty map per-pixel
# result['mean_uncertainty'] — scalar

save_image(result['sr'], 'mri_sr.png')
```

## Model Info

- **Input**: ảnh MRI grayscale bất kỳ kích thước
- **Output**: ảnh ×2 (H×2, W×2)
- **Params**: ~1.2M
- **Inference**: ~0.1s/ảnh 256×256 trên CPU M1