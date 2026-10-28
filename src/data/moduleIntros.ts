/**
 * moduleIntros — nội dung trang giới thiệu của 4 module.
 *
 * Tách khỏi component để chỉnh nội dung không phải sửa JSX. Mỗi module có:
 *  - `lead`: một đoạn mô tả mục tiêu (thay cho đoạn văn dài cũ).
 *  - `highlights`: 3 thẻ nêu rõ "làm gì / học được gì / vì sao quan trọng".
 *  - `steps`: danh sách các phần của module (bài học / bước quy trình / tính năng).
 *  - `meta`: nhãn ngắn hiển thị ở dải thông tin (số bài, thời lượng, mức độ).
 *
 * Mọi trường là `LocalizedString` ({vi,en,zh}); resolve bằng `tr()`.
 */
import type { LocalizedString } from "../i18n/types";
import type { ModuleId } from "./modules";

export interface IntroHighlight {
  label: LocalizedString;
  body: LocalizedString;
}

export interface IntroStep {
  title: LocalizedString;
  hint: LocalizedString;
}

export interface ModuleIntro {
  moduleId: ModuleId;
  lead: LocalizedString;
  highlights: IntroHighlight[];
  stepsHeading: LocalizedString;
  steps: IntroStep[];
  meta: LocalizedString[];
  cta: LocalizedString;
}

export const moduleIntros: ModuleIntro[] = [
  // ── Module 1 ────────────────────────────────────────────────────────
  {
    moduleId: "module-1",
    lead: {
      vi: "Vận hành một máy MRI giáo dục qua 11 thí nghiệm tương tác — từ việc bắt tín hiệu cộng hưởng đầu tiên đến đo được thời gian giãn T1/T2. Mỗi bài mở đầu bằng một hộp kiến thức ngắn, rồi mở khoá bảng điều khiển để bạn tự kéo tham số và nhìn kết quả thay đổi ngay.",
      en: "Operate an educational MRI scanner through 11 interactive experiments — from catching the first resonance signal to measuring T1/T2 relaxation. Each lesson opens with a short knowledge box, then unlocks the control panel so you can drag parameters and watch the result change instantly.",
      zh: "通过 11 个互动实验操作一台教学 MRI 扫描仪——从捕捉第一个共振信号，到测量 T1/T2 弛豫时间。每节课先给出简短的知识框，随后解锁控制面板，让你拖动参数并即时看到结果变化。",
    },
    highlights: [
      {
        label: { vi: "Bạn làm gì", en: "What you do", zh: "你会做什么" },
        body: {
          vi: "Kéo O1, shim, biên độ xung RF, TR/TE — quan sát tín hiệu FID, phổ, ảnh và đường hồi phục ngay trên trình duyệt.",
          en: "Drag O1, shim, RF pulse amplitude, TR/TE — and watch the FID signal, spectrum, image and recovery curve update live in the browser.",
          zh: "拖动 O1、匀场、射频脉冲幅度、TR/TE——在浏览器中实时观察 FID 信号、频谱、图像与恢复曲线。",
        },
      },
      {
        label: { vi: "Bạn học được", en: "What you learn", zh: "你会学到" },
        body: {
          vi: "Vì sao cộng hưởng xảy ra, cách hiệu chỉnh máy, cách tạo ảnh từ tín hiệu, và cách đọc hằng số giãn T1/T2 từ dữ liệu đo.",
          en: "Why resonance happens, how to calibrate a scanner, how an image is formed from raw signal, and how to read T1/T2 constants from measured data.",
          zh: "共振为何发生、如何校准扫描仪、图像如何由原始信号形成，以及如何从测量数据中读出 T1/T2 常数。",
        },
      },
      {
        label: { vi: "Vì sao quan trọng", en: "Why it matters", zh: "为何重要" },
        body: {
          vi: "Mọi tham số bạn chỉnh ở đây đều là tham số kỹ thuật viên thật sự chỉnh trên máy lâm sàng — hiểu chúng là hiểu vì sao ảnh MRI tốt hay xấu.",
          en: "Every parameter here is one a real technologist adjusts on a clinical scanner — understanding them is understanding why an MRI looks good or bad.",
          zh: "这里的每个参数都是临床技师在真实扫描仪上调整的参数——理解它们，就理解了 MRI 图像好坏的原因。",
        },
      },
    ],
    stepsHeading: {
      vi: "Bốn giai đoạn, 11 bài",
      en: "Four phases, 11 lessons",
      zh: "四个阶段，11 节课",
    },
    steps: [
      {
        title: { vi: "Nền tảng tín hiệu", en: "Signal foundations", zh: "信号基础" },
        hint: {
          vi: "FID, độ ổn định từ trường — bài 1–2",
          en: "FID, field stability — lessons 1–2",
          zh: "FID、磁场稳定性——第 1–2 课",
        },
      },
      {
        title: { vi: "Hiệu chỉnh máy", en: "Machine calibration", zh: "设备校准" },
        hint: {
          vi: "Shim, auto-gain, xung cứng & xung mềm — bài 3–6",
          en: "Shim, auto-gain, hard & soft pulses — lessons 3–6",
          zh: "匀场、自动增益、硬脉冲与软脉冲——第 3–6 课",
        },
      },
      {
        title: { vi: "Tạo ảnh cơ bản", en: "Basic imaging", zh: "基础成像" },
        hint: {
          vi: "Prescan, spin echo & FOV, tương phản — bài 7–9",
          en: "Prescan, spin echo & FOV, weighting — lessons 7–9",
          zh: "预扫描、自旋回波与 FOV、对比加权——第 7–9 课",
        },
      },
      {
        title: { vi: "Đo T1/T2", en: "Measuring T1/T2", zh: "测量 T1/T2" },
        hint: {
          vi: "Inversion Recovery, CPMG — bài 10–11",
          en: "Inversion Recovery, CPMG — lessons 10–11",
          zh: "反转恢复、CPMG——第 10–11 课",
        },
      },
    ],
    meta: [
      { vi: "11 bài tương tác", en: "11 interactive lessons", zh: "11 节互动课" },
      { vi: "4 giai đoạn", en: "4 phases", zh: "4 个阶段" },
      { vi: "Tiến độ được lưu", en: "Progress saved", zh: "进度已保存" },
    ],
    cta: { vi: "Bắt đầu bài 1", en: "Start lesson 1", zh: "开始第 1 课" },
  },

  // ── Module 2 ────────────────────────────────────────────────────────
  {
    moduleId: "module-2",
    lead: {
      vi: "Chạy trọn một ca chụp MRI theo đúng trình tự phần mềm trên máy thật: hiệu chỉnh hệ thống, chụp ảnh định vị, đặt lát cắt và tham số chuỗi xung, thu k-space, rồi tái tạo và xử lý ảnh. Bạn quyết định từng bước — và thấy ngay hậu quả của mỗi quyết định lên ảnh cuối cùng.",
      en: "Run a complete MRI exam in the same order as the scanner software: calibrate the system, acquire localizers, place slices and set sequence parameters, collect k-space, then reconstruct and process images. You make every decision — and see its consequences in the final image.",
      zh: "按照真实扫描仪软件的流程完整运行一次 MRI 检查：校准系统、采集定位像、设置切层与序列参数、采集 k-space，然后重建并处理图像。每个决定都由你做出，并立即看到它如何影响最终图像。",
    },
    highlights: [
      {
        label: { vi: "Bạn làm gì", en: "What you do", zh: "你会做什么" },
        body: {
          vi: "Cân O1 và shim, chọn cuộn thu, đặt FOV và lát cắt trên 3 mặt phẳng, chọn chuỗi SE/TSE/FLAIR, rồi chạy quét và áp cửa sổ hiển thị.",
          en: "Balance O1 and shim, pick a coil, place FOV and slices across three planes, choose an SE/TSE/FLAIR sequence, then run the scan and apply display windows.",
          zh: "平衡 O1 与匀场、选择线圈、在三个方位上放置 FOV 与切层、选择 SE/TSE/FLAIR 序列，然后执行扫描并应用显示窗宽窗位。",
        },
      },
      {
        label: { vi: "Bạn học được", en: "What you learn", zh: "你会学到" },
        body: {
          vi: "Chuỗi xung nào cho tương phản nào, TR/TE ảnh hưởng gì, và vì sao một ca chụp ẩu ở bước hiệu chỉnh lại cho ra ảnh nhiễu ở bước cuối.",
          en: "Which sequence gives which contrast, what TR/TE actually change, and why a sloppy calibration step ends up as a noisy image at the end.",
          zh: "哪种序列产生何种对比、TR/TE 究竟改变了什么，以及为何校准草率会在最后变成一张噪声很大的图像。",
        },
      },
      {
        label: { vi: "Vì sao quan trọng", en: "Why it matters", zh: "为何重要" },
        body: {
          vi: "Đây là toàn bộ quy trình một kỹ thuật viên chạy mỗi ngày. Làm đúng thứ tự là kỹ năng nghề — và cũng là cách hiểu sâu nhất về vật lý MRI.",
          en: "This is the entire workflow a technologist runs every day. Doing it in the right order is a professional skill — and the deepest way to understand MRI physics.",
          zh: "这是技师每天运行的完整流程。按正确顺序操作是一项职业技能——也是理解 MRI 物理最深入的方式。",
        },
      },
    ],
    stepsHeading: {
      vi: "Năm bước của một ca chụp",
      en: "Five steps of one exam",
      zh: "一次检查的五个步骤",
    },
    steps: [
      {
        title: { vi: "Prescan", en: "Prescan", zh: "预扫描" },
        hint: {
          vi: "Cân O1, shim, biên độ và độ rộng xung RF",
          en: "Balance O1, shim, RF amplitude and pulse width",
          zh: "平衡 O1、匀场、射频幅度与脉冲宽度",
        },
      },
      {
        title: { vi: "Scout", en: "Scout", zh: "定位" },
        hint: {
          vi: "Chụp 3 mặt phẳng để định vị lát cắt",
          en: "Acquire three planes to localize slices",
          zh: "采集三个方位以定位切层",
        },
      },
      {
        title: { vi: "Scan setup", en: "Scan setup", zh: "扫描设置" },
        hint: {
          vi: "FOV, độ dày lát cắt, góc cắt, TR/TE/FA",
          en: "FOV, slice thickness, angulation, TR/TE/FA",
          zh: "FOV、层厚、角度方向、TR/TE/FA",
        },
      },
      {
        title: { vi: "Scan", en: "Scan", zh: "扫描" },
        hint: {
          vi: "Thu k-space theo chuỗi xung đã chọn",
          en: "Collect k-space with the chosen sequence",
          zh: "按所选序列采集 k-space",
        },
      },
      {
        title: { vi: "Processing", en: "Processing", zh: "图像处理" },
        hint: {
          vi: "FFT, lưới ảnh, khử nhiễu, cửa sổ hiển thị",
          en: "FFT, image grid, denoising, display window",
          zh: "FFT、图像网格、去噪、显示窗",
        },
      },
    ],
    meta: [
      { vi: "5 bước quy trình", en: "5 workflow steps", zh: "5 个工作流步骤" },
      { vi: "Vật lý thời gian thực", en: "Real-time physics", zh: "实时物理模拟" },
      { vi: "Mỗi ca bắt đầu lại", en: "Fresh exam each time", zh: "每次重新开始" },
    ],
    cta: { vi: "Vào simulator", en: "Open the simulator", zh: "进入模拟器" },
  },

  // ── Module 3 ────────────────────────────────────────────────────────
  {
    moduleId: "module-3",
    lead: {
      vi: "Trong MRI lâm sàng, chọn TR và TE là một bài toán đánh đổi: quét nhanh thì ảnh nhiễu, quét lâu thì bệnh nhân mệt. Module này giới thiệu MRIParamNet — một mô hình học sâu dự đoán tổ hợp tham số gần tối ưu từ chính ảnh bạn đã chụp — và cho bạn so sánh ba cách chọn điểm tối ưu khác nhau.",
      en: "In clinical MRI, choosing TR and TE is a trade-off: scan fast and the image is noisy, scan slowly and the patient suffers. This module introduces MRIParamNet — a deep model that predicts a near-optimal parameter set from an image you already acquired — and lets you compare three ways of picking the optimum.",
      zh: "在临床 MRI 中，选择 TR 与 TE 是一种权衡：扫描快则噪声大，扫描慢则患者难受。本模块介绍 MRIParamNet——一个从已采集图像预测近优参数组合的深度模型——并让你比较三种选取最优点的方法。",
    },
    highlights: [
      {
        label: { vi: "Bạn làm gì", en: "What you do", zh: "你会做什么" },
        body: {
          vi: "Tải lên một ảnh MRI đã chụp ở (TR₀, TE₀), khai báo giá trị mục tiêu J₀, rồi để mô hình quét toàn bộ lưới tham số và đề xuất (TR*, TE*).",
          en: "Upload an MRI acquired at (TR₀, TE₀), declare the objective value J₀, then let the model sweep the whole parameter grid and propose (TR*, TE*).",
          zh: "上传一张在 (TR₀, TE₀) 采集的 MRI，填写目标值 J₀，让模型扫描整个参数网格并给出 (TR*, TE*)。",
        },
      },
      {
        label: { vi: "Bạn học được", en: "What you learn", zh: "你会学到" },
        body: {
          vi: "Vì sao hàm mục tiêu J = CNR − λ·T_scan là phi tuyến, và ba phương pháp chọn điểm — argmax, soft-argmax, quadratic fit — khác nhau ở đâu.",
          en: "Why the objective J = CNR − λ·T_scan is non-linear, and where the three selection methods — argmax, soft-argmax, quadratic fit — differ.",
          zh: "为何目标函数 J = CNR − λ·T_scan 是非线性的，以及三种选点方法——argmax、soft-argmax、二次拟合——的差异。",
        },
      },
      {
        label: { vi: "Vì sao quan trọng", en: "Why it matters", zh: "为何重要" },
        body: {
          vi: "Một gợi ý tham số tốt trong chưa đầy một giây có thể rút ngắn thời gian chụp mà không mất chất lượng — đúng bài toán mà phòng MRI nào cũng gặp.",
          en: "A good parameter suggestion in under a second can shorten an exam without losing quality — a problem every MRI department faces.",
          zh: "不到一秒内给出的参数建议，可以在不损失质量的前提下缩短检查时间——这是每个 MRI 科室都会遇到的问题。",
        },
      },
    ],
    stepsHeading: {
      vi: "Nội dung module",
      en: "What's inside",
      zh: "模块内容",
    },
    steps: [
      {
        title: { vi: "Nguyên lý", en: "The principle", zh: "原理" },
        hint: {
          vi: "Vì sao tham số tối ưu phụ thuộc vào ảnh, và vì sao không có một đáp án chung",
          en: "Why the optimal parameters depend on the image, and why there is no single answer",
          zh: "为何最优参数依赖图像，以及为何不存在统一答案",
        },
      },
      {
        title: { vi: "Mô hình MRIParamNet", en: "The MRIParamNet model", zh: "MRIParamNet 模型" },
        hint: {
          vi: "ResNet-18 đơn kênh kết hợp nhánh tham số, dự đoán bề mặt J(TR, TE)",
          en: "A single-channel ResNet-18 fused with a parameter branch, predicting the J(TR, TE) surface",
          zh: "单通道 ResNet-18 与参数分支融合，预测 J(TR, TE) 曲面",
        },
      },
      {
        title: { vi: "Ba cách chọn điểm", en: "Three selection methods", zh: "三种选点方法" },
        hint: {
          vi: "Argmax cứng, soft-argmax làm mượt, quadratic fit giải tích",
          en: "Hard argmax, smoothing soft-argmax, analytic quadratic fit",
          zh: "硬 argmax、平滑 soft-argmax、解析二次拟合",
        },
      },
      {
        title: { vi: "Bản đồ nhiệt J", en: "The J heatmap", zh: "J 热力图" },
        hint: {
          vi: "Nhìn thấy vùng tối ưu và điểm neo trên cùng một mặt phẳng",
          en: "See the optimum region and the anchor point on one surface",
          zh: "在同一曲面上查看最优区域与锚点",
        },
      },
    ],
    meta: [
      { vi: "Mô hình học sâu", en: "Deep-learning model", zh: "深度学习模型" },
      { vi: "Kết quả dưới 1 giây", en: "Under 1 s inference", zh: "1 秒内推理" },
      { vi: "Có ràng buộc lâm sàng", en: "Clinical constraints", zh: "临床约束" },
    ],
    cta: { vi: "Mở phòng thí nghiệm", en: "Open the lab", zh: "打开实验台" },
  },

  // ── Module 4 ────────────────────────────────────────────────────────
  {
    moduleId: "module-4",
    lead: {
      vi: "Máy MRI không thể vừa nhanh vừa nét. Siêu phân giải bằng học sâu tìm cách phá giới hạn đó: từ một ảnh độ phân giải thấp, mô hình CHARMS-Lite dựng lại ảnh nét gấp đôi — kèm theo một bản đồ cho biết chỗ nào mô hình tự tin và chỗ nào không.",
      en: "An MRI cannot be both fast and sharp. Deep-learning super-resolution attacks that limit: from a low-resolution image, the CHARMS-Lite model reconstructs a twice-as-sharp version — with a map showing where the model is confident and where it is not.",
      zh: "MRI 无法同时做到又快又清晰。深度学习超分辨率正是针对这一限制：CHARMS-Lite 从低分辨率图像重建出两倍清晰的版本——并附带一张标注模型何处自信、何处不确定的图。",
    },
    highlights: [
      {
        label: { vi: "Bạn làm gì", en: "What you do", zh: "你会做什么" },
        body: {
          vi: "Tải lên ảnh MRI độ phân giải thấp (tuỳ chọn kèm ảnh gốc chất lượng cao), chạy mô hình, rồi di chuột lên ảnh kết quả để đọc độ bất định tại từng điểm ảnh.",
          en: "Upload a low-resolution MRI (optionally with its high-quality ground truth), run the model, then hover over the result to read the uncertainty at each pixel.",
          zh: "上传低分辨率 MRI（可选附上高质量原图），运行模型，然后在结果图上悬停以读取每个像素的不确定性。",
        },
      },
      {
        label: { vi: "Bạn học được", en: "What you learn", zh: "你会学到" },
        body: {
          vi: "PSNR và SSIM đo chất lượng ảnh ra sao, và vì sao một mô hình y tế phải nói được nó \"không chắc\" ở đâu.",
          en: "How PSNR and SSIM measure output quality, and why a medical model must be able to say where it is unsure.",
          zh: "PSNR 与 SSIM 如何衡量输出质量，以及为何医学模型必须能指出它“不确定”的地方。",
        },
      },
      {
        label: { vi: "Vì sao quan trọng", en: "Why it matters", zh: "为何重要" },
        body: {
          vi: "Rút ngắn thời gian chụp là lợi ích trực tiếp cho bệnh nhân — nhưng chỉ khi bạn biết phần nào của ảnh đáng tin để đọc.",
          en: "Shorter scans directly benefit patients — but only if you know which parts of the image are trustworthy enough to read.",
          zh: "缩短扫描时间直接惠及患者——但前提是你知道图像的哪些部分足以信赖。",
        },
      },
    ],
    stepsHeading: {
      vi: "Nội dung module",
      en: "What's inside",
      zh: "模块内容",
    },
    steps: [
      {
        title: { vi: "Nguyên lý", en: "The principle", zh: "原理" },
        hint: {
          vi: "Vì sao ảnh MRI bị giới hạn độ phân giải bởi thời gian chụp",
          en: "Why MRI resolution is limited by acquisition time",
          zh: "为何 MRI 分辨率受采集时间限制",
        },
      },
      {
        title: { vi: "Kiến trúc CHARMS-Lite", en: "The CHARMS-Lite architecture", zh: "CHARMS-Lite 架构" },
        hint: {
          vi: "Khối RRAF, RLFE và MDDTA — tăng độ phân giải gấp đôi",
          en: "RRAF, RLFE and MDDTA blocks — a 2× resolution increase",
          zh: "RRAF、RLFE 与 MDDTA 模块——两倍分辨率提升",
        },
      },
      {
        title: { vi: "Bản đồ bất định", en: "The uncertainty map", zh: "不确定性图" },
        hint: {
          vi: "Độ lệch chuẩn giữa 4 lần TTA — cho biết vùng nào mô hình không chắc",
          en: "Standard deviation across 4 TTA passes — showing where the model is unsure",
          zh: "4 次 TTA 之间的标准差——显示模型不确定的区域",
        },
      },
      {
        title: { vi: "Đo chất lượng", en: "Quality metrics", zh: "质量指标" },
        hint: {
          vi: "PSNR và SSIM khi có ảnh gốc để đối chiếu",
          en: "PSNR and SSIM when a ground-truth image is available",
          zh: "有原图对照时的 PSNR 与 SSIM",
        },
      },
    ],
    meta: [
      { vi: "Siêu phân giải ×2", en: "2× super-resolution", zh: "2 倍超分辨率" },
      { vi: "Bản đồ bất định", en: "Uncertainty map", zh: "不确定性图" },
      { vi: "~1,2M tham số", en: "~1.2M parameters", zh: "约 120 万参数" },
    ],
    cta: { vi: "Mở phòng thí nghiệm", en: "Open the lab", zh: "打开实验台" },
  },
];

export function getModuleIntro(id: ModuleId): ModuleIntro | undefined {
  return moduleIntros.find((m) => m.moduleId === id);
}
