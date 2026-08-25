import { useT } from "../../i18n/useT";
import { formatNumber } from "../../i18n/format";

interface ParamSliderProps {
  id: string;
  label: string;
  unit?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  /** Định dạng hiển thị giá trị (mặc định formatNumber theo locale). */
  format?: (v: number) => string;
  disabled?: boolean;
  onChange: (v: number) => void;
}

/**
 * ParamSlider — thanh trượt tham số dùng chung cho các bài Module 1.
 * Có nhãn + đơn vị + giá trị hiện tại, target tối thiểu 44px, accent cyan.
 */
export function ParamSlider({
  id,
  label,
  unit,
  min,
  max,
  step,
  value,
  format,
  disabled,
  onChange,
}: ParamSliderProps) {
  const { locale } = useT();
  const fmt = (v: number) => (format ? format(v) : formatNumber(v, locale));
  const display = fmt(value);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <label
          htmlFor={id}
          style={{ fontFamily: "var(--font-data)", fontSize: "0.82rem", color: "var(--color-muted)" }}
        >
          {label}
        </label>
        <span className="mono" style={{ color: "var(--color-proton-cyan)" }}>
          {display}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", marginTop: "var(--space-2)", accentColor: "var(--color-proton-cyan)" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span className="mono" style={{ fontSize: "0.72rem", color: "var(--color-faint)" }}>
          {fmt(min)}
        </span>
        <span className="mono" style={{ fontSize: "0.72rem", color: "var(--color-faint)" }}>
          {fmt(max)}
        </span>
      </div>
    </div>
  );
}
