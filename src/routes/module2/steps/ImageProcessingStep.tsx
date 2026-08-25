import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "../../../components/ui/Card";
import { Modal } from "../../../components/ui/Modal";
import { ParamSliderField } from "./ParamField";
import { useModule2Store } from "../../../stores/module2Store";
import type { ScanResult, ScanResultDisplay } from "../../../stores/module2Store";
import { drawGrayscale, drawColormapped } from "../../../mri-sim/canvas";
import {
  denoiseImage,
  windowImage,
} from "../../../simulations/module2/scanReconstruct";
import {
  COLORMAPS,
  COLORMAP_LABELS,
  type ColormapName,
} from "../../../mri-sim/colormap";
import { useT } from "../../../i18n/useT";

/**
 * ImageProcessingStep — bước 4: hiển thị lưới ScanResult theo layout cố định
 * (raw · 1×1 · 2×4 · 3×6 là cấu hình grid hiển thị, không phụ thuộc số ảnh).
 * Ô nào không có ảnh để trống.
 *
 * KHÔNG còn block "Bộ lọc & cửa sổ hiển thị" cố định. Mỗi ô có nút "Xử lý ảnh"
 * mở modal riêng: chỉnh WW/WL (có tooltip giải thích) + chọn colormap, xem
 * preview live, rồi "Áp dụng" lưu vào `ScanResult.display` (hoặc "Đóng" bỏ).
 * Colormap áp khi vẽ ảnh Filtered — đổi dropdown vẽ lại ngay, không tính lại
 * pipeline khử nhiễu.
 *
 * Khử nhiễu (denoiseImage) vẫn tính theo blockSize/searchSize mặc định từ
 * processingParams, memo theo image + 2 size; ảnh gốc trong store không bị sửa.
 */

type Layout = { rows: number; cols: number; label: string };
const LAYOUTS: Layout[] = [
  { rows: 1, cols: 1, label: "1×1" },
  { rows: 2, cols: 4, label: "2×4" },
  { rows: 3, cols: 6, label: "3×6" },
];

const LAYOUT_BUTTON_STYLE = (active: boolean): React.CSSProperties => ({
  padding: "8px 14px",
  minHeight: 38,
  fontFamily: "var(--font-data)",
  fontSize: "0.8rem",
  color: active ? "#06222b" : "var(--color-paper)",
  background: active
    ? "linear-gradient(180deg, var(--color-proton-cyan), #2bb9c9)"
    : "transparent",
  border: active
    ? "1px solid var(--color-proton-cyan)"
    : "1px solid var(--color-line-strong)",
  borderRadius: 999,
  cursor: "pointer",
});

export function ImageProcessingStep() {
  const { t } = useT();
  const scanResults = useModule2Store((s) => s.scanResults);
  const [layout, setLayout] = useState<Layout>(LAYOUTS[1]);

  if (scanResults.length === 0) {
    return (
      <Card>
        <p className="eyebrow">Image processing</p>
        <p className="mono" style={{ fontSize: "0.85rem", color: "var(--color-faint)", marginTop: "var(--space-3)" }}>
          {t("img.empty")}
        </p>
      </Card>
    );
  }

  const slots = layout.rows * layout.cols;

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      {/* Thanh công cụ gọn: chỉ chọn layout grid hiển thị */}
      <Card style={{ padding: "var(--space-4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <div>
            <p className="eyebrow">{t("img.gridEyebrow")}</p>
            <p className="mono" style={{ fontSize: "0.74rem", color: "var(--color-faint)", marginTop: "var(--space-1)" }}>
              {t("img.gridSummary", { rows: layout.rows, cols: layout.cols, slots, n: scanResults.length })}
            </p>
          </div>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            {LAYOUTS.map((l) => (
              <button
                key={l.label}
                type="button"
                onClick={() => setLayout(l)}
                className="mono"
                style={LAYOUT_BUTTON_STYLE(layout.label === l.label)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Lưới ảnh cố định theo layout; ô thừa để trống */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))`,
          gap: "var(--space-3)",
        }}
      >
        {Array.from({ length: slots }).map((_, i) => {
          const r = scanResults[i];
          if (!r) return <EmptyTile key={`empty-${i}`} index={i} />;
          return <ResultTile key={r.id} result={r} />;
        })}
      </div>

      </div>
  );
}

/** Ô trống: giữ chỗ theo layout, không có ảnh. */
function EmptyTile({ index }: { index: number }) {
  const { t } = useT();
  return (
    <Card style={{ padding: "var(--space-3)" }}>
      <div
        style={{
          aspectRatio: "1 / 1",
          borderRadius: "var(--radius-sm)",
          border: "1px dashed var(--color-line)",
          background: "rgba(0,0,0,0.25)",
          display: "grid",
          placeItems: "center",
        }}
        aria-label={t("img.emptyTileAria", { n: index + 1 })}
      >
        <span className="mono" style={{ fontSize: "0.62rem", color: "var(--color-faint)" }}>
          {t("img.emptyLabel")}
        </span>
      </div>
    </Card>
  );
}

/** Một ô ảnh: raw + filtered (theo display riêng nếu có) + nút "Xử lý ảnh". */
function ResultTile({ result }: { result: ScanResult }) {
  const { t } = useT();
  const processingParams = useModule2Store((s) => s.processingParams);
  const setScanResultDisplay = useModule2Store((s) => s.setScanResultDisplay);
  const [modalOpen, setModalOpen] = useState(false);

  const rawRef = useRef<HTMLCanvasElement>(null);
  const filteredRef = useRef<HTMLCanvasElement>(null);

  // Khử nhiễu (memo theo image + 2 size mặc định); ảnh gốc không đổi.
  const filtered = useMemo(
    () => denoiseImage(result.image, processingParams.blockSize, processingParams.searchSize),
    [result.image, processingParams.blockSize, processingParams.searchSize],
  );

  // Thiết lập hiển thị: display riêng của ô nếu có, ngược lại mặc định store.
  const display: ScanResultDisplay = result.display ?? {
    ww: processingParams.ww,
    wl: processingParams.wl,
    colormap: processingParams.colormap,
  };

  const rawWindowed = useMemo(
    () => windowImage(result.image, display.ww, display.wl),
    [result.image, display.ww, display.wl],
  );
  const filteredWindowed = useMemo(
    () => windowImage(filtered, display.ww, display.wl),
    [filtered, display.ww, display.wl],
  );

  useEffect(() => {
    drawGrayscale(rawRef.current, rawWindowed);
  }, [rawWindowed]);
  useEffect(() => {
    drawColormapped(filteredRef.current, filteredWindowed, display.colormap);
  }, [filteredWindowed, display.colormap]);

  const seq = result.snapshot.sequence;
  const st = result.snapshot.sliceThickness;
  const seqLabel = seq === "FLAIR" ? "FLAIR" : seq === "TSE" ? "T2 TSE" : "T1 SE";

  return (
    <Card style={{ padding: "var(--space-3)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
        <TileCanvas label="Raw" canvasRef={rawRef} />
        <TileCanvas label="Filtered" canvasRef={filteredRef} />
      </div>
      <div className="mono" style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--space-2)", fontSize: "0.66rem", color: "var(--color-muted)" }}>
        <span>{seqLabel}</span>
        <span>ST {st}mm</span>
        <span>WW {display.ww.toFixed(2)} · WL {display.wl.toFixed(2)}</span>
      </div>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="mono"
        style={{
          marginTop: "var(--space-2)",
          width: "100%",
          padding: "8px 12px",
          minHeight: 36,
          fontFamily: "var(--font-data)",
          fontSize: "0.74rem",
          color: "var(--color-proton-cyan)",
          background: "transparent",
          border: "1px solid var(--color-line-strong)",
          borderRadius: "var(--radius-sm)",
          cursor: "pointer",
        }}
      >
        {t("img.processBtn")}
      </button>
      <ImageProcessingModal
        open={modalOpen}
        result={result}
        filtered={filtered}
        onClose={() => setModalOpen(false)}
        onApply={(d) => {
          setScanResultDisplay(result.id, d);
          setModalOpen(false);
        }}
      />
    </Card>
  );
}

function TileCanvas({ label, canvasRef }: { label: string; canvasRef: React.RefObject<HTMLCanvasElement> }) {
  return (
    <div style={{ display: "grid", gap: 2 }}>
      <div style={{ aspectRatio: "1 / 1", borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid var(--color-line)", background: "#000" }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", imageRendering: "pixelated" }} aria-label={label} />
      </div>
      <span className="mono" style={{ fontSize: "0.62rem", color: "var(--color-faint)", textAlign: "center" }}>{label}</span>
    </div>
  );
}

/**
 * ImageProcessingModal — modal xử lý ảnh cho 1 ô. Chỉnh WW/WL + colormap, xem
 * preview filtered live; "Áp dụng" lưu display, "Đóng" bỏ không lưu.
 */
function ImageProcessingModal({
  open,
  result,
  filtered,
  onClose,
  onApply,
}: {
  open: boolean;
  result: ScanResult;
  filtered: number[][];
  onClose: () => void;
  onApply: (display: ScanResultDisplay) => void;
}) {
  const processingParams = useModule2Store((s) => s.processingParams);
  const { t } = useT();
  // Draft hiển thị: khởi tạo từ display riêng của ô (nếu có) hoặc mặc định store.
  const [ww, setWw] = useState(result.display?.ww ?? processingParams.ww);
  const [wl, setWl] = useState(result.display?.wl ?? processingParams.wl);
  const [colormap, setColormap] = useState<ColormapName>(result.display?.colormap ?? processingParams.colormap);

  const previewRef = useRef<HTMLCanvasElement>(null);

  // Khi mở lại cho ô khác / cùng ô, đồng bộ draft theo display hiện tại.
  useEffect(() => {
    if (!open) return;
    setWw(result.display?.ww ?? processingParams.ww);
    setWl(result.display?.wl ?? processingParams.wl);
    setColormap(result.display?.colormap ?? processingParams.colormap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, result.id]);

  const previewWindowed = useMemo(() => windowImage(filtered, ww, wl), [filtered, ww, wl]);
  useEffect(() => {
    if (open) drawColormapped(previewRef.current, previewWindowed, colormap);
  }, [open, previewWindowed, colormap]);

  const seqLabel =
    result.snapshot.sequence === "FLAIR"
      ? "FLAIR"
      : result.snapshot.sequence === "TSE"
        ? "T2 TSE"
        : "T1 SE";

  return (
    <Modal open={open} onClose={onClose} labelledBy="ip-modal-title">
      <p id="ip-modal-title" className="eyebrow" style={{ marginBottom: "var(--space-1)" }}>
        {t("img.modalTitle", { n: result.index + 1 })}
      </p>
      <p className="mono" style={{ fontSize: "0.74rem", color: "var(--color-faint)" }}>
        {seqLabel} · ST {result.snapshot.sliceThickness}mm
      </p>

      {/* Preview ảnh filtered (colormap áp live) */}
      <div
        style={{
          marginTop: "var(--space-4)",
          display: "grid",
          gridTemplateColumns: "minmax(0, 220px) 1fr",
          gap: "var(--space-4)",
          alignItems: "start",
        }}
      >
        <div style={{ display: "grid", gap: 2 }}>
          <div style={{ aspectRatio: "1 / 1", borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid var(--color-line)", background: "#000" }}>
            <canvas ref={previewRef} style={{ width: "100%", height: "100%", display: "block", imageRendering: "pixelated" }} aria-label="Preview filtered" />
          </div>
          <span className="mono" style={{ fontSize: "0.62rem", color: "var(--color-faint)", textAlign: "center" }}>
            {t("img.filteredLabel", { name: COLORMAP_LABELS[colormap] })}
          </span>
        </div>

        {/* Cơ bản: WW/WL + colormap */}
        <div style={{ display: "grid", gap: "var(--space-3)" }}>
          <p className="eyebrow" style={{ color: "var(--color-muted)" }}>{t("img.basicEyebrow")}</p>

          <div style={{ display: "grid", gap: "var(--space-2)" }}>
            <ParamSliderField
              label="Window Width"
              value={ww}
              min={0.1}
              max={1}
              step={0.05}
              onChange={setWw}
              tip={t("img.wwTip")}
            />
            <ParamSliderField
              label="Window Level"
              value={wl}
              min={0}
              max={1}
              step={0.05}
              onChange={setWl}
              tip={t("img.wwTip")}
            />
          </div>

          <label style={{ display: "grid", gap: "var(--space-1)", minWidth: 0 }}>
            <span className="mono" style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)", fontSize: "0.7rem", color: "var(--color-muted)" }}>
              Colormap
              <span
                title={t("img.lutTip")}
                aria-label={t("img.lutTip")}
                style={{
                  display: "inline-grid",
                  placeItems: "center",
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  border: "1px solid var(--color-line-strong)",
                  color: "var(--color-faint)",
                  fontSize: "0.62rem",
                  cursor: "help",
                  userSelect: "none",
                }}
              >
                ?
              </span>
            </span>
            <select
              value={colormap}
              onChange={(e) => setColormap(e.target.value as ColormapName)}
              style={{
                width: "100%",
                minWidth: 0,
                boxSizing: "border-box",
                height: 34,
                padding: "0 8px",
                fontFamily: "var(--font-data)",
                fontSize: "0.8rem",
                color: "var(--color-paper)",
                background: "var(--color-bore-2)",
                border: "1px solid var(--color-line-strong)",
                borderRadius: "var(--radius-sm)",
                outline: "none",
                cursor: "pointer",
              }}
            >
              {COLORMAPS.map((c) => (
                <option key={c} value={c} style={{ color: "#06222b" }}>
                  {COLORMAP_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Hành động */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-5)" }}>
        <button
          type="button"
          onClick={onClose}
          className="mono"
          style={{
            padding: "10px 18px",
            minHeight: 40,
            fontFamily: "var(--font-data)",
            fontSize: "0.82rem",
            color: "var(--color-paper)",
            background: "transparent",
            border: "1px solid var(--color-line-strong)",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
          }}
        >
          {t("common.close")}
        </button>
        <button
          type="button"
          onClick={() => onApply({ ww, wl, colormap })}
          className="mono"
          style={{
            padding: "10px 18px",
            minHeight: 40,
            fontFamily: "var(--font-data)",
            fontSize: "0.82rem",
            color: "#06222b",
            background: "linear-gradient(180deg, var(--color-proton-cyan), #2bb9c9)",
            border: "1px solid var(--color-proton-cyan)",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
          }}
        >
          {t("img.apply")}
        </button>
      </div>
    </Modal>
  );
}
