import { useMemo, useState } from "react";
import { BlockMath } from "react-katex";
import { LabLayout } from "../../components/learning/LabLayout";
import { Button } from "../../components/ui/Button";
import { ParamSlider } from "../../components/learning/ParamSlider";
import { StatusItem } from "../../components/learning/StatusItem";
import { RichText } from "../../components/learning/RichText";
import { BaseLineChart } from "../../components/charts/BaseLineChart";
import { useT } from "../../i18n/useT";
import { V_MAX, generateFidWithGain, isClipping } from "../../simulations/autoGain";

interface Lesson4AutoGainProps {
  locked: boolean;
  onReopenKnowledge: () => void;
}

export default function Lesson4AutoGain({ locked, onReopenKnowledge }: Lesson4AutoGainProps) {
  const { t } = useT();
  const [prg, setPrg] = useState(2);
  const [p1, setP1] = useState(15);

  const fid = useMemo(() => generateFidWithGain(prg, p1), [prg, p1]);
  const clipping = isClipping(fid);

  return (
    <LabLayout
      title={t("common.lessonN", { n: 4 })}
      theory={
        <>
          <p className="muted">
            <RichText text={t("lesson4.theory", { vmax: V_MAX })} />
          </p>
          <BlockMath math={"V_{ADC}(t) = \\text{clip}\\bigl(G(PRG)\\cdot V_{FID}(t),\\ -V_{max},\\ +V_{max}\\bigr)"} />
        </>
      }
      controls={
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", justifyContent: "space-between", flex: 1 }}>
          <ParamSlider id="prg" label={t("lesson4.prgLabel")} min={0} max={4} step={1} value={prg} disabled={locked} onChange={setPrg} />
          <ParamSlider id="p1" label={t("lesson4.p1Label")} unit="μs" min={5} max={30} step={1} value={p1} disabled={locked} onChange={setP1} />
          <Button variant="ghost" size="md" onClick={onReopenKnowledge}>{t("lab.reviewKnowledge")}</Button>
        </div>
      }
      visualization={
        <BaseLineChart
          labels={fid.map((p) => p.tMs.toFixed(0))}
          series={[{ label: "V_ADC(t)", data: fid.map((p) => p.signal), color: clipping ? "rgba(255,107,107,0.95)" : "rgba(55,215,232,0.95)", fill: true }]}
          xLabel={t("chart.timeMs")}
          yLabel={t("chart.vAdc")}
          height={260}
          ariaLabel={t("lesson4.aria")}
        />
      }
      explanation={
        <p style={{ fontSize: "1rem" }}>
          <span className="mono" style={{ fontSize: "0.78rem", color: "var(--color-field-amber)" }}>{t("common.explainPrefix")}</span>
          {clipping ? t("lesson4.explainClip", { vmax: V_MAX }) : t("lesson4.explainOk")}
        </p>
      }
      reviewQuestion={
        <p className="muted" style={{ fontStyle: "italic" }}>
          {t("lesson4.review")}
        </p>
      }
      statusBar={
        <>
          <StatusItem label="PRG" value={prg} tone="cyan" />
          <StatusItem label={t("lesson4.sThreshold")} value={`±${V_MAX}`} />
          <StatusItem label={t("lesson4.sClip")} value={clipping ? t("common.clippingYes") : t("common.clippingNo")} tone={clipping ? "red" : "default"} />
        </>
      }
      locked={locked}
    />
  );
}
