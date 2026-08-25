import { useMemo, useState } from "react";
import { BlockMath } from "react-katex";
import { LabLayout } from "../../components/learning/LabLayout";
import { Button } from "../../components/ui/Button";
import { ParamSlider } from "../../components/learning/ParamSlider";
import { StatusItem } from "../../components/learning/StatusItem";
import { RichText } from "../../components/learning/RichText";
import { DualChart } from "../../components/charts/DualChart";
import { EchoTrainChart } from "../../components/charts/EchoTrainChart";
import { FitSpectrumChart } from "../../components/charts/FitSpectrumChart";
import { useT } from "../../i18n/useT";
import {
  RELAX_SAMPLES,
  echoTrain,
  fitSpectrum,
  spectrumPeaks,
  type SampleKind,
} from "../../simulations/relaxometry";

interface Lesson11T2CpmgProps {
  locked: boolean;
  onReopenKnowledge: () => void;
}

const SAMPLE_IDS: SampleKind[] = ["oil", "water", "cuso4", "mixture"];

export default function Lesson11T2Cpmg({ locked, onReopenKnowledge }: Lesson11T2CpmgProps) {
  const { t } = useT();
  const [sampleId, setSampleId] = useState<SampleKind>("oil");
  const [te, setTe] = useState(20);
  const [ne, setNe] = useState(16);

  const sample = RELAX_SAMPLES[sampleId];
  const train = useMemo(() => echoTrain(sample.t2Ms, te, ne), [sample, te, ne]);
  const spectrum = useMemo(() => fitSpectrum(sample, "T2"), [sample]);
  const peaks = useMemo(() => spectrumPeaks(sample, "T2"), [sample]);

  const sampleLabel = (id: SampleKind) => t(`common.sample.${id}`);

  return (
    <LabLayout
      title={t("common.lessonN", { n: 11 })}
      theory={
        <>
          <p className="muted">
            <RichText text={t("lesson11.theory")} />
          </p>
          <BlockMath math={"M_{xy}(n\\cdot TE) = M_0\\cdot \\exp(-n\\cdot TE/T_2)"} />
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
          <ParamSlider id="te" label="TE" unit="ms" min={5} max={80} step={5} value={te} disabled={locked} onChange={setTe} />
          <ParamSlider id="ne" label={t("lesson11.neLabel")} min={4} max={40} step={1} value={ne} disabled={locked} onChange={setNe} />
          <Button variant="ghost" size="md" onClick={onReopenKnowledge}>{t("lab.reviewKnowledge")}</Button>
        </div>
      }
      visualization={
        <DualChart
          leftLabel={t("chart.echo")}
          rightLabel={t("chart.specT2")}
          left={<EchoTrainChart points={train} t2Ms={sample.t2Ms} teMs={te} height={220} />}
          right={<FitSpectrumChart points={spectrum} peaks={peaks} xLabel={t("chart.t2Ms")} height={220} />}
        />
      }
      explanation={
        <p style={{ fontSize: "1rem" }}>
          <span className="mono" style={{ fontSize: "0.78rem", color: "var(--color-field-amber)" }}>{t("common.explainPrefix")}</span>
          <RichText text={t("lesson11.explain")} />
        </p>
      }
      reviewQuestion={
        <p className="muted" style={{ fontStyle: "italic" }}>
          <RichText text={t("lesson11.review")} />
        </p>
      }
      statusBar={
        <>
          <StatusItem label={t("lesson11.sSample")} value={sampleLabel(sampleId)} tone="cyan" />
          <StatusItem label={t("lesson11.sT2Fit")} value={`${sample.t2Ms} ms`} tone="amber" />
          <StatusItem label="TE/NE" value={`${te} ms · ${ne}`} />
        </>
      }
      locked={locked}
    />
  );
}
