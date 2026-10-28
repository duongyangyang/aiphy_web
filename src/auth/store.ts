import { create } from "zustand";
import {
  fetchMe,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  type AuthUser,
} from "./api";

/**
 * auth/store — trạng thái phiên đăng nhập của toàn app.
 *
 * `status`:
 *   - "loading": đang hỏi server xem cookie còn hiệu lực không (lần tải đầu).
 *   - "authed" : đã có user.
 *   - "anon"   : chưa đăng nhập.
 *
 * Không persist vào localStorage — nguồn sự thật là cookie httpOnly ở server.
 */

type Status = "loading" | "authed" | "anon";

interface AuthState {
  user: AuthUser | null;
  status: Status;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Xoá trạng thái khi server trả 401 giữa chừng. */
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "loading",

  refresh: async () => {
    try {
      const { user } = await fetchMe();
      set({ user, status: "authed" });
    } catch {
      // 401 là bình thường (chưa đăng nhập); lỗi mạng cũng về trạng thái anon
      // để không treo app ở màn hình loading.
      set({ user: null, status: "anon" });
    }
  },

  login: async (email, password) => {
    const { user } = await apiLogin(email, password);
    set({ user, status: "authed" });
  },

  register: async (email, name, password) => {
    const { user } = await apiRegister(email, name, password);
    set({ user, status: "authed" });
  },

  logout: async () => {
    try {
      await apiLogout();
    } finally {
      set({ user: null, status: "anon" });
    }
  },

  clear: () => set({ user: null, status: "anon" }),
}));
