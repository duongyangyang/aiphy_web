import type { ReactNode } from "react";
import { Card } from "../ui/Card";
import { useT } from "../../i18n/useT";

interface LabLayoutProps {
  title: ReactNode;
  theory: ReactNode;
  controls: ReactNode;
  visualization: ReactNode;
  explanation: ReactNode;
  reviewQuestion?: ReactNode;
  /** Khi true, controls bị mờ và không tương tác được (chưa mở khóa sau modal). */
  locked: boolean;
  /** Thanh trạng thái kiểu phần mềm máy: readout động dưới cùng. */
  statusBar?: ReactNode;
}

/**
 * LabLayout — vỏ bài thí nghiệm dùng chung cho mọi bài Module 1.
 * Tham chiếu `module1-thiet-ke.md` mục 4.3-4.5:
 *   - Lý thuyết ngắn (thu gọn được)
 *   - Cột trái: bảng điều khiển (controls)
 *   - Cột phải: vùng kết quả (chart/ảnh)
 *   - Dưới: giải thích động + câu hỏi ôn tập
 */
export function LabLayout({
  title,
  theory,
  controls,
  visualization,
  explanation,
  reviewQuestion,
  locked,
  statusBar,
}: LabLayoutProps) {
  const { t } = useT();
  return (
    <div style={{ display: "grid", gap: "var(--space-5)" }}>
      <Card>
        <details>
          <summary style={{ cursor: "pointer", fontFamily: "var(--font-data)", fontSize: "0.86rem", color: "var(--color-muted)" }}>
            {t("lab.theory")}
          </summary>
          <div style={{ marginTop: "var(--space-3)" }}>
            <h2 style={{ fontSize: "1.3rem" }}>{title}</h2>
            {theory}
          </div>
        </details>
      </Card>

      <div
        className="lab-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 0.85fr) minmax(0, 1.15fr)",
          gap: "var(--space-4)",
          alignItems: "stretch",
        }}
      >
        <Card
          aria-hidden={locked}
          style={{
            opacity: locked ? 0.5 : 1,
            pointerEvents: locked ? "none" : "auto",
            transition: "opacity 0.2s ease",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <p className="eyebrow">{t("lab.controls")}</p>
          {/* Wrapper dãn theo cột; nội dung controls tự phân bổ dọc (space-between)
              để không bị lệch hết lên đầu cột, bỏ trống phía dưới. */}
          <div style={{ marginTop: "var(--space-3)", flex: 1, display: "flex", flexDirection: "column" }}>
            {controls}
          </div>
        </Card>

        <Card
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <p className="eyebrow">{t("lab.realtime")}</p>
          {/* Căn giữa theo trục dọc để khớp khung: ảnh/chart không bị quá bé hay tràn. */}
          <div style={{ marginTop: "var(--space-3)", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
            {visualization}
          </div>
        </Card>
      </div>

      <Card>
        <p className="eyebrow">{t("lab.explanation")}</p>
        <div style={{ marginTop: "var(--space-2)" }}>{explanation}</div>
      </Card>

      {reviewQuestion && (
      <Card>
        <p className="eyebrow">{t("lab.review")}</p>
        <div style={{ marginTop: "var(--space-2)" }}>{reviewQuestion}</div>
      </Card>
    )}

      {statusBar && (
        <div
          className="field-grid"
          style={{
            display: "flex",
            gap: "var(--space-5)",
            alignItems: "center",
            flexWrap: "wrap",
            padding: "var(--space-2) var(--space-4)",
            background: "var(--color-bore-2)",
            border: "1px solid var(--color-line)",
            borderRadius: "var(--radius-sm)",
            fontFamily: "var(--font-data)",
            fontSize: "0.8rem",
            color: "var(--color-muted)",
          }}
        >
          {statusBar}
        </div>
      )}
    </div>
  );
}
