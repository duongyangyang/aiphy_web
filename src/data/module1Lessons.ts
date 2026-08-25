/**
 * module1Lessons — registry 11 bài của Module 1, chia 4 giai đoạn.
 *
 * Nguồn: `module1-thiet-ke.md`. `tab` là nhãn ngắn cho thanh điều hướng
 * (để 11 nút nằm gọn trong trang, không cần cuộn). Toàn bộ bài đều
 * `status: "available"`; component tương ứng gán trong `Module1Page.tsx`.
 *
 * Các trường nội dung (`title`, `tab`, `objective`) là `LocalizedString`
 * ({vi,en,zh}); id/order/phase/status giữ nguyên.
 */
import type { LocalizedString } from "../i18n/types";

export type LessonStatus = "available" | "placeholder";

export type Phase =
  | "signal-foundations"
  | "machine-calibration"
  | "basic-imaging"
  | "relaxometry";

export interface Module1Lesson {
  id: string;
  order: number;
  title: LocalizedString;
  /** Nhãn ngắn cho thanh tab. */
  tab: LocalizedString;
  phase: Phase;
  status: LessonStatus;
  objective: LocalizedString;
}

/** Nhãn giai đoạn theo locale. Resolve bằng `tr()` ở nơi dùng. */
export const phaseLabels: Record<Phase, LocalizedString> = {
  "signal-foundations": {
    vi: "Giai đoạn 1 · Nền tảng tín hiệu",
    en: "Phase 1 · Signal foundations",
    zh: "阶段 1 · 信号基础",
  },
  "machine-calibration": {
    vi: "Giai đoạn 2 · Hiệu chỉnh máy",
    en: "Phase 2 · Machine calibration",
    zh: "阶段 2 · 设备校准",
  },
  "basic-imaging": {
    vi: "Giai đoạn 3 · Tạo ảnh cơ bản",
    en: "Phase 3 · Basic imaging",
    zh: "阶段 3 · 基础成像",
  },
  relaxometry: {
    vi: "Giai đoạn 4 · Đo T1/T2",
    en: "Phase 4 · Measuring T1/T2",
    zh: "阶段 4 · 测量 T1/T2",
  },
};

export const module1Lessons: Module1Lesson[] = [
  // Giai đoạn 1
  {
    id: "lesson-1-fid",
    order: 1,
    title: {
      vi: "Phát hiện tín hiệu cộng hưởng từ hạt nhân (FID)",
      en: "Detecting the nuclear magnetic resonance signal (FID)",
      zh: "检测核磁共振信号（FID）",
    },
    tab: { vi: "FID", en: "FID", zh: "FID" },
    phase: "signal-foundations",
    status: "available",
    objective: {
      vi: "Hiểu quá trình kích thích và hồi phục; hiểu 3 yếu tố của tín hiệu FID.",
      en: "Understand excitation and relaxation; understand the three factors of the FID signal.",
      zh: "理解激发与弛豫过程；理解 FID 信号的三个要素。",
    },
  },
  {
    id: "lesson-2-field-stability",
    order: 2,
    title: {
      vi: "Đo cường độ và độ ổn định từ trường",
      en: "Measuring field strength and stability",
      zh: "测量磁场强度与稳定性",
    },
    tab: { vi: "Từ trường", en: "Field", zh: "磁场" },
    phase: "signal-foundations",
    status: "available",
    objective: {
      vi: "Hiểu quan hệ tần số Larmor — cường độ từ trường B0; hiểu độ trôi từ trường.",
      en: "Understand the Larmor frequency — field strength B0 relationship; understand field drift.",
      zh: "理解拉莫尔频率与磁场强度 B0 的关系；理解磁场漂移。",
    },
  },
  // Giai đoạn 2
  {
    id: "lesson-3-shimming",
    order: 3,
    title: {
      vi: "Đo và điều chỉnh độ đồng nhất từ trường (Shimming)",
      en: "Measuring and adjusting field homogeneity (Shimming)",
      zh: "测量并调整磁场均匀度（Shimming）",
    },
    tab: { vi: "Shim", en: "Shim", zh: "Shim" },
    phase: "machine-calibration",
    status: "available",
    objective: {
      vi: "Hiểu ảnh hưởng của độ không đồng nhất từ trường lên T2*.",
      en: "Understand the effect of field inhomogeneity on T2*.",
      zh: "理解磁场不均匀性对 T2* 的影响。",
    },
  },
  {
    id: "lesson-4-auto-gain",
    order: 4,
    title: {
      vi: "Điều chỉnh gain tự động",
      en: "Automatic gain adjustment",
      zh: "自动增益调节",
    },
    tab: { vi: "Gain", en: "Gain", zh: "Gain" },
    phase: "machine-calibration",
    status: "available",
    objective: {
      vi: "Hiểu vì sao cần khuếch đại nhưng không được khuếch đại quá mức (giới hạn ADC).",
      en: "Understand why amplification is needed but must not be excessive (ADC limit).",
      zh: "理解为何需要放大但不能过度放大（ADC 限制）。",
    },
  },
  {
    id: "lesson-5-hard-pulse",
    order: 5,
    title: {
      vi: "Xác định góc lật xung cứng (90°/180°)",
      en: "Determining the hard-pulse flip angle (90°/180°)",
      zh: "确定硬脉冲翻转角（90°/180°）",
    },
    tab: { vi: "Xung cứng", en: "Hard pulse", zh: "硬脉冲" },
    phase: "machine-calibration",
    status: "available",
    objective: {
      vi: "Hiểu quan hệ độ rộng xung và góc lật từ hóa.",
      en: "Understand the relationship between pulse width and flip angle.",
      zh: "理解脉冲宽度与翻转角的关系。",
    },
  },
  {
    id: "lesson-6-soft-pulse",
    order: 6,
    title: {
      vi: "Xác định góc lật xung mềm",
      en: "Determining the soft-pulse flip angle",
      zh: "确定软脉冲翻转角",
    },
    tab: { vi: "Xung mềm", en: "Soft pulse", zh: "软脉冲" },
    phase: "machine-calibration",
    status: "available",
    objective: {
      vi: "Phân biệt xung cứng (non-selective) và xung mềm (selective).",
      en: "Distinguish hard (non-selective) and soft (selective) pulses.",
      zh: "区分硬脉冲（非选择性）与软脉冲（选择性）。",
    },
  },
  // Giai đoạn 3
  {
    id: "lesson-7-prescan",
    order: 7,
    title: {
      vi: "Prescan: quy trình chuẩn máy trước khi chụp",
      en: "Prescan: standard scanner procedure before scanning",
      zh: "Prescan：扫描前的标准设备流程",
    },
    tab: { vi: "Prescan", en: "Prescan", zh: "Prescan" },
    phase: "basic-imaging",
    status: "available",
    objective: {
      vi: "Hiểu vì sao cần hiệu chỉnh máy trước mỗi lần chụp.",
      en: "Understand why the scanner must be calibrated before each scan.",
      zh: "理解为何每次扫描前都需要校准设备。",
    },
  },
  {
    id: "lesson-8-spin-echo-fov",
    order: 8,
    title: {
      vi: "Tạo ảnh chuỗi xung Spin Echo: FOV và độ phân giải",
      en: "Imaging with the Spin Echo pulse sequence: FOV and resolution",
      zh: "自旋回波脉冲序列成像：FOV 与分辨率",
    },
    tab: { vi: "FOV", en: "FOV", zh: "FOV" },
    phase: "basic-imaging",
    status: "available",
    objective: {
      vi: "Hiểu quan hệ gradient mã hóa, băng thông, và trường nhìn (FOV).",
      en: "Understand the relationship between encoding gradients, bandwidth, and field of view (FOV).",
      zh: "理解编码梯度、带宽与视野（FOV）之间的关系。",
    },
  },
  {
    id: "lesson-9-weighting",
    order: 9,
    title: {
      vi: "Ảnh trọng số (T1WI / T2WI / PDWI)",
      en: "Weighted images (T1WI / T2WI / PDWI)",
      zh: "加权图像（T1WI / T2WI / PDWI）",
    },
    tab: { vi: "Trọng số", en: "Weighting", zh: "加权" },
    phase: "basic-imaging",
    status: "available",
    objective: {
      vi: "Hiểu vì sao cùng mẫu vật cho ảnh khác nhau tùy tham số quét.",
      en: "Understand why the same sample yields different images depending on scan parameters.",
      zh: "理解为何同一样本在不同扫描参数下会产生不同图像。",
    },
  },
  // Giai đoạn 4
  {
    id: "lesson-10-t1-ir",
    order: 10,
    title: {
      vi: "Đo T1 bằng chuỗi xung Inversion Recovery (IR)",
      en: "Measuring T1 with the Inversion Recovery (IR) pulse sequence",
      zh: "用 Inversion Recovery（IR）脉冲序列测量 T1",
    },
    tab: { vi: "T1 (IR)", en: "T1 (IR)", zh: "T1 (IR)" },
    phase: "relaxometry",
    status: "available",
    objective: {
      vi: "Hiểu nguyên lý đo T1 qua nhiều điểm thời gian đảo ngược (TI).",
      en: "Understand the principle of measuring T1 across multiple inversion times (TI).",
      zh: "理解通过多个反转时间（TI）点测量 T1 的原理。",
    },
  },
  {
    id: "lesson-11-t2-cpmg",
    order: 11,
    title: {
      vi: "Đo T2 bằng chuỗi xung CPMG",
      en: "Measuring T2 with the CPMG pulse sequence",
      zh: "用 CPMG 脉冲序列测量 T2",
    },
    tab: { vi: "T2 (CPMG)", en: "T2 (CPMG)", zh: "T2 (CPMG)" },
    phase: "relaxometry",
    status: "available",
    objective: {
      vi: "Hiểu nguyên lý chuỗi echo và vì sao CPMG đo được T2 thật.",
      en: "Understand the echo-train principle and why CPMG measures true T2.",
      zh: "理解回波链原理以及为何 CPMG 能测得真实 T2。",
    },
  },
];

export function getLesson(id: string): Module1Lesson | undefined {
  return module1Lessons.find((l) => l.id === id);
}
