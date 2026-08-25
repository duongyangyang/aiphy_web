import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { RichText } from "../components/learning/RichText";
import { useT } from "../i18n/useT";
import { generatePhantom } from "./phantom";
import { spinEchoSignal } from "./signal";
import {
  fft2d,
  fftshiftFlat,
  ifftshiftFlat,
  kspaceMagnitude,
} from "./fft";

const N = 128; // phantom vuông, lũy thừa 2 để FFT
const DISPLAY = 256; // kích thước hiển thị canvas
const GAMMA = 0.85;

type Mask = Uint8Array; // N*N: 1 = giữ, 0 = xoá (tọa độ đã shift, tâm giữa)

interface DragState {
  r0: number;
  c0: number;
  r1: number;
  c1: number;
  active: boolean;
}

/**
 * KSpaceView — bước 3: mô phỏng k-space.
 * Ảnh tín hiệu → FFT 2D → k-space (hiển thị biên độ log, tâm giữa) → mask
 * bằng cách kéo chuột xoá vùng → IFFT 2D → ảnh tái tạo. So sánh ảnh gốc
 * và ảnh sau khi xoá tần số.
 */
export default function KSpaceView() {
  const { t } = useT();
  // Ảnh gốc (spin echo, T2WI cho CSF sáng — k-space phong phú).
  const phantom = useMemo(() => generatePhantom({ size: N }), []);
  const signal = useMemo(() => spinEchoSignal(phantom, 2000, 80), [phantom]);

  // k-space gốc (đã shift tâm giữa).
  const kspace = useMemo(() => {
    const re = new Float64Array(N * N);
    const im = new Float64Array(N * N);
    let idx = 0;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) re[idx++] = signal[r][c];
    fft2d(re, im, N, false);
    const reS = fftshiftFlat(re, N);
    const imS = fftshiftFlat(im, N);
    const mag = kspaceMagnitude(reS, imS, N);
    return { reS, imS, mag };
  }, [signal]);

  // Mask (trạng thái). Khởi tạo toàn giữ.
  const [mask, setMask] = useState<Mask>(() => {
    const m = new Uint8Array(N * N);
    m.fill(1);
    return m;
  });
  const [drag, setDrag] = useState<DragState | null>(null);

  // Áp mask rồi IFFT → ảnh tái tạo.
  const reconstructed = useMemo(() => {
    const reS = new Float64Array(N * N);
    const imS = new Float64Array(N * N);
    for (let i = 0; i < N * N; i++) {
      if (mask[i]) {
        reS[i] = kspace.reS[i];
        imS[i] = kspace.imS[i];
      }
    }
    const re = ifftshiftFlat(reS, N);
    const im = ifftshiftFlat(imS, N);
    fft2d(re, im, N, true);
    // Lấy phần thực.
    const out = new Float64Array(N * N);
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < N * N; i++) {
      const v = re[i];
      out[i] = v;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    // Chuẩn hoá về [0,1] (ảnh thật thì min~0, nhưng mask có thể tạo offset).
    const range = max - min || 1;
    for (let i =  0; i < N * N; i++) out[i] = (out[i] - min) / range;
    return out;
  }, [kspace, mask]);

  // Vẽ 3 canvas.
  const origRef = useRef<HTMLCanvasElement>(null);
  const kRef = useRef<HTMLCanvasElement>(null);
  const reconRef = useRef<HTMLCanvasElement>(null);

  // Ảnh gốc.
  useEffect(() => {
    const canvas = origRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(N, N);
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const v = Math.max(0, Math.min(1, signal[r][c]));
        const g = Math.round(Math.pow(v, GAMMA) * 255);
        const idx = (r * N + c) * 4;
        img.data[idx] = g;
        img.data[idx + 1] = g;
        img.data[idx + 2] = g;
        img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [signal]);

  // k-space + ô kéo.
  useEffect(() => {
    const canvas = kRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(N, N);
    for (let i = 0; i < N * N; i++) {
      const v = kspace.mag[i];
      const kept = mask[i] === 1;
      const g = Math.round(Math.pow(v, 0.9) * 255);
      const idx = i * 4;
      // Vùng bị xoá: làm tối + hơi đỏ để phân biệt.
      img.data[idx] = kept ? g : Math.round(g * 0.25);
      img.data[idx + 1] = kept ? g : Math.round(g * 0.12);
      img.data[idx + 2] = kept ? g : Math.round(g * 0.12);
      img.data[idx + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    // Vẽ ô đang kéo.
    if (drag && drag.active) {
      const x0 = Math.min(drag.c0, drag.c1);
      const x1 = Math.max(drag.c0, drag.c1);
      const y0 = Math.min(drag.r0, drag.r1);
      const y1 = Math.max(drag.r0, drag.r1);
      const scale = N; // canvas nội bộ = N
      ctx.strokeStyle = "rgba(242,184,75,0.95)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0));
      // (scale chỉ để rõ: canvas nội bộ là N×N, vẽ theo tọa độ pixel)
      void scale;
    }
  }, [kspace, mask, drag]);

  // Ảnh tái tạo.
  useEffect(() => {
    const canvas = reconRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(N, N);
    for (let i = 0; i < N * N; i++) {
      const v = Math.max(0, Math.min(1, reconstructed[i]));
      const g = Math.round(Math.pow(v, GAMMA) * 255);
      const idx = i * 4;
      img.data[idx] = g;
      img.data[idx + 1] = g;
      img.data[idx + 2] = g;
      img.data[idx + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [reconstructed]);

  // Chuyển toạ độ chuột → chỉ số k-space.
  const toCell = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = kRef.current;
    if (!canvas) return { r: 0, c: 0 };
    const rect = canvas.getBoundingClientRect();
    const c = Math.floor(((e.clientX - rect.left) / rect.width) * N);
    const r = Math.floor(((e.clientY - rect.top) / rect.height) * N);
    return { r: Math.max(0, Math.min(N - 1, r)), c: Math.max(0, Math.min(N - 1, c)) };
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { r, c } = toCell(e);
    setDrag({ r0: r, c0: c, r1: r, c1: c, active: true });
  };
  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drag?.active) return;
    const { r, c } = toCell(e);
    setDrag({ ...drag, r1: r, c1: c });
  };
  const onMouseUp = () => {
    if (!drag?.active) return;
    const r0 = Math.min(drag.r0, drag.r1);
    const r1 = Math.max(drag.r0, drag.r1);
    const c0 = Math.min(drag.c0, drag.c1);
    const c1 = Math.max(drag.c0, drag.c1);
    setMask((prev) => {
      const m = new Uint8Array(prev);
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) m[r * N + c] = 0;
      return m;
    });
    setDrag(null);
  };

  // Preset: xoá biên (chỉ giữ tâm).
  const eraseEdges = (centerHalf: number) => {
    const c = N / 2;
    const lo = Math.round(c - centerHalf / 2);
    const hi = Math.round(c + centerHalf / 2);
    setMask(() => {
      const m = new Uint8Array(N * N);
      for (let r = 0; r < N; r++) for (let col = 0; col < N; col++) {
        m[r * N + col] = r >= lo && r <= hi && col >= lo && col <= hi ? 1 : 0;
      }
      return m;
    });
  };
  // Preset: xoá tâm (giữ biên).
  const eraseCenter = (centerHalf: number) => {
    const c = N / 2;
    const lo = Math.round(c - centerHalf / 2);
    const hi = Math.round(c + centerHalf / 2);
    setMask((prev) => {
      const m = new Uint8Array(N * N); // reset: toàn giữ rồi xoá tâm
      m.fill(1);
      for (let r = lo; r <= hi; r++) for (let col = lo; col <= hi; col++) m[r * N + col] = 0;
      void prev;
      return m;
    });
  };
  const restoreAll = () => {
    const m = new Uint8Array(N * N);
    m.fill(1);
    setMask(m);
  };

  const keptRatio = useMemo(() => {
    let k = 0;
    for (let i = 0; i < mask.length; i++) if (mask[i]) k++;
    return k / (N * N);
  }, [mask]);

  return (
    <div
      className="container"
      style={{ padding: "var(--space-6) var(--space-5) var(--space-8)", display: "grid", gap: "var(--space-5)" }}
    >
      <Card>
        <p className="eyebrow">{t("mriSim.kspace.eyebrow")}</p>
        <h1 style={{ fontSize: "1.5rem", marginTop: "var(--space-2)" }}>{t("mriSim.kspace.title")}</h1>
        <p className="muted" style={{ maxWidth: "72ch" }}>
          <RichText text={t("mriSim.kspace.intro")} />
        </p>
      </Card>

      <div className="lab-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "var(--space-4)", alignItems: "start" }}>
        <CanvasCard label={t("mriSim.kspace.origLabel")}>
          <canvas ref={origRef} width={N} height={N} style={canvasStyle()} aria-label={t("mriSim.kspace.origAria")} />
        </CanvasCard>
        <CanvasCard label={t("mriSim.kspace.kspaceLabel")}>
          <canvas
            ref={kRef}
            width={N}
            height={N}
            style={{ ...canvasStyle(), cursor: "crosshair" }}
            aria-label="k-space"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          />
        </CanvasCard>
        <CanvasCard label={t("mriSim.kspace.reconLabel")}>
          <canvas ref={reconRef} width={N} height={N} style={canvasStyle()} aria-label={t("mriSim.kspace.reconAria")} />
        </CanvasCard>
      </div>

      <Card>
        <p className="eyebrow">{t("mriSim.kspace.toolsEyebrow")}</p>
        <div style={{ marginTop: "var(--space-3)", display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
          <Button variant="secondary" size="sm" onClick={() => eraseEdges(48)}>{t("mriSim.kspace.eraseEdges48")}</Button>
          <Button variant="secondary" size="sm" onClick={() => eraseEdges(24)}>{t("mriSim.kspace.eraseEdges24")}</Button>
          <Button variant="secondary" size="sm" onClick={() => eraseCenter(24)}>{t("mriSim.kspace.eraseCenter24")}</Button>
          <Button variant="secondary" size="sm" onClick={() => eraseCenter(48)}>{t("mriSim.kspace.eraseCenter48")}</Button>
          <Button variant="ghost" size="sm" onClick={restoreAll}>{t("mriSim.kspace.restore")}</Button>
          <span className="mono" style={{ fontSize: "0.74rem", color: "var(--color-faint)", marginLeft: "auto" }}>
            {t("mriSim.kspace.keptRatio", { pct: (keptRatio * 100).toFixed(1) })}
          </span>
        </div>
        <p className="mono" style={{ fontSize: "0.74rem", color: "var(--color-faint)", marginTop: "var(--space-3)" }}>
          {t("mriSim.kspace.tip")}
        </p>
      </Card>

      <Card>
        <p className="eyebrow">{t("mriSim.kspace.explainEyebrow")}</p>
        <div style={{ marginTop: "var(--space-2)", display: "grid", gap: "var(--space-3)", maxWidth: "80ch" }}>
          <p className="muted" style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>
            <RichText text={t("mriSim.kspace.explain1")} />
          </p>
          <p className="muted" style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>
            <RichText text={t("mriSim.kspace.explain2")} />
          </p>
          <p className="muted" style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>
            <RichText text={t("mriSim.kspace.explain3")} />
          </p>
        </div>
      </Card>
    </div>
  );
}

function canvasStyle(): React.CSSProperties {
  return {
    width: DISPLAY,
    height: DISPLAY,
    imageRendering: "pixelated",
    border: "1px solid var(--color-line)",
    borderRadius: "var(--radius-sm)",
    background: "#000",
    display: "block",
    margin: "0 auto",
  };
}

function CanvasCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card>
      <p className="eyebrow">{label}</p>
      <div style={{ marginTop: "var(--space-3)" }}>{children}</div>
    </Card>
  );
}
