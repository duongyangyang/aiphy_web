import { useT } from "../../i18n/useT";

/**
 * LoadingSpinner — hiệu ứng loading chuyên dụng cho vùng visualization
 * của Module 3 & 4. Hiển thị một "lõi proton" xoay với quỹ đạo điện tử
 * và shimmer skeleton, phù hợp theme MRI.
 */
export function LoadingSpinner() {
  const { t } = useT();

  return (
    <>
      <style>{`
        @keyframes lds-orb-pulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.15); opacity: 0.5; }
        }
        @keyframes lds-ring-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes lds-ring-spin-rev {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        @keyframes lds-shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes lds-dot-bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        .lds-shimmer-bar {
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(55,215,232,0.08) 40%,
            rgba(55,215,232,0.18) 50%,
            rgba(55,215,232,0.08) 60%,
            transparent 100%
          );
          background-size: 400px 100%;
          animation: lds-shimmer 2.2s ease-in-out infinite;
        }
        .lds-dot { display: inline-block; animation: lds-dot-bounce 1.4s ease-in-out infinite; }
        .lds-dot:nth-child(2) { animation-delay: 0.16s; }
        .lds-dot:nth-child(3) { animation-delay: 0.32s; }
      `}</style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--space-5)",
          padding: "var(--space-8) var(--space-4)",
          width: "100%",
        }}
      >
        {/* Lõi proton + quỹ đạo */}
        <div
          style={{
            position: "relative",
            width: 80,
            height: 80,
            display: "grid",
            placeItems: "center",
          }}
        >
          {/* Quỹ đạo ngoài */}
          <div
            style={{
              position: "absolute",
              width: 80,
              height: 80,
              borderRadius: "50%",
              border: "1.5px solid rgba(55,215,232,0.25)",
              animation: "lds-ring-spin 3.6s linear infinite",
            }}
          >
            {/* Điểm sáng trên quỹ đạo */}
            <div
              style={{
                position: "absolute",
                top: -4,
                left: "50%",
                transform: "translateX(-50%)",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--color-proton-cyan)",
                boxShadow: "0 0 10px var(--color-proton-cyan), 0 0 20px rgba(55,215,232,0.6)",
              }}
            />
          </div>
          {/* Quỹ đạo trong (ngược chiều) */}
          <div
            style={{
              position: "absolute",
              width: 56,
              height: 56,
              borderRadius: "50%",
              border: "1.5px solid rgba(245,200,66,0.25)",
              animation: "lds-ring-spin-rev 2.4s linear infinite",
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: -4,
                left: "50%",
                transform: "translateX(-50%)",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--color-field-amber)",
                boxShadow: "0 0 8px var(--color-field-amber), 0 0 16px rgba(245,200,66,0.5)",
              }}
            />
          </div>
          {/* Lõi */}
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "radial-gradient(circle at 40% 35%, rgba(55,215,232,0.9), rgba(13,102,142,0.7))",
              boxShadow: "0 0 18px rgba(55,215,232,0.5), 0 0 36px rgba(55,215,232,0.25)",
              animation: "lds-orb-pulse 2s ease-in-out infinite",
            }}
          />
        </div>

        {/* Text */}
        <div style={{ textAlign: "center" }}>
          <p
            className="mono"
            style={{
              fontSize: "0.92rem",
              color: "var(--color-proton-cyan)",
              margin: 0,
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            {t("ml.loading.title")}
            <span className="lds-dot" style={{ color: "var(--color-proton-cyan)" }}>.</span>
            <span className="lds-dot" style={{ color: "var(--color-proton-cyan)" }}>.</span>
            <span className="lds-dot" style={{ color: "var(--color-proton-cyan)" }}>.</span>
          </p>
          <p
            className="mono"
            style={{
              fontSize: "0.72rem",
              color: "var(--color-faint)",
              margin: "var(--space-2) 0 0",
            }}
          >
            {t("ml.loading.subtitle")}
          </p>
        </div>

        {/* Skeleton placeholder bars */}
        <div style={{ width: "100%", maxWidth: 360, display: "grid", gap: "var(--space-3)" }}>
          <div
            className="lds-shimmer-bar"
            style={{ height: 180, borderRadius: "var(--radius-md)", background: "var(--color-bore-2)" }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-3)" }}>
            <div className="lds-shimmer-bar" style={{ height: 48, borderRadius: "var(--radius-sm)" }} />
            <div className="lds-shimmer-bar" style={{ height: 48, borderRadius: "var(--radius-sm)" }} />
            <div className="lds-shimmer-bar" style={{ height: 48, borderRadius: "var(--radius-sm)" }} />
          </div>
        </div>
      </div>
    </>
  );
}