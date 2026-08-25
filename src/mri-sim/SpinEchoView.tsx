import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "../components/ui/Card";
import { ParamSlider } from "../components/learning/ParamSlider";
import { RichText } from "../components/learning/RichText";
import { useT } from "../i18n/useT";
import { generatePhantom } from "./phantom";
import { spinEchoSignal } from "./signal";
import { classifyWeighting } from "../simulations/weighting";

const SIZE = 128; // phantom kích thước vuông
const DISPLAY = 384; // kích thước hiển thị canvas (CSS scale)
const GAMMA = 0.85; // gamma hiển thị cho dễ nhìn (không đổi tương phản)

/**
 * SpinEchoView — demo tương tác cho module MRI Simulator (bước 2).
 * 2 slider TR/TE, vẽ ảnh grayscale từ tín hiệu spin echo, cập nhật tức thời.
 */
export default function SpinEchoView() {
  const { t } = useT();
  const [tr, setTr] = useState(500);
  const [te, setTe] = useState(20);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Phantom cố định (chỉ tạo 1 lần) — chỉ tín hiệu đổi khi kéo slider.
  const phantom = useMemo(() => generatePhantom({ size: SIZE }), []);
  const signal = useMemo(() => spinEchoSignal(phantom, tr, te), [phantom, tr, te]);
  const weight = classifyWeighting(tr, te);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rows = signal.length;
    const cols = signal[0]?.length ?? 0;
    if (cols === 0) return;
    const img = ctx.createImageData(cols, rows);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = Math.max(0, Math.min(1, signal[r][c]));
        // Gamma hiển thị (windowing) — tăng độ sáng vùng tối, giữ tương phản.
        const g = Math.round(Math.pow(v, GAMMA) * 255);
        const idx = (r * cols + c) * 4;
        img.data[idx] = g;
        img.data[idx + 1] = g;
        img.data[idx + 2] = g;
        img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [signal]);

  return (
    <div
      className="container"
      style={{ padding: "var(--space-6) var(--space-5) var(--space-8)", display: "grid", gap: "var(--space-5)" }}
    >
      <Card>
        <p className="eyebrow">{t("mriSim.spin.eyebrow")}</p>
        <h1 style={{ fontSize: "1.5rem", marginTop: "var(--space-2)" }}>{t("mriSim.spin.title")}</h1>
        <p className="muted" style={{ maxWidth: "70ch" }}>
          <RichText text={t("mriSim.spin.intro")} />
        </p>
      </Card>

      <div
        className="lab-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 0.85fr) minmax(0, 1.15fr)",
          gap: "var(--space-4)",
          alignItems: "start",
        }}
      >
        <Card>
          <p className="eyebrow">{t("lab.controls")}</p>
          <div style={{ marginTop: "var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <ParamSlider id="tr" label="TR" unit="ms" min={50} max={3000} step={50} value={tr} onChange={setTr} />
            <ParamSlider id="te" label="TE" unit="ms" min={5} max={200} step={5} value={te} onChange={setTe} />
            <p className="mono" style={{ fontSize: "0.74rem", color: "var(--color-faint)" }}>
              {t("mriSim.spin.weightHint")}
            </p>
          </div>
        </Card>

        <Card>
          <p className="eyebrow">{t("mriSim.spin.imgEyebrow")}</p>
          <div style={{ marginTop: "var(--space-3)", display: "flex", justifyContent: "center" }}>
            <canvas
              ref={canvasRef}
              width={SIZE}
              height={SIZE}
              style={{
                width: DISPLAY,
                height: DISPLAY,
                imageRendering: "pixelated",
                border: "1px solid var(--color-line)",
                borderRadius: "var(--radius-sm)",
                background: "#000",
              }}
              aria-label={t("mriSim.spin.imgAria")}
            />
          </div>
          <p className="mono" style={{ fontSize: "0.74rem", color: "var(--color-faint)", marginTop: "var(--space-2)" }}>
            {t("mriSim.spin.readout", { tr, te, label: t("lesson9.sWeight"), weight })}
          </p>
        </Card>
      </div>

      <Card>
        <p className="eyebrow">{t("mriSim.spin.explainEyebrow")}</p>
        <div style={{ marginTop: "var(--space-2)", display: "grid", gap: "var(--space-3)", maxWidth: "78ch" }}>
          <p className="muted" style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>
            <RichText text={t("mriSim.spin.explain1")} />
          </p>
          <p className="muted" style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>
            <RichText text={t("mriSim.spin.explain2")} />
          </p>
          <p className="muted" style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>
            <RichText text={t("mriSim.spin.explain3")} />
          </p>
          <p className="muted" style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>
            <RichText text={t("mriSim.spin.explain4", { weight })} />
          </p>
        </div>
      </Card>
    </div>
  );
}
