"""
Inference script for CHARMS MRI Super-Resolution.

Usage:
    python inference.py --input mri_lq.png --output mri_sr.png
    python inference.py --input mri_lq.png --output mri_sr.png --hq mri_hq.png
    python inference.py --input mri_lq.png --output mri_sr.png --checkpoint path/to/weights.pth
"""

import argparse
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
from torchvision.transforms.functional import adjust_contrast, adjust_sharpness

from model import CHARMS_Lite


def load_model(checkpoint_path: str, device: torch.device) -> CHARMS_Lite:
    """Load model từ checkpoint."""
    ckpt = torch.load(checkpoint_path, map_location=device, weights_only=False)

    model = CHARMS_Lite(
        in_channels=ckpt['args'].in_channels,
        out_channels=ckpt['args'].out_channels,
        base_channels=ckpt['args'].base_channels,
        n_rraf=ckpt['args'].n_rraf,
        n_rlfe=ckpt['args'].n_rlfe,
        n_mddta_heads=ckpt['args'].n_mddta_heads,
    ).to(device)

    model.load_state_dict(ckpt['model_state_dict'])
    model.eval()

    print(f"Loaded model (epoch {ckpt['epoch']}, PSNR {ckpt['best_psnr']:.2f} dB)")
    return model


def load_image(path: str) -> torch.Tensor:
    """Load ảnh grayscale, chuẩn hóa về [0,1], shape (1,1,H,W)."""
    img = Image.open(path).convert('L')
    tensor = torch.from_numpy(np.array(img, dtype=np.float32)) / 255.0
    tensor = tensor.unsqueeze(0).unsqueeze(0)  # (1, 1, H, W)
    return tensor


def save_image(tensor: torch.Tensor, path: str):
    """Lưu tensor (1,1,H,W) hoặc (1,H,W) thành ảnh grayscale."""
    img = tensor.detach().cpu().squeeze().numpy()
    img = np.clip(img * 255.0, 0, 255).astype(np.uint8)
    Image.fromarray(img, mode='L').save(path)


def _tta_predict(model: CHARMS_Lite, x: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:
    """
    Test-time augmentation: 4 lần inference với flip, trả về (mean, std).
    """
    preds = []
    for flip_h, flip_v in [(False, False), (True, False), (False, True), (True, True)]:
        aug = x
        if flip_h:
            aug = torch.flip(aug, [3])
        if flip_v:
            aug = torch.flip(aug, [2])
        p = model(aug)
        if flip_v:
            p = torch.flip(p, [2])
        if flip_h:
            p = torch.flip(p, [3])
        preds.append(p)
    stacked = torch.stack(preds, dim=0)  # (4, 1, H, W)
    return stacked.mean(dim=0), stacked.std(dim=0)


def _psnr(pred: torch.Tensor, target: torch.Tensor) -> float:
    mse = torch.mean((pred - target) ** 2).item()
    if mse == 0:
        return float('inf')
    return float(10 * np.log10(1.0 / mse))


def _ssim(pred: torch.Tensor, target: torch.Tensor, window_size: int = 11) -> float:
    C1, C2 = 0.01 ** 2, 0.03 ** 2
    pad = window_size // 2
    mu1 = F.avg_pool2d(pred, window_size, 1, pad)
    mu2 = F.avg_pool2d(target, window_size, 1, pad)
    mu1_sq, mu2_sq = mu1 ** 2, mu2 ** 2
    mu12 = mu1 * mu2
    sig1 = F.avg_pool2d(pred ** 2, window_size, 1, pad) - mu1_sq
    sig2 = F.avg_pool2d(target ** 2, window_size, 1, pad) - mu2_sq
    sig12 = F.avg_pool2d(pred * target, window_size, 1, pad) - mu12
    ssim_map = ((2 * mu12 + C1) * (2 * sig12 + C2)) / \
               ((mu1_sq + mu2_sq + C1) * (sig1 + sig2 + C2) + 1e-8)
    return float(ssim_map.mean().item())


def super_resolve(model: CHARMS_Lite, lq_tensor: torch.Tensor, device: torch.device,
                  hq_tensor: torch.Tensor | None = None) -> dict:
    """
    Chạy model, trả về dict:
        sr:           ảnh SR (1,1,H*2,W*2) đã enhance
        uncertainty:  uncertainty map (1,1,H*2,W*2) — std TTA
        mean_uncertainty: float
        psnr:         float | None (nếu có hq_tensor)
        ssim:         float | None (nếu có hq_tensor)
    """
    x = lq_tensor.to(device)

    with torch.no_grad():
        sr, uncertainty = _tta_predict(model, x)

    sr = adjust_contrast(sr, 1.15)
    sr = adjust_sharpness(sr, 1.12)

    result: dict = {
        'sr': sr,
        'uncertainty': uncertainty,
        'mean_uncertainty': float(uncertainty.mean().item()),
    }

    if hq_tensor is not None:
        hq = hq_tensor.to(device)
        if hq.shape[-2:] != sr.shape[-2:]:
            hq = F.interpolate(hq, size=sr.shape[-2:], mode='bicubic', align_corners=False)
        result['psnr'] = _psnr(sr, hq)
        result['ssim'] = _ssim(sr, hq)

    return result


def _save_uncertainty_map(uncertainty: torch.Tensor, path: str):
    """Lưu uncertainty map dưới dạng heatmap (ảnh màu)."""
    u = uncertainty.detach().cpu().squeeze().numpy()
    u = (u - u.min()) / (u.max() - u.min() + 1e-8)
    u = (np.clip(u * 255.0, 0, 255)).astype(np.uint8)
    Image.fromarray(u, mode='L').save(path)


def main():
    parser = argparse.ArgumentParser(description='CHARMS MRI Super-Resolution Inference')
    parser.add_argument('--input',  type=str, required=True, help='Path to low-res MRI image')
    parser.add_argument('--output', type=str, required=True, help='Path to save super-resolved image')
    parser.add_argument('--hq', type=str, default=None, help='Path to HQ ground truth (optional)')
    parser.add_argument('--checkpoint', type=str, default='best_model_200e.pth',
                        help='Path to model checkpoint')
    args = parser.parse_args()

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Device: {device}")

    model = load_model(args.checkpoint, device)
    lq    = load_image(args.input)
    hq    = load_image(args.hq) if args.hq else None
    print(f"Input:  {args.input}  ({lq.shape[2]}×{lq.shape[3]})")

    result = super_resolve(model, lq, device, hq)
    print(f"Output: {result['sr'].shape[2]}×{result['sr'].shape[3]}")
    print(f"Mean uncertainty: {result['mean_uncertainty']:.6f}")

    if result.get('psnr') is not None:
        print(f"PSNR: {result['psnr']:.2f} dB")
        print(f"SSIM: {result['ssim']:.4f}")

    save_image(result['sr'], args.output)
    _save_uncertainty_map(result['uncertainty'], args.output.replace('.png', '_uncertainty.png'))


if __name__ == '__main__':
    main()