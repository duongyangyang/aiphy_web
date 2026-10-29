import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuthStore } from "../auth/store";

/**
 * useUsageTracking — ghi nhận thời lượng sử dụng phục vụ nghiên cứu.
 *
 * Cơ chế:
 *   - Mỗi lần tab được mở (mount), sinh một sessionId và gửi heartbeat ngay.
 *   - Sau đó heartbeat mỗi HEARTBEAT_MS khi tab còn hiển thị.
 *   - Tab ẩn (chuyển tab / thu nhỏ) → dừng gửi, server không cộng thêm thời gian.
 *   - Đóng tab → gửi lần cuối bằng `sendBeacon` (không bị huỷ giữa đường).
 *
 * Server tính duration = last_seen_at − opened_at, đúng định nghĩa
 * "mở tab → đóng tab", và chặn mỗi bước nhảy ở 90 giây để thời gian ngủ/mất
 * mạng không bị tính nhầm là thời gian học.
 *
 * Chỉ chạy khi đã đăng nhập; đăng xuất là ngừng ghi.
 */

const HEARTBEAT_MS = 30_000;

/** Suy ra module hiện tại từ đường dẫn. */
export function moduleFromPath(pathname: string): string {
  if (pathname.startsWith("/module-1")) return "module-1";
  if (pathname.startsWith("/module-2")) return "module-2";
  if (pathname.startsWith("/module-3")) return "module-3";
  if (pathname.startsWith("/module-4")) return "module-4";
  return "other";
}

/**
 * Sinh id phiên ngẫu nhiên.
 *
 * KHÔNG dùng thẳng `crypto.randomUUID()`: hàm đó chỉ tồn tại trong secure
 * context (HTTPS hoặc localhost). Triển khai chạy http:// trên địa chỉ IP sẽ
 * có `crypto.randomUUID === undefined` và ném TypeError ngay sau khi đăng nhập.
 * `crypto.getRandomValues` thì có ở mọi ngữ cảnh, nên dùng nó để dựng UUID v4.
 */
function randomSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    // Cùng đường: môi trường không có Web Crypto. Chất lượng ngẫu nhiên chỉ ảnh
    // hưởng việc gộp nhóm heartbeat, không phải bảo mật.
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // phiên bản 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // biến thể RFC 4122
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function useUsageTracking(): void {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  const sessionIdRef = useRef<string | null>(null);
  const moduleRef = useRef(moduleFromPath(location.pathname));

  // Cập nhật module hiện tại khi đổi trang — không gửi request, chỉ đổi nhãn
  // cho heartbeat kế tiếp.
  useEffect(() => {
    moduleRef.current = moduleFromPath(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    if (status !== "authed") return;

    let sessionId: string;
    try {
      sessionId = randomSessionId();
    } catch {
      // Đo thời lượng là tính năng phụ. Không có id thì bỏ qua phiên này,
      // tuyệt đối không để nó làm sập giao diện.
      return;
    }
    sessionIdRef.current = sessionId;

    const beat = (end: boolean) => {
      // Bọc toàn bộ: đây là mã chạy nền, mọi lỗi ở đây đều phải bị nuốt.
      try {
        const body = JSON.stringify({
          sessionId,
          module: moduleRef.current,
          ...(end ? { end: true } : {}),
        });
        // sendBeacon không gửi được header; dùng fetch với keepalive cho cả hai
        // trường hợp để cookie phiên luôn được đính kèm.
        void fetch("/api/track/heartbeat", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {
          // Mất mạng thì bỏ qua — heartbeat sau sẽ bù.
        });
      } catch {
        // Bỏ qua.
      }
    };

    let timer: number | null = null;

    const start = () => {
      if (timer !== null) return;
      timer = window.setInterval(() => beat(false), HEARTBEAT_MS);
    };

    const stop = () => {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    };

    // Gửi ngay nhịp đầu để server ghi nhận opened_at.
    beat(false);

    if (document.visibilityState === "visible") start();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        beat(false); // bù khoảng thời gian vừa ẩn (server chặn trần 90s)
        start();
      } else {
        beat(false);
        stop();
      }
    };

    const onPageHide = () => {
      beat(true);
      stop();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      // Đóng phiên khi rời app (đăng xuất / unmount) để số liệu khép kín.
      beat(true);
    };
  }, [status]);
}
