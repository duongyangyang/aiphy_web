/**
 * ParamField — ô nhập số chuẩn hoá dùng chung cho MỌI panel Module 2
 * (Prescan, Scout, và các bước sau). Một style cố định duy nhất → không panel
 * nào tự set kích thước riêng, tránh lệch height/padding/font giữa các khối.
 */

/**
 * PARAM_INPUT_STYLE — style CỐ ĐỊNH cho ô <input>: cùng height (34px), padding,
 * font-size, bo góc; width 100% + boxSizing để lấp đầy ô nhưng vẫn co gọn.
 */
export const PARAM_INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  height: 34,
  padding: "0 8px",
  fontFamily: "var(--font-data)",
  fontSize: "0.8rem",
  textAlign: "right",
  color: "var(--color-paper)",
  border: "1px solid var(--color-line-strong)",
  borderRadius: "var(--radius-sm)",
  outline: "none",
};

/**
 * ParamField — nhãn (có đơn vị) xếp trên, ô nhập số dưới. Nhãn có thể xuống
 * dòng để không đẩy ô nhập tràn khung. `locked` làm mờ + khoá (dùng cho Auto).
 */
export function ParamField({
  label,
  unit,
  value,
  onChange,
  step = 1,
  locked = false,
}: {
  label: string;
  unit?: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  locked?: boolean;
}) {
  return (
    <label style={{ display: "grid", gap: 2, minWidth: 0 }}>
      <span
        className="mono"
        style={{
          fontSize: "0.7rem",
          lineHeight: 1.25,
          color: "var(--color-muted)",
          overflowWrap: "anywhere",
        }}
      >
        {label}
        {unit ? <span style={{ color: "var(--color-faint)" }}> ({unit})</span> : null}
      </span>
      <input
        type="number"
        value={Number.isFinite(value) ? Number(value.toFixed(4)) : 0}
        step={step}
        disabled={locked}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          onChange(Number.isFinite(v) ? v : 0);
        }}
        style={{
          ...PARAM_INPUT_STYLE,
          background: locked ? "rgba(13,27,46,0.5)" : "var(--color-bore-2)",
          opacity: locked ? 0.55 : 1,
        }}
      />
    </label>
  );
}

/**
 * ParamSliderField — như ParamField nhưng có thêm slider đồng bộ 2 chiều: kéo
 * slider ↔ gõ số cùng cập nhật một giá trị. Dùng ở Scan setup (Location /
 * Sequence Parameters) theo quy ước đã thống nhất.
 *
 * `tip` (tuỳ chọn): thêm dấu "?" nhỏ bên cạnh nhãn với tooltip giải thích; hover
 * hiện chữ (dùng cho WW/WL ở bước Image processing).
 */
export function ParamSliderField({
  label,
  unit,
  value,
  onChange,
  min,
  max,
  step = 1,
  locked = false,
  tip,
}: {
  label: string;
  unit?: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  locked?: boolean;
  tip?: string;
}) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <label style={{ display: "grid", gap: 3, minWidth: 0 }}>
      <span
        className="mono"
        style={{ fontSize: "0.7rem", lineHeight: 1.25, color: "var(--color-muted)", overflowWrap: "anywhere", display: "inline-flex", alignItems: "center", gap: "var(--space-1)" }}
      >
        {label}
        {unit ? <span style={{ color: "var(--color-faint)" }}> ({unit})</span> : null}
        {tip ? (
          <span
            title={tip}
            aria-label={tip}
            style={{
              display: "inline-grid",
              placeItems: "center",
              width: 16,
              height: 16,
              borderRadius: "50%",
              border: "1px solid var(--color-line-strong)",
              color: "var(--color-faint)",
              fontSize: "0.62rem",
              cursor: "help",
              userSelect: "none",
            }}
          >
            ?
          </span>
        ) : null}
      </span>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 68px", gap: "var(--space-2)", alignItems: "center" }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : min}
          disabled={locked}
          onChange={(e) => onChange(clamp(parseFloat(e.target.value)))}
          style={{ width: "100%", minWidth: 0, accentColor: "var(--color-proton-cyan)", opacity: locked ? 0.55 : 1 }}
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? Number(value.toFixed(4)) : 0}
          disabled={locked}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            onChange(Number.isFinite(v) ? clamp(v) : min);
          }}
          style={{
            ...PARAM_INPUT_STYLE,
            width: 68,
            background: locked ? "rgba(13,27,46,0.5)" : "var(--color-bore-2)",
            opacity: locked ? 0.55 : 1,
          }}
        />
      </div>
    </label>
  );
}
