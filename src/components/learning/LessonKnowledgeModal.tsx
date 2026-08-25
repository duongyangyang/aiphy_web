import { BlockMath, InlineMath } from "react-katex";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import type { LessonKnowledge } from "../../data/lessonKnowledge";
import { useT } from "../../i18n/useT";

interface LessonKnowledgeModalProps {
  open: boolean;
  knowledge: LessonKnowledge;
  onStart: () => void;
}

/**
 * LessonKnowledgeModal — hộp kiến thức bắt buộc trước bài (theo
 * `module1-thiet-ke.md` mục 3.1).
 *
 * - Tự mở khi vào bài mới.
 * - KHÔNG đóng được bằng Esc hay click backdrop (dismissible={false}).
 * - Chỉ nút "Bắt đầu thí nghiệm" mới mở khóa controls.
 */
export function LessonKnowledgeModal({ open, knowledge, onStart }: LessonKnowledgeModalProps) {
  const { t, tr } = useT();
  return (
    <Modal open={open} dismissible={false} onClose={onStart} labelledBy="lesson-knowledge-title">
      <p className="eyebrow">{t("knowledge.eyebrow")}</p>
      <h2 id="lesson-knowledge-title" style={{ fontSize: "1.4rem", marginTop: "var(--space-2)" }}>
        {t("knowledge.context")}
      </h2>
      <p className="muted">{tr(knowledge.context)}</p>

      <h3 style={{ fontSize: "1.1rem", marginTop: "var(--space-4)" }}>{t("knowledge.concepts")}</h3>
      <ul style={{ display: "grid", gap: "var(--space-2)" }}>
        {knowledge.concepts.map((c, i) => (
          <li key={i} style={{ lineHeight: 1.5 }}>
            <ConceptText text={tr(c)} />
          </li>
        ))}
      </ul>

      <h3 style={{ fontSize: "1.1rem", marginTop: "var(--space-4)" }}>{t("knowledge.formula")}</h3>
      <BlockMath math={tr(knowledge.formula)} />

      <ul style={{ display: "grid", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
        {knowledge.formulaExplain.map((c, i) => (
          <li key={i} className="muted" style={{ lineHeight: 1.5, fontSize: "0.92rem" }}>
            <ConceptText text={tr(c)} />
          </li>
        ))}
      </ul>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-5)" }}>
        <Button variant="primary" size="md" onClick={onStart}>
          {t("knowledge.start")}
        </Button>
      </div>
    </Modal>
  );
}

/**
 * ConceptText — render chuỗi có thể chứa LaTeX inline dạng \(...\).
 * Tách các đoạn \\(...\\) ra và xen kẽ InlineMath với text thường.
 */
function ConceptText({ text }: { text: string }) {
  const parts = splitInlineLatex(text);
  return (
    <>
      {parts.map((p, i) =>
        p.type === "math" ? <InlineMath key={i} math={p.value} /> : <span key={i}>{p.value}</span>
      )}
    </>
  );
}

function splitInlineLatex(text: string): { type: "text" | "math"; value: string }[] {
  const result: { type: "text" | "math"; value: string }[] = [];
  const regex = /\\\((.+?)\\\)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) result.push({ type: "text", value: text.slice(last, match.index) });
    result.push({ type: "math", value: match[1] });
    last = regex.lastIndex;
  }
  if (last < text.length) result.push({ type: "text", value: text.slice(last) });
  return result;
}
