import { useMemo, useState } from "react";
import { BlockMath } from "react-katex";
import { LabLayout } from "../../components/learning/LabLayout";
import { Button } from "../../components/ui/Button";
import { ParamSlider } from "../../components/learning/ParamSlider";
import { StatusItem } from "../../components/learning/StatusItem";
import { RichText } from "../../components/learning/RichText";
import { DualChart } from "../../components/charts/DualChart";
import { BaseLineChart } from "../../components/charts/BaseLineChart";
import { SpectrumChart } from "../../components/charts/SpectrumChart";
import { useT } from "../../i18n/useT";
import { sincEnvelope, softPulseSpectrum } from "../../simulations/softPulse";

interface Lesson6SoftPulseProps {
  locked: boolean;
  onReopenKnowledge: () => void;
}

export default function Lesson6SoftPulse({ locked, onReopenKnowledge }: Lesson6SoftPulseProps) {
  const { t } = useT();
  const [rfa, setRfa] = useState(50);

  const envelope = useMemo(() => sincEnvelope(rfa), [rfa]);
  const spectrum = useMemo(() => softPulseSpectrum(rfa), [rfa]);

  return (
    <LabLayout
      title={t("common.lessonN", { n: 6 })}
      theory={
        <>
          <p className="muted">
            <RichText text={t("lesson6.theory")} />
          </p>
          <BlockMath math={"\\text{Envelope}(t) = RFA \\cdot \\text{sinc}(t) = RFA \\cdot \\dfrac{\\sin(\\pi t)}{\\pi t}"} />
        </>
      }
      controls={
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", justifyContent: "space-between", flex: 1 }}>
          <ParamSlider id="rfa" label={t("lesson6.rfaLabel")} unit="%" min={10} max={100} step={5} value={rfa} disabled={locked} onChange={setRfa} />
          <Button variant="ghost" size="md" onClick={onReopenKnowledge}>{t("lab.reviewKnowledge")}</Button>
          <p className="mono" style={{ fontSize: "0.74rem", color: "var(--color-faint)" }}>
            {t("lesson6.note")}
          </p>
        </div>
      }
      visualization={
        <DualChart
          leftLabel={t("chart.sinc")}
          rightLabel={t("chart.rectSpec")}
          left={
            <BaseLineChart
              labels={envelope.map((p) => p.tUs.toFixed(1))}
              series={[{ label: "Envelope", data: envelope.map((p) => p.amplitude), color: "rgba(55,215,232,0.95)", fill: true }]}
              xLabel={t("chart.timeUs")}
              yLabel={t("chart.amp")}
              yMin={-1}
              yMax={1}
              height={220}
              ariaLabel={t("lesson6.aria")}
            />
          }
          right={<SpectrumChart points={spectrum} height={220} yMin={0} yMax={1} />}
        />
      }
      explanation={
        <p style={{ fontSize: "1rem" }}>
          <span className="mono" style={{ fontSize: "0.78rem", color: "var(--color-field-amber)" }}>{t("common.explainPrefix")}</span>
          <RichText text={t("lesson6.explain")} />
        </p>
      }
      reviewQuestion={
        <p className="muted" style={{ fontStyle: "italic" }}>
          {t("lesson6.review")}
        </p>
      }
      statusBar={
        <>
          <StatusItem label="RFA" value={`${rfa}%`} tone="cyan" />
          <StatusItem label={t("lesson6.sPulseType")} value={t("lesson6.sPulseValue")} tone="amber" />
        </>
      }
      locked={locked}
    />
  );
}
