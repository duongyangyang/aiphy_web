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

    const sessionId = crypto.randomUUID();
    sessionIdRef.current = sessionId;

    const beat = (end: boolean) => {
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
