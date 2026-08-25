/**
 * Module2 types — các kiểu dùng chung cho Module 2 (MRI simulator).
 * Tách riêng khỏi store để các component import type mà không kéo theo
 * zustand create() (tránh vòng import không cần thiết).
 */
import type { LocalizedString } from "../i18n/types";

/** 5 bước luồng vận hành MRI/NMR thật. */
export type ModuleStep =
  | "prescan"
  | "scout"
  | "scanSetup"
  | "scanning"
  | "imageProcessing";

/** Thông tin hiển thị cho mỗi bước (nhãn tab + tiêu đề vùng chính). */
export interface StepMeta {
  key: ModuleStep;
  /** Nhãn ngắn trên thanh bước (thuật ngữ MRI tiếng Anh chuẩn, giữ nguyên). */
  tab: string;
  /** Tiêu đề đầy đủ ở vùng chính. */
  title: LocalizedString;
  /** Mô tả một dòng. */
  hint: LocalizedString;
}

/**
 * MODULE2_STEPS — bảng metadata đầy đủ (gồm cả trạng thái tạm `scanning`),
 * dùng để tra tiêu đề/hint theo `currentStep`.
 *
 * `scanning` KHÔNG phải một bước điều hướng độc lập — nó là trạng thái tạm khi
 * lệnh "Scan" chạy (khởi động từ trong Scan setup). Thanh bước ở đầu trang chỉ
 * hiển thị `NAV_STEPS` (không có Scan).
 */
export const MODULE2_STEPS: StepMeta[] = [
  {
    key: "prescan",
    tab: "Prescan",
    title: { vi: "Prescan · Hiệu chỉnh hệ thống", en: "Prescan · System calibration", zh: "预扫描 · 系统校准" },
    hint: { vi: "Cân O1, shim, biên độ & độ rộng xung RF trước khi chụp.", en: "Balance O1, shim, RF amplitude & pulse width before scanning.", zh: "扫描前调整 O1、匀场、射频幅度与脉冲宽度。" },
  },
  {
    key: "scout",
    tab: "Scout",
    title: { vi: "Scout · Ảnh định vị", en: "Scout · Localizer images", zh: "定位 · 定位像" },
    hint: { vi: "Chụp 3 mặt phẳng (sagittal/coronal/axial) để định vị lát cắt.", en: "Acquire 3 planes (sagittal/coronal/axial) to localize slices.", zh: "采集三个方位（矢状/冠状/轴位）以定位切层。" },
  },
  {
    key: "scanSetup",
    tab: "Scan setup",
    title: { vi: "Scan setup · Lát cắt & chuỗi xung", en: "Scan setup · Slices & pulse sequence", zh: "扫描设置 · 切层与脉冲序列" },
    hint: { vi: "Đặt FOV, độ dày/lượt lát cắt, hướng đáy góc và tham số TR/TE/FA.", en: "Set FOV, slice thickness/count, angulation and TR/TE/FA.", zh: "设置 FOV、层厚/层数、角度方向与 TR/TE/FA。" },
  },
  {
    key: "scanning",
    tab: "Scan",
    title: { vi: "Scan · Thu k-space", en: "Scan · k-space acquisition", zh: "扫描 · 采集 k 空间" },
    hint: { vi: "Thu dữ liệu k-space theo chuỗi xung đã chọn.", en: "Acquire k-space data per the selected pulse sequence.", zh: "按所选脉冲序列采集 k 空间数据。" },
  },
  {
    key: "imageProcessing",
    tab: "Processing",
    title: { vi: "Image processing · Tái tạo ảnh", en: "Image processing · Image reconstruction", zh: "图像处理 · 图像重建" },
    hint: { vi: "FFT, lưới ảnh (1×1 / 2×4 / 3×6) và lưu ca chụp.", en: "FFT, image grid (1×1 / 2×4 / 3×6) and save the scan.", zh: "FFT、图像网格 (1×1 / 2×4 / 3×6) 并保存扫描。" },
  },
];

/**
 * NAV_STEPS — các bước điều hướng hiển thị trên thanh bước ngang. Bỏ
 * `scanning`: Scan là lệnh chạy sau khi cấu hình xong tham số trong Scan
 * setup, không phải một mục chọn riêng.
 */
export const NAV_STEPS: StepMeta[] = MODULE2_STEPS.filter((s) => s.key !== "scanning");

/**
 * MIN_QUALITY_TO_PROCEED — ngưỡng calibrationQuality để Prescan được xem là
 * đạt, cho phép sang bước Scout. Dời lên đây (dùng chung) thay vì để cục bộ
 * trong PrescanStep.
 */
export const MIN_QUALITY_TO_PROCEED = 0.8;

/**
 * StepGatingState — phần state của Module2 store mà các hàm gating đọc. Tách
 * interface hẹp để tránh kéo toàn bộ store (tránh vòng import).
 */
export interface StepGatingState {
  calibration: { quality: number } | null;
  scoutImages: unknown | null;
  scanResults: unknown[];
}

/**
 * isStepCompleted — bước đã hoàn thành chưa (theo dữ liệu trong store):
 *  - prescan: có calibration và quality >= MIN_QUALITY_TO_PROCEED.
 *  - scout: có ảnh scout.
 *  - scanSetup: scout đã xong (bước cấu hình sẵn sàng rời đi khi đã có ảnh
 *    định vị — bản thân nó không có "kết quả" riêng).
 *  - scanning: đã có ít nhất 1 ảnh kết quả (tức Scan đã chạy và sinh results).
 *  - imageProcessing: luôn true (bước cuối).
 *
 * Lưu ý: `isStepUnlocked` dùng isStepCompleted của các bước trước, nên
 *   - mở khoá scanning cần scanSetup completed = scoutDone (đúng: Scan chỉ
 *     chạy được khi đã có scout).
 *   - mở khoá imageProcessing cần scanning completed = scanResults.length > 0.
 */
export function isStepCompleted(state: StepGatingState, step: ModuleStep): boolean {
  switch (step) {
    case "prescan":
      return !!state.calibration && state.calibration.quality >= MIN_QUALITY_TO_PROCEED;
    case "scout":
      return !!state.scoutImages;
    case "scanSetup":
      return !!state.scoutImages;
    case "scanning":
      return state.scanResults.length > 0;
    case "imageProcessing":
      return true;
    default:
      return false;
  }
}

/**
 * isStepUnlocked — target được phép vào khi mọi bước đứng trước nó (theo
 * MODULE2_STEPS) đều đã hoàn thành. prescan luôn mở; scout cần prescan;
 * scanSetup/scanning cần scout; imageProcessing cần có ảnh kết quả.
 */
export function isStepUnlocked(state: StepGatingState, target: ModuleStep): boolean {
  const order = MODULE2_STEPS.map((s) => s.key);
  const idx = order.indexOf(target);
  if (idx <= 0) return true; // prescan (đầu) luôn mở
  for (let i = 0; i < idx; i++) {
    if (!isStepCompleted(state, order[i])) return false;
  }
  return true;
}

/**
 * stepBlockReason — lý do (chuỗi địa phương hoá) chặn việc sang target, hoặc
 * null nếu đã mở khoá. Tìm bước trước chưa completed gần nhất và nhắc bằng
 * `title` của bước đó. Trả `LocalizedString` để call site resolve theo locale.
 */
export function stepBlockReason(
  state: StepGatingState,
  target: ModuleStep,
): LocalizedString | null {
  if (isStepUnlocked(state, target)) return null;
  const order = MODULE2_STEPS;
  const idx = order.findIndex((s) => s.key === target);
  for (let i = idx - 1; i >= 0; i--) {
    if (!isStepCompleted(state, order[i].key)) {
      const prev = order[i];
      const next = order[idx];
      const q = MIN_QUALITY_TO_PROCEED;
      if (prev.key === "prescan") {
        const destTab = target === "scout" ? "Scout" : null;
        return {
          vi: `Hoàn thành bước Prescan (calibrationQuality >= ${q}) trước khi sang ${destTab ?? next.title.vi}.`,
          en: `Complete the Prescan step (calibrationQuality >= ${q}) before going to ${destTab ?? next.title.en}.`,
          zh: `请先完成预扫描步骤（calibrationQuality >= ${q}）再进入${destTab ?? next.title.zh}。`,
        };
      }
      if (prev.key === "scout") {
        return {
          vi: `Chụp ảnh Scout ở bước "${prev.title.vi}" trước khi sang ${next.title.vi}.`,
          en: `Acquire Scout images in the "${prev.title.en}" step before going to ${next.title.en}.`,
          zh: `请先在"${prev.title.zh}"步骤采集定位像，再进入${next.title.zh}。`,
        };
      }
      return {
        vi: `Hoàn thành bước "${prev.title.vi}" trước khi sang ${next.title.vi}.`,
        en: `Complete the "${prev.title.en}" step before going to ${next.title.en}.`,
        zh: `请先完成"${prev.title.zh}"步骤，再进入${next.title.zh}。`,
      };
    }
  }
  return null;
}
