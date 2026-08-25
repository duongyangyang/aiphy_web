import type { ModuleVisual } from "../../data/modules";

/**
 * ModuleCardVisual — minh họa CSS/SVG cho thẻ module trên trang chủ.
 * Mỗi module có một visual riêng để phân biệt ngay trên lưới.
 */
export function ModuleCardVisual({ visual }: { visual: ModuleVisual }) {
  const wrapperStyle: React.CSSProperties = {
    aspectRatio: "16 / 9",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--color-line)",
    background: "var(--color-bore-2)",
    overflow: "hidden",
    position: "relative",
  };

  if (visual === "fid-wave") {
    return (
      <div className="field-grid" style={wrapperStyle} aria-hidden>
        <svg viewBox="0 0 200 80" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <path
            d="M10 40 L40 38 L55 50 L70 30 L85 48 L100 32 L115 46 L130 34 L145 44 L160 36 L190 40"
            fill="none"
            stroke="var(--color-proton-cyan)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 40 Q200 40 190 40"
            fill="none"
            stroke="var(--color-faint)"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
        </svg>
      </div>
    );
  }

  if (visual === "scanner-phantom") {
    return (
      <div style={{ ...wrapperStyle, display: "grid", placeItems: "center" }} aria-hidden className="field-grid">
        <div style={{ width: 96, height: 96, borderRadius: "50%", border: "2px solid var(--color-rf-violet)", position: "relative" }}>
          <div style={{ position: "absolute", inset: 18, borderRadius: "50%", border: "1px solid var(--color-proton-cyan)" }} />
          <div style={{ position: "absolute", left: "50%", top: "50%", width: 6, height: 6, background: "var(--color-field-amber)", borderRadius: "50%", transform: "translate(-50%,-50%)" }} />
        </div>
      </div>
    );
  }

  if (visual === "param-prediction") {
    // Dự đoán tham số: các điểm dữ liệu rời rạc + đường拟合 gần tối ưu.
    const pts = [
      [20, 58], [48, 40], [72, 30], [98, 26], [124, 30], [150, 40], [178, 56],
    ];
    return (
      <div className="field-grid" style={wrapperStyle} aria-hidden>
        <svg viewBox="0 0 200 80" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <path
            d="M16 60 Q60 18 100 22 T184 58"
            fill="none"
            stroke="var(--color-rf-violet)"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.85"
          />
          {pts.map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="2.6"
              fill={i === 3 ? "var(--color-field-amber)" : "var(--color-proton-cyan)"}
            />
          ))}
          <line x1="16" y1="70" x2="184" y2="70" stroke="var(--color-faint)" strokeWidth="0.8" />
        </svg>
      </div>
    );
  }

  // sr-grid
  return (
    <div style={{ ...wrapperStyle, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gridTemplateRows: "repeat(3, 1fr)", gap: 2, padding: 2 }} aria-hidden>
      {Array.from({ length: 18 }).map((_, i) => (
        <div
          key={i}
          style={{
            background:
              i % 7 === 0 ? "var(--color-proton-cyan)" : i % 5 === 0 ? "rgba(55,215,232,0.3)" : "rgba(234,246,248,0.06)",
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}
