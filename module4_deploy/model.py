"""
CHARMS-Lite: CNN-Transformer Hybrid for MRI Super-Resolution
Paper: Sensors 2026, 26, 738 — Li et al.

Lightweight version tối ưu cho inference:
  - ESA_Lite     : depthwise 5×5 thay pool + 2 dilated conv
  - RLFE_Lite    : 2 conv block thay 3
  - PCA_Lite     : bỏ 1×1Conv thừa
  - HFIR_Lite    : 2 DSConv thay 4
  - Single upsampling branch thay dual

Interface: CHARMS_Lite(in_channels=1, out_channels=1, base_channels=64,
                        n_rraf=4, n_rlfe=4, n_mddta_heads=4, scale=2)
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


# ── Helper ──
def default_conv(in_channels, out_channels, kernel_size,
                 stride=1, padding=None, bias=True, groups=1):
    if padding is None and stride == 1:
        padding = kernel_size // 2
    return nn.Conv2d(in_channels, out_channels, kernel_size,
                     stride=stride, padding=padding, bias=bias, groups=groups)


# ── ESA_Lite ──
class ESA_Lite(nn.Module):
    def __init__(self, in_channels, conv=default_conv):
        super().__init__()
        f = in_channels // 4
        self.c_down  = conv(in_channels, f, kernel_size=1)
        self.dw      = nn.Conv2d(f, f, kernel_size=5, padding=2, groups=f, bias=False)
        self.c_up    = conv(f, in_channels, kernel_size=1)
        self.sigmoid = nn.Sigmoid()
        self.relu    = nn.ReLU(inplace=True)

    def forward(self, x, feat):
        c    = self.relu(self.dw(self.c_down(feat)))
        mask = self.sigmoid(self.c_up(c))
        return x * mask + x * 0.1


# ── RLFE_Lite ──
class RLFE_Lite(nn.Module):
    def __init__(self, in_channels=64, out_channels=64, conv=default_conv):
        super().__init__()
        self.conv_block1 = nn.Sequential(
            conv(in_channels,  out_channels, kernel_size=3), nn.ReLU(inplace=True))
        self.conv_block2 = nn.Sequential(
            conv(out_channels, out_channels, kernel_size=3), nn.ReLU(inplace=True))
        self.shortcut = (conv(in_channels, out_channels, kernel_size=1)
                         if in_channels != out_channels else nn.Identity())
        self.esa = ESA_Lite(in_channels=out_channels, conv=conv)

    def forward(self, x, feat):
        c = self.conv_block2(self.conv_block1(feat))
        c = c + self.shortcut(x)
        return self.esa(c, c)


# ── ChannelShuffle ──
class ChannelShuffle(nn.Module):
    def __init__(self, groups=4):
        super().__init__()
        self.groups = groups

    def forward(self, x):
        B, C, H, W = x.shape
        g = self.groups
        assert C % g == 0, f"C={C} not divisible by groups={g}"
        return (x.view(B, g, C // g, H, W)
                 .transpose(1, 2).contiguous()
                 .view(B, C, H, W))


# ── PCA_Lite ──
class PCA_Lite(nn.Module):
    def __init__(self, in_channels, conv=default_conv):
        super().__init__()
        self.pa_conv  = conv(in_channels, in_channels, kernel_size=1)
        self.sca_pool = nn.AdaptiveAvgPool2d(1)
        self.sca_conv = conv(in_channels, in_channels, kernel_size=1)
        self.aux_conv = conv(in_channels, in_channels, kernel_size=3)
        self.sigmoid  = nn.Sigmoid()

    def forward(self, x):
        ap    = self.sigmoid(self.pa_conv(x))
        ac    = self.sigmoid(self.sca_conv(self.sca_pool(x)))
        a_pca = self.sigmoid(ap + ac)
        return a_pca * self.aux_conv(x)


# ── RRAF_Lite ──
class RRAF_Lite(nn.Module):
    def __init__(self, in_channels=64, n_rlfe=4, conv=default_conv):
        super().__init__()
        C = in_channels
        self.rlfe_blocks = nn.ModuleList(
            [RLFE_Lite(in_channels=C, out_channels=C, conv=conv) for _ in range(n_rlfe)])
        self.shuffle  = ChannelShuffle(groups=4)
        self.pca      = PCA_Lite(in_channels=C, conv=conv)
        self.out_conv = conv(C, C, kernel_size=1)

    def forward(self, x):
        f_prev = x
        acc    = x
        for rlfe in self.rlfe_blocks:
            f_k = rlfe(f_prev, f_prev)
            acc = acc + f_k
            f_prev = f_k
        acc = self.shuffle(acc)
        out = self.pca(acc)
        return self.out_conv(out) + x


# ── MDDTA (Multi-Depthwise Dilated Transformer Attention) ──
class MDDTAHead(nn.Module):
    def __init__(self, in_channels, dilation=1):
        super().__init__()
        self.dw_q = nn.Conv2d(in_channels, in_channels, kernel_size=3,
                              padding=dilation, dilation=dilation,
                              groups=in_channels, bias=False)
        self.dw_k = nn.Conv2d(in_channels, in_channels, kernel_size=3,
                              padding=dilation, dilation=dilation,
                              groups=in_channels, bias=False)
        self.dw_v = nn.Conv2d(in_channels, in_channels, kernel_size=3,
                              padding=dilation, dilation=dilation,
                              groups=in_channels, bias=False)

    @staticmethod
    def _elu_feature_map(x):
        return F.elu(x) + 1.0

    def forward(self, x):
        B, C, H, W = x.shape
        Q = self.dw_q(x).flatten(2).transpose(1, 2)
        K = self.dw_k(x).flatten(2).transpose(1, 2)
        V = self.dw_v(x).flatten(2).transpose(1, 2)
        Q = self._elu_feature_map(Q)
        K = self._elu_feature_map(K)
        KV    = torch.bmm(K.transpose(1, 2), V)
        out   = torch.bmm(Q, KV)
        denom = torch.bmm(Q, K.sum(dim=1, keepdim=True).transpose(1, 2))
        out   = out / (denom + 1e-6)
        return out.transpose(1, 2).view(B, C, H, W)


class MDDTA(nn.Module):
    def __init__(self, in_channels=64, num_heads=4):
        super().__init__()
        self.heads   = nn.ModuleList([
            MDDTAHead(in_channels, dilation=i + 1) for i in range(num_heads)])
        self.weights = nn.Parameter(torch.ones(num_heads) / num_heads)
        self.norm    = nn.LayerNorm(in_channels)
        self.proj    = nn.Conv2d(in_channels, in_channels, kernel_size=1)

    def forward(self, x):
        B, C, H, W = x.shape
        x_flat = x.flatten(2).transpose(1, 2).contiguous()
        x_norm = self.norm(x_flat).transpose(1, 2).view(B, C, H, W)
        w   = torch.softmax(self.weights, dim=0)
        out = sum(w[i] * self.heads[i](x_norm) for i in range(len(self.heads)))
        return self.proj(out) + x_norm


# ── GDDFN ──
class GDDFN(nn.Module):
    def __init__(self, in_channels=64, expansion=2, dilation=2):
        super().__init__()
        mid = in_channels * expansion
        self.norm   = nn.LayerNorm(in_channels)
        self.pw_in  = nn.Conv2d(in_channels, mid * 2, kernel_size=1)
        self.dw1    = nn.Conv2d(mid, mid, kernel_size=3,
                                padding=dilation, dilation=dilation, groups=mid)
        self.dw2    = nn.Conv2d(mid, mid, kernel_size=3,
                                padding=dilation, dilation=dilation, groups=mid)
        self.pw_out = nn.Conv2d(mid, in_channels, kernel_size=1)
        self.act    = nn.GELU()

    def forward(self, x):
        B, C, H, W = x.shape
        xn = x.flatten(2).transpose(1, 2).contiguous()
        xn = self.norm(xn).transpose(1, 2).view(B, C, H, W)
        xn = self.pw_in(xn)
        f1, f2 = xn.chunk(2, dim=1)
        out = self.act(self.dw1(f1)) * self.dw2(f2)
        return self.pw_out(out) + x


# ── HFIR_Lite ──
class DepthwiseSeparableConv(nn.Module):
    def __init__(self, in_channels, out_channels):
        super().__init__()
        self.dw   = nn.Conv2d(in_channels, in_channels, kernel_size=3,
                              padding=1, groups=in_channels, bias=False)
        self.pw   = nn.Conv2d(in_channels, out_channels, kernel_size=1, bias=False)
        self.bn   = nn.BatchNorm2d(out_channels)
        self.relu = nn.ReLU(inplace=True)

    def forward(self, x):
        return self.relu(self.bn(self.pw(self.dw(x))))


class HFIR_Lite(nn.Module):
    def __init__(self, in_channels=1):
        super().__init__()
        self.ds_stack = nn.Sequential(
            DepthwiseSeparableConv(in_channels, in_channels),
            DepthwiseSeparableConv(in_channels, in_channels),
        )
        self.sigmoid  = nn.Sigmoid()
        self.out_conv = nn.Conv2d(in_channels, in_channels, kernel_size=3, padding=1)

    def forward(self, u_fout):
        mask    = self.sigmoid(self.ds_stack(u_fout))
        refined = u_fout * mask
        return self.out_conv(refined)


# ── CHARMS_Lite ──
class CHARMS_Lite(nn.Module):
    def __init__(self, in_channels=1, out_channels=1, base_channels=64,
                 n_rraf=4, n_rlfe=4, n_mddta_heads=4, scale=2,
                 conv=default_conv):
        super().__init__()
        C = base_channels
        self.scale = scale

        # Block 1: Deep Feature Extraction
        self.head_conv = conv(in_channels, C, kernel_size=3)
        self.rraf_blocks = nn.ModuleList(
            [RRAF_Lite(in_channels=C, n_rlfe=n_rlfe, conv=conv) for _ in range(n_rraf)])
        self.mddta  = MDDTA(in_channels=C, num_heads=n_mddta_heads)
        self.gddfn  = GDDFN(in_channels=C)
        self.pre_up = conv(C, C, kernel_size=3)

        # Block 2: Single Upsampling Branch
        self.up_conv    = conv(C, out_channels * (scale ** 2), kernel_size=3)
        self.pixel_shuf = nn.PixelShuffle(scale)

        # Block 3: High-Frequency Refinement
        self.hfir = HFIR_Lite(in_channels=out_channels)

    def forward(self, x):
        # Block 1
        f0 = self.head_conv(x)
        fn = f0
        for rraf in self.rraf_blocks:
            fn = rraf(fn)
        ft       = self.mddta(fn)
        f_fusion = self.gddfn(ft)
        f_fusion = self.pre_up(f_fusion) + f0

        # Block 2
        i_sr = self.pixel_shuf(self.up_conv(f_fusion))

        # Block 3
        i_rsr = self.hfir(i_sr)

        # Global residual
        i_rsr = i_rsr + F.interpolate(
            x, scale_factor=self.scale, mode='bilinear', align_corners=False)

        return i_rsr