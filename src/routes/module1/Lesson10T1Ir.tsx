import { useMemo, useState } from "react";
import { BlockMath } from "react-katex";
import { LabLayout } from "../../components/learning/LabLayout";
import { Button } from "../../components/ui/Button";
import { ParamSlider } from "../../components/learning/ParamSlider";
import { StatusItem } from "../../components/learning/StatusItem";
import { RichText } from "../../components/learning/RichText";
import { DualChart } from "../../components/charts/DualChart";
import { RecoveryChart } from "../../components/charts/RecoveryChart";
import { FitSpectrumChart } from "../../components/charts/FitSpectrumChart";
import { useT } from "../../i18n/useT";
import {
  RELAX_SAMPLES,
  recoveryCurve,
  fitSpectrum,
  spectrumPeaks,
  type SampleKind,
} from "../../simulations/relaxometry";

interface Lesson10T1IrProps {
  locked: boolean;
  onReopenKnowledge: () => void;
}

const SAMPLE_IDS: SampleKind[] = ["oil", "water", "cuso4", "mixture"];

export default function Lesson10T1Ir({ locked, onReopenKnowledge }: Lesson10T1IrProps) {
  const { t } = useT();
  const [sampleId, setSampleId] = useState<SampleKind>("oil");
  const [nti, setNti] = useState(8);

  const sample = RELAX_SAMPLES[sampleId];
  const tiMax = sample.t1Ms * 4;
  const curve = useMemo(() => recoveryCurve(sample.t1Ms, tiMax, nti), [sample, tiMax, nti]);
  const spectrum = useMemo(() => fitSpectrum(sample, "T1"), [sample]);
  const peaks = useMemo(() => spectrumPeaks(sample, "T1"), [sample]);

  const sampleLabel = (id: SampleKind) =>
    t(`common.sample.${id === "cuso4" ? "cuso4" : id}`);

  return (
    <LabLayout
      title={t("common.lessonN", { n: 10 })}
      theory={
        <>
          <p className="muted">
            <RichText text={t("lesson10.theory")} />
          </p>
          <BlockMath math={"M_z(TI) = M_0\\bigl[1-2\\exp(-TI/T_1)\\bigr]"} />
        </>
      }
      controls={
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", justifyContent: "space-between", flex: 1 }}>
          <div>
            <p className="mono" style={{ fontSize: "0.78rem", color: "var(--color-muted)", margin: 0 }}>{t("common.selectSample")}</p>
            <div style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap", marginTop: "var(--space-2)" }}>
              {SAMPLE_IDS.map((id) => (
                <Button
                  key={id}
                  variant={sampleId === id ? "primary" : "secondary"}
                  size="sm"
                  disabled={locked}
                  onClick={() => setSampleId(id)}
                >
                  {sampleLabel(id)}
                </Button>
              ))}
            </div>
          </div>
          <ParamSlider id="nti" label={t("lesson10.ntiLabel")} min={4} max={20} step={1} value={nti} disabled={locked} onChange={setNti} />
          <Button variant="ghost" size="md" onClick={onReopenKnowledge}>{t("lab.reviewKnowledge")}</Button>
          <p className="mono" style={{ fontSize: "0.74rem", color: "var(--color-faint)" }}>
            {t("lesson10.note")}
          </p>
        </div>
      }
      visualization={
        <DualChart
          leftLabel={t("chart.recovery")}
          rightLabel={t("chart.specT1")}
          left={<RecoveryChart curve={curve} t1Ms={sample.t1Ms} height={220} />}
          right={<FitSpectrumChart points={spectrum} peaks={peaks} xLabel={t("chart.t1Ms")} height={220} />}
        />
      }
      explanation={
        <p style={{ fontSize: "1rem" }}>
          <span className="mono" style={{ fontSize: "0.78rem", color: "var(--color-field-amber)" }}>{t("common.explainPrefix")}</span>
          {sampleId === "mixture"
            ? t("lesson10.explainMix")
            : t("lesson10.explainSingle", { t1: sample.t1Ms, sample: sampleLabel(sampleId) })}
        </p>
      }
      reviewQuestion={
        <p className="muted" style={{ fontStyle: "italic" }}>
          <RichText text={t("lesson10.review")} />
        </p>
      }
      statusBar={
        <>
          <StatusItem label={t("lesson10.sSample")} value={sampleLabel(sampleId)} tone="cyan" />
          <StatusItem label={t("lesson10.sT1Fit")} value={`${sample.t1Ms} ms`} tone="amber" />
          <StatusItem label={t("lesson10.sPeaks")} value={peaks.length} />
        </>
      }
      locked={locked}
    />
  );
}
