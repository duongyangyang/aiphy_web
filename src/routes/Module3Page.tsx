import { useState } from "react";
import { BlockMath } from "react-katex";
import { LabLayout } from "../components/learning/LabLayout";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ParamSlider } from "../components/learning/ParamSlider";
import { StatusItem } from "../components/learning/StatusItem";
import { RichText } from "../components/learning/RichText";
import { ImageUpload } from "../components/learning/ImageUpload";
import { useT } from "../i18n/useT";
import { LoadingSpinner } from "../components/learning/LoadingSpinner";
import { recommendParams, type RecommendParamsResult } from "../ml-service/api";
import { trackEvent } from "../tracking/events";

type Method = "argmax" | "soft_argmax" | "quadratic";

export default function Module3Page() {
  const { t } = useT();

  // ── State ──
  const [image, setImage] = useState<File | null>(null);
  const [tr0, setTr0] = useState(30);
  const [te0, setTe0] = useState(5);
  const [j0, setJ0] = useState(1.23);
  const [method, setMethod] = useState<Method>("soft_argmax");
  const [topK, setTopK] = useState(8);
  const [temperature, setTemperature] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendParamsResult | null>(null);

  // ── Run ──
  const handleRun = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    try {
      const r = await recommendParams({
        image,
        tr0,
        te0,
        j0,
        method,
        top_k: topK,
        temperature,
      });
      setResult(r);
      // Sự kiện nghiên cứu: tham số người dùng chọn và kết quả mô hình đề xuất.
      trackEvent("m3_run", "module-3", {
        tr0,
        te0,
        j0,
        method,
        top_k: topK,
        temperature,
        TR_star: r.TR_star,
        TE_star: r.TE_star,
        J_max: r.J_max,
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
        title={t("ml.m3.title")}
        locked={false}
        theory={
          <>
            <p className="muted">
              <RichText text={t("ml.m3.theoryP1")} />
            </p>
            <p className="muted">
              <RichText text={t("ml.m3.theoryP2")} />
            </p>
            <BlockMath math={"J = \\text{CNR} - \\lambda \\cdot T_{\\text{scan}}"} />
            <p className="muted" style={{ marginTop: "var(--space-2)" }}>
              <RichText text={t("ml.m3.theoryP3")} />
            </p>
          </>
        }
        controls={
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", justifyContent: "space-between", flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              {/* Ảnh anchor */}
              <ImageUpload
                id="m3-image"
                file={image}
                onFile={setImage}
                label={t("ml.m3.uploadLabel")}
                hint={t("ml.m3.uploadHint")}
                accept="image/png,image/jpeg,image/jpg,image/webp,image/bmp"
              />

              {/* TR0 */}
              <ParamSlider
                id="m3-tr0"
                label={t("ml.m3.tr0Label")}
                unit="ms"
                min={30}
                max={3000}
                step={1}
                value={tr0}
                onChange={setTr0}
              />

              {/* TE0 */}
              <ParamSlider
                id="m3-te0"
                label={t("ml.m3.te0Label")}
                unit="ms"
                min={5}
                max={200}
                step={1}
                value={te0}
                onChange={setTe0}
              />

              {/* J0 */}
              <ParamSlider
                id="m3-j0"
                label={t("ml.m3.j0Label")}
                min={0.5}
                max={5.0}
                step={0.01}
                value={j0}
                onChange={setJ0}
              />

              {/* Method selector */}
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                <label
                  htmlFor="m3-method"
                  className="mono"
                  style={{ fontSize: "0.82rem", color: "var(--color-muted)" }}
                >
                  {t("ml.m3.methodLabel")}
                </label>
                <select
                  id="m3-method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value as Method)}
                  style={{
                    padding: "var(--space-2) var(--space-3)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-line)",
                    background: "var(--color-bore-2)",
                    color: "var(--color-paper)",
                    fontFamily: "var(--font-data)",
                    fontSize: "0.84rem",
                  }}
                >
                  <option value="argmax">{t("ml.m3.method.argmax")}</option>
                  <option value="soft_argmax">{t("ml.m3.method.soft_argmax")}</option>
                  <option value="quadratic">{t("ml.m3.method.quadratic")}</option>
                </select>
              </div>

              {/* Top-K (chỉ hiện khi method ≠ argmax) */}
              {method !== "argmax" && (
                <ParamSlider
                  id="m3-topk"
                  label={t("ml.m3.topKLabel")}
                  min={4}
                  max={20}
                  step={1}
                  value={topK}
                  onChange={setTopK}
                />
              )}

              {/* Temperature (chỉ hiện khi method = soft_argmax) */}
              {method === "soft_argmax" && (
                <ParamSlider
                  id="m3-temp"
                  label={t("ml.m3.temperatureLabel")}
                  min={0.1}
                  max={2.0}
                  step={0.1}
                  value={temperature}
                  onChange={setTemperature}
                />
              )}
            </div>

            <Button
              variant="primary"
              size="lg"
              disabled={!canRun}
              onClick={handleRun}
              style={{ alignSelf: "flex-start", minWidth: 160 }}
            >
              {loading ? t("ml.m3.running") : t("ml.m3.runBtn")}
            </Button>

            {error && (
              <p className="mono" style={{ color: "var(--color-danger-red)", fontSize: "0.8rem", margin: 0 }}>
                {t("ml.m3.error", { msg: error })}
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
                {/* Heatmap */}
                <img
                  src={`data:image/png;base64,${result.heatmap_base64}`}
                  alt="J landscape heatmap"
                  style={{
                    maxWidth: "100%",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-line)",
                  }}
                />

                {/* Result card */}
                <Card style={{ width: "100%", padding: "var(--space-4)", display: "grid", gap: "var(--space-2)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span className="mono" style={{ fontSize: "0.82rem", color: "var(--color-muted)" }}>
                      {t("ml.m3.resultLabel")}
                    </span>
                    <span className="mono" style={{ fontSize: "0.74rem", color: "var(--color-faint)" }}>
                      {result.method}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-3)", textAlign: "center" }}>
                    <div>
                      <p className="mono" style={{ fontSize: "0.72rem", color: "var(--color-faint)", margin: 0 }}>
                        TR*
                      </p>
                      <p className="mono" style={{ fontSize: "1.3rem", color: "var(--color-proton-cyan)", margin: 0, fontWeight: 600 }}>
                        {result.TR_star.toFixed(0)} ms
                      </p>
                    </div>
                    <div>
                      <p className="mono" style={{ fontSize: "0.72rem", color: "var(--color-faint)", margin: 0 }}>
                        TE*
                      </p>
                      <p className="mono" style={{ fontSize: "1.3rem", color: "var(--color-proton-cyan)", margin: 0, fontWeight: 600 }}>
                        {result.TE_star.toFixed(0)} ms
                      </p>
                    </div>
                    <div>
                      <p className="mono" style={{ fontSize: "0.72rem", color: "var(--color-faint)", margin: 0 }}>
                        Jₘₐₓ
                      </p>
                      <p className="mono" style={{ fontSize: "1.3rem", color: "var(--color-field-amber)", margin: 0, fontWeight: 600 }}>
                        {result.J_max.toFixed(3)}
                      </p>
                    </div>
                  </div>
                  {result && (result.tr_raw !== result.TR_star || result.te_raw !== result.TE_star) && (
                    <div style={{
                      background: "var(--color-surface-elevated)",
                      borderRadius: "var(--radius-sm)",
                      padding: "var(--space-2) var(--space-3)",
                      display: "flex", alignItems: "center", gap: "var(--space-2)",
                      fontSize: "0.72rem",
                    }}>
                      <span style={{ color: "var(--color-field-amber)" }}>&#9432;</span>
                      <span style={{ color: "var(--color-muted)" }}>
                        {t("ml.m3.constrainedNote")}
                        {" "}
                      </span>
                      <span className="mono" style={{ color: "var(--color-faint)", textDecoration: "line-through" }}>
                        ({result.tr_raw.toFixed(0)}, {result.te_raw.toFixed(0)})
                      </span>
                      <span className="mono" style={{ color: "var(--color-proton-cyan)" }}>
                        &rarr; ({result.TR_star.toFixed(0)}, {result.TE_star.toFixed(0)})
                      </span>
                    </div>
                  )}
                </Card>
              </>
            ) : (
              <p className="muted" style={{ textAlign: "center" }}>
                {t("ml.m3.noResult")}
              </p>
            )}
          </div>
        }
        explanation={
          result ? (
            <div style={{ display: "grid", gap: "var(--space-2)" }}>
              <RichText text={t("ml.m3.explain.result", {
                tr_star: result.TR_star.toFixed(0),
                te_star: result.TE_star.toFixed(0),
                j_max: result.J_max.toFixed(3),
              })} />
              {result.method === "argmax" && (
                <RichText text={t("ml.m3.explain.argmax")} />
              )}
              {result.method === "soft_argmax" && (
                <RichText text={t("ml.m3.explain.softArgmax")} />
              )}
              {result.method === "quadratic" && (
                <RichText text={t("ml.m3.explain.quadratic")} />
              )}
            </div>
          ) : (
            <p className="muted">{t("ml.m3.explain.idle")}</p>
          )
        }
        statusBar={
          <>
            <StatusItem label={t("ml.m3.status.tr0")} value={`${tr0} ms`} tone="default" />
            <StatusItem label={t("ml.m3.status.te0")} value={`${te0} ms`} tone="default" />
            <StatusItem label={t("ml.m3.status.j0")} value={j0.toFixed(2)} tone="default" />
            {result && (
              <>
                <StatusItem label={t("ml.m3.status.trStar")} value={`${result.TR_star.toFixed(0)} ms`} tone="cyan" />
                <StatusItem label={t("ml.m3.status.teStar")} value={`${result.TE_star.toFixed(0)} ms`} tone="cyan" />
                <StatusItem label={t("ml.m3.status.jMax")} value={result.J_max.toFixed(3)} tone="amber" />
              </>
            )}
            <StatusItem label={t("ml.m3.status.method")} value={method} tone="default" />
          </>
        }
      />
    </section>
  );
}