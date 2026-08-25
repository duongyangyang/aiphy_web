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
import {
  simulateT2starMs,
  fwhmHz,
  generateFid,
  lorentzianSpectrum,
  fidIntegral,
} from "../../simulations/shim";

interface Lesson3ShimmingProps {
  locked: boolean;
  onReopenKnowledge: () => void;
}

export default function Lesson3Shimming({ locked, onReopenKnowledge }: Lesson3ShimmingProps) {
  const { t } = useT();
  const [gx, setGx] = useState(8);
  const [gy, setGy] = useState(8);
  const [gz, setGz] = useState(8);

  const t2star = useMemo(() => simulateT2starMs(gx, gy, gz), [gx, gy, gz]);
  const fwhm = useMemo(() => fwhmHz(t2star), [t2star]);
  const fid = useMemo(() => generateFid(gx, gy, gz), [gx, gy, gz]);
  const spectrum = useMemo(() => lorentzianSpectrum(gx, gy, gz, 0), [gx, gy, gz]);
  const score = useMemo(() => fidIntegral(fid), [fid]);

  const isOptimal = score > 0.6;

  return (
    <LabLayout
      title={t("common.lessonN", { n: 3 })}
      theory={
        <>
          <p className="muted">
            <RichText text={t("lesson3.theory")} />
          </p>
          <BlockMath math={"\\dfrac{1}{T_2^{*}} = \\dfrac{1}{T_2} + \\gamma\\cdot \\Delta B_0,\\qquad FWHM = \\dfrac{1}{\\pi \\cdot T_2^{*}}"} />
        </>
      }
      controls={
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", justifyContent: "space-between", flex: 1 }}>
          <ParamSlider id="gx" label="GxOffset" min={-20} max={20} step={1} value={gx} disabled={locked} onChange={setGx} />
          <ParamSlider id="gy" label="GyOffset" min={-20} max={20} step={1} value={gy} disabled={locked} onChange={setGy} />
          <ParamSlider id="gz" label="GzOffset" min={-20} max={20} step={1} value={gz} disabled={locked} onChange={setGz} />
          <div style={{ padding: "var(--space-3)", border: "1px solid var(--color-line)", borderRadius: "var(--radius-sm)" }}>
            <p className="mono" style={{ fontSize: "0.74rem", color: "var(--color-faint)", margin: 0 }}>{t("common.scoreFid")}</p>
            <p className="mono" style={{ fontSize: "1.4rem", color: isOptimal ? "var(--color-success-green)" : "var(--color-field-amber)", margin: "4px 0 0" }}>
              {(score * 1000).toFixed(0)}
            </p>
            <p className="mono" style={{ fontSize: "0.74rem", color: "var(--color-faint)", margin: 0 }}>
              {isOptimal ? t("lesson3.optimalHint") : t("lesson3.adjustHint")}
            </p>
          </div>
          <Button variant="ghost" size="md" onClick={onReopenKnowledge}>{t("lab.reviewKnowledge")}</Button>
        </div>
      }
      visualization={
        <DualChart
          leftLabel={t("chart.fid")}
          rightLabel={t("chart.spectrum")}
          left={
            <BaseLineChart
              labels={fid.map((p) => p.tMs.toFixed(0))}
              series={[{ label: "S(t)", data: fid.map((p) => p.signal), color: "rgba(55,215,232,0.95)", fill: true }]}
              xLabel={t("chart.timeMs")}
              yLabel={t("chart.amp")}
              height={220}
              ariaLabel={t("lesson3.ariaFid")}
            />
          }
          right={<SpectrumChart points={spectrum} centerHz={0} height={220} />}
        />
      }
      explanation={
        <p style={{ fontSize: "1rem" }}>
          <span className="mono" style={{ fontSize: "0.78rem", color: "var(--color-field-amber)" }}>{t("common.explainPrefix")}</span>
          {isOptimal ? t("lesson3.explainOptimal") : t("lesson3.explainNot")}
        </p>
      }
      reviewQuestion={
        <p className="muted" style={{ fontStyle: "italic" }}>
          <RichText text={t("lesson3.review")} />
        </p>
      }
      statusBar={
        <>
          <StatusItem label={t("lesson3.sT2star")} value={`${t2star.toFixed(1)} ms`} tone="cyan" />
          <StatusItem label="FWHM" value={`${fwhm.toFixed(1)} Hz`} tone="amber" />
          <StatusItem label={t("common.score")} value={(score * 1000).toFixed(0)} />
        </>
      }
      locked={locked}
    />
  );
}
