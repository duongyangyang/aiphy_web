import { create } from "zustand";

/**
 * progress/store — tiến độ Module 1 của người dùng hiện tại, đồng bộ với server.
 *
 * Nguồn sự thật là bảng `lesson_progress`; store này chỉ giữ bản sao để giao
 * diện đọc đồng bộ. Mọi thao tác ghi đều gọi API rồi cập nhật lại state.
 */

export interface LessonProgress {
  lessonId: string;
  startedAt: string | null;
  completedAt: string | null;
}

interface ProgressState {
  lessons: Record<string, LessonProgress>;
  loaded: boolean;
  load: () => Promise<void>;
  start: (lessonId: string) => Promise<void>;
  complete: (lessonId: string) => Promise<void>;
  reset: () => void;
}

async function post(path: string): Promise<void> {
  const res = await fetch(path, { method: "POST", credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  lessons: {},
  loaded: false,

  load: async () => {
    try {
      const res = await fetch("/api/progress", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { lessons: LessonProgress[] };
      const map: Record<string, LessonProgress> = {};
      for (const l of data.lessons) map[l.lessonId] = l;
      set({ lessons: map, loaded: true });
    } catch {
      // Không tải được thì vẫn đánh dấu loaded để giao diện không treo spinner.
      set({ loaded: true });
    }
  },

  start: async (lessonId) => {
    const existing = get().lessons[lessonId];
    // Đã ghi nhận rồi thì không gọi lại server.
    if (existing?.startedAt) return;

    const now = new Date().toISOString();
    set((s) => ({
      lessons: {
        ...s.lessons,
        [lessonId]: {
          lessonId,
          startedAt: existing?.startedAt ?? now,
          completedAt: existing?.completedAt ?? null,
        },
      },
    }));

    try {
      await post(`/api/progress/${encodeURIComponent(lessonId)}/start`);
    } catch {
      // Giữ trạng thái lạc quan; lần tải trang sau sẽ đồng bộ lại.
    }
  },

  complete: async (lessonId) => {
    const now = new Date().toISOString();
    set((s) => {
      const existing = s.lessons[lessonId];
      return {
        lessons: {
          ...s.lessons,
          [lessonId]: {
            lessonId,
            startedAt: existing?.startedAt ?? now,
            completedAt: existing?.completedAt ?? now,
          },
        },
      };
    });

    try {
      await post(`/api/progress/${encodeURIComponent(lessonId)}/complete`);
    } catch {
      // Lạc quan: người dùng thấy tiến độ ngay; lần sau đồng bộ lại.
    }
  },

  reset: () => set({ lessons: {}, loaded: false }),
}));
