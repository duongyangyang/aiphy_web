import { create } from "zustand";

/**
 * config/store — cấu hình runtime do server quyết định.
 *
 * `mlEnabled` cho biết máy chủ này có chạy dịch vụ mô hình học sâu không.
 * Module 3/4 luôn hiển thị đầy đủ nội dung lý thuyết; khi tắt, nút chạy mô
 * hình thay bằng thông báo "chưa hỗ trợ do giới hạn phần cứng".
 *
 * Mặc định `true` để lần tải đầu không nháy thông báo sai; `load()` chạy ngay
 * khi app mount và sửa lại theo server.
 */

interface ConfigState {
  mlEnabled: boolean;
  loaded: boolean;
  load: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set) => ({
  mlEnabled: true,
  loaded: false,

  load: async () => {
    try {
      const res = await fetch("/api/config", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { mlEnabled?: boolean };
      set({ mlEnabled: data.mlEnabled !== false, loaded: true });
    } catch {
      // Không đọc được cấu hình: giữ mặc định bật. Nếu ML thật sự không chạy,
      // lần gọi inference sẽ trả lỗi và người dùng thấy thông báo tương ứng.
      set({ loaded: true });
    }
  },
}));
