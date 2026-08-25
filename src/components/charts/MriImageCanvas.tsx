import { useEffect, useRef } from "react";
import type { LocalizedString } from "../../i18n/types";
import { useT } from "../../i18n/useT";

export type SampleKind = "oil" | "water" | "cuso4" | "mixture";

export interface MriSample {
  kind: SampleKind;
  /** Tâm sample trong tọa độ chuẩn [0..1]. */
  cx: number;
  cy: number;
  /** Bán kính chuẩn [0..1] (so với nửa chiều nhỏ). */
  radius: number;
  /** Độ sáng [0..1]. */
  brightness: number;
  label?: LocalizedString;
}

interface MriImageCanvasProps {
  samples: MriSample[];
  /** FOV tương đối vô hướng (1 = vừa khung). Dùng khi không tách hướng. */
  fovScale?: number;
  /** FOV theo hướng Read (mã hoá tần số, ngang). Nhỏ → sample rộng ngang. Bài 8. */
  fovScaleX?: number;
  /** FOV theo hướng Phase (mã hoá pha, dọc). Nhỏ → sample cao dọc. Bài 8. */
  fovScaleY?: number;
  /** Vẽ chú thích mũi tên Read/Phase lên ảnh (Bài 8). */
  showFovAxes?: boolean;
  width?: number;
  height?: number;
  caption?: string;
}

/**
 * MriImageCanvas — vẽ ảnh MRI mô phỏng bằng Canvas 2D.
 * Dùng cho Bài 7 (ảnh mẫu sau prescan), Bài 8 (FOV), Bài 9 (trọng số brightness).
 * Nền tối + sample dạng oval/tròn, độ sáng = grayscale.
 *
 * FOV hướng: khi có `fovScaleX`/`fovScaleY`, sample vẽ thành ellipse với
 * rx theo Read (ngang) và ry theo Phase (dọc) — giảm FOV Read làm sample rộng
 * ngang, giảm FOV Phase làm sample cao dọc.
 */
export function MriImageCanvas({
  samples,
  fovScale = 1,
  fovScaleX,
  fovScaleY,
  showFovAxes = false,
  width = 420,
  height = 300,
  caption,
}: MriImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t, tr, locale } = useT();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Nền ảnh MRI: tối, hơi gradient.
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, "#0a1622");
    bg.addColorStop(1, "#050b14");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Lưới mảnh.
    ctx.strokeStyle = "rgba(234,246,248,0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // FOV: nhỏ hơn → sample phóng to trong khung (chiếm nhiều diện tích hơn).
    const scaleX = fovScaleX !== undefined ? 1 / Math.max(0.2, fovScaleX) : 1 / Math.max(0.2, fovScale);
    const scaleY = fovScaleY !== undefined ? 1 / Math.max(0.2, fovScaleY) : 1 / Math.max(0.2, fovScale);
    const half = Math.min(width, height) / 2;

    for (const s of samples) {
      const cx = s.cx * width;
      const cy = s.cy * height;
      const rx = s.radius * half * scaleX * 1.2;
      const ry = s.radius * half * scaleY * 1.2;
      const g = Math.max(0, Math.min(1, s.brightness));
      const gray = Math.round(40 + g * 200);
      const grad = ctx.createRadialGradient(cx, cy, Math.min(rx, ry) * 0.1, cx, cy, Math.max(rx, ry));
      grad.addColorStop(0, `rgba(${gray},${gray},${gray},0.98)`);
      grad.addColorStop(0.8, `rgba(${gray},${Math.max(0, gray - 30)},${Math.max(0, gray - 50)},0.9)`);
      grad.addColorStop(1, "rgba(10,20,30,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(2, rx), Math.max(2, ry * 0.82), 0, 0, Math.PI * 2);
      ctx.fill();

      if (s.label) {
        ctx.fillStyle = "rgba(234,246,248,0.7)";
        ctx.font = "11px 'IBM Plex Mono', monospace";
        ctx.fillText(tr(s.label), cx - rx, cy + ry + 14);
      }
    }

    // Hộp legend hướng Read (ngang) / Phase (dọc) — góc trên trái, gọn để
    // không ăn vào sample và không mất chữ.
    if (showFovAxes) {
      ctx.save();
      const boxX = 8;
      const boxY = 8;
      const boxW = 92;
      const boxH = 44;
      ctx.fillStyle = "rgba(7,17,31,0.78)";
      ctx.strokeStyle = "rgba(234,246,248,0.18)";
      ctx.lineWidth = 1;
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.strokeRect(boxX, boxY, boxW, boxH);
      ctx.font = "11px 'IBM Plex Mono', monospace";
      // Read (x): mũi tên ngang cyan.
      const ax0 = boxX + 8;
      const ax1 = boxX + 30;
      const ay = boxY + 16;
      ctx.strokeStyle = "rgba(55,215,232,0.95)";
      ctx.fillStyle = "rgba(55,215,232,0.95)";
      ctx.beginPath();
      ctx.moveTo(ax0, ay);
      ctx.lineTo(ax1, ay);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ax1, ay);
      ctx.lineTo(ax1 - 5, ay - 3);
      ctx.lineTo(ax1 - 5, ay + 3);
      ctx.fill();
      ctx.fillText("Read (x)", ax1 + 6, ay + 4);
      // Phase (y): mũi tên dọc amber.
      const px = boxX + 16;
      const py0 = boxY + 26;
      const py1 = boxY + 38;
      ctx.strokeStyle = "rgba(242,184,75,0.95)";
      ctx.fillStyle = "rgba(242,184,75,0.95)";
      ctx.beginPath();
      ctx.moveTo(px, py0);
      ctx.lineTo(px, py1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px, py0);
      ctx.lineTo(px - 3, py0 + 5);
      ctx.lineTo(px + 3, py0 + 5);
      ctx.fill();
      ctx.fillText("Phase (y)", px + 8, py0 + 10);
      ctx.restore();
    }
  }, [samples, fovScale, fovScaleX, fovScaleY, showFovAxes, width, height, locale, tr]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: "100%",
          maxWidth: width,
          height: "auto",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--color-line)",
          display: "block",
          margin: "0 auto",
        }}
        aria-label={caption ?? t("mri.defaultAria")}
      />
      {caption && (
        <p className="mono" style={{ fontSize: "0.74rem", color: "var(--color-faint)", marginTop: "var(--space-2)" }}>
          {caption}
        </p>
      )}
    </div>
  );
}
