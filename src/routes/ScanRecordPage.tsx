import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { drawGrayscale } from "../mri-sim/canvas";
import { getScan, type ScanRecord } from "../mri-sim/api";
import { useT } from "../i18n/useT";
import { formatDateTime } from "../i18n/format";

const DISPLAY = 320;

/** ScanRecordPage — xem lại một ca chụp qua id (từ backend). */
export default function ScanRecordPage() {
  const { t, locale } = useT();
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<ScanRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getScan(id)
      .then((r) => {
        setRecord(r);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [id]);

  const gtRef = useRef<HTMLCanvasElement>(null);
  const resRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (record) {
      drawGrayscale(gtRef.current, record.groundTruth);
      drawGrayscale(resRef.current, record.result);
    }
  }, [record]);

  return (
    <div
      className="container"
      style={{ padding: "var(--space-6) var(--space-5) var(--space-8)", display: "grid", gap: "var(--space-5)" }}
    >
      <Card>
        <p className="eyebrow">{t("scanRecord.eyebrow")}</p>
        <h1 style={{ fontSize: "1.4rem", marginTop: "var(--space-2)" }}>{t("scanRecord.title")}</h1>
        {id && (
          <p className="mono" style={{ fontSize: "0.82rem", color: "var(--color-proton-cyan)", marginTop: "var(--space-2)" }}>
            {t("scanRecord.idLabel")}: {id}
          </p>
        )}
      </Card>

      {loading && <Card><p className="muted">{t("scanRecord.loading")}</p></Card>}
      {error && (
        <Card>
          <p className="mono" style={{ color: "var(--color-danger-red)" }}>{error}</p>
          <Link to="/module-2"><Button variant="ghost" size="sm" style={{ marginTop: "var(--space-3)" }}>{t("scanRecord.backToSim")}</Button></Link>
        </Card>
      )}

      {record && (
        <>
          <div className="lab-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "var(--space-4)", alignItems: "start" }}>
            <ImageCard label={t("scanRecord.imgGroundTruth")} canvasRef={gtRef} />
            <ImageCard label={t("scanRecord.imgResult")} canvasRef={resRef} />
          </div>
          <Card>
            <p className="eyebrow">{t("scanRecord.params")}</p>
            <div style={{ marginTop: "var(--space-3)", display: "grid", gap: "var(--space-2)", fontFamily: "var(--font-data)", fontSize: "0.84rem" }}>
              <Row k="Protocol" v={record.protocolName} />
              <Row k={t("scanRecord.sequence")} v={record.sequence} />
              <Row k="TR" v={`${record.params.TR} ms`} />
              <Row k="TE" v={`${record.params.TE} ms`} />
              {record.params.TI !== null && record.params.TI !== undefined && <Row k="TI" v={`${record.params.TI} ms`} />}
              <Row k="Flip angle" v={`${record.params.flipAngle}°`} />
              <Row k="Matrix size" v={`${record.params.matrixSize} × ${record.params.matrixSize}`} />
              <Row k={t("scanRecord.savedAt")} v={formatDateTime(record.savedAt, locale)} />
            </div>
            <Link to="/module-2"><Button variant="primary" size="md" style={{ marginTop: "var(--space-4)" }}>{t("scanRecord.newScan")}</Button></Link>
          </Card>
        </>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
      <span style={{ color: "var(--color-muted)" }}>{k}</span>
      <span className="mono" style={{ color: "var(--color-paper)" }}>{v}</span>
    </div>
  );
}

function ImageCard({ label, canvasRef }: { label: string; canvasRef: React.RefObject<HTMLCanvasElement> }) {
  return (
    <Card>
      <p className="eyebrow">{label}</p>
      <div style={{ marginTop: "var(--space-3)", display: "flex", justifyContent: "center" }}>
        <canvas
          ref={canvasRef}
          style={{
            width: DISPLAY,
            height: DISPLAY,
            imageRendering: "pixelated",
            border: "1px solid var(--color-line)",
            borderRadius: "var(--radius-sm)",
            background: "#000",
          }}
          aria-label={label}
        />
      </div>
    </Card>
  );
}
