import { useEffect, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Toast } from "../../components/ui/Toast";
import { useModule2Store } from "../../stores/module2Store";
import {
  MODULE2_STEPS,
  NAV_STEPS,
  stepBlockReason,
  type ModuleStep,
} from "../../stores/module2Types";
import { useT } from "../../i18n/useT";
import { formatTime } from "../../i18n/format";
import { PrescanStep } from "./steps/PrescanStep";
import { ScoutStep } from "./steps/ScoutStep";
import { ScanSetupStep } from "./steps/ScanSetupStep";
import { ScanningStep } from "./steps/ScanningStep";
import { ImageProcessingStep } from "./steps/ImageProcessingStep";

/**
 * Module2Shell — khung điều hướng cho Module 2:
 *  - Thanh bước NGANG trên đầu (Prescan → Scout → Scan setup → Processing).
 *    Không có "Scan" vì Scan là lệnh chạy trong Scan setup, không phải bước.
 *  - Sidebar trái: thông tin phiên (Receiving Coil, Sample/Time/Tester) +
 *    tiến trình (progress job + nút Prescan/Scout/Stop).
 *  - Vùng chính: nội dung theo `currentStep`.
 *
 * Sidebar và các màn hình cùng đọc `useModule2Store` (Zustand). Nút "Prescan"
 * chỉ phát `requestPrescan()`; PrescanStep lắng nghe và tự chạy tuần tự 4 khối.
 */

/** Options cho dropdown Receiving Coil (đường kính cuộn thu). */
const COIL_OPTIONS = ["5mm", "10mm", "15mm", "20mm"];

export function Module2Shell() {
  const { t, tr } = useT();
  const currentStep = useModule2Store((s) => s.currentStep);
  const setStep = useModule2Store((s) => s.setStep);
  const activeMeta = MODULE2_STEPS.find((s) => s.key === currentStep) ?? MODULE2_STEPS[0];
  const [toast, setToast] = useState<{ msg: string; tone: "warn" | "info" | "success" } | null>(null);

  // Chuyển bước có gating: nếu target chưa mở khoá → hiện toast cảnh báo, không
  // chuyển. Đọc snapshot đầy đủ qua getState() để tránh re-render dư.
  const goToStep = (target: ModuleStep) => {
    const reason = stepBlockReason(useModule2Store.getState(), target);
    if (reason) {
      setToast({ msg: tr(reason), tone: "warn" });
      return;
    }
    setStep(target);
  };

  return (
    <div className="container" style={{ padding: "var(--space-5) var(--space-5) var(--space-8)", display: "grid", gap: "var(--space-4)" }}>
      <StepBar currentStep={currentStep} onNavigate={goToStep} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(220px, 260px) minmax(0, 1fr)",
          gap: "var(--space-5)",
          alignItems: "start",
        }}
      >
        <Sidebar onNavigate={goToStep} />

        <main aria-label={t("module2.contentAria")} style={{ display: "grid", gap: "var(--space-4)" }}>
          <Card style={{ padding: "var(--space-3) var(--space-4)" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)", flexWrap: "wrap" }}>
              <p className="eyebrow" style={{ margin: 0 }}>Module 2 · MRI Simulator</p>
              <h1 style={{ fontSize: "1.02rem", fontWeight: 600, margin: 0 }}>{tr(activeMeta.title)}</h1>
            </div>
            <p className="mono" style={{ maxWidth: "90ch", marginTop: "var(--space-1)", marginBottom: 0, fontSize: "0.76rem", color: "var(--color-muted)" }}>
              {tr(activeMeta.hint)}
            </p>
          </Card>

          <StepContent step={currentStep} />
        </main>
      </div>

      {toast ? <Toast tone={toast.tone} message={toast.msg} onClose={() => setToast(null)} autoDismissMs={6000} /> : null}
    </div>
  );
}

/**
 * StepBar — thanh quy trình chụp NẰM NGANG trên đầu. Mỗi bước là 1 chip; bước
 * đã qua đánh dấu ✓. Bấm để chuyển bước qua `onNavigate` (có gating: bước chưa
 * mở khoá → toast cảnh báo, không chuyển).
 */
function StepBar({ currentStep, onNavigate }: { currentStep: ModuleStep; onNavigate: (step: ModuleStep) => void }) {
  const { t } = useT();
  const idx = NAV_STEPS.findIndex((s) => s.key === currentStep);

  return (
    <Card style={{ padding: "var(--space-3) var(--space-4)" }}>
      <nav aria-label={t("module2.navAria")} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
        {NAV_STEPS.map((s, i) => {
          const active = s.key === currentStep;
          const done = idx >= 0 && i < idx;
          return (
            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <button
                type="button"
                onClick={() => onNavigate(s.key)}
                aria-current={active ? "step" : undefined}
                className="mono"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  padding: "8px 14px",
                  minHeight: 40,
                  fontFamily: "var(--font-data)",
                  fontSize: "0.82rem",
                  color: active ? "var(--color-paper)" : done ? "var(--color-muted)" : "var(--color-faint)",
                  background: active ? "rgba(55,215,232,0.12)" : "transparent",
                  border: active ? "1px solid var(--color-proton-cyan)" : "1px solid var(--color-line)",
                  borderRadius: 999,
                  cursor: "pointer",
                  transition: "background 0.12s ease, border-color 0.12s ease",
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    flex: "0 0 auto",
                    fontSize: "0.68rem",
                    color: active ? "#06222b" : "inherit",
                    background: active
                      ? "var(--color-proton-cyan)"
                      : done
                      ? "rgba(76,217,161,0.18)"
                      : "transparent",
                  }}
                >
                  {done ? "✓" : i + 1}
                </span>
                {s.tab}
              </button>
              {i < NAV_STEPS.length - 1 && (
                <span aria-hidden style={{ color: "var(--color-faint)", fontSize: "0.9rem" }}>
                  →
                </span>
              )}
            </div>
          );
        })}
      </nav>
    </Card>
  );
}

/** Render nội dung thật cho từng bước; bước chưa dựng giữ placeholder. */
function StepContent({ step }: { step: ModuleStep }) {
  switch (step) {
    case "prescan":
      return <PrescanStep />;
    case "scout":
      return <ScoutStep />;
    case "scanSetup":
      return <ScanSetupStep />;
    case "scanning":
      return <ScanningStep />;
    case "imageProcessing":
      return <ImageProcessingStep />;
    default:
      return <StepPlaceholder step={step} />;
  }
}

function Sidebar({ onNavigate }: { onNavigate: (step: ModuleStep) => void }) {
  const { t } = useT();
  const currentStep = useModule2Store((s) => s.currentStep);
  const setStep = useModule2Store((s) => s.setStep);
  const reset = useModule2Store((s) => s.reset);
  const requestPrescan = useModule2Store((s) => s.requestPrescan);
  const requestScout = useModule2Store((s) => s.requestScout);
  const requestStop = useModule2Store((s) => s.requestStop);
  const receivingCoil = useModule2Store((s) => s.receivingCoil);
  const setReceivingCoil = useModule2Store((s) => s.setReceivingCoil);
  const sample = useModule2Store((s) => s.sample);
  const tester = useModule2Store((s) => s.tester);
  const prescanJob = useModule2Store((s) => s.prescanJob);
  const scoutJob = useModule2Store((s) => s.scoutJob);
  const calibration = useModule2Store((s) => s.calibration);
  const scoutImages = useModule2Store((s) => s.scoutImages);

  // Job hiển thị trên progress bar = job nào đang chạy (prescan hoặc scout).
  const activeJob = prescanJob ?? scoutJob;
  const prescanDone = !!calibration;
  const scoutDone = !!scoutImages;
  // Scan được BẬT khi đã ở/qua bước Scan setup (đã có ảnh scout).
  const scanEnabled = currentStep === "scanSetup" || currentStep === "scanning";

  return (
    <aside style={{ position: "sticky", top: 80, display: "grid", gap: "var(--space-4)" }}>
      {/* Thông tin phiên + cuộn thu */}
      <Card style={{ padding: "var(--space-4)" }}>
        <p className="eyebrow" style={{ marginBottom: "var(--space-3)" }}>
          {t("module2.session")}
        </p>
        <label style={{ display: "grid", gap: "var(--space-1)", marginBottom: "var(--space-3)" }}>
          <span className="mono" style={{ fontSize: "0.72rem", color: "var(--color-muted)" }}>
            Receiving Coil
          </span>
          <select
            value={receivingCoil}
            onChange={(e) => setReceivingCoil(e.target.value)}
            className="mono"
            style={{
              width: "100%",
              padding: "8px 10px",
              minHeight: 40,
              fontFamily: "var(--font-data)",
              fontSize: "0.84rem",
              color: "var(--color-paper)",
              background: "var(--color-bore-2)",
              border: "1px solid var(--color-line-strong)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            {COIL_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <div style={{ display: "grid", gap: "var(--space-1)", fontFamily: "var(--font-data)", fontSize: "0.76rem" }}>
          <MetaRow k="Sample" v={sample} />
          <MetaRow k="Time" v={<Clock />} />
          <MetaRow k="Tester" v={tester} />
        </div>
      </Card>

      {/* Progress + trạng thái job đang chạy */}
      <Card style={{ padding: "var(--space-4)" }}>
        <p className="eyebrow" style={{ marginBottom: "var(--space-3)" }}>
          {t("module2.progress")}
        </p>
        <JobProgress job={activeJob} />
        <div style={{ display: "grid", gap: "var(--space-2)", marginTop: "var(--space-4)" }}>
          {/* Prescan: nổi bật khi đang ở bước prescan; nếu đã xong → ✓ xanh lá. */}
          <ActionButton
            label="Prescan"
            active={currentStep === "prescan"}
            done={prescanDone}
            running={!!prescanJob}
            disabled={!!activeJob}
            onClick={requestPrescan}
          />
          {/* Scout: teal khi đang ở bước scout (glow khi chạy); ✓ khi đã xong.
              Nhảy sang scout qua onNavigate (có gating prescan); đang ở scout
              thì nút này phát lệnh chụp. */}
          <ActionButton
            label="Scout"
            active={currentStep === "scout"}
            running={!!scoutJob}
            done={scoutDone && currentStep !== "scout"}
            disabled={!!activeJob}
            onClick={() => (currentStep === "scout" ? requestScout() : onNavigate("scout"))}
          />
          {/* Scan: BẬT khi đã ở/qua Scan setup — teal khi scanning (glow), ✓ khi xong.
              disabled đã chặn khi chưa scanEnabled (chưa qua scout), nên nhấn =
              setStep thẳng, không cần gating lại. */}
          <ActionButton
            label="Scan"
            active={scanEnabled}
            running={currentStep === "scanning"}
            done={currentStep === "imageProcessing"}
            disabled={!scanEnabled || !!activeJob}
            onClick={() => setStep("scanning")}
          />
          <Button variant="danger" size="md" onClick={() => { requestStop(); reset(); }} style={{ width: "100%" }}>
            Stop
          </Button>
        </div>
      </Card>
    </aside>
  );
}

/**
 * ActionButton — nút hành động sidebar với trạng thái theo currentStep:
 *  - active: nổi bật màu teal (viền + nền proton-cyan), giống nút Prescan
 *    active trước đây.
 *  - running: thêm glow/pulse nhẹ (animation m2-pulse trong tokens.css).
 *  - done: icon ✓ xanh lá bên cạnh nhãn (báo bước đã hoàn tất).
 */
function ActionButton({
  label,
  active,
  running = false,
  done = false,
  disabled = false,
  onClick,
}: {
  label: string;
  active: boolean;
  running?: boolean;
  done?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const { t } = useT();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={running ? "m2-pulse" : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-2)",
        width: "100%",
        minHeight: 44,
        padding: "10px 18px",
        fontFamily: "var(--font-body)",
        fontSize: "0.92rem",
        fontWeight: 500,
        borderRadius: "var(--radius-sm)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        color: active ? "#06222b" : "var(--color-paper)",
        background: active
          ? "linear-gradient(180deg, var(--color-proton-cyan), #2bb9c9)"
          : "transparent",
        border: active
          ? "1px solid var(--color-proton-cyan)"
          : "1px solid var(--color-line-strong)",
        transition: "background 0.14s ease, border-color 0.14s ease",
      }}
    >
      {label}
      {done && (
        <span aria-label={t("module2.stepDoneAria")} style={{ color: active ? "#06222b" : "var(--color-success-green)", fontSize: "0.9rem" }}>
          ✓
        </span>
      )}
    </button>
  );
}

/** Đồng hồ thời gian thực (dòng "Time" trong metadata). */
function Clock() {
  const { locale } = useT();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return <>{formatTime(now, locale, { hour12: false })}</>;
}

/**
 * JobProgress — progress bar đỏ/hồng với % đè lên thanh + dòng trạng thái
 * "Auto Shimming... (00:01:32)". Đồng hồ chạy mỗi giây trong lúc có job.
 */
function JobProgress({ job }: { job: { label: string; progress: number; startedAt: number } | null }) {
  const { t } = useT();
  const [, tick] = useState(0);
  useEffect(() => {
    if (!job) return;
    const id = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [job]);

  const pct = job ? job.progress : 0;
  const elapsed = job ? Math.floor((Date.now() - job.startedAt) / 1000) : 0;

  return (
    <div>
      <div
        style={{
          position: "relative",
          height: 20,
          background: "var(--color-bore-2)",
          borderRadius: 999,
          overflow: "hidden",
          border: "1px solid var(--color-line)",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: "linear-gradient(90deg, #ff6b6b, #ff8fb0)",
            transition: "width 0.12s linear",
          }}
        />
        <span
          className="mono"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.72rem",
            fontWeight: 600,
            color: "var(--color-paper)",
            textShadow: "0 1px 2px rgba(0,0,0,0.6)",
          }}
        >
          {pct.toFixed(0)}%
        </span>
      </div>
      <p className="mono" style={{ fontSize: "0.76rem", color: "var(--color-muted)", marginTop: "var(--space-2)" }}>
        {job ? `${job.label}... (${formatElapsed(elapsed)})` : t("module2.ready")}
      </p>
    </div>
  );
}

function formatElapsed(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function MetaRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-2)" }}>
      <span style={{ color: "var(--color-faint)" }}>{k}</span>
      <span style={{ color: "var(--color-paper)" }}>{v}</span>
    </div>
  );
}

function StepPlaceholder({ step }: { step: ModuleStep }) {
  const { t } = useT();
  const meta = MODULE2_STEPS.find((s) => s.key === step);
  const tab = meta?.tab ?? step;
  return (
    <Card>
      <p className="eyebrow">{t("module2.placeholderEyebrow", { tab })}</p>
      <div
        style={{
          marginTop: "var(--space-4)",
          padding: "var(--space-7)",
          textAlign: "center",
          border: "1px dashed var(--color-line-strong)",
          borderRadius: "var(--radius-md)",
          background: "rgba(55,215,232,0.03)",
        }}
      >
        <p className="mono" style={{ color: "var(--color-muted)", fontSize: "0.9rem", margin: 0 }}>
          {t("module2.placeholderBody", { tab })}
        </p>
      </div>
    </Card>
  );
}
