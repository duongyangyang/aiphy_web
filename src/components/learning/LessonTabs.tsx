import { Link } from "react-router-dom";
import type { Module1Lesson, Phase } from "../../data/module1Lessons";
import { useT } from "../../i18n/useT";

interface LessonTabsProps {
  lessons: Module1Lesson[];
  currentId: string;
  basePath: string;
}

const PHASE_COLOR: Record<Phase, string> = {
  "signal-foundations": "var(--color-proton-cyan)",
  "machine-calibration": "var(--color-rf-violet)",
  "basic-imaging": "var(--color-field-amber)",
  relaxometry: "var(--color-success-green)",
};

/**
 * LessonTabs — thanh điều hướng bài học, cố định (sticky) phía dưới header.
 *
 * - Các nút xuống dòng (flex-wrap) thay vì cuộn ngang → không có thanh trượt,
 *   luôn nằm gọn trong trang ở mọi chiều rộng.
 * - Nút thu nhỏ: số thứ tự + nhãn ngắn (`tab`) + chấm màu theo giai đoạn.
 * - Tab active tô nổi bật viền màu giai đoạn.
 */
export function LessonTabs({ lessons, currentId, basePath }: LessonTabsProps) {
  const { t, tr } = useT();
  return (
    <nav
      aria-label={t("lessonTabs.aria")}
      style={{
        position: "sticky",
        top: 64,
        zIndex: 40,
        width: "100%",
        minWidth: 0,
        background: "rgba(7,17,31,0.9)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--color-line)",
        paddingBottom: "var(--space-2)",
      }}
    >
      <div
        role="tablist"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--space-1)",
          minWidth: 0,
          maxWidth: "100%",
        }}
      >
        {lessons.map((l) => {
          const active = l.id === currentId;
          const color = PHASE_COLOR[l.phase];
          return (
            <Link
              key={l.id}
              role="tab"
              aria-selected={active}
              to={`${basePath}/${l.id}`}
              title={tr(l.title)}
              style={{
                flex: "0 0 auto",
                minHeight: 34,
                padding: "5px 9px",
                borderRadius: "var(--radius-sm)",
                border: active ? `1px solid ${color}` : "1px solid var(--color-line)",
                background: active ? "rgba(55,215,232,0.1)" : "transparent",
                color: active ? "var(--color-paper)" : "var(--color-muted)",
                textDecoration: "none",
                fontFamily: "var(--font-data)",
                fontSize: "0.72rem",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: color,
                  opacity: active ? 1 : 0.5,
                  flex: "0 0 auto",
                }}
              />
              <span style={{ color: "var(--color-faint)" }}>{String(l.order).padStart(2, "0")}</span>
              <span>{tr(l.tab)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
