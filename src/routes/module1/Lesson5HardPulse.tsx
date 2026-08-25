import { useEffect, useMemo, useState } from "react";
import { BlockMath } from "react-katex";
import { LabLayout } from "../../components/learning/LabLayout";
import { Button } from "../../components/ui/Button";
import { ParamSlider } from "../../components/learning/ParamSlider";
import { StatusItem } from "../../components/learning/StatusItem";
import { AmplitudeChart } from "../../components/charts/AmplitudeChart";
import { RichText } from "../../components/learning/RichText";
import { useT } from "../../i18n/useT";
import { amplitudeVsP1, flipAngleFromP1, findFlipMarks } from "../../simulations/hardPulse";

interface Lesson5HardPulseProps {
  locked: boolean;
  onReopenKnowledge: () => void;
}

export default function Lesson5HardPulse({ locked, onReopenKnowledge }: Lesson5HardPulseProps) {
  const { t } = useT();
  const [p1, setP1] = useState(15);
  const [scanning, setScanning] = useState(false);

  const points = useMemo(() => amplitudeVsP1(), []);
  const marks = findFlipMarks();
  const theta = flipAngleFromP1(p1);

  // Quét P1 từ 1 → 30.
  useEffect(() => {
    if (!scanning) return;
    let v = 1;
    const reduceMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stepMs = reduceMotion ? 350 : 500;
    const id = window.setInterval(() => {
      if (v >= 30) {
        setScanning(false);
        return;
      }
      v += 1;
      setP1(v);
    }, stepMs);
    return () => window.clearInterval(id);
  }, [scanning]);

  const at90 = Math.abs(theta - 90) < 6;
  const at180 = Math.abs(theta - 180) < 6;

  return (
    <LabLayout
      title={t("common.lessonN", { n: 5 })}
      theory={
        <>
          <p className="muted">
            <RichText text={t("lesson5.theory")} />
          </p>
          <BlockMath math={"V(t) \\propto M_0 \\sin(\\theta)\\cos(\\omega_0 t)\\exp(-t/T_2^{*}),\\quad \\theta = \\gamma B_1 \\tau"} />
        </>
      }
      controls={
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", justifyContent: "space-between", flex: 1 }}>
          <ParamSlider id="p1" label={t("lesson5.p1Label")} unit="μs" min={1} max={30} step={1} value={p1} disabled={locked || scanning} onChange={setP1} />
          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
            <Button variant="primary" size="md" disabled={locked || scanning} onClick={() => setScanning(true)}>
              {scanning ? t("common.scanning") : t("lesson5.scanBtn")}
            </Button>
            <Button variant="ghost" size="md" onClick={onReopenKnowledge}>{t("lab.reviewKnowledge")}</Button>
          </div>
        </div>
      }
      visualization={
        <AmplitudeChart
          points={points}
          currentP1={p1}
          marks={[{ index: points.findIndex((p) => Math.abs(p.flipAngleDeg - 90) < 1), label: "90°" }, { index: points.findIndex((p) => Math.abs(p.flipAngleDeg - 180) < 1), label: "180°" }]}
          height={260}
        />
      }
      explanation={
        <p style={{ fontSize: "1rem" }}>
          <span className="mono" style={{ fontSize: "0.78rem", color: "var(--color-field-amber)" }}>{t("common.explainPrefix")}</span>
          {at90 ? t("lesson5.explain90", { p1, theta: theta.toFixed(0) }) : at180 ? t("lesson5.explain180", { p1, theta: theta.toFixed(0) }) : t("lesson5.explainMid", { p1, theta: theta.toFixed(0) })}
        </p>
      }
      reviewQuestion={
        <p className="muted" style={{ fontStyle: "italic" }}>
          {t("lesson5.review")}
        </p>
      }
      statusBar={
        <>
          <StatusItem label="P1" value={`${p1} μs`} tone="cyan" />
          <StatusItem label="θ" value={`${theta.toFixed(0)}°`} tone="amber" />
          <StatusItem label={t("lesson5.sP190")} value={`${marks.p90} μs`} />
        </>
      }
      locked={locked}
    />
  );
}
