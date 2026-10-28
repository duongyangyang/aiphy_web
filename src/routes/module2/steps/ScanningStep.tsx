import { useEffect, useRef, useState } from "react";
import { Card } from "../../../components/ui/Card";
import { useModule2Store } from "../../../stores/module2Store";
import { useT } from "../../../i18n/useT";
import { trackEvent } from "../../../tracking/events";
import {
  reconstructScan,
  scanDurationMs,
} from "../../../simulations/module2/scanReconstruct";

/**
 * ScanningStep — bước Scan (trạng thái tạm): chạy physics engine với
 * sliceLocation + sequenceParams + calibrationQuality, mô phỏng thời gian
 * bằng progress bar (theo NEX × số lát), rồi tạo N ScanResult vào store và
 * chuyển sang imageProcessing. N = sliceLocation.sliceCount (hoặc 1/8/24 tuỳ
 * layout mục đích — ở đây dùng sliceCount để có nhiều lát).
 */
export function ScanningStep() {
  const { t } = useT();
  const sliceLocation = useModule2Store((s) => s.sliceLocation);
  const sequenceParams = useModule2Store((s) => s.sequenceParams);
  const calibration = useModule2Store((s) => s.calibration);
  const addScanResult = useModule2Store((s) => s.addScanResult);
  const clearScanResults = useModule2Store((s) => s.clearScanResults);
  const setStep = useModule2Store((s) => s.setStep);

  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Tự chạy khi mount.
  useEffect(() => {
    const quality = calibration?.quality ?? 0.5;
    const count = Math.max(1, Math.min(8, sliceLocation.sliceCount));
    const total = scanDurationMs(sequenceParams, count);
    const tickMs = 60;
    let elapsed = 0;

    // Xoá kết quả cũ trước loạt mới.
    clearScanResults();

    timerRef.current = window.setInterval(() => {
      elapsed += tickMs;
      const pct = Math.min(100, (elapsed / total) * 100);
      setProgress(pct);
      if (pct >= 100) {
        if (timerRef.current !== null) window.clearInterval(timerRef.current);
        // Sinh `count` lát, thêm vào store.
        for (let i = 0; i < count; i++) {
          const { image, groundTruth } = reconstructScan(
            sequenceParams,
            sliceLocation,
            quality,
            i,
          );
          addScanResult({
            id: `scan-${Date.now()}-${i}`,
            index: i,
            image,
            groundTruth,
            quality,
            snapshot: {
              TR: sequenceParams.TR,
              TE: sequenceParams.TE,
              FA: sequenceParams.FA,
              sequence: sequenceParams.sequence,
              matrixSize: sequenceParams.matrixSize,
              sliceThickness: sliceLocation.sliceThickness,
            },
          });
        }
        setDone(true);
        // Sự kiện nghiên cứu: một loạt chụp hoàn tất với bộ tham số nào.
        trackEvent("m2_scan", "module-2", {
          TR: sequenceParams.TR,
          TE: sequenceParams.TE,
          FA: sequenceParams.FA,
          TI: sequenceParams.TI,
          sequence: sequenceParams.sequence,
          matrixSize: sequenceParams.matrixSize,
          bandwidth: sequenceParams.bandwidth,
          nex: sequenceParams.nex,
          sliceCount: count,
          quality,
        });
        // Nhẹ nhàng rồi sang Image processing.
        window.setTimeout(() => setStep("imageProcessing"), 500);
      }
    }, tickMs);

    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reduceMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <Card>
      <p className="eyebrow">{t("scanning.eyebrow")}</p>
      <h2 style={{ fontSize: "1.2rem", marginTop: "var(--space-2)" }}>
        {t("scanning.kacq", { seq: sequenceParams.sequence })}
      </h2>
      <p className="mono" style={{ fontSize: "0.8rem", color: "var(--color-muted)", marginTop: "var(--space-2)" }}>
        TR {sequenceParams.TR} ms · TE {sequenceParams.TE} ms · matrix {sequenceParams.matrixSize}
        {sequenceParams.TI ? ` · TI ${sequenceParams.TI} ms` : ""} · NEX {sequenceParams.nex} · BW {sequenceParams.bandwidth} Hz
      </p>

      <div style={{ marginTop: "var(--space-4)", position: "relative", height: 16, background: "var(--color-bore-2)", borderRadius: 999, overflow: "hidden", border: "1px solid var(--color-line)" }}>
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "linear-gradient(90deg, var(--color-proton-cyan), var(--color-rf-violet))",
            transition: "width 0.06s linear",
          }}
        />
        <span className="mono" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 600, color: "var(--color-paper)" }}>
          {progress.toFixed(0)}%
        </span>
      </div>
      <p className="mono" style={{ fontSize: "0.76rem", color: "var(--color-faint)", marginTop: "var(--space-3)" }}>
        {reduceMotion ? "" : t("scanning.reconstructing")}
        {done ? t("scanning.done") : t("scanning.collecting")}
      </p>
    </Card>
  );
}
