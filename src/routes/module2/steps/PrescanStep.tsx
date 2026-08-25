import { useEffect, useRef, useState } from "react";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { ParamField as Field } from "./ParamField";
import { ShimmingChart } from "../../../components/charts/ShimmingChart";
import { useT } from "../../../i18n/useT";
import {
  DEFAULT_O1_MHZ,
  useModule2Store,
  type Calibration,
  type HiddenGroundTruth,
} from "../../../stores/module2Store";
import {
  computeCalibrationErrors,
  K1_O1,
  K2_SHIM,
  K3_RFA,
  type CalibrationErrors,
} from "../../../simulations/module2/calibrationQuality";
import { generateFidCurve } from "../../../simulations/module2/fidSignal";
import { MIN_QUALITY_TO_PROCEED } from "../../../stores/module2Types";

/**
 * PrescanStep — panel hiệu chỉnh Prescan mô phỏng Niumag NMR V3.0.
 *
 * Biểu đồ Shimming trên cùng; 4 khối tham số (O1 / Shimming / RF Amplitude /
 * RF Pulse Width) xếp 1 hàng ngang. Mỗi khối có checkbox "Auto" (mặc định
 * TICK → khoá input, hệ thống tự dò), nút Scan (chạy riêng khối) + View.
 *
 * Logic ẩn giữ nguyên: mỗi lần một khối chạy xong, cập nhật input hiệu chỉnh
 * (o1/shim/rfA90/rfA180) rồi tính lại `calibrationQuality` từ `hiddenGroundTruth`
 * qua `computeCalibrationErrors`. Auto ON → khối tự dò ra giá trị gần đúng
 * (residual nhỏ, quality cao); Auto OFF → dùng đúng giá trị người dùng nhập.
 *
 * Chỉ cho sang bước Scout khi quality >= MIN_QUALITY_TO_PROCEED (0.8). Chưa
 * đạt → ẩn nút chuyển bước, hiện cảnh báo + viền đỏ/cam cho khối có error cao
 * nhất. Người dùng Scan/View lại bao nhiêu lần tuỳ ý cho tới khi đạt.
 *
 * Nút "Prescan" ở sidebar phát `prescanRequest`; step này lắng nghe rồi chạy
 * tuần tự 4 khối đầu O1 → Shimming → RF Amplitude → RF Pulse Width. Nút "Stop"
 * phát `stopRequest` để huỷ.
 */

/** Toàn bộ tham số panel Prescan theo layout Niumag. */
interface PrescanParams {
  // Auto O1
  sfO1: number; // SF O1 (MHz) — dùng làm calibration.o1
  o1D0: number; // D0 (ms)
  // Auto Shimming
  gxOffset: number;
  gyOffset: number;
  gzOffset: number;
  shimD0: number;
  // Auto RF Amplitude
  rfa90: number; // RFA 90 (%)
  rfa180: number; // RFA 180 (%)
  rfaStart: number; // RFA &Start (%)
  rfaEnd: number; // RFA &End (%)
  rfaInc: number; // RFA &Inc (%)
  pulseDuration: number; // Pulse Duration (us)
  rfaD0: number;
  // Auto RF Pulse Width
  p90: number; // P90 (us)
  p180: number; // P180 (us)
  rfpwStart: number; // RFPW Start (us)
  rfpwEnd: number; // RFPW End (us)
  rfpwInc: number; // RFPW Inc (us)
  rfpwD0: number;
}

type AutoKey = "o1" | "shim" | "rfAmp" | "rfPw";
type Errs = CalibrationErrors;

const DEFAULT_PARAMS: PrescanParams = {
  sfO1: DEFAULT_O1_MHZ,
  o1D0: 500,
  gxOffset: 0,
  gyOffset: 0,
  gzOffset: 0,
  shimD0: 500,
  rfa90: 100,
  rfa180: 100,
  rfaStart: 60,
  rfaEnd: 140,
  rfaInc: 5,
  pulseDuration: 500,
  rfaD0: 500,
  p90: 8,
  p180: 16,
  rfpwStart: 4,
  rfpwEnd: 20,
  rfpwInc: 1,
  rfpwD0: 500,
};

const TICK_MS = 50;

// Ngưỡng quality tối thiểu để sang bước Scout được định nghĩa chung ở
// module2Types (MIN_QUALITY_TO_PROCEED) — import ở đầu file.

export function PrescanStep() {
  const { t } = useT();
  const calibration = useModule2Store((s) => s.calibration);
  const setCalibration = useModule2Store((s) => s.setCalibration);
  const hiddenGroundTruth = useModule2Store((s) => s.hiddenGroundTruth);
  const setPrescanJob = useModule2Store((s) => s.setPrescanJob);
  const prescanRequest = useModule2Store((s) => s.prescanRequest);
  const stopRequest = useModule2Store((s) => s.stopRequest);
  const requestPrescan = useModule2Store((s) => s.requestPrescan);
  const setStep = useModule2Store((s) => s.setStep);

  const [params, setParams] = useState<PrescanParams>(DEFAULT_PARAMS);
  const [auto, setAuto] = useState<Record<AutoKey, boolean>>({
    o1: true,
    shim: true,
    rfAmp: true,
    rfPw: true,
  });

  const [trace, setTrace] = useState<number[]>(() => calibration?.shimCurve ?? []);
  const [running, setRunning] = useState<AutoKey | "full" | null>(null);
  const [errors, setErrors] = useState<Errs | null>(
    calibration ? { o1Error: 0, shimError: 0, rfaError90: 0, rfaError180: 0, rfaError: 0, quality: calibration.quality } : null,
  );
  /**
   * Đã đóng hộp kết quả Prescan hay chưa. Hộp (Modal giữa màn hình) mở lại mỗi
   * lần Scan mới chạy xong (đặt false trong runBlock); đóng qua nút X /
   * Re-Prescan / Sang Scout. Khởi tạo theo `!!calibration`: nếu quay lại
   * Prescan khi calibration đã có (từ Scout về) → coi như đã đóng, không bật.
   */
  const [resultDismissed, setResultDismissed] = useState(() => !!calibration);

  const timerRef = useRef<number | null>(null);
  const cancelRef = useRef(false);

  const set = (patch: Partial<PrescanParams>) => setParams((p) => ({ ...p, ...patch }));
  const toggleAuto = (k: AutoKey) => setAuto((a) => ({ ...a, [k]: !a[k] }));

  // Dọn timer khi unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, []);

  /**
   * Tính input hiệu chỉnh hiệu dụng cho một khối. Auto ON → hệ thống "tự dò"
   * ra giá trị gần ground-truth (residual nhỏ ngẫu nhiên deterministic theo
   * seed đơn giản); Auto OFF → dùng đúng số người dùng nhập.
   */
  const effectiveInput = (key: AutoKey, truth: HiddenGroundTruth) => {
    const base = {
      o1: params.sfO1,
      shimOffsets: { x: params.gxOffset, y: params.gyOffset, z: params.gzOffset },
      rfA90: params.rfa90,
      rfA180: params.rfa180,
    };
    if (key === "o1" && auto.o1) base.o1 = truth.trueO1 + 0.01;
    if (key === "shim" && auto.shim) {
      base.shimOffsets = {
        x: truth.trueShim.gx + 0.03,
        y: truth.trueShim.gy - 0.02,
        z: truth.trueShim.gz + 0.02,
      };
    }
    if (key === "rfAmp" && auto.rfAmp) {
      base.rfA90 = truth.trueRFA90 + 0.5;
      base.rfA180 = truth.trueRFA180 - 0.5;
    }
    return base;
  };

  /**
   * Chạy một khối hiệu chỉnh: cập nhật params theo giá trị "tự dò" (nếu Auto),
   * animate progress + biểu đồ Shimming, rồi ghi calibration + quality mới.
   * Trả Promise để chuỗi full-prescan await tuần tự.
   */
  const runBlock = (key: AutoKey, label: string): Promise<void> =>
    new Promise((resolve) => {
      if (!hiddenGroundTruth) return resolve();
      const truth = hiddenGroundTruth;
      const input = effectiveInput(key, truth);

      // Nếu Auto ON: ghi ngược giá trị dò được vào ô input để người dùng thấy.
      if (key === "o1" && auto.o1) set({ sfO1: input.o1 });
      if (key === "shim" && auto.shim)
        set({ gxOffset: input.shimOffsets.x, gyOffset: input.shimOffsets.y, gzOffset: input.shimOffsets.z });
      if (key === "rfAmp" && auto.rfAmp) set({ rfa90: input.rfA90, rfa180: input.rfA180 });

      const errs = computeCalibrationErrors(input, truth);
      setErrors(errs);

      // Biểu đồ Shimming = FID vật lý, lái bằng chính các error hiện tại:
      // shimError → T2* (độ phẳng), o1Error → dao động off-resonance,
      // rfaError90 → biên độ. Đường hé lộ dần trái→phải như máy quét thật.
      const total = 60;
      const fullCurve = generateFidCurve(
        { o1Error: errs.o1Error, shimError: errs.shimError, rfaError90: errs.rfaError90 },
        total,
      );
      const localTrace: number[] = [];
      let i = 0;
      const startedAt = Date.now();
      cancelRef.current = false;

      timerRef.current = window.setInterval(() => {
        if (cancelRef.current) {
          if (timerRef.current !== null) window.clearInterval(timerRef.current);
          setPrescanJob(null);
          return resolve();
        }
        if (i >= total) {
          if (timerRef.current !== null) window.clearInterval(timerRef.current);
          const result: Calibration = {
            o1: input.o1,
            shimOffsets: input.shimOffsets,
            rfA90: input.rfA90,
            rfA180: input.rfA180,
            shimCurve: fullCurve,
            quality: errs.quality,
          };
          setCalibration(result);
          setResultDismissed(false); // mở lại hộp kết quả sau khi Scan xong
          setPrescanJob({ label, progress: 100, startedAt });
          return resolve();
        }
        localTrace.push(fullCurve[i]);
        setTrace([...localTrace]);
        i += 1;
        setPrescanJob({ label, progress: (i / total) * 100, startedAt });
      }, TICK_MS);
    });

  const runSingle = async (key: AutoKey, label: string) => {
    if (running) return;
    setRunning(key);
    await runBlock(key, label);
    setRunning(null);
    window.setTimeout(() => setPrescanJob(null), 600);
  };

  /** Full prescan: 4 khối tuần tự O1 → Shimming → RF Amplitude → RF Pulse Width. */
  const runFull = async () => {
    if (running) return;
    setRunning("full");
    const chain: [AutoKey, string][] = [
      ["o1", "Auto O1"],
      ["shim", "Auto Shimming"],
      ["rfAmp", "Auto RF Amplitude"],
      ["rfPw", "Auto RF Pulse Width"],
    ];
    for (const [key, label] of chain) {
      if (cancelRef.current) break;
      await runBlock(key, label);
    }
    setRunning(null);
    window.setTimeout(() => setPrescanJob(null), 600);
  };

  // Lắng nghe nút "Prescan" ở sidebar.
  const reqRef = useRef(prescanRequest);
  useEffect(() => {
    if (prescanRequest !== reqRef.current) {
      reqRef.current = prescanRequest;
      runFull();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prescanRequest]);

  // Lắng nghe nút "Stop".
  const stopRef = useRef(stopRequest);
  useEffect(() => {
    if (stopRequest !== stopRef.current) {
      stopRef.current = stopRequest;
      cancelRef.current = true;
    }
  }, [stopRequest]);

  const quality = errors?.quality ?? 0;
  const busy = running !== null;
  const canProceed = !!calibration && quality >= MIN_QUALITY_TO_PROCEED;

  // Hộp kết quả bật khi đã có calibration, không còn job chạy, và người dùng
  // chưa đóng. Đóng chỉ qua Re-Prescan / Sang Scout (dismissible=false).
  const showResultModal = !!calibration && !busy && !resultDismissed;

  // Khối có đóng góp lỗi lớn nhất vào exponent quality (k·error) — dùng thang
  // đã nhân k để so công bằng giữa các đơn vị (MHz vs shim vs %). Chỉ dùng để
  // tô viền cảnh báo khi chưa đạt; null khi chưa Scan hoặc đã đạt.
  const worstBlockKey: AutoKey | null =
    errors && !canProceed
      ? ([
          ["o1", K1_O1 * errors.o1Error],
          ["shim", K2_SHIM * errors.shimError],
          ["rfAmp", K3_RFA * errors.rfaError],
        ] as [AutoKey, number][]).reduce((a, b) => (b[1] > a[1] ? b : a))[0]
      : null;

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      {/* Biểu đồ Shimming */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "var(--space-2)" }}>
          <p className="eyebrow">Shimming</p>
          {errors && (
            <span className="mono" style={{ fontSize: "0.78rem", color: qualityColor(quality) }}>
              calibrationQuality = {quality.toFixed(3)}
            </span>
          )}
        </div>
        <div style={{ marginTop: "var(--space-3)" }}>
          <ShimmingChart data={trace} height={240} />
        </div>
        {errors && (
          <div className="mono" style={{ marginTop: "var(--space-3)", display: "flex", gap: "var(--space-4)", flexWrap: "wrap", fontSize: "0.78rem", color: "var(--color-muted)" }}>
            <span>o1Error: <b style={{ color: "var(--color-paper)" }}>{errors.o1Error.toFixed(3)} MHz</b></span>
            <span>shimError: <b style={{ color: "var(--color-paper)" }}>{errors.shimError.toFixed(3)}</b></span>
            <span>rfaError90: <b style={{ color: "var(--color-paper)" }}>{errors.rfaError90.toFixed(2)} %</b></span>
            <span>rfaError180: <b style={{ color: "var(--color-paper)" }}>{errors.rfaError180.toFixed(2)} %</b></span>
          </div>
        )}
      </Card>

      {/* 4 khối tham số — bề rộng khác nhau theo lượng tham số (O1<Shim<RFPW<RFAmp),
          tổng đúng bằng bề rộng block Shimming ở trên. minmax(0,…) để nội dung
          không tràn ra ngoài khung. */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,0.85fr) minmax(0,1fr) minmax(0,1.35fr) minmax(0,1.2fr)", gap: "var(--space-3)", alignItems: "stretch" }}>
          <ParamBlock title="Auto O1" checked={auto.o1} onToggle={() => toggleAuto("o1")}
            onScan={() => runSingle("o1", "Auto O1")} hasView busy={busy} warn={worstBlockKey === "o1"}>
            <Field label="SF O1" unit="MHz" value={params.sfO1} step={0.01} locked={auto.o1} onChange={(v) => set({ sfO1: v })} />
            <Field label="D0" unit="ms" value={params.o1D0} step={10} locked={auto.o1} onChange={(v) => set({ o1D0: v })} />
          </ParamBlock>

          <ParamBlock title="Auto Shimming" checked={auto.shim} onToggle={() => toggleAuto("shim")}
            onScan={() => runSingle("shim", "Auto Shimming")} hasView busy={busy} warn={worstBlockKey === "shim"}>
            <Field label="Gx Offset" value={params.gxOffset} step={0.05} locked={auto.shim} onChange={(v) => set({ gxOffset: v })} />
            <Field label="Gy Offset" value={params.gyOffset} step={0.05} locked={auto.shim} onChange={(v) => set({ gyOffset: v })} />
            <Field label="Gz Offset" value={params.gzOffset} step={0.05} locked={auto.shim} onChange={(v) => set({ gzOffset: v })} />
            <Field label="D0" unit="ms" value={params.shimD0} step={10} locked={auto.shim} onChange={(v) => set({ shimD0: v })} />
          </ParamBlock>

          <ParamBlock title="Auto RF Amplitude" checked={auto.rfAmp} onToggle={() => toggleAuto("rfAmp")}
            onScan={() => runSingle("rfAmp", "Auto RF Amplitude")} hasView busy={busy} warn={worstBlockKey === "rfAmp"}>
            <Field label="RFA 90" unit="%" value={params.rfa90} step={0.5} locked={auto.rfAmp} onChange={(v) => set({ rfa90: v })} />
            <Field label="RFA 180" unit="%" value={params.rfa180} step={0.5} locked={auto.rfAmp} onChange={(v) => set({ rfa180: v })} />
            <Field label="RFA &Start" unit="%" value={params.rfaStart} step={1} locked={auto.rfAmp} onChange={(v) => set({ rfaStart: v })} />
            <Field label="RFA &End" unit="%" value={params.rfaEnd} step={1} locked={auto.rfAmp} onChange={(v) => set({ rfaEnd: v })} />
            <Field label="RFA &Inc" unit="%" value={params.rfaInc} step={1} locked={auto.rfAmp} onChange={(v) => set({ rfaInc: v })} />
            <Field label="Pulse Duration" unit="us" value={params.pulseDuration} step={10} locked={auto.rfAmp} onChange={(v) => set({ pulseDuration: v })} />
            <Field label="D0" unit="ms" value={params.rfaD0} step={10} locked={auto.rfAmp} onChange={(v) => set({ rfaD0: v })} />
          </ParamBlock>

          <ParamBlock title="Auto RF Pulse Width" checked={auto.rfPw} onToggle={() => toggleAuto("rfPw")}
            onScan={() => runSingle("rfPw", "Auto RF Pulse Width")} hasView busy={busy}>
            <Field label="P90" unit="us" value={params.p90} step={0.5} locked={auto.rfPw} onChange={(v) => set({ p90: v })} />
            <Field label="P180" unit="us" value={params.p180} step={0.5} locked={auto.rfPw} onChange={(v) => set({ p180: v })} />
            <Field label="RFPW Start" unit="us" value={params.rfpwStart} step={0.5} locked={auto.rfPw} onChange={(v) => set({ rfpwStart: v })} />
            <Field label="RFPW End" unit="us" value={params.rfpwEnd} step={0.5} locked={auto.rfPw} onChange={(v) => set({ rfpwEnd: v })} />
            <Field label="RFPW Inc" unit="us" value={params.rfpwInc} step={0.5} locked={auto.rfPw} onChange={(v) => set({ rfpwInc: v })} />
            <Field label="D0" unit="ms" value={params.rfpwD0} step={10} locked={auto.rfPw} onChange={(v) => set({ rfpwD0: v })} />
          </ParamBlock>
      </div>

      {/* Hộp kết quả Prescan — Modal căn giữa, chỉ đóng qua Re-Prescan / Scout.
          Chưa chạy Prescan: chỉ hiện dòng hướng dẫn tĩnh, không bật modal. */}
      {!calibration && (
        <Card>
          <p className="mono" style={{ fontSize: "0.8rem", color: "var(--color-faint)", margin: 0 }}>
            {t("prescan.runHint")}
          </p>
        </Card>
      )}

      <Modal open={showResultModal} onClose={() => setResultDismissed(true)} labelledBy="prescan-result-title">
        {/* Nút đóng (X) — chỉ tắt hộp, không đổi trạng thái Prescan. */}
        <button
          type="button"
          aria-label={t("common.close")}
          onClick={() => setResultDismissed(true)}
          style={{
            position: "absolute",
            top: "var(--space-3)",
            right: "var(--space-3)",
            width: 32,
            height: 32,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.1rem",
            lineHeight: 1,
            color: "var(--color-muted)",
            background: "transparent",
            border: "1px solid var(--color-line)",
            borderRadius: "var(--radius-sm)",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
        {canProceed ? (
          <>
            <p className="eyebrow" style={{ color: "var(--color-success-green)" }}>
              {t("prescan.doneEyebrow")}
            </p>
            <h2 id="prescan-result-title" style={{ fontSize: "1.25rem", marginTop: "var(--space-2)" }}>
              {t("prescan.passTitle")}
            </h2>
            <p className="muted" style={{ marginTop: "var(--space-2)" }}>
              {t("prescan.passBody")}
            </p>
            <div style={{ marginTop: "var(--space-5)", display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setResultDismissed(true);
                  setStep("scout");
                }}
              >
                {t("prescan.gotoScout")}
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setResultDismissed(true);
                  requestPrescan();
                }}
              >
                {t("prescan.rePrescan")}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="eyebrow" style={{ color: "var(--color-danger-red)" }}>
              <span aria-hidden>⚠ </span>{t("prescan.failEyebrow")}
            </p>
            <h2 id="prescan-result-title" style={{ fontSize: "1.25rem", marginTop: "var(--space-2)" }}>
              {t("prescan.failTitle")}
            </h2>
            <p className="muted" style={{ marginTop: "var(--space-2)" }}>
              {t("prescan.failBody")}
            </p>
            <div style={{ marginTop: "var(--space-5)", display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setResultDismissed(true);
                  requestPrescan();
                }}
              >
                {t("prescan.rePrescan")}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

function qualityColor(q: number): string {
  return q >= 0.8 ? "var(--color-success-green)" : q >= 0.4 ? "var(--color-field-amber)" : "var(--color-danger-red)";
}

/**
 * ParamBlock — một cột tham số Niumag: header có checkbox "Auto …", các Field,
 * và hàng nút Scan + View dưới cùng.
 */
function ParamBlock({
  title,
  checked,
  onToggle,
  onScan,
  hasView = false,
  busy,
  warn = false,
  children,
}: {
  title: string;
  checked: boolean;
  onToggle: () => void;
  onScan?: () => void;
  hasView?: boolean;
  busy: boolean;
  /** Viền cảnh báo đỏ/cam khi đây là khối có lỗi cao nhất và chưa đạt quality. */
  warn?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card
      style={{
        padding: "var(--space-3)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
        border: warn ? "1px solid var(--color-danger-red)" : undefined,
        boxShadow: warn ? "0 0 0 1px var(--color-danger-red), 0 0 18px rgba(255,107,107,0.25)" : undefined,
      }}
    >
      <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer" }}>
        <input type="checkbox" checked={checked} onChange={onToggle} disabled={busy} style={{ width: 16, height: 16, accentColor: "var(--color-proton-cyan)" }} />
        <span style={{ fontFamily: "var(--font-data)", fontSize: "0.86rem", fontWeight: 600, color: "var(--color-paper)" }}>{title}</span>
      </label>

      <div style={{ display: "grid", gap: "var(--space-2)", flex: 1 }}>{children}</div>

      <div style={{ display: "flex", gap: "var(--space-2)" }}>
        <Button variant="primary" size="sm" onClick={onScan} disabled={busy} style={{ flex: 1 }}>
          Scan
        </Button>
        {hasView && (
          <Button variant="secondary" size="sm" disabled={busy} style={{ flex: 1 }} onClick={() => { /* View — placeholder */ }}>
            View
          </Button>
        )}
      </div>
    </Card>
  );
}



