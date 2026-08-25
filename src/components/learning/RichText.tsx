import { InlineMath } from "react-katex";

type Segment = { type: "text" | "math" | "bold"; value: string };

/**
 * RichText — render chuỗi văn có thể chứa:
 * - LaTeX inline dạng \(...\)
 * - Markdown bold dạng **...**
 *
 * Thứ tự ưu tiên: LaTeX trước (để ** bên trong \(...\) không bị bắt nhầm),
 * sau đó tách bold trong phần text còn lại.
 */
export function RichText({ text }: { text: string }) {
  const parts = parseRichText(text);
  return (
    <>
      {parts.map((p, i) => {
        if (p.type === "math") return <InlineMath key={i} math={p.value} />;
        if (p.type === "bold") return <strong key={i}>{p.value}</strong>;
        return <span key={i}>{p.value}</span>;
      })}
    </>
  );
}

/**
 * Parse chuỗi thành các segment: text | math (\(...\)) | bold (**...**).
 * Tách LaTeX trước để nội dung bên trong \(...\) không bị xử lý bold.
 */
function parseRichText(text: string): Segment[] {
  // Bước 1: tách theo LaTeX \(...\)
  const raw: Segment[] = [];
  const latexRe = /\\\((.+?)\\\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = latexRe.exec(text)) !== null) {
    if (m.index > last) raw.push({ type: "text", value: text.slice(last, m.index) });
    raw.push({ type: "math", value: m[1] });
    last = latexRe.lastIndex;
  }
  if (last < text.length) raw.push({ type: "text", value: text.slice(last) });

  // Bước 2: trong mỗi text segment, tách **bold**
  const result: Segment[] = [];
  const boldRe = /\*\*(.+?)\*\*/g;
  for (const seg of raw) {
    if (seg.type !== "text") {
      result.push(seg);
      continue;
    }
    let s = 0;
    let bm: RegExpExecArray | null;
    while ((bm = boldRe.exec(seg.value)) !== null) {
      if (bm.index > s) result.push({ type: "text", value: seg.value.slice(s, bm.index) });
      result.push({ type: "bold", value: bm[1] });
      s = boldRe.lastIndex;
    }
    if (s < seg.value.length) result.push({ type: "text", value: seg.value.slice(s) });
  }

  return result;
}
