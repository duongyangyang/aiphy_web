import { useMemo, useState } from "react";
import { BlockMath } from "react-katex";
import { LabLayout } from "../../components/learning/LabLayout";
import { Button } from "../../components/ui/Button";
import { ParamSlider } from "../../components/learning/ParamSlider";
import { StatusItem } from "../../components/learning/StatusItem";
import { MriImageCanvas } from "../../components/charts/MriImageCanvas";
import { useT } from "../../i18n/useT";
import {
  isResonanceComplete,
  isShimComplete,
  isSoftPulseComplete,
  canImage,
  completedSteps,
  type PrescanParams,
} from "../../simulations/prescan";
import { prescanSampleImage } from "../../simulations/spinEchoImage";

interface Lesson7PrescanProps {
  locked: boolean;
  onReopenKnowledge: () => void;
}

// Công thức Bài 7 — có chữ giải thích trong \text{...}, dịch theo locale.
const PRESCAN_FORMULA = {
  vi: "\\text{Prescan} = [\\text{tìm } O1] \\to [\\text{shim}] \\to [\\text{xung mềm } RFA]",
  en: "\\text{Prescan} = [\\text{find } O1] \\to [\\text{shim}] \\to [\\text{soft pulse } RFA]",
  zh: "\\text{Prescan} = [\\text{寻找 } O1] \\to [\\text{匀场}] \\to [\\text{软脉冲 } RFA]",
};

export default function Lesson7Prescan({ locked, onReopenKnowledge }: Lesson7PrescanProps) {
  const { t, tr } = useT();
  const [params, setParams] = useState<PrescanParams>({
    o1Hz: 5000,
    gx: 10,
    gy: 10,
    gz: 10,
    rfaPercent: 30,
  });

  const done = useMemo(() => completedSteps(params), [params]);
  const ready = canImage(params);
  const samples = useMemo(() => prescanSampleImage(), []);

  function set<K extends keyof PrescanParams>(key: K, value: number) {
    setParams((p) => ({ ...p, [key]: value }));
  }

  const steps = [
    { n: 1, label: t("lesson7.step1"), complete: isResonanceComplete(params) },
    { n: 2, label: t("lesson7.step2"), complete: isShimComplete(params) },
    { n: 3, label: t("lesson7.step3"), complete: isSoftPulseComplete(params) },
  ];

  return (
    <LabLayout
      title={t("common.lessonN", { n: 7 })}
      theory={
        <>
          <p className="muted">
            {t("lesson7.theory")}
          </p>
          <BlockMath math={tr(PRESCAN_FORMULA)} />
        </>
      }
      controls={
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", justifyContent: "space-between", flex: 1 }}>
          <StepCard step={1} label={t("lesson7.step1")} done={isResonanceComplete(params)}>
            <ParamSlider id="p7-o1" label="O1" unit="Hz" min={-50000} max={50000} step={1000} value={params.o1Hz} disabled={locked} onChange={(v) => set("o1Hz", v)} />
          </StepCard>
          <StepCard step={2} label={t("lesson7.step2")} done={isShimComplete(params)}>
            <ParamSlider id="p7-gx" label="Gx" min={-20} max={20} step={1} value={params.gx} disabled={locked} onChange={(v) => set("gx", v)} />
            <ParamSlider id="p7-gy" label="Gy" min={-20} max={20} step={1} value={params.gy} disabled={locked} onChange={(v) => set("gy", v)} />
            <ParamSlider id="p7-gz" label="Gz" min={-20} max={20} step={1} value={params.gz} disabled={locked} onChange={(v) => set("gz", v)} />
          </StepCard>
          <StepCard step={3} label={t("lesson7.step3")} done={isSoftPulseComplete(params)}>
            <ParamSlider id="p7-rfa" label="RFA" unit="%" min={10} max={100} step={5} value={params.rfaPercent} disabled={locked} onChange={(v) => set("rfaPercent", v)} />
          </StepCard>
          <Button variant="ghost" size="md" onClick={onReopenKnowledge}>{t("lab.reviewKnowledge")}</Button>
        </div>
      }
      visualization={
        <div>
          <p className="eyebrow">{t("lesson7.scanEyebrow")}</p>
          {ready ? (
            <MriImageCanvas samples={samples} caption={t("lesson7.readyCaption")} />
          ) : (
            <div style={{ padding: "var(--space-6)", border: "1px dashed var(--color-line)", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
              <p className="mono" style={{ color: "var(--color-faint)" }}>{t("lesson7.lockedHint")}</p>
            </div>
          )}
        </div>
      }
      explanation={
        <p style={{ fontSize: "1rem" }}>
          <span className="mono" style={{ fontSize: "0.78rem", color: "var(--color-field-amber)" }}>{t("common.explainPrefix")}</span>
          {ready
            ? t("lesson7.explainReady")
            : t("lesson7.explainProgress", { done: done.length - (ready ? 1 : 0) })}
        </p>
      }
      reviewQuestion={
        <p className="muted" style={{ fontStyle: "italic" }}>
          {t("lesson7.review")}
        </p>
      }
      statusBar={
        <>
          {steps.map((s) => (
            <StatusItem key={s.n} label={t("module1.stepN", { n: s.n })} value={s.complete ? "✓" : "—"} tone={s.complete ? "cyan" : "default"} />
          ))}
          <StatusItem label={t("lesson7.sReady")} value={ready ? t("common.readyYes") : t("common.readyNo")} tone={ready ? "amber" : "red"} />
        </>
      }
      locked={locked}
    />
  );
}

function StepCard({ step, label, done, children }: { step: number; label: string; done: boolean; children: React.ReactNode }) {
  const { t } = useT();
  return (
    <div style={{ padding: "var(--space-3)", border: `1px solid ${done ? "var(--color-success-green)" : "var(--color-line)"}`, borderRadius: "var(--radius-sm)", display: "grid", gap: "var(--space-3)" }}>
      <p className="mono" style={{ fontSize: "0.78rem", color: done ? "var(--color-success-green)" : "var(--color-muted)", margin: 0 }}>
        {t("lesson7.stepLabel", { n: step, label })} {done ? "✓" : ""}
      </p>
      {children}
    </div>
  );
}
