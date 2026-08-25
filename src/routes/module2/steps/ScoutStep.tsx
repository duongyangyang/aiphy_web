import { useEffect, useRef, useState } from "react";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { ParamField } from "./ParamField";
import { useModule2Store } from "../../../stores/module2Store";
import { useT } from "../../../i18n/useT";
import { drawGrayscale } from "../../../mri-sim/canvas";
import {
  generateScoutImages,
  SCOUT_SIZE,
  type ScoutPlane,
} from "../../../simulations/module2/scoutImage";

/**
 * ScoutStep — bước Scout (Module 2): chụp 3 ảnh định vị (sagittal / coronal /
 * axial). Panel "Scout Parameters" (RG/PRG/DRG/TR) ảnh hưởng noise/clipping/độ
 * sáng ảnh (xem `scoutImage.ts`).
 *
 * Khi chạy: một scan line chạy dọc từng viewport; phần đã quét hiện ảnh rõ dần
 * (bên trên đường quét = ảnh thật, bên dưới = nhiễu mờ), progress + % đồng bộ.
 * Xong → modal "Scout hoàn tất. Chuyển sang Scan setup?".
 *
 * Nút "Scout" ở sidebar phát `scoutRequest`; step này lắng nghe rồi chạy.
 */

const PLANES: { key: ScoutPlane }[] = [
  { key: "sagittal" },
  { key: "coronal" },
  { key: "axial" },
];

const TICK_MS = 40;
const TOTAL_TICKS = 55;

/** Bộ tham số Scout "tối ưu" hệ thống tự dò khi Auto ON: gain chuẩn (không
 *  cháy) + TR đủ dài cho ảnh sáng, ít nhiễu. */
const AUTO_SCOUT_PARAMS = { rg: 20, prg: 3, drg: 3, tr: 1200 };

export function ScoutStep() {
  const { t } = useT();
  const scoutParams = useModule2Store((s) => s.scoutParams);
  const setScoutParams = useModule2Store((s) => s.setScoutParams);
  const scoutImages = useModule2Store((s) => s.scoutImages);
  const setScoutImages = useModule2Store((s) => s.setScoutImages);
  const setScoutJob = useModule2Store((s) => s.setScoutJob);
  const scoutRequest = useModule2Store((s) => s.scoutRequest);
  const stopRequest = useModule2Store((s) => s.stopRequest);
  const setStep = useModule2Store((s) => s.setStep);

  // Ảnh đầy đủ đang được vẽ dần (giữ ngoài render loop); `reveal` = số hàng đã
  // quét trên mỗi ảnh.
  const fullRef = useRef<Record<ScoutPlane, number[][]> | null>(null);
  const canvasRefs = {
    sagittal: useRef<HTMLCanvasElement>(null),
    coronal: useRef<HTMLCanvasElement>(null),
    axial: useRef<HTMLCanvasElement>(null),
  };

  const [progress, setProgress] = useState(() => (scoutImages ? 100 : 0));
  const [running, setRunning] = useState(false);
  const [revealRow, setRevealRow] = useState<number>(() => (scoutImages ? SCOUT_SIZE : 0));
  const [doneModal, setDoneModal] = useState(false);
  // Auto Scout (mặc định TICK, giống Prescan): khoá input, hệ thống tự dò
  // tham số thu tối ưu (gain chuẩn + TR dài → ảnh sáng, ít nhiễu, không cháy).
  const [auto, setAuto] = useState(true);

  const timerRef = useRef<number | null>(null);
  const cancelRef = useRef(false);

  const set = (patch: Partial<typeof scoutParams>) => setScoutParams(patch);

  // Dọn timer khi unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, []);

  const reduceMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /**
   * Vẽ 3 canvas ở mức reveal hiện tại: hàng < revealRow = ảnh thật, hàng >=
   * = nhiễu mờ (giả lập vùng chưa quét). Khi reveal >= size → ảnh rõ hoàn toàn.
   */
  const paint = (full: Record<ScoutPlane, number[][]>, reveal: number) => {
    for (const { key } of PLANES) {
      const src = full[key];
      const shown = src.map((row, r) =>
        r < reveal
          ? row
          : row.map((_, c) => 0.06 + 0.05 * Math.abs(Math.sin((r * 3.1 + c * 1.7 + r * c * 0.02)))),
      );
      drawGrayscale(canvasRefs[key].current, shown);
    }
  };

  // Vẽ lại khi có ảnh sẵn (mount lại từ Scan setup quay về).
  useEffect(() => {
    if (scoutImages && !running) {
      fullRef.current = scoutImages as Record<ScoutPlane, number[][]>;
      paint(scoutImages as Record<ScoutPlane, number[][]>, SCOUT_SIZE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoutImages]);

  const runScout = () => {
    if (running) return;
    // Auto ON → hệ thống tự dò ra bộ tham số tối ưu (ghi ngược vào ô để người
    // dùng thấy); Auto OFF → dùng đúng giá trị người dùng nhập.
    const effective = auto ? AUTO_SCOUT_PARAMS : scoutParams;
    if (auto) setScoutParams(AUTO_SCOUT_PARAMS);
    const full = generateScoutImages(effective);
    fullRef.current = full;
    cancelRef.current = false;
    setRunning(true);
    setDoneModal(false);
    setProgress(0);
    setRevealRow(0);

    const startedAt = Date.now();
    let tick = 0;
    const totalTicks = reduceMotion ? 12 : TOTAL_TICKS;
    const stepMs = reduceMotion ? 30 : TICK_MS;

    timerRef.current = window.setInterval(() => {
      if (cancelRef.current) {
        if (timerRef.current !== null) window.clearInterval(timerRef.current);
        setRunning(false);
        setScoutJob(null);
        return;
      }
      tick += 1;
      const frac = tick / totalTicks;
      const reveal = Math.round(frac * SCOUT_SIZE);
      setRevealRow(reveal);
      setProgress(Math.min(100, frac * 100));
      paint(full, reveal);
      setScoutJob({ label: "Scout", progress: Math.min(100, frac * 100), startedAt });

      if (tick >= totalTicks) {
        if (timerRef.current !== null) window.clearInterval(timerRef.current);
        paint(full, SCOUT_SIZE);
        setScoutImages({ sagittal: full.sagittal, coronal: full.coronal, axial: full.axial });
        setProgress(100);
        setRevealRow(SCOUT_SIZE);
        setRunning(false);
        setDoneModal(true);
        window.setTimeout(() => setScoutJob(null), 600);
      }
    }, stepMs);
  };

  // Lắng nghe nút "Scout" ở sidebar.
  const reqRef = useRef(scoutRequest);
  useEffect(() => {
    if (scoutRequest !== reqRef.current) {
      reqRef.current = scoutRequest;
      runScout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoutRequest]);

  // Lắng nghe nút "Stop".
  const stopRef = useRef(stopRequest);
  useEffect(() => {
    if (stopRequest !== stopRef.current) {
      stopRef.current = stopRequest;
      cancelRef.current = true;
    }
  }, [stopRequest]);

  const hasImages = !!scoutImages || running;

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div
        className="lab-grid"
        style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(240px, 300px)", gap: "var(--space-4)", alignItems: "stretch" }}
      >
        {/* 3 viewport — flex-column + space-between để phân bố đều chiều dọc,
            không để trống khoảng dưới. */}
        <Card style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "var(--space-2)" }}>
            <p className="eyebrow">{t("scout.eyebrow")}</p>
            <span className="mono" style={{ fontSize: "0.76rem", color: running ? "var(--color-proton-cyan)" : "var(--color-faint)" }}>
              {running ? t("scout.scanning") : scoutImages ? t("scout.done") : t("scout.notShot")}
            </span>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", marginTop: "var(--space-3)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "var(--space-3)" }}>
              {PLANES.map(({ key }) => (
                <Viewport
                  key={key}
                  label={t(`scout.plane.${key}`)}
                  canvasRef={canvasRefs[key]}
                  running={running}
                  revealFrac={revealRow / SCOUT_SIZE}
                  placeholder={!hasImages}
                />
              ))}
            </div>
          </div>

          {/* Progress đồng bộ 3 viewport */}
          <div style={{ marginTop: "var(--space-4)" }}>
            <ScoutProgress progress={progress} running={running} />
          </div>
        </Card>

        {/* Panel Scout Parameters */}
        <Card style={{ padding: "var(--space-4)", height: "100%", display: "flex", flexDirection: "column" }}>
          {/* Header: checkbox "Auto Scout" giống Prescan. */}
          <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer", marginBottom: "var(--space-3)" }}>
            <input
              type="checkbox"
              checked={auto}
              onChange={() => setAuto((a) => !a)}
              disabled={running}
              style={{ width: 16, height: 16, accentColor: "var(--color-proton-cyan)" }}
            />
            <span style={{ fontFamily: "var(--font-data)", fontSize: "0.86rem", fontWeight: 600, color: "var(--color-paper)" }}>
              Auto Scout
            </span>
          </label>
          {/* 4 input giãn đều lấp chiều cao panel → content cân đối, không dồn góc. */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-evenly", gap: "var(--space-3)" }}>
            <ParamField label="Scout RG" value={scoutParams.rg} step={1} locked={running || auto} onChange={(v) => set({ rg: v })} />
            <ParamField label="Scout PRG" value={scoutParams.prg} step={1} locked={running || auto} onChange={(v) => set({ prg: v })} />
            <ParamField label="Scout DRG" value={scoutParams.drg} step={1} locked={running || auto} onChange={(v) => set({ drg: v })} />
            <ParamField label="Scout TR" unit="ms" value={scoutParams.tr} step={50} locked={running || auto} onChange={(v) => set({ tr: v })} />
          </div>
          <p className="mono" style={{ fontSize: "0.72rem", color: "var(--color-faint)", marginTop: "var(--space-3)", lineHeight: 1.5 }}>
            {auto
              ? t("scout.autoOn")
              : t("scout.autoOff")}
          </p>
          <div style={{ marginTop: "var(--space-4)" }}>
            <Button variant="primary" size="md" onClick={runScout} disabled={running} style={{ width: "100%" }}>
              {running ? t("scout.runRunning") : scoutImages ? t("scout.runAgain") : t("scout.runFirst")}
            </Button>
          </div>
        </Card>
      </div>

      {/* Modal khi Scout xong */}
      <Modal open={doneModal} onClose={() => setDoneModal(false)} labelledBy="scout-done-title">
        <p className="eyebrow" style={{ color: "var(--color-success-green)" }}>{t("scout.modalEyebrow")}</p>
        <h2 id="scout-done-title" style={{ fontSize: "1.25rem", marginTop: "var(--space-2)" }}>
          {t("scout.modalTitle")}
        </h2>
        <p className="muted" style={{ marginTop: "var(--space-2)" }}>
          {t("scout.modalBody")}
        </p>
        <div style={{ marginTop: "var(--space-5)", display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <Button variant="primary" size="md" onClick={() => { setDoneModal(false); setStep("scanSetup"); }}>
            {t("scout.gotoScanSetup")}
          </Button>
          <Button variant="ghost" size="md" onClick={() => setDoneModal(false)}>
            {t("scout.stay")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/** Một viewport ảnh scout + scan line chạy khi đang quét. */
function Viewport({
  label,
  canvasRef,
  running,
  revealFrac,
  placeholder,
}: {
  label: string;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  running: boolean;
  revealFrac: number;
  placeholder: boolean;
}) {
  const { t } = useT();
  return (
    <div style={{ display: "grid", gap: "var(--space-1)" }}>
      <div
        style={{
          position: "relative",
          aspectRatio: "1 / 1",
          borderRadius: "var(--radius-sm)",
          overflow: "hidden",
          border: "1px solid var(--color-line)",
          background: "#000",
        }}
      >
        {placeholder ? (
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
            <span className="mono" style={{ fontSize: "0.72rem", color: "var(--color-faint)" }}>{t("scout.noImage")}</span>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={SCOUT_SIZE}
            height={SCOUT_SIZE}
            style={{ width: "100%", height: "100%", display: "block", imageRendering: "pixelated" }}
            aria-label={label}
          />
        )}
        {/* Scan line — chạy dọc theo revealFrac khi đang quét. */}
        {running && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: `${Math.min(100, revealFrac * 100)}%`,
              height: 2,
              background: "var(--color-proton-cyan)",
              boxShadow: "0 0 10px 2px rgba(55,215,232,0.7)",
            }}
          />
        )}
      </div>
      <span className="mono" style={{ fontSize: "0.7rem", color: "var(--color-muted)", textAlign: "center" }}>{label}</span>
    </div>
  );
}

/** Progress bar + % cho Scout (đồng bộ 3 viewport). */
function ScoutProgress({ progress, running }: { progress: number; running: boolean }) {
  return (
    <div>
      <div style={{ position: "relative", height: 16, background: "var(--color-bore-2)", borderRadius: 999, overflow: "hidden", border: "1px solid var(--color-line)" }}>
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "linear-gradient(90deg, var(--color-proton-cyan), var(--color-rf-violet))",
            transition: "width 0.08s linear",
            opacity: running || progress >= 100 ? 1 : 0.5,
          }}
        />
        <span
          className="mono"
          style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 600, color: "var(--color-paper)", textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
        >
          {progress.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
