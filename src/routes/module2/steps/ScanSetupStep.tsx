import { useEffect, useRef, useState } from "react";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { ParamSliderField } from "./ParamField";
import { useModule2Store } from "../../../stores/module2Store";
import { useT } from "../../../i18n/useT";
import { drawGrayscale } from "../../../mri-sim/canvas";
import { SCOUT_SIZE, type ScoutPlane } from "../../../simulations/module2/scoutImage";
import {
  SEQUENCE_OPTIONS,
  isIRSequence,
  computePreviewImage,
  orientationMatrix,
  ORIENTATION_PRESETS,
  sliceBoxRect,
  PHANTOM_FOV_MM,
} from "../../../simulations/module2/scanSetup";

/**
 * ScanSetupStep — bước Scan setup (Module 2). Hai tab con:
 *  - Location: 3 ảnh Scout + ô đỏ kéo/resize (chỉ Sagittal & Coronal), lưới
 *    tham số 4 cột (FOV/offset, slice, góc + preset, ma trận hướng cắt).
 *  - Sequence Parameters: chọn chuỗi xung (SE/TSE/FLAIR), TR/TE/FA/matrix +
 *    preview tương phản realtime (physics engine sẵn có).
 *
 * Mọi giá trị lưu vào `sliceLocation` / `sequenceParams` trong store.
 */

type Tab = "location" | "sequence";

const PLANES: { key: ScoutPlane; label: string; hasBox: boolean }[] = [
  { key: "sagittal", label: "Sagittal", hasBox: true },
  { key: "coronal", label: "Coronal", hasBox: true },
  { key: "axial", label: "Axial", hasBox: false },
];

export function ScanSetupStep() {
  const { t } = useT();
  const sliceLocation = useModule2Store((s) => s.sliceLocation);
  const setSliceLocation = useModule2Store((s) => s.setSliceLocation);
  const sequenceParams = useModule2Store((s) => s.sequenceParams);
  const setSequenceParams = useModule2Store((s) => s.setSequenceParams);
  const scoutImages = useModule2Store((s) => s.scoutImages);

  const [tab, setTab] = useState<Tab>("location");

  const setLoc = (patch: Partial<typeof sliceLocation>) => setSliceLocation(patch);
  const setSeq = (patch: Partial<typeof sequenceParams>) => setSequenceParams(patch);

  // Điều kiện "đủ" để sẵn sàng Scan: FOV > 0, ít nhất 1 lát, đã chọn chuỗi xung.
  const locationReady = sliceLocation.fovRead > 0 && sliceLocation.fovPhase > 0 && sliceLocation.sliceCount >= 1;
  const sequenceReady = sequenceParams.TR > 0 && sequenceParams.TE > 0 && !!sequenceParams.sequence;
  const ready = locationReady && sequenceReady;

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      {/* Tab con */}
      <div style={{ display: "flex", gap: "var(--space-2)" }}>
        <TabButton active={tab === "location"} onClick={() => setTab("location")}>{t("scanSetup.tabLocation")}</TabButton>
        <TabButton active={tab === "sequence"} onClick={() => setTab("sequence")}>{t("scanSetup.tabSequence")}</TabButton>
      </div>

      {tab === "location" ? (
        <LocationTab sliceLocation={sliceLocation} setLoc={setLoc} scoutImages={scoutImages} />
      ) : (
        <SequenceTab sequenceParams={sequenceParams} setSeq={setSeq} />
      )}

      {/* Hộp thông báo sẵn sàng chụp */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <p className="mono" style={{ fontSize: "0.82rem", color: ready ? "var(--color-success-green)" : "var(--color-faint)", margin: 0 }}>
            {ready ? t("scanSetup.readyYes") : t("scanSetup.readyNo")}
          </p>
          <Button variant="primary" size="md" disabled={!ready} onClick={() => useModule2Store.getState().setStep("scanning")}>
            {t("scanSetup.startScan")}
          </Button>
        </div>
      </Card>
    </div>
  );
}

/** Tab con — style pill giống thanh bước. */
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mono"
      style={{
        padding: "8px 16px",
        minHeight: 40,
        fontFamily: "var(--font-data)",
        fontSize: "0.82rem",
        color: active ? "#06222b" : "var(--color-muted)",
        background: active ? "linear-gradient(180deg, var(--color-proton-cyan), #2bb9c9)" : "transparent",
        border: active ? "1px solid var(--color-proton-cyan)" : "1px solid var(--color-line-strong)",
        borderRadius: 999,
        cursor: "pointer",
        transition: "background 0.14s ease, border-color 0.14s ease",
      }}
    >
      {children}
    </button>
  );
}

type SliceLoc = ReturnType<typeof useModule2Store.getState>["sliceLocation"];
type SeqParams = ReturnType<typeof useModule2Store.getState>["sequenceParams"];

/** TAB LOCATION — 3 ảnh Scout + box kéo/resize + lưới tham số 4 cột. */
function LocationTab({
  sliceLocation,
  setLoc,
  scoutImages,
}: {
  sliceLocation: SliceLoc;
  setLoc: (p: Partial<SliceLoc>) => void;
  scoutImages: ReturnType<typeof useModule2Store.getState>["scoutImages"];
}) {
  const { t } = useT();
  const matrix = orientationMatrix(sliceLocation.alpha, sliceLocation.beta, sliceLocation.gamma);
  const applyPreset = (name: string) => {
    const p = ORIENTATION_PRESETS[name];
    if (p) setLoc({ alpha: p.alpha, beta: p.beta, gamma: p.gamma });
  };

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      {/* 3 ảnh Scout với box định vị */}
      <Card>
        <p className="eyebrow" style={{ marginBottom: "var(--space-3)" }}>{t("scanSetup.localizerEyebrow")}</p>
        {scoutImages ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "var(--space-3)" }}>
            {PLANES.map(({ key, label, hasBox }) => (
              <ScoutViewport key={key} plane={key} label={label} image={scoutImages[key]} hasBox={hasBox} />
            ))}
          </div>
        ) : (
          <p className="mono" style={{ fontSize: "0.8rem", color: "var(--color-faint)" }}>
            {t("scanSetup.noScout")}
          </p>
        )}
      </Card>

      {/* Lưới tham số 4 cột — các Card cao bằng nhau (stretch), nội dung giãn
          đều theo chiều dọc để tránh khoảng trắng. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "var(--space-4)", alignItems: "stretch" }}>
        <Card style={{ padding: "var(--space-4)", height: "100%", display: "flex", flexDirection: "column" }}>
          <p className="eyebrow" style={{ marginBottom: "var(--space-3)" }}>FOV & Read/Phase</p>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-evenly", gap: "var(--space-3)" }}>
            <ParamSliderField label="FOV Read" unit="mm" value={sliceLocation.fovRead} min={10} max={50} step={1} onChange={(v) => setLoc({ fovRead: v })} />
            <ParamSliderField label="Offset Read" unit="mm" value={sliceLocation.offsetRead} min={-10} max={10} step={1} onChange={(v) => setLoc({ offsetRead: v })} />
            <ParamSliderField label="FOV Phase" unit="mm" value={sliceLocation.fovPhase} min={10} max={50} step={1} onChange={(v) => setLoc({ fovPhase: v })} />
            <ParamSliderField label="Offset Phase" unit="mm" value={sliceLocation.offsetPhase} min={-10} max={10} step={1} onChange={(v) => setLoc({ offsetPhase: v })} />
          </div>
        </Card>

        <Card style={{ padding: "var(--space-4)", height: "100%", display: "flex", flexDirection: "column" }}>
          <p className="eyebrow" style={{ marginBottom: "var(--space-3)" }}>Slice</p>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-evenly", gap: "var(--space-3)" }}>
            <ParamSliderField label="Offset Slice" unit="mm" value={sliceLocation.offsetSlice} min={-15} max={15} step={1} onChange={(v) => setLoc({ offsetSlice: v })} />
            <ParamSliderField label="Slice Count" value={sliceLocation.sliceCount} min={1} max={20} step={1} onChange={(v) => setLoc({ sliceCount: Math.round(v) })} />
            <ParamSliderField label="Slice Thickness" unit="mm" value={sliceLocation.sliceThickness} min={1} max={20} step={0.5} onChange={(v) => setLoc({ sliceThickness: v })} />
            <ParamSliderField label="Slice Gap" unit="mm" value={sliceLocation.sliceGap} min={0} max={10} step={0.5} onChange={(v) => setLoc({ sliceGap: v })} />
          </div>
        </Card>

        <Card style={{ padding: "var(--space-4)", height: "100%", display: "flex", flexDirection: "column" }}>
          <p className="eyebrow" style={{ marginBottom: "var(--space-3)" }}>{t("scanSetup.angleEyebrow")}</p>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-evenly", gap: "var(--space-3)" }}>
            <ParamSliderField label="Alpha Angle" unit="°" value={sliceLocation.alpha} min={-180} max={180} step={1} onChange={(v) => setLoc({ alpha: v })} />
            <ParamSliderField label="Beta Angle" unit="°" value={sliceLocation.beta} min={-180} max={180} step={1} onChange={(v) => setLoc({ beta: v })} />
            <ParamSliderField label="Gamma Angle" unit="°" value={sliceLocation.gamma} min={-180} max={180} step={1} onChange={(v) => setLoc({ gamma: v })} />
            {/* 3 preset chung 1 hàng — chia đều, font nhỏ, không wrap. */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-1)" }}>
              {["Sagittal", "Coronal", "Axial"].map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => applyPreset(name)}
                  className="mono"
                  style={{
                    minHeight: 32,
                    padding: "4px 2px",
                    fontSize: "0.66rem",
                    color: "var(--color-paper)",
                    background: "transparent",
                    border: "1px solid var(--color-line-strong)",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card style={{ padding: "var(--space-4)", height: "100%", display: "flex", flexDirection: "column" }}>
          <p className="eyebrow" style={{ marginBottom: "var(--space-3)" }}>{t("scanSetup.matrixEyebrow")}</p>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <OrientationTable matrix={matrix} />
          </div>
        </Card>
      </div>
    </div>
  );
}

/** Bảng ma trận hướng cắt Slice/Phase/Read × (x,y,z), tự cập nhật theo góc. */
function OrientationTable({ matrix }: { matrix: number[][] }) {
  const rows = ["Slice", "Phase", "Read"];
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-data)", fontSize: "0.76rem" }}>
      <thead>
        <tr>
          <th style={{ textAlign: "left", color: "var(--color-muted)", padding: "3px 4px" }} />
          {["x", "y", "z"].map((h) => (
            <th key={h} style={{ textAlign: "right", color: "var(--color-faint)", padding: "3px 4px" }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r}>
            <td style={{ color: "var(--color-muted)", padding: "3px 4px" }}>{r}</td>
            {matrix[i].map((v, j) => (
              <td key={j} style={{ textAlign: "right", color: "var(--color-paper)", padding: "3px 4px" }}>{v.toFixed(2)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * ScoutViewport — vẽ 1 ảnh Scout; nếu hasBox → phủ ô đỏ bán trong suốt
 * kéo/resize được (local state, thuần minh hoạ định vị lát cắt). Ô đỏ chỉ có
 * ở Sagittal & Coronal, không có ở Axial (theo yêu cầu).
 */
function ScoutViewport({
  plane,
  label,
  image,
  hasBox,
}: {
  plane: ScoutPlane;
  label: string;
  image: number[][];
  hasBox: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    drawGrayscale(canvasRef.current, image);
  }, [image]);

  const boxPlane = plane === "coronal" || plane === "sagittal" ? plane : null;

  return (
    <div style={{ display: "grid", gap: "var(--space-1)" }}>
      <div style={{ position: "relative", aspectRatio: "1 / 1", borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid var(--color-line)", background: "#000" }}>
        <canvas
          ref={canvasRef}
          width={SCOUT_SIZE}
          height={SCOUT_SIZE}
          style={{ width: "100%", height: "100%", display: "block", imageRendering: "pixelated" }}
          aria-label={`Scout ${label}`}
        />
        {hasBox && boxPlane && <SliceBox plane={boxPlane} />}
      </div>
      <span className="mono" style={{ fontSize: "0.7rem", color: "var(--color-muted)", textAlign: "center" }}>{label}</span>
    </div>
  );
}

/**
 * SliceBox — ô đỏ ĐỌC vị trí/kích thước TỪ store (`sliceBoxRect`), không
 * hardcode. Kéo (move) → cập nhật Offset theo trục ngang + Offset Slice theo
 * trục dọc; resize (góc) → cập nhật FOV (trục ngang) + Slice Thickness (dọc).
 * Ghi thẳng vào store nên đổi slider ↔ kéo box hai chiều nhất quán.
 */
function SliceBox({ plane }: { plane: "sagittal" | "coronal" }) {
  const sliceLocation = useModule2Store((s) => s.sliceLocation);
  const setSliceLocation = useModule2Store((s) => s.setSliceLocation);

  // Vị trí ô đỏ tính TỪ store (nguồn sự thật duy nhất).
  const rect = sliceBoxRect(plane, sliceLocation);

  const dragRef = useRef<
    | { mode: "move" | "resize"; sx: number; sy: number; loc: typeof sliceLocation }
    | null
  >(null);
  const boxElRef = useRef<HTMLDivElement>(null);

  // Trục ngang của viewport: coronal = Read, sagittal = Phase.
  const horizFovKey = plane === "coronal" ? "fovRead" : "fovPhase";
  const horizOffKey = plane === "coronal" ? "offsetRead" : "offsetPhase";

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const parent = boxElRef.current?.parentElement;
      const r = parent?.getBoundingClientRect();
      if (!r) return;
      // Delta chuột theo px → mm (viewport rộng = PHANTOM_FOV_MM).
      const dxMM = ((e.clientX - d.sx) / r.width) * PHANTOM_FOV_MM;
      const dyMM = ((e.clientY - d.sy) / r.height) * PHANTOM_FOV_MM;

      if (d.mode === "move") {
        // Kéo ngang → offset trục ngang view; kéo dọc → offsetSlice (trục lát).
        setSliceLocation({
          [horizOffKey]: Math.round(d.loc[horizOffKey] + dxMM),
          offsetSlice: Math.round(d.loc.offsetSlice + dyMM),
        });
      } else {
        // Resize: FOV ngang nới theo 2·dx (kéo mép phải → giãn cả 2 bên tâm);
        // dy đổi trực tiếp bề dày MỖI lát (Slice Thickness), giữ nguyên Count.
        const nextFov = Math.max(40, Math.round(d.loc[horizFovKey] + dxMM * 2));
        const nextThickness = Math.max(1, Math.round((d.loc.sliceThickness + dyMM * 2) * 10) / 10);
        setSliceLocation({ [horizFovKey]: nextFov, sliceThickness: nextThickness });
      }
    };
    const onUp = () => (dragRef.current = null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plane]);

  const startMove = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { mode: "move", sx: e.clientX, sy: e.clientY, loc: sliceLocation };
  };
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { mode: "resize", sx: e.clientX, sy: e.clientY, loc: sliceLocation };
  };

  const { slices } = rect;
  const lastSlice = slices[slices.length - 1];

  return (
    // Wrapper phủ toàn viewport để đo px và bắt drag; các ô lát nằm bên trong.
    <div ref={boxElRef} style={{ position: "absolute", inset: 0 }}>
      {slices.map((s, i) => (
        <div
          key={i}
          onMouseDown={startMove}
          style={{
            position: "absolute",
            left: `${s.leftPct}%`,
            top: `${s.topPct}%`,
            width: `${s.widthPct}%`,
            height: `${s.heightPct}%`,
            border: "1.5px solid var(--color-danger-red)",
            background: "rgba(255,107,107,0.16)",
            cursor: "move",
            boxSizing: "border-box",
          }}
        />
      ))}
      {/* Handle resize ở góc dưới-phải của lát CUỐI (đổi FOV ngang + thickness). */}
      {lastSlice && (
        <div
          onMouseDown={startResize}
          style={{
            position: "absolute",
            left: `calc(${lastSlice.leftPct + lastSlice.widthPct}% - 6px)`,
            top: `calc(${lastSlice.topPct + lastSlice.heightPct}% - 6px)`,
            width: 12,
            height: 12,
            background: "var(--color-danger-red)",
            borderRadius: 2,
            cursor: "nwse-resize",
          }}
        />
      )}
    </div>
  );
}

/** TAB SEQUENCE PARAMETERS — chọn chuỗi xung + TR/TE/FA/matrix + preview. */
function SequenceTab({ sequenceParams, setSeq }: { sequenceParams: SeqParams; setSeq: (p: Partial<SeqParams>) => void }) {
  const { t } = useT();
  const isIR = isIRSequence(sequenceParams.sequence);

  const onSequenceChange = (value: string) => {
    // FLAIR (IR) cần TI; SE/TSE bỏ TI. Đặt giá trị mặc định hợp lý cho mỗi loại.
    if (value === "FLAIR") setSeq({ sequence: value, TR: 9000, TE: 120, TI: 2100 });
    else if (value === "TSE") setSeq({ sequence: value, TR: 4000, TE: 100, TI: null });
    else setSeq({ sequence: value, TR: 500, TE: 15, TI: null });
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(220px, 300px)", gap: "var(--space-4)", alignItems: "start" }}>
      <Card style={{ padding: "var(--space-4)" }}>
        <p className="eyebrow" style={{ marginBottom: "var(--space-3)" }}>Sequence Parameters</p>
        <label style={{ display: "grid", gap: "var(--space-1)", marginBottom: "var(--space-4)" }}>
          <span className="mono" style={{ fontSize: "0.72rem", color: "var(--color-muted)" }}>Sequence</span>
          <select
            value={sequenceParams.sequence}
            onChange={(e) => onSequenceChange(e.target.value)}
            className="mono"
            style={{ width: "100%", padding: "8px 10px", minHeight: 40, fontFamily: "var(--font-data)", fontSize: "0.84rem", color: "var(--color-paper)", background: "var(--color-bore-2)", border: "1px solid var(--color-line-strong)", borderRadius: "var(--radius-sm)" }}
          >
            {SEQUENCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <div style={{ display: "grid", gap: "var(--space-3)" }}>
          <ParamSliderField label="TR" unit="ms" value={sequenceParams.TR} min={200} max={12000} step={50} onChange={(v) => setSeq({ TR: v })} />
          <ParamSliderField label="TE" unit="ms" value={sequenceParams.TE} min={5} max={200} step={5} onChange={(v) => setSeq({ TE: v })} />
          {isIR && (
            <ParamSliderField label="TI" unit="ms" value={sequenceParams.TI ?? 2100} min={1500} max={3500} step={50} onChange={(v) => setSeq({ TI: v })} />
          )}
          <ParamSliderField label="Flip Angle" unit="°" value={sequenceParams.FA} min={10} max={180} step={5} onChange={(v) => setSeq({ FA: v })} />
          <ParamSliderField label="Bandwidth" unit="Hz" value={sequenceParams.bandwidth} min={8000} max={100000} step={1000} onChange={(v) => setSeq({ bandwidth: v })} />
          <ParamSliderField label="NEX" value={sequenceParams.nex} min={1} max={8} step={1} onChange={(v) => setSeq({ nex: Math.round(v) })} />
        </div>
        <label style={{ display: "grid", gap: "var(--space-1)", marginTop: "var(--space-4)" }}>
          <span className="mono" style={{ fontSize: "0.72rem", color: "var(--color-muted)" }}>Matrix Size</span>
          <select
            value={sequenceParams.matrixSize}
            onChange={(e) => setSeq({ matrixSize: parseInt(e.target.value, 10) })}
            className="mono"
            style={{ width: "100%", padding: "8px 10px", minHeight: 40, fontFamily: "var(--font-data)", fontSize: "0.84rem", color: "var(--color-paper)", background: "var(--color-bore-2)", border: "1px solid var(--color-line-strong)", borderRadius: "var(--radius-sm)" }}
          >
            {[64, 128, 256].map((m) => (
              <option key={m} value={m}>{m} × {m}</option>
            ))}
          </select>
        </label>
      </Card>

      {/* Preview tương phản realtime */}
      <Card style={{ padding: "var(--space-4)" }}>
        <p className="eyebrow" style={{ marginBottom: "var(--space-3)" }}>{t("scanSetup.previewEyebrow")}</p>
        <ContrastPreview params={sequenceParams} />
        <p className="mono" style={{ fontSize: "0.72rem", color: "var(--color-faint)", marginTop: "var(--space-3)", lineHeight: 1.5 }}>
          {t("scanSetup.previewNote", { ti: isIR ? "/TI" : "" })}
        </p>
      </Card>
    </div>
  );
}

/** Preview tương phản — vẽ lại canvas mỗi khi tham số đổi (realtime). */
function ContrastPreview({ params }: { params: SeqParams }) {
  const { t } = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const img = computePreviewImage(params);
    drawGrayscale(canvasRef.current, img);
  }, [params]);
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", maxWidth: 220, aspectRatio: "1 / 1", imageRendering: "pixelated", border: "1px solid var(--color-line)", borderRadius: "var(--radius-sm)", background: "#000" }}
        aria-label={t("scanSetup.previewAria")}
      />
    </div>
  );
}
