/**
 * modules — registry 4 module của website.
 *
 * Đây là nguồn sự thật cho điều hướng + thẻ trên trang chủ. Thêm module mới
 * bằng cách thêm record tại đây và thêm route trong `src/App.tsx`.
 *
 * Các trường nội dung (`title`, `subtitle`, `description`) là `LocalizedString`
 * ({vi,en,zh}); id/href/status/visual/order giữ nguyên. Tên module hiển thị
 * ("Module N" / "模块 N") nằm ở dictionary key `common.moduleLabel`.
 */
import type { LocalizedString } from "../i18n/types";

export type ModuleId = "module-1" | "module-2" | "module-3" | "module-4";

export type ModuleStatus = "available" | "placeholder";

/** Loại minh họa cho thẻ module (vẽ bằng CSS/SVG trong HomePage). */
export type ModuleVisual = "fid-wave" | "scanner-phantom" | "sr-grid" | "param-prediction";

export interface ModuleCard {
  id: ModuleId;
  order: number;
  title: LocalizedString;
  subtitle: LocalizedString;
  description: LocalizedString;
  href: string;
  status: ModuleStatus;
  visual: ModuleVisual;
}

export const modules: ModuleCard[] = [
  {
    id: "module-1",
    order: 1,
    title: {
      vi: "Học tập chụp MRI",
      en: "Learning MRI scanning",
      zh: "MRI 扫描学习",
    },
    subtitle: {
      vi: "11 bài thí nghiệm tương tác",
      en: "11 interactive experiments",
      zh: "11 个互动实验",
    },
    description: {
      vi: "Vận hành máy MRI qua slider và mô phỏng tín hiệu thời gian thực.",
      en: "Operate an MRI scanner via sliders and real-time signal simulation.",
      zh: "通过滑块操作 MRI 扫描仪并实时模拟信号。",
    },
    href: "/module-1",
    status: "available",
    visual: "fid-wave",
  },
  {
    id: "module-2",
    order: 2,
    title: {
      vi: "Mô phỏng giả lập chụp MRI",
      en: "MRI scanning simulator",
      zh: "MRI 扫描模拟器",
    },
    subtitle: {
      vi: "Simulator chụp MRI",
      en: "MRI scanning simulator",
      zh: "MRI 扫描模拟",
    },
    description: {
      vi: "Chọn protocol, chỉnh tham số, giả lập thu k-space và tái tạo ảnh — lưu mỗi ca chụp.",
      en: "Choose a protocol, tune parameters, simulate k-space acquisition and reconstruct the image — save each scan case.",
      zh: "选择协议、调整参数、模拟 k-space 采集并重建图像——保存每次扫描。",
    },
    href: "/module-2",
    status: "available",
    visual: "scanner-phantom",
  },
  {
    id: "module-3",
    order: 3,
    title: {
      vi: "Dự đoán tham số MRI gần tối ưu",
      en: "Near-optimal MRI parameter prediction",
      zh: "近优 MRI 参数预测",
    },
    subtitle: {
      vi: "Demo dự đoán tham số",
      en: "Parameter prediction demo",
      zh: "参数预测演示",
    },
    description: {
      vi: "Dự đoán tổ hợp tham số quét MRI tối ưu xấp xỉ bằng mô hình học sâu — cân bằng giữa thời gian quét, độ phân giải và nhiễu.",
      en: "Predict near-optimal MRI scan-parameter combinations with a deep-learning model — balancing scan time, resolution, and noise.",
      zh: "利用深度学习模型预测近优 MRI 扫描参数组合——在扫描时间、分辨率与噪声之间取得平衡。",
    },
    href: "/module-3",
    status: "available",
    visual: "param-prediction",
  },
  {
    id: "module-4",
    order: 4,
    title: {
      vi: "Nghiên cứu MRI Super Resolution",
      en: "MRI Super-Resolution research",
      zh: "MRI 超分辨率研究",
    },
    subtitle: {
      vi: "Demo siêu phân giải",
      en: "Super-resolution demo",
      zh: "超分辨率演示",
    },
    description: {
      vi: "Nâng độ phân giải ảnh MRI bằng mô hình học sâu.",
      en: "Upscale MRI image resolution using a deep-learning model.",
      zh: "使用深度学习模型提升 MRI 图像分辨率。",
    },
    href: "/module-4",
    status: "placeholder",
    visual: "sr-grid",
  },
];

export function getModule(id: ModuleId): ModuleCard | undefined {
  return modules.find((m) => m.id === id);
}
