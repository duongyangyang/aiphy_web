import { useMemo, useState } from "react";
import { BlockMath } from "react-katex";
import { LabLayout } from "../../components/learning/LabLayout";
import { Button } from "../../components/ui/Button";
import { ParamSlider } from "../../components/learning/ParamSlider";
import { StatusItem } from "../../components/learning/StatusItem";
import { RichText } from "../../components/learning/RichText";
import { MriImageCanvas } from "../../components/charts/MriImageCanvas";
import { useT } from "../../i18n/useT";
import { weightingSamples, classifyWeighting, TISSUES } from "../../simulations/weighting";

interface Lesson9WeightingProps {
  locked: boolean;
  onReopenKnowledge: () => void;
}

export default function Lesson9Weighting({ locked, onReopenKnowledge }: Lesson9WeightingProps) {
  const { t } = useT();
  const [tr, setTr] = useState(500);
  const [te, setTe] = useState(20);

  const samples = useMemo(() => weightingSamples(tr, te), [tr, te]);
  const weight = classifyWeighting(tr, te);

  return (
    <LabLayout
      title={t("common.lessonN", { n: 9 })}
      theory={
        <>
          <p className="muted">
            <RichText text={t("lesson9.theory")} />
          </p>
          <BlockMath math={"S \\propto \\rho(H)\\bigl[1-\\exp(-TR/T_1)\\bigr]\\exp(-TE/T_2)"} />
        </>
      }
      controls={
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", justifyContent: "space-between", flex: 1 }}>
          <ParamSlider id="tr" label="TR" unit="ms" min={100} max={3000} step={100} value={tr} disabled={locked} onChange={setTr} />
          <ParamSlider id="te" label="TE" unit="ms" min={5} max={150} step={5} value={te} disabled={locked} onChange={setTe} />
          <Button variant="ghost" size="md" onClick={onReopenKnowledge}>{t("lab.reviewKnowledge")}</Button>
        </div>
      }
      visualization={
        <MriImageCanvas
          samples={samples}
          caption={t("lesson9.caption", { weight, tr, te })}
        />
      }
      explanation={
        <p style={{ fontSize: "1rem" }}>
          <span className="mono" style={{ fontSize: "0.78rem", color: "var(--color-field-amber)" }}>{t("common.explainPrefix")}</span>
          {weight === "T1WI" && t("lesson9.explainT1", { oilT1: TISSUES.oil.t1Ms, waterT1: TISSUES.water.t1Ms })}
          {weight === "T2WI" && t("lesson9.explainT2", { waterT2: TISSUES.water.t2Ms, oilT2: TISSUES.oil.t2Ms })}
          {weight === "PDWI" && t("lesson9.explainPD")}
        </p>
      }
      reviewQuestion={
        <p className="muted" style={{ fontStyle: "italic" }}>
          <RichText text={t("lesson9.review")} />
        </p>
      }
      statusBar={
        <>
          <StatusItem label="TR" value={`${tr} ms`} tone="cyan" />
          <StatusItem label="TE" value={`${te} ms`} tone="amber" />
          <StatusItem label={t("lesson9.sWeight")} value={weight} tone="cyan" />
        </>
      }
      locked={locked}
    />
  );
}
