import { useEffect, useMemo, useState } from "react";
import { BlockMath } from "react-katex";
import { LabLayout } from "../../components/learning/LabLayout";
import { Button } from "../../components/ui/Button";
import { ParamSlider } from "../../components/learning/ParamSlider";
import { StatusItem } from "../../components/learning/StatusItem";
import { RichText } from "../../components/learning/RichText";
import { FidChart } from "../../components/charts/FidChart";
import { useT } from "../../i18n/useT";
import { formatNumber } from "../../i18n/format";
import {
  generateFidSignal,
  classifyFidState,
  getFidExplanation,
  getFidStateLabel,
  AUTO_SCAN_SEQUENCE,
  type FidState,
} from "../../simulations/fid";

interface Lesson1FidProps {
  /** Khi true, controls bị khóa (modal kiến thức đang mở). */
  locked: boolean;
  onReopenKnowledge: () => void;
}

const O1_MIN = -50000;
const O1_MAX = 50000;
const O1_STEP = 1000;

/**
 * Lesson1Fid — Bài 1: Phát hiện tín hiệu cộng hưởng từ hạt nhân (FID).
 * Tham chiếu `module1-thiet-ke.md` Bài 1.
 */
export default function Lesson1Fid({ locked, onReopenKnowledge }: Lesson1FidProps) {
  const { t, tr, locale } = useT();
  const [o1Hz, setO1Hz] = useState(0);
  const [scanning, setScanning] = useState(false);

  const points = useMemo(() => generateFidSignal({ o1Hz }), [o1Hz]);
  const state: FidState = classifyFidState(o1Hz);
  const explanation = getFidExplanation(o1Hz);

  // Quét tự động: cập nhật O1 theo bước trong AUTO_SCAN_SEQUENCE.
  useEffect(() => {
    if (!scanning) return;
    let i = 0;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stepMs = reduceMotion ? 600 : 900;
    const id = window.setInterval(() => {
      if (i >= AUTO_SCAN_SEQUENCE.length) {
        setScanning(false);
        return;
      }
      setO1Hz(clampO1(AUTO_SCAN_SEQUENCE[i]));
      i += 1;
    }, stepMs);
    return () => window.clearInterval(id);
  }, [scanning]);

  return (
    <LabLayout
      title={t("common.lessonN", { n: 1 })}
      theory={
        <>
          <p className="muted">
            <RichText text={t("lesson1.theory")} />
          </p>
          <BlockMath math={"S(t) \\propto \\cos\\big((\\omega_0 - \\omega_{RF})\\,t\\big)\\cdot \\exp\\!\\left(-\\dfrac{t}{T_2^{*}}\\right)"} />
        </>
      }
      controls={
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", justifyContent: "space-between", flex: 1 }}>
          <ParamSlider
            id="o1-slider"
            label={t("lesson1.o1Label")}
            unit="Hz"
            min={O1_MIN}
            max={O1_MAX}
            step={O1_STEP}
            value={o1Hz}
            disabled={locked || scanning}
            onChange={setO1Hz}
          />
          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
            <Button
              variant="primary"
              size="md"
              disabled={locked || scanning}
              onClick={() => setScanning(true)}
            >
              {scanning ? t("common.scanning") : t("lesson1.scanBtn")}
            </Button>
            <Button variant="ghost" size="md" onClick={onReopenKnowledge}>
              {t("lab.reviewKnowledge")}
            </Button>
          </div>
          <p className="mono" style={{ fontSize: "0.74rem", color: "var(--color-faint)" }}>
            {t("lesson1.scanNote")}
          </p>
        </div>
      }
      visualization={<FidChart points={points} state={state} o1Hz={o1Hz} />}
      explanation={
        <p style={{ fontSize: "1rem" }}>
          <span className="mono" style={{ fontSize: "0.78rem", color: "var(--color-field-amber)" }}>{t("lab.statusPrefix")}</span>
          <RichText text={tr(explanation)} />
        </p>
      }
      reviewQuestion={
        <p className="muted" style={{ fontStyle: "italic" }}>
          {t("lesson1.review")}
        </p>
      }
      statusBar={
        <>
          <StatusItem label="O1" value={formatNumber(o1Hz, locale) + " Hz"} tone="cyan" />
          <StatusItem label={t("lab.statusLabel")} value={tr(getFidStateLabel(state))} tone="amber" />
          <StatusItem label="T2*" value="28 ms" />
        </>
      }
      locked={locked}
    />
  );
}

function clampO1(value: number): number {
  return Math.max(O1_MIN, Math.min(O1_MAX, value));
}
