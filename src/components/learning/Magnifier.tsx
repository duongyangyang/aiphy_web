import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Magnifier — kính lúp zoom khi di chuột vào ảnh SR output (Module 4).
 *
 * - Ống kính tròn (180px) theo sát con trỏ, phóng to 3×, có tâm ngắm chữ thập
 * - Gọi `onPixelChange` với uncertainty tại pixel đang hover để hiển thị bên ngoài
 */
interface MagnifierProps {
  srBase64: string;
  uncertaintyBase64: string;
  uncertaintyMin: number;
  uncertaintyMax: number;
  naturalW: number;
  naturalH: number;
  onPixelChange?: (info: { uc: number; px: number; py: number } | null) => void;
}

const LENS = 180;
const ZOOM = 3;

export function Magnifier({
  srBase64,
  uncertaintyBase64,
  uncertaintyMin,
  uncertaintyMax,
  naturalW,
  naturalH,
  onPixelChange,
}: MagnifierProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const ucCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const ucLoadedRef = useRef(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [show, setShow] = useState(false);

  const srUrl = `data:image/png;base64,${srBase64}`;
  const uncertaintyUrl = `data:image/png;base64,${uncertaintyBase64}`;

  // Tải ảnh uncertainty vào canvas ẩn để lấy mẫu pixel
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        ucCtxRef.current = ctx;
        ucLoadedRef.current = true;
      }
    };
    img.src = uncertaintyUrl;
  }, [uncertaintyUrl]);

  const handleMove = useCallback((e: React.MouseEvent) => {
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const rx = e.clientX - rect.left;
    const ry = e.clientY - rect.top;
    const sx = naturalW / rect.width;
    const sy = naturalH / rect.height;
    const nx = rx * sx;
    const ny = ry * sy;
    setPos({ x: nx, y: ny });

    if (ucCtxRef.current && ucLoadedRef.current) {
      const ix = Math.min(Math.round(nx), naturalW - 1);
      const iy = Math.min(Math.round(ny), naturalH - 1);
      try {
        const pixel = ucCtxRef.current.getImageData(ix, iy, 1, 1).data;
        const norm = pixel[0] / 255;
        const range = uncertaintyMax - uncertaintyMin;
        const uc = isFinite(range) && range > 0
          ? norm * range + uncertaintyMin
          : norm;
        onPixelChange?.({ uc, px: Math.round(nx), py: Math.round(ny) });
      } catch {
        onPixelChange?.(null);
      }
    }
  }, [naturalW, naturalH, uncertaintyMin, uncertaintyMax, onPixelChange]);

  const bgX = pos ? -pos.x * ZOOM + LENS / 2 : 0;
  const bgY = pos ? -pos.y * ZOOM + LENS / 2 : 0;

  return (
    <div style={{ display: "grid", gap: "var(--space-2)", width: "100%" }}>
      {/* Ảnh SR + kính lúp */}
      <div
        style={{
          position: "relative",
          display: "inline-block",
          cursor: "none",
          lineHeight: 0,
          borderRadius: 4,
          overflow: "hidden",
        }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => { setShow(false); setPos(null); onPixelChange?.(null); }}
        onMouseMove={handleMove}
      >
        <img
          ref={imgRef}
          src={srUrl}
          alt="Super-resolved output"
          style={{ maxWidth: "100%", display: "block", borderRadius: 4 }}
          draggable={false}
        />

        {/* Ống kính lúp */}
        {show && pos && (
          <>
            <div
              style={{
                position: "absolute",
                left: pos.x / naturalW * (imgRef.current?.clientWidth ?? naturalW) - LENS / 2 - 4,
                top: pos.y / naturalH * (imgRef.current?.clientHeight ?? naturalH) - LENS / 2 - 4,
                width: LENS + 8,
                height: LENS + 8,
                borderRadius: "50%",
                border: "2px solid rgba(55,215,232,0.35)",
                boxShadow: "0 0 24px rgba(55,215,232,0.3), 0 0 48px rgba(55,215,232,0.12)",
                pointerEvents: "none",
                zIndex: 9,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: pos.x / naturalW * (imgRef.current?.clientWidth ?? naturalW) - LENS / 2,
                top: pos.y / naturalH * (imgRef.current?.clientHeight ?? naturalH) - LENS / 2,
                width: LENS,
                height: LENS,
                borderRadius: "50%",
                border: "2.5px solid var(--color-proton-cyan)",
                boxShadow:
                  "0 0 0 4px rgba(3,8,16,0.6), 0 0 20px rgba(55,215,232,0.45), inset 0 0 16px rgba(0,0,0,0.35)",
                overflow: "hidden",
                pointerEvents: "none",
                zIndex: 10,
                backgroundImage: `url(${srUrl})`,
                backgroundSize: `${naturalW * ZOOM}px ${naturalH * ZOOM}px`,
                backgroundPosition: `${bgX}px ${bgY}px`,
                backgroundRepeat: "no-repeat",
              }}
            >
              {/* Tâm ngắm chữ thập */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  pointerEvents: "none",
                }}
              >
                <div style={{ position: "relative", width: 18, height: 18 }}>
                  <div style={{
                    position: "absolute", top: "50%", left: 0, right: 0, height: 1,
                    background: "rgba(55,215,232,0.85)", boxShadow: "0 0 2px rgba(0,0,0,0.5)",
                  }} />
                  <div style={{
                    position: "absolute", left: "50%", top: 0, bottom: 0, width: 1,
                    background: "rgba(55,215,232,0.85)", boxShadow: "0 0 2px rgba(0,0,0,0.5)",
                  }} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}