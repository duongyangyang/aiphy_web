import { Lightbulb } from "lucide-react";
import { Card } from "../ui/Card";
import { useT } from "../../i18n/useT";

interface LessonPlaceholderProps {
  title: string;
  objective: string;
  phase: string;
}

/**
 * LessonPlaceholder — chiếm chỗ cho các bài chưa triển khai.
 * Giữ cấu trúc điều hướng ổn định; sau này thay nội dung thật mà không đổi
 * layout. Hiển thị mục tiêu học tập để học sinh biết trước sẽ học gì.
 */
export function LessonPlaceholder({ title, objective, phase }: LessonPlaceholderProps) {
  const { t } = useT();
  return (
    <Card style={{ textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "var(--space-3)" }}>
        <span
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background: "rgba(242,184,75,0.12)",
            color: "var(--color-field-amber)",
          }}
          aria-hidden
        >
          <Lightbulb size={22} />
        </span>
      </div>
      <p className="eyebrow">{phase}</p>
      <h2 style={{ fontSize: "1.4rem", marginTop: "var(--space-2)" }}>{title}</h2>
      <p className="muted" style={{ maxWidth: "46ch", margin: "0 auto" }}>
        {t("placeholder.underConstruction")}{objective}
      </p>
      <p className="mono" style={{ fontSize: "0.78rem", color: "var(--color-faint)", marginTop: "var(--space-4)" }}>
        {t("placeholder.waitingSim")}
      </p>
    </Card>
  );
}
