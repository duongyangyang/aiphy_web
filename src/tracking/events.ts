/**
 * tracking/events — gửi sự kiện học tập lên server (fire-and-forget).
 *
 * Dùng cho các hành động có ý nghĩa nghiên cứu: chạy dự đoán Module 3, siêu
 * phân giải Module 4, chạy một loạt chụp Module 2. Không chặn giao diện —
 * lỗi mạng thì bỏ qua.
 */

export type EventKind = "lesson_start" | "lesson_complete" | "m2_scan" | "m3_run" | "m4_run";

export function trackEvent(kind: EventKind, module: string, payload?: unknown): void {
  void fetch("/api/track/event", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, module, payload }),
    keepalive: true,
  }).catch(() => {
    // Sự kiện là dữ liệu phụ — không làm gián đoạn trải nghiệm người dùng.
  });
}
