import { useMemo, useState } from "react";
import { BlockMath } from "react-katex";
import { LabLayout } from "../../components/learning/LabLayout";
import { Button } from "../../components/ui/Button";
import { ParamSlider } from "../../components/learning/ParamSlider";
import { StatusItem } from "../../components/learning/StatusItem";
import { RichText } from "../../components/learning/RichText";
import { BaseLineChart } from "../../components/charts/BaseLineChart";
import { useT } from "../../i18n/useT";
import {
  computeB0,
  computeFLarmorMHz,
  driftSeries,
  ppmPerMin,
  totalDriftHz,
  GAMMA_MHZ_PER_T,
} from "../../simulations/fieldStability";

interface Lesson2FieldStabilityProps {
  locked: boolean;
  onReopenKnowledge: () => void;
}

// Tần số Larmor mặc định (MHz) — giả lập máy EDUMR ~0.55T.
const F_LARMOR_MHZ = 23.4;
const F_LARMOR_HZ = F_LARMOR_MHZ * 1e6;

// Công thức Bài 2 — có chữ giải thích trong \text{...}, dịch theo locale.
const STABILITY_FORMULA = {
  vi: "B_0 = \\dfrac{f_{Larmor}}{42.58}\\ \\bigl(\\text{T}\\bigr),\\quad \\text{Độ ổn định} = \\dfrac{\\Delta f}{f_{Larmor}} \\times 10^{6} \\times \\dfrac{1}{\\Delta t}\\ \\bigl(\\text{ppm/phút}\\bigr)",
  en: "B_0 = \\dfrac{f_{Larmor}}{42.58}\\ \\bigl(\\text{T}\\bigr),\\quad \\text{Stability} = \\dfrac{\\Delta f}{f_{Larmor}} \\times 10^{6} \\times \\dfrac{1}{\\Delta t}\\ \\bigl(\\text{ppm/min}\\bigr)",
  zh: "B_0 = \\dfrac{f_{Larmor}}{42.58}\\ \\bigl(\\text{T}\\bigr),\\quad \\text{稳定性} = \\dfrac{\\Delta f}{f_{Larmor}} \\times 10^{6} \\times \\dfrac{1}{\\Delta t}\\ \\bigl(\\text{ppm/分钟}\\bigr)",
};

export default function Lesson2FieldStability({ locked, onReopenKnowledge }: Lesson2FieldStabilityProps) {
  const { t, tr } = useT();
  const [tMin, setTMin] = useState(30);
  const [guessB0, setGuessB0] = useState("");

  const series = useMemo(() => driftSeries(tMin, F_LARMOR_HZ), [tMin]);
  const drift = totalDriftHz(series);
  const stability = ppmPerMin(drift, F_LARMOR_HZ, tMin);
  const b0Real = computeB0(F_LARMOR_MHZ);

  const guessNum = Number(guessB0);
  const guessValid = !Number.isNaN(guessNum) && guessNum > 0;
  const guessFLarmor = guessValid ? computeFLarmorMHz(guessNum) : null;

  return (
    <LabLayout
      title={t("common.lessonN", { n: 2 })}
      theory={
        <>
          <p className="muted">
            <RichText text={t("lesson2.theory", { gamma: GAMMA_MHZ_PER_T })} />
          </p>
          <BlockMath math={tr(STABILITY_FORMULA)} />
        </>
      }
      controls={
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", justifyContent: "space-between", flex: 1 }}>
          <ParamSlider
            id="drift-time"
            label={t("lesson2.driftLabel")}
            unit={t("lesson2.driftUnit")}
            min={0}
            max={30}
            step={1}
            value={tMin}
            disabled={locked}
            onChange={setTMin}
          />
          <div>
            <label
              htmlFor="guess-b0"
              style={{ fontFamily: "var(--font-data)", fontSize: "0.82rem", color: "var(--color-muted)" }}
            >
              {t("lesson2.guessLabel")}
            </label>
            <input
              id="guess-b0"
              type="number"
              step="0.01"
              placeholder={t("lesson2.guessPlaceholder")}
              disabled={locked}
              value={guessB0}
              onChange={(e) => setGuessB0(e.target.value)}
              style={inputStyle}
            />
            <p className="mono" style={{ fontSize: "0.8rem", color: "var(--color-proton-cyan)", marginTop: "var(--space-2)" }}>
              {guessFLarmor !== null ? t("lesson2.guessResult", { mhz: guessFLarmor.toFixed(2) }) : t("lesson2.guessHint")}
            </p>
          </div>
          <Button variant="ghost" size="md" onClick={onReopenKnowledge}>
            {t("lab.reviewKnowledge")}
          </Button>
        </div>
      }
      visualization={
        <BaseLineChart
          labels={series.map((p) => p.tMin.toFixed(0))}
          series={[{ label: "f Larmor (Hz)", data: series.map((p) => p.freqHz), color: "rgba(55,215,232,0.95)", fill: true }]}
          xLabel={t("chart.timeMin")}
          yLabel={t("chart.freqHz")}
          height={260}
          ariaLabel={t("lesson2.ariaDrift")}
        />
      }
      explanation={
        <p style={{ fontSize: "1rem" }}>
          <span className="mono" style={{ fontSize: "0.78rem", color: "var(--color-field-amber)" }}>{t("common.explainPrefix")}</span>
          {t("lesson2.explain", {
            tmin: tMin,
            drift: drift.toFixed(1),
            stability: stability.toFixed(2),
            mhz: (3 * GAMMA_MHZ_PER_T).toFixed(1),
          })}
        </p>
      }
      reviewQuestion={
        <p className="muted" style={{ fontStyle: "italic" }}>
          {t("lesson2.review")}
        </p>
      }
      statusBar={
        <>
          <StatusItem label={t("lesson2.sF")} value={`${F_LARMOR_MHZ} MHz`} tone="cyan" />
          <StatusItem label={t("lesson2.sB0")} value={`${b0Real.toFixed(3)} T`} tone="amber" />
          <StatusItem label={t("lesson2.sStability")} value={`${stability.toFixed(2)} ${t("unit.ppmPerMin")}`} />
        </>
      }
      locked={locked}
    />
  );
}

const inputStyle: React.CSSProperties = {
  minHeight: 44,
  padding: "10px 12px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--color-line)",
  background: "rgba(234,246,248,0.04)",
  color: "var(--color-paper)",
  fontFamily: "var(--font-data)",
  width: "100%",
  marginTop: "var(--space-2)",
};
