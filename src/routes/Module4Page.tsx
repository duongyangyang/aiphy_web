import { useState } from "react";
import { BlockMath } from "react-katex";
import { LabLayout } from "../components/learning/LabLayout";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { StatusItem } from "../components/learning/StatusItem";
import { RichText } from "../components/learning/RichText";
import { ImageUpload } from "../components/learning/ImageUpload";
import { MlUnavailableModal } from "../components/learning/MlUnavailableModal";
import { useT } from "../i18n/useT";
import { LoadingSpinner } from "../components/learning/LoadingSpinner";
import { Magnifier } from "../components/learning/Magnifier";
import { useConfigStore } from "../config/store";
import { superResolve, type SuperResolveResult } from "../ml-service/api";
import { trackEvent } from "../tracking/events";

type ViewMode = "sr" | "uncertainty";

export default function Module4Page() {
  const { t } = useT();
  const mlEnabled = useConfigStore((s) => s.mlEnabled);
  const [mlModalOpen, setMlModalOpen] = useState(false);

  // ── State ──
  const [image, setImage] = useState<File | null>(null);
  const [hqImage, setHqImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SuperResolveResult | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("sr");
  const [pixelUC, setPixelUC] = useState<{ uc: number; px: number; py: number } | null>(null);

  // ── Run ──
  const handleRun = async () => {
    // ML tắt trên máy chủ này: báo lý do thay vì gọi API rồi hiện lỗi kỹ thuật.
    if (!mlEnabled) {
      setMlModalOpen(true);
      return;
    }
    if (!image) return;
    setLoading(true);
    setError(null);
    try {
      const r = await superResolve(image, hqImage ?? undefined);
      setResult(r);
      setViewMode("sr");
      // Sự kiện nghiên cứu: kích thước vào/ra và chất lượng đo được.
      trackEvent("m4_run", "module-4", {
        has_hq: hqImage !== null,
        input_shape: r.input_shape,
        output_shape: r.output_shape,
        psnr: r.psnr,
        ssim: r.ssim,
        mean_uncertainty: r.mean_uncertainty,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const canRun = image !== null && !loading;

  // ── Render ──
  return (
    <section className="container" style={{ padding: "var(--space-6) var(--space-5) var(--space-8)" }}>
      <LabLayout
        title={t("ml.m4.title")}
        locked={false}
        theory={
          <>
            <p className="muted">
              <RichText text={t("ml.m4.theoryP1")} />
            </p>
            <BlockMath math={"I_{\\text{SR}} = \\text{CHARMS-Lite}(I_{\\text{LR}})"} />
            <p className="muted" style={{ marginTop: "var(--space-2)" }}>
              <RichText text={t("ml.m4.theoryP2")} />
            </p>
            <p className="muted">
              <RichText text={t("ml.m4.theoryP3")} />
            </p>
          </>
        }
        controls={
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", justifyContent: "space-between", flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              {/* Ảnh low-res */}
              <ImageUpload
                id="m4-lq"
                file={image}
                onFile={setImage}
                label={t("ml.m4.uploadLQ")}
                hint={t("ml.m4.uploadHint")}
                accept="image/png,image/jpeg,image/jpg,image/webp,image/bmp"
              />

              {/* Ảnh HQ (tùy chọn) */}
              <ImageUpload
                id="m4-hq"
                file={hqImage}
                onFile={setHqImage}
                label={t("ml.m4.uploadHQ")}
                hint={t("ml.m4.uploadHQHint")}
                accept="image/png,image/jpeg,image/jpg,image/webp,image/bmp"
              />
            </div>

            <Button
              variant="primary"
              size="lg"
              // Khi ML tắt, nút luôn bấm được để người dùng nhận được lời giải
              // thích, thay vì một nút xám không phản hồi.
              disabled={mlEnabled && !canRun}
              onClick={handleRun}
              style={{ alignSelf: "flex-start", minWidth: 160 }}
            >
              {loading ? t("ml.m4.running") : t("ml.m4.runBtn")}
            </Button>

            {!mlEnabled && (
              <p className="mono" style={{ fontSize: "0.78rem", color: "var(--color-field-amber)", margin: 0 }}>
                {t("ml.disabled.shortNote")}
              </p>
            )}

            {error && (
              <p className="mono" style={{ color: "var(--color-danger-red)", fontSize: "0.8rem", margin: 0 }}>
                {t("ml.m4.error", { msg: error })}
              </p>
            )}
          </div>
        }
        visualization={
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", alignItems: "center" }}>
            {loading ? (
              <LoadingSpinner />
            ) : result ? (
              <>
                {/* View toggle */}
                <div style={{ display: "flex", gap: "var(--space-2)", alignSelf: "flex-start" }}>
                  <button
                    type="button"
                    onClick={() => setViewMode("sr")}
                    className="mono"
                    style={{
                      padding: "4px 12px",
                      borderRadius: "var(--radius-sm)",
                      border: `1px solid ${viewMode === "sr" ? "var(--color-proton-cyan)" : "var(--color-line)"}`,
                      background: viewMode === "sr" ? "rgba(55,215,232,0.12)" : "transparent",
                      color: viewMode === "sr" ? "var(--color-proton-cyan)" : "var(--color-muted)",
                      fontSize: "0.78rem",
                      cursor: "pointer",
                    }}
                  >
                    {t("ml.m4.viewSR")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("uncertainty")}
                    className="mono"
                    style={{
                      padding: "4px 12px",
                      borderRadius: "var(--radius-sm)",
                      border: `1px solid ${viewMode === "uncertainty" ? "var(--color-proton-cyan)" : "var(--color-line)"}`,
                      background: viewMode === "uncertainty" ? "rgba(55,215,232,0.12)" : "transparent",
                      color: viewMode === "uncertainty" ? "var(--color-proton-cyan)" : "var(--color-muted)",
                      fontSize: "0.78rem",
                      cursor: "pointer",
                    }}
                  >
                    {t("ml.m4.viewUncertainty")}
                  </button>
                </div>

                {viewMode === "sr" ? (
                  /* Before / After */
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", width: "100%" }}>
                    <div style={{ textAlign: "center" }}>
                      <p className="mono" style={{ fontSize: "0.72rem", color: "var(--color-faint)", marginBottom: "var(--space-2)" }}>
                        {t("ml.m4.inputLabel")}
                      </p>
                      <div style={{
                        padding: "var(--space-2)",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-line)",
                        background: "var(--color-bore-2)",
                      }}>
                        <img
                          src={URL.createObjectURL(image!)}
                          alt="Low-res input"
                          style={{ maxWidth: "100%", display: "block", borderRadius: 4 }}
                        />
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p className="mono" style={{ fontSize: "0.72rem", color: "var(--color-faint)", marginBottom: "var(--space-2)" }}>
                        {t("ml.m4.outputLabel")}
                      </p>
                      <div style={{
                        padding: "var(--space-2)",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-line)",
                        background: "var(--color-bore-2)",
                      }}>
                        <Magnifier
                          srBase64={result.sr_base64}
                          uncertaintyBase64={result.uncertainty_base64}
                          uncertaintyMin={result.uncertainty_min}
                          uncertaintyMax={result.uncertainty_max}
                          naturalW={result.output_shape[0]}
                          naturalH={result.output_shape[1]}
                          onPixelChange={setPixelUC}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Uncertainty map */
                  <div style={{ textAlign: "center", width: "100%" }}>
                    <p className="mono" style={{ fontSize: "0.72rem", color: "var(--color-faint)", marginBottom: "var(--space-2)" }}>
                      {t("ml.m4.uncertaintyLabel")}
                    </p>
                    <div style={{
                      padding: "var(--space-2)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-line)",
                      background: "var(--color-bore-2)",
                    }}>
                      <img
                        src={`data:image/png;base64,${result.uncertainty_base64}`}
                        alt="Uncertainty map"
                        style={{ maxWidth: "100%", display: "block", borderRadius: 4 }}
                      />
                    </div>
                  </div>
                )}

                {/* Metrics */}
                <Card style={{ width: "100%", padding: "var(--space-3) var(--space-4)", display: "flex", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap" }}>
                  {result.psnr !== null && (
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-proton-cyan)", boxShadow: "0 0 6px var(--color-proton-cyan)" }} />
                      <span className="mono" style={{ fontSize: "0.78rem", color: "var(--color-faint)" }}>{t("ml.m4.psnr")}</span>
                      <span className="mono" style={{ fontSize: "1.05rem", color: "var(--color-proton-cyan)", fontWeight: 700 }}>{result.psnr} dB</span>
                    </div>
                  )}
                  {result.ssim !== null && (
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-proton-cyan)", boxShadow: "0 0 6px var(--color-proton-cyan)" }} />
                      <span className="mono" style={{ fontSize: "0.78rem", color: "var(--color-faint)" }}>{t("ml.m4.ssim")}</span>
                      <span className="mono" style={{ fontSize: "1.05rem", color: "var(--color-proton-cyan)", fontWeight: 700 }}>{result.ssim}</span>
                    </div>
                  )}
                  {/* Pixel uncertainty — luôn hiển thị */}
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginLeft: "auto" }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: "50%",
                      background: pixelUC !== null ? "var(--color-field-amber)" : "var(--color-line)",
                      boxShadow: pixelUC !== null ? "0 0 8px var(--color-field-amber)" : "none",
                      transition: "background 0.15s, box-shadow 0.15s",
                    }} />
                    <span className="mono" style={{ fontSize: "0.78rem", color: "var(--color-faint)" }}>{t("ml.m4.pixelUncertainty")}</span>
                    <span className="mono" style={{
                      fontSize: "1.05rem", fontWeight: 700,
                      color: pixelUC !== null ? "var(--color-field-amber)" : "var(--color-faint)",
                      transition: "color 0.15s",
                    }}>
                      {pixelUC !== null ? pixelUC.uc.toFixed(6) : "—"}
                    </span>
                    {pixelUC !== null && (
                      <span className="mono" style={{ fontSize: "0.72rem", color: "var(--color-faint)", opacity: 0.6 }}>
                        ({pixelUC.px}, {pixelUC.py})
                      </span>
                    )}
                  </div>
                </Card>
              </>
            ) : (
              <p className="muted" style={{ textAlign: "center" }}>
                {t("ml.m4.noResult")}
              </p>
            )}
          </div>
        }
        explanation={
          result ? (
            <div style={{ display: "grid", gap: "var(--space-2)" }}>
              <RichText text={t("ml.m4.explain.result", {
                input_w: String(result.input_shape[0]),
                input_h: String(result.input_shape[1]),
                output_w: String(result.output_shape[0]),
                output_h: String(result.output_shape[1]),
              })} />
              {result.psnr !== null && (
                <RichText text={t("ml.m4.explain.metrics", {
                  psnr: String(result.psnr),
                  ssim: String(result.ssim),
                })} />
              )}
              <RichText text={t("ml.m4.explain.uncertainty", {
                mean_uncertainty: result.mean_uncertainty.toFixed(4),
              })} />
            </div>
          ) : (
            <p className="muted">{t("ml.m4.explain.idle")}</p>
          )
        }
        statusBar={
          <>
            {result ? (
              <>
                <StatusItem
                  label={t("ml.m4.status.inputShape")}
                  value={`${result.input_shape[0]}×${result.input_shape[1]}`}
                  tone="default"
                />
                <StatusItem
                  label={t("ml.m4.status.outputShape")}
                  value={`${result.output_shape[0]}×${result.output_shape[1]}`}
                  tone="cyan"
                />
                {result.psnr !== null && (
                  <StatusItem label={t("ml.m4.status.psnr")} value={`${result.psnr} dB`} tone="cyan" />
                )}
                {result.ssim !== null && (
                  <StatusItem label={t("ml.m4.status.ssim")} value={result.ssim} tone="cyan" />
                )}
                <StatusItem
                  label={t("ml.m4.status.uncertainty")}
                  value={result.mean_uncertainty.toFixed(4)}
                  tone="amber"
                />
              </>
            ) : (
              <StatusItem label={t("ml.m4.status.ready")} value={t("ml.m4.status.idle")} tone="default" />
            )}
          </>
        }
      />

      <MlUnavailableModal
        open={mlModalOpen}
        onClose={() => setMlModalOpen(false)}
        moduleLabel={t("common.moduleLabel", { n: 4 })}
      />
    </section>
  );
}