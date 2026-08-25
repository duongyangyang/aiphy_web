/**
 * modulePlaceholders — nội dung "tên các phần + giới thiệu ngắn" cho các module
 * đang ở dạng placeholder (chưa triển khai). Dùng trong `PlaceholderPage`.
 *
 * Nguồn: module 4 (MRI Super Resolution) lấy từ `module3-thiet-ke.md` (Phần A
 * mục 4.1–4.5, Phần B mục 5.1–5.5). Module 3 (近优MRI参数预测) theo định hướng
 * nghiên cứu dự đoán tham số quét gần tối ưu bằng Deep Learning.
 *
 * Mọi trường là `LocalizedString` ({vi,en,zh}); resolve bằng `tr()`.
 */
import type { LocalizedString } from "../i18n/types";
import type { ModuleId } from "./modules";

export interface PlaceholderSection {
  heading: LocalizedString;
  items: LocalizedString[];
}

export interface ModulePlaceholder {
  moduleId: ModuleId;
  intro: LocalizedString;
  sections: PlaceholderSection[];
}

export const modulePlaceholders: ModulePlaceholder[] = [
  {
    moduleId: "module-3",
    intro: {
      vi: "Trình bày nghiên cứu ứng dụng Deep Learning để dự đoán tổ hợp tham số quét MRI gần tối ưu — cân bằng giữa thời gian quét, độ phân giải và nhiễu. Hiểu nguyên lý rồi trải nghiệm trực tiếp model đã huấn luyện sẵn.",
      en: "Presents research applying Deep Learning to predict near-optimal MRI scan-parameter combinations — balancing scan time, resolution, and noise. Understand the principle, then try a pre-trained model directly.",
      zh: "介绍将深度学习应用于预测近优 MRI 扫描参数组合的研究——在扫描时间、分辨率与噪声之间取得平衡。先理解原理，再直接体验已训练好的模型。",
    },
    sections: [
      {
        heading: {
          vi: "Phần A — Giải thích nguyên lý",
          en: "Part A — Principle",
          zh: "A 部分 · 原理讲解",
        },
        items: [
          {
            vi: "Dự đoán tham số MRI là gì",
            en: "What MRI parameter prediction is",
            zh: "什么是 MRI 参数预测",
          },
          {
            vi: "Vì sao cần “gần tối ưu” — đánh đổi thời gian / phân giải / nhiễu",
            en: "Why “near-optimal” — the time / resolution / noise trade-off",
            zh: "为何需要“近优”——时间 / 分辨率 / 噪声的权衡",
          },
          {
            vi: "Phương pháp truyền thống & hạn chế",
            en: "Traditional methods & limitations",
            zh: "传统方法与局限",
          },
          {
            vi: "Deep Learning dự đoán tham số gần tối ưu",
            en: "Deep Learning for near-optimal parameter prediction",
            zh: "深度学习预测近优参数",
          },
          {
            vi: "Ưu điểm so với tinh chỉnh thủ công",
            en: "Advantages over manual tuning",
            zh: "相比手动调参的优势",
          },
        ],
      },
      {
        heading: {
          vi: "Phần B — Demo trải nghiệm model",
          en: "Part B — Model demo",
          zh: "B 部分 · 模型体验",
        },
        items: [
          {
            vi: "Nhập ràng buộc (thời gian, SNR, độ phân giải mục tiêu)",
            en: "Enter constraints (time, SNR, target resolution)",
            zh: "输入约束（时间、SNR、目标分辨率）",
          },
          {
            vi: "Chọn model Deep Learning",
            en: "Choose a Deep Learning model",
            zh: "选择深度学习模型",
          },
          {
            vi: "Chạy dự đoán → tổ hợp tham số đề xuất",
            en: "Run prediction → suggested parameter combination",
            zh: "运行预测 → 建议参数组合",
          },
          {
            vi: "So sánh với protocol chuẩn",
            en: "Compare against a standard protocol",
            zh: "与标准协议对比",
          },
        ],
      },
    ],
  },
  {
    moduleId: "module-4",
    intro: {
      vi: "Trình bày thành tựu nghiên cứu Deep Learning trong MRI Super Resolution — hiểu nguyên lý và trải nghiệm trực tiếp model DL SR đã huấn luyện sẵn qua demo tương tác.",
      en: "Presents research on Deep Learning for MRI Super Resolution — understand the principle and try a pre-trained DL SR model directly through an interactive demo.",
      zh: "介绍深度学习在 MRI 超分辨率中的研究进展——理解原理，并通过互动演示直接体验已训练好的 DL SR 模型。",
    },
    sections: [
      {
        heading: {
          vi: "Phần A — Giải thích nguyên lý",
          en: "Part A — Principle",
          zh: "A 部分 · 原理讲解",
        },
        items: [
          {
            vi: "MRI Super Resolution là gì",
            en: "What MRI Super Resolution is",
            zh: "什么是 MRI 超分辨率",
          },
          {
            vi: "Ý nghĩa lâm sàng / thực tiễn",
            en: "Clinical / practical significance",
            zh: "临床与现实意义",
          },
          {
            vi: "Phương pháp truyền thống & hạn chế",
            en: "Traditional methods & limitations",
            zh: "传统方法与局限",
          },
          {
            vi: "Deep Learning được ứng dụng như thế nào",
            en: "How Deep Learning is applied",
            zh: "深度学习的应用方式",
          },
          {
            vi: "Ưu điểm của Deep Learning",
            en: "Advantages of Deep Learning",
            zh: "深度学习的优势",
          },
        ],
      },
      {
        heading: {
          vi: "Phần B — Demo trải nghiệm model",
          en: "Part B — Model demo",
          zh: "B 部分 · 模型体验",
        },
        items: [
          {
            vi: "Chọn ảnh đầu vào (ảnh mẫu / tải lên)",
            en: "Choose input image (sample / upload)",
            zh: "选择输入图像（样图 / 上传）",
          },
          {
            vi: "Chọn model DL",
            en: "Choose a DL model",
            zh: "选择深度学习模型",
          },
          {
            vi: "Chạy Super Resolution",
            en: "Run Super Resolution",
            zh: "运行超分辨率",
          },
          {
            vi: "So sánh trước / sau + chỉ số (PSNR / SSIM)",
            en: "Before / after comparison + metrics (PSNR / SSIM)",
            zh: "前后对比 + 指标（PSNR / SSIM）",
          },
        ],
      },
    ],
  },
];

export function getModulePlaceholder(id: ModuleId): ModulePlaceholder | undefined {
  return modulePlaceholders.find((m) => m.moduleId === id);
}
