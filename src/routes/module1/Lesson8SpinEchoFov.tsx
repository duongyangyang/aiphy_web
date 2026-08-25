import { useMemo, useState } from "react";
import { BlockMath } from "react-katex";
import { LabLayout } from "../../components/learning/LabLayout";
import { Button } from "../../components/ui/Button";
import { ParamSlider } from "../../components/learning/ParamSlider";
import { StatusItem } from "../../components/learning/StatusItem";
import { RichText } from "../../components/learning/RichText";
import { MriImageCanvas } from "../../components/charts/MriImageCanvas";
import { useT } from "../../i18n/useT";
import { sampleLayoutForFov } from "../../simulations/spinEchoImage";

interface Lesson8SpinEchoFovProps {
  locked: boolean;
  onReopenKnowledge: () => void;
}

export default function Lesson8SpinEchoFov({ locked, onReopenKnowledge }: Lesson8SpinEchoFovProps) {
  const { t } = useT();
  const [fovRead, setFovRead] = useState(80);
  const [fovPhase, setFovPhase] = useState(80);

  const samples = useMemo(() => sampleLayoutForFov({ fovReadMm: fovRead, fovPhaseMm: fovPhase }), [fovRead, fovPhase]);
  // FOV hướng: Read (ngang) và Phase (dọc) độc lập. 80 mm = mức tham chiếu.
  const fovScaleX = fovRead / 80;
  const fovScaleY = fovPhase / 80;
  const smaller = Math.min(fovScaleX, fovScaleY);

  return (
    <LabLayout
      title={t("common.lessonN", { n: 8 })}
      theory={
        <>
          <p className="muted">
            <RichText text={t("lesson8.theory")} />
          </p>
          <BlockMath math={"FOV_x = \\dfrac{sw}{\\gamma \\cdot G_x}, \\qquad FOV_y = \\dfrac{NE}{\\gamma \\cdot G_y \\cdot D_y}"} />
        </>
      }
      controls={
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", justifyContent: "space-between", flex: 1 }}>
          <ParamSlider id="fov-read" label={t("lesson8.fovReadLabel")} unit="mm" min={40} max={200} step={10} value={fovRead} disabled={locked} onChange={setFovRead} />
          <ParamSlider id="fov-phase" label={t("lesson8.fovPhaseLabel")} unit="mm" min={40} max={200} step={10} value={fovPhase} disabled={locked} onChange={setFovPhase} />
          <Button variant="ghost" size="md" onClick={onReopenKnowledge}>{t("lab.reviewKnowledge")}</Button>
        </div>
      }
      visualization={
        <MriImageCanvas
          samples={samples}
          fovScaleX={fovScaleX}
          fovScaleY={fovScaleY}
          showFovAxes
          caption={t("lesson8.caption", { read: fovRead, phase: fovPhase })}
        />
      }
      explanation={
        <p style={{ fontSize: "1rem" }}>
          <span className="mono" style={{ fontSize: "0.78rem", color: "var(--color-field-amber)" }}>{t("common.explainPrefix")}</span>
          {t("lesson8.explainBase")}{" "}
          {fovRead < 60 || fovPhase < 60
            ? t("lesson8.explainSmall")
            : fovRead > 150 || fovPhase > 150
              ? t("lesson8.explainLarge")
              : t("lesson8.explainMid")}
        </p>
      }
      reviewQuestion={
        <p className="muted" style={{ fontStyle: "italic" }}>
          {t("lesson8.review")}
        </p>
      }
      statusBar={
        <>
          <StatusItem label="FOV Read" value={`${fovRead} mm`} tone="cyan" />
          <StatusItem label="FOV Phase" value={`${fovPhase} mm`} tone="amber" />
          <StatusItem label={t("lesson8.sResolution")} value={smaller < 0.7 ? t("common.resolutionHigh") : smaller > 1.5 ? t("common.resolutionLow") : t("common.resolutionMid")} />
        </>
      }
      locked={locked}
    />
  );
}
