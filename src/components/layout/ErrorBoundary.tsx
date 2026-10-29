import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

/**
 * ErrorBoundary — chặn lỗi render để một bài học hỏng không làm trắng cả site.
 *
 * Hiển thị thông báo thân thiện + nút tải lại. Nội dung tĩnh (không dùng i18n)
 * vì boundary phải hoạt động kể cả khi chính store i18n gặp lỗi.
 */

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[aiphys] Unhandled UI error:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          background: "#07111f",
          color: "#eaf6f8",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 520,
            padding: 32,
            borderRadius: 18,
            border: "1px solid rgba(234,246,248,0.2)",
            background: "#102235",
          }}
        >
          <p
            style={{
              fontFamily: "IBM Plex Mono, ui-monospace, monospace",
              fontSize: "0.74rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#37d7e8",
              margin: "0 0 8px",
            }}
          >
            Ciying Zhixi
          </p>
          <h1 style={{ fontSize: "1.4rem", margin: "0 0 12px", fontWeight: 600 }}>
            Đã xảy ra lỗi / Something went wrong
          </h1>
          <p style={{ color: "#8ea7b8", margin: "0 0 20px", lineHeight: 1.55 }}>
            Trang này gặp sự cố khi hiển thị. Dữ liệu học tập của bạn vẫn an toàn.
            <br />
            This page hit an error while rendering. Your learning data is safe.
          </p>

          {/* Chi tiết lỗi: hiển thị để người vận hành chẩn đoán nhanh, không
              phải mở console. Không lộ thông tin nhạy cảm — chỉ là thông báo
              của runtime. */}
          <details style={{ marginBottom: 20 }}>
            <summary
              style={{
                cursor: "pointer",
                fontFamily: "IBM Plex Mono, ui-monospace, monospace",
                fontSize: "0.78rem",
                color: "#5c7790",
              }}
            >
              Chi tiết kỹ thuật / Technical detail
            </summary>
            <pre
              style={{
                marginTop: 10,
                padding: 12,
                borderRadius: 8,
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(234,246,248,0.14)",
                color: "#ff9b9b",
                fontFamily: "IBM Plex Mono, ui-monospace, monospace",
                fontSize: "0.74rem",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                maxHeight: 180,
                overflow: "auto",
              }}
            >
              {String(this.state.error?.message ?? this.state.error)}
            </pre>
          </details>

          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              minHeight: 44,
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(180deg, #37d7e8, #2bb9c9)",
              color: "#06222b",
              fontFamily: "inherit",
              fontSize: "0.95rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Tải lại trang / Reload
          </button>
        </div>
      </div>
    );
  }
}
