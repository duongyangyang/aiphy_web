/**
 * lessonKnowledge — nội dung hộp kiến thức trước bài (theo `module1-thiet-ke.md`).
 *
 * Mỗi record gắn với `lessonId` trong `module1Lessons.ts`. Công thức (`formula`)
 * là chuỗi LaTeX thuần, locale-independent — NGOẠI LỆ: các công thức có chữ
 * giải thích trong `\text{...}` (Bài 2, 7) dùng `LocalizedString` để dịch theo
 * locale. `context`/`concepts`/`formulaExplain` là `LocalizedString` — văn xuôi
 * được dịch, các đoạn LaTeX inline \(...\) giữ nguyên. Không dùng ký tự Unicode
 * toán học.
 *
 * ⚠️ Bản EN/ZH là nháp dịch chuyên ngành MRI — cần chuyên gia review.
 */
import type { LocalizedString } from "../i18n/types";

export interface LessonKnowledge {
  lessonId: string;
  context: LocalizedString;
  concepts: LocalizedString[];
  formula: LocalizedString | string;
  formulaExplain: LocalizedString[];
}

export const lessonKnowledge: Record<string, LessonKnowledge> = {
  "lesson-1-fid": {
    lessonId: "lesson-1-fid",
    context: {
      vi: "Đây là bước đầu tiên khi vận hành máy MRI thật — trước khi làm bất cứ điều gì khác, máy phải \"nghe\" được tín hiệu FID phát ra từ mẫu vật.",
      en: "This is the first step when operating a real MRI scanner — before doing anything else, the machine must be able to \"hear\" the FID signal emitted by the sample.",
      zh: "这是操作真实 MRI 扫描仪的第一步——在做任何其他事之前，设备必须能够“听到”样品发出的 FID 信号。",
    },
    concepts: [
      {
        vi: "Tín hiệu FID (Free Induction Decay): tín hiệu cảm ứng tự do, xuất hiện ngay sau xung kích thích RF.",
        en: "FID signal (Free Induction Decay): the free induction signal that appears immediately after the RF excitation pulse.",
        zh: "FID 信号（Free Induction Decay，自由感应衰减）：紧跟在 RF 激发脉冲之后出现的自由感应信号。",
      },
      {
        vi: "Tần số Larmor \\(\\omega_0\\): tần số tiến động tự nhiên của hạt nhân trong từ trường \\(B_0\\).",
        en: "Larmor frequency \\(\\omega_0\\): the natural precession frequency of the nuclei in the magnetic field \\(B_0\\).",
        zh: "拉莫尔频率 \\(\\omega_0\\)：原子核在磁场 \\(B_0\\) 中的自然进动频率。",
      },
      {
        vi: "Độ lệch tần số \\(O1\\): chênh lệch giữa tần số phát RF (\\(\\omega_{RF}\\)) và tần số cộng hưởng thật (\\(\\omega_0\\)).",
        en: "Frequency offset \\(O1\\): the difference between the RF transmit frequency (\\(\\omega_{RF}\\)) and the true resonance frequency (\\(\\omega_0\\)).",
        zh: "频率偏移 \\(O1\\)：RF 发射频率（\\(\\omega_{RF}\\)）与真实共振频率（\\(\\omega_0\\)）之差。",
      },
      {
        vi: "\\(T_2^{*}\\): thời gian đặc trưng cho tốc độ suy giảm tín hiệu FID.",
        en: "\\(T_2^{*}\\): the characteristic time for the decay rate of the FID signal.",
        zh: "\\(T_2^{*}\\)：表征 FID 信号衰减速率的特征时间。",
      },
    ],
    formula:
      "S(t) \\propto \\cos\\big((\\omega_0 - \\omega_{RF})\\,t\\big)\\cdot \\exp\\!\\left(-\\dfrac{t}{T_2^{*}}\\right)",
    formulaExplain: [
      {
        vi: "\\(S(t)\\): biên độ tín hiệu tại thời điểm \\(t\\).",
        en: "\\(S(t)\\): signal amplitude at time \\(t\\).",
        zh: "\\(S(t)\\)：时刻 \\(t\\) 的信号幅度。",
      },
      {
        vi: "\\((\\omega_0 - \\omega_{RF})\\): độ lệch tần số góc (tương đương \\(O1\\)).",
        en: "\\((\\omega_0 - \\omega_{RF})\\): angular frequency offset (equivalent to \\(O1\\)).",
        zh: "\\((\\omega_0 - \\omega_{RF})\\)：角频率偏移（等价于 \\(O1\\)）。",
      },
      {
        vi: "\\(T_2^{*}\\): hằng số suy giảm của tín hiệu FID.",
        en: "\\(T_2^{*}\\): decay constant of the FID signal.",
        zh: "\\(T_2^{*}\\)：FID 信号的衰减常数。",
      },
    ],
  },

  "lesson-2-field-stability": {
    lessonId: "lesson-2-field-stability",
    context: {
      vi: "Sau khi tìm được tần số cộng hưởng ở Bài 1, ta có thể suy ra cường độ từ trường thật của máy — bước hiệu chuẩn quan trọng trước khi chụp ảnh.",
      en: "After finding the resonance frequency in Lesson 1, we can infer the scanner's true magnetic field strength — an important calibration step before imaging.",
      zh: "在第 1 课中找到共振频率后，我们就能推算出设备真实的磁场强度——这是成像前的重要校准步骤。",
    },
    concepts: [
      {
        vi: "Hằng số từ hồi chuyển \\(\\gamma\\) (gyromagnetic ratio): tỷ lệ cố định giữa tần số Larmor và cường độ từ trường; với \\(^1H\\) thì \\(\\gamma \\approx 42.58\\ \\text{MHz/T}\\).",
        en: "Gyromagnetic ratio \\(\\gamma\\): the fixed ratio between the Larmor frequency and the magnetic field strength; for \\(^1H\\), \\(\\gamma \\approx 42.58\\ \\text{MHz/T}\\).",
        zh: "磁旋比 \\(\\gamma\\)（gyromagnetic ratio）：拉莫尔频率与磁场强度之间的固定比值；对于 \\(^1H\\)，\\(\\gamma \\approx 42.58\\ \\text{MHz/T}\\)。",
      },
      {
        vi: "Từ trường \\(B_0\\): cường độ từ trường tĩnh của máy MRI, đơn vị Tesla (T).",
        en: "Magnetic field \\(B_0\\): the static magnetic field strength of the MRI scanner, in Tesla (T).",
        zh: "磁场 \\(B_0\\)：MRI 扫描仪的静磁场强度，单位为特斯拉（T）。",
      },
      {
        vi: "Độ trôi từ trường (field drift): sự thay đổi nhỏ của \\(B_0\\) theo thời gian do nhiệt độ, dòng điện không ổn định.",
        en: "Field drift: a small change in \\(B_0\\) over time caused by temperature and unstable currents.",
        zh: "磁场漂移（field drift）：\\(B_0\\) 随时间因温度、电流不稳定而产生的微小变化。",
      },
      {
        vi: "Đơn vị \\(\\text{ppm}\\) (phần triệu): dùng để đo độ trôi tương đối.",
        en: "The unit \\(\\text{ppm}\\) (parts per million): used to measure relative drift.",
        zh: "单位 \\(\\text{ppm}\\)（百万分率）：用于衡量相对漂移。",
      },
    ],
    formula: {
      vi: "B_0 = \\dfrac{f_{Larmor}}{42.58}\\ \\bigl(\\text{T, với } f_{Larmor}\\text{ tính bằng MHz}\\bigr),\\quad \\text{Độ ổn định} = \\dfrac{\\Delta f}{f_{Larmor}} \\times 10^{6} \\times \\dfrac{1}{\\Delta t}\\ \\bigl(\\text{ppm/phút}\\bigr)",
      en: "B_0 = \\dfrac{f_{Larmor}}{42.58}\\ \\bigl(\\text{T, where } f_{Larmor}\\text{ is in MHz}\\bigr),\\quad \\text{Stability} = \\dfrac{\\Delta f}{f_{Larmor}} \\times 10^{6} \\times \\dfrac{1}{\\Delta t}\\ \\bigl(\\text{ppm/min}\\bigr)",
      zh: "B_0 = \\dfrac{f_{Larmor}}{42.58}\\ \\bigl(\\text{T，其中 } f_{Larmor}\\text{ 以 MHz 为单位}\\bigr),\\quad \\text{稳定性} = \\dfrac{\\Delta f}{f_{Larmor}} \\times 10^{6} \\times \\dfrac{1}{\\Delta t}\\ \\bigl(\\text{ppm/分钟}\\bigr)",
    },
    formulaExplain: [
      {
        vi: "\\(f_{Larmor}\\): tần số cộng hưởng (Hz hoặc MHz).",
        en: "\\(f_{Larmor}\\): resonance frequency (Hz or MHz).",
        zh: "\\(f_{Larmor}\\)：共振频率（Hz 或 MHz）。",
      },
      {
        vi: "\\(\\Delta f\\): dịch chuyển tần số do trôi từ trường trong khoảng \\(\\Delta t\\).",
        en: "\\(\\Delta f\\): frequency shift due to field drift over the interval \\(\\Delta t\\).",
        zh: "\\(\\Delta f\\)：在 \\(\\Delta t\\) 时间内由磁场漂移引起的频率偏移。",
      },
      {
        vi: "\\(\\text{ppm/phút}\\): độ ổn định tương đối của từ trường theo thời gian.",
        en: "\\(\\text{ppm/min}\\): relative field stability over time.",
        zh: "\\(\\text{ppm/分钟}\\)：磁场随时间的相对稳定性。",
      },
    ],
  },

  "lesson-3-shimming": {
    lessonId: "lesson-3-shimming",
    context: {
      vi: "Từ trường thực tế không bao giờ đồng nhất tuyệt đối — cuộn shim giúp \"làm phẳng\" từ trường quanh mẫu vật để tín hiệu không bị nhiễu loạn.",
      en: "The real magnetic field is never perfectly homogeneous — shim coils help \"flatten\" the field around the sample so the signal is not distorted.",
      zh: "实际磁场永远不会绝对均匀——匀场线圈（shim coils）帮助在样品周围“抹平”磁场，使信号不受扰动。",
    },
    concepts: [
      {
        vi: "Độ không đồng nhất từ trường \\(\\Delta B_0\\): sai lệch cục bộ của từ trường so với giá trị lý tưởng.",
        en: "Field inhomogeneity \\(\\Delta B_0\\): local deviation of the magnetic field from the ideal value.",
        zh: "磁场不均匀性 \\(\\Delta B_0\\)：磁场相对理想值的局部偏差。",
      },
      {
        vi: "\\(T_2^{*}\\) so với \\(T_2\\): \\(T_2^{*}\\) luôn nhỏ hơn hoặc bằng \\(T_2\\) vì bị ảnh hưởng thêm bởi \\(\\Delta B_0\\).",
        en: "\\(T_2^{*}\\) vs \\(T_2\\): \\(T_2^{*}\\) is always less than or equal to \\(T_2\\) because it is additionally affected by \\(\\Delta B_0\\).",
        zh: "\\(T_2^{*}\\) 与 \\(T_2\\)：\\(T_2^{*}\\) 总是小于或等于 \\(T_2\\)，因为它还额外受到 \\(\\Delta B_0\\) 的影响。",
      },
      {
        vi: "Độ rộng nửa cực đại phổ \\(FWHM\\) (Full Width at Half Maximum): thước đo độ \"nhọn\" của đỉnh phổ cộng hưởng.",
        en: "Spectral FWHM (Full Width at Half Maximum): a measure of how \"sharp\" the resonance peak is.",
        zh: "谱线半高宽 \\(FWHM\\)（Full Width at Half Maximum）：衡量共振峰“尖锐程度”的指标。",
      },
      {
        vi: "Shimming: quá trình điều chỉnh dòng điện 3 cuộn (\\(G_x, G_y, G_z\\)) để tối thiểu hóa \\(\\Delta B_0\\).",
        en: "Shimming: the process of adjusting the currents of three coils (\\(G_x, G_y, G_z\\)) to minimize \\(\\Delta B_0\\).",
        zh: "匀场（Shimming）：调节三个线圈电流（\\(G_x, G_y, G_z\\)）以最小化 \\(\\Delta B_0\\) 的过程。",
      },
    ],
    formula:
      "\\dfrac{1}{T_2^{*}} = \\dfrac{1}{T_2} + \\gamma\\cdot \\Delta B_0,\\qquad FWHM = \\dfrac{1}{\\pi \\cdot T_2^{*}}",
    formulaExplain: [
      {
        vi: "\\(T_2\\): thời gian hồi phục ngang thuần (không kể \\(\\Delta B_0\\)).",
        en: "\\(T_2\\): pure transverse relaxation time (excluding \\(\\Delta B_0\\)).",
        zh: "\\(T_2\\)：纯横向弛豫时间（不含 \\(\\Delta B_0\\)）。",
      },
      {
        vi: "\\(\\Delta B_0\\): độ không đồng nhất từ trường.",
        en: "\\(\\Delta B_0\\): magnetic field inhomogeneity.",
        zh: "\\(\\Delta B_0\\)：磁场不均匀性。",
      },
      {
        vi: "\\(FWHM\\): độ rộng đỉnh phổ — càng nhỏ nghĩa là phổ càng nhọn, shimming càng tốt.",
        en: "\\(FWHM\\): spectral peak width — the smaller it is, the sharper the spectrum and the better the shimming.",
        zh: "\\(FWHM\\)：谱峰宽度——越小表示谱线越尖锐、匀场越好。",
      },
    ],
  },

  "lesson-4-auto-gain": {
    lessonId: "lesson-4-auto-gain",
    context: {
      vi: "Tín hiệu FID thật rất yếu, cần khuếch đại trước khi số hóa (ADC) — nhưng khuếch đại sai cách sẽ làm hỏng dữ liệu.",
      en: "The real FID signal is very weak and must be amplified before digitization (ADC) — but amplifying it the wrong way will corrupt the data.",
      zh: "真实的 FID 信号非常微弱，必须在数字化（ADC）之前进行放大——但放大方式不当会损坏数据。",
    },
    concepts: [
      {
        vi: "Gain (độ khuếch đại): hệ số nhân biên độ tín hiệu trước khi vào bộ chuyển đổi ADC.",
        en: "Gain: the multiplication factor applied to the signal amplitude before it enters the ADC.",
        zh: "Gain（增益）：信号进入 ADC 之前对其幅度施加的放大倍数。",
      },
      {
        vi: "ADC (Analog-to-Digital Converter): bộ số hóa tín hiệu, có giới hạn biên độ tối đa ghi nhận được.",
        en: "ADC (Analog-to-Digital Converter): the signal digitizer, which has a maximum recordable amplitude limit.",
        zh: "ADC（模数转换器）：信号数字化器件，具有可记录的最大幅度限制。",
      },
      {
        vi: "Hiện tượng clipping (cắt tín hiệu): khi biên độ vượt ngưỡng ADC, phần vượt bị \"cắt phẳng\", gây méo dữ liệu.",
        en: "Clipping: when the amplitude exceeds the ADC threshold, the excess is \"flattened off\", distorting the data.",
        zh: "削波（clipping）：当幅度超过 ADC 阈值时，超出部分被“削平”，导致数据失真。",
      },
      {
        vi: "\\(PRG\\): tham số điều khiển mức khuếch đại trước (pre-gain) trên máy thật.",
        en: "\\(PRG\\): the parameter controlling the pre-gain level on a real scanner.",
        zh: "\\(PRG\\)：真实设备上控制前置增益（pre-gain）水平的参数。",
      },
    ],
    formula:
      "V_{ADC}(t) = \\text{clip}\\bigl(G(PRG)\\cdot V_{FID}(t),\\ -V_{max},\\ +V_{max}\\bigr)",
    formulaExplain: [
      {
        vi: "\\(G(PRG)\\): hệ số khuếch đại theo \\(PRG\\).",
        en: "\\(G(PRG)\\): amplification factor as a function of \\(PRG\\).",
        zh: "\\(G(PRG)\\)：随 \\(PRG\\) 变化的放大系数。",
      },
      {
        vi: "\\(V_{max}\\): ngưỡng bão hòa của ADC (ví dụ \\(\\pm 2048\\)).",
        en: "\\(V_{max}\\): ADC saturation threshold (e.g. \\(\\pm 2048\\)).",
        zh: "\\(V_{max}\\)：ADC 饱和阈值（例如 \\(\\pm 2048\\)）。",
      },
      {
        vi: "\\(\\text{clip}(\\cdot)\\): hàm cắt phần tín hiệu vượt ngưỡng \\(\\pm V_{max}\\).",
        en: "\\(\\text{clip}(\\cdot)\\): function that clips the part of the signal exceeding \\(\\pm V_{max}\\).",
        zh: "\\(\\text{clip}(\\cdot)\\)：截去信号超过 \\(\\pm V_{max}\\) 部分的函数。",
      },
    ],
  },

  "lesson-5-hard-pulse": {
    lessonId: "lesson-5-hard-pulse",
    context: {
      vi: "Để tạo tín hiệu FID mạnh nhất, cần xác định chính xác độ rộng xung RF ứng với góc lật \\(90^\\circ\\) — bước hiệu chỉnh bắt buộc trước khi tạo ảnh.",
      en: "To produce the strongest FID signal, the RF pulse width corresponding to a \\(90^\\circ\\) flip angle must be determined precisely — a mandatory calibration step before imaging.",
      zh: "为了产生最强的 FID 信号，必须精确确定对应 \\(90^\\circ\\) 翻转角的 RF 脉冲宽度——这是成像前必须完成的校准步骤。",
    },
    concepts: [
      {
        vi: "Góc lật từ hóa \\(\\theta\\) (flip angle): góc mà véc-tơ từ hóa bị \"lật\" ra khỏi trục \\(z\\) sau xung RF.",
        en: "Flip angle \\(\\theta\\): the angle by which the magnetization vector is tipped away from the \\(z\\)-axis after the RF pulse.",
        zh: "翻转角 \\(\\theta\\)（flip angle）：RF 脉冲后磁化矢量被“扳离” \\(z\\) 轴的角度。",
      },
      {
        vi: "Xung cứng (hard pulse/non-selective): xung RF ngắn, kích thích đồng đều toàn bộ mẫu vật, không chọn lọc lát cắt.",
        en: "Hard pulse (non-selective): a short RF pulse that excites the entire sample uniformly, without slice selection.",
        zh: "硬脉冲（hard pulse / 非选择性）：一种短 RF 脉冲，均匀激发整个样品，不进行选层。",
      },
      {
        vi: "Quan hệ giữa độ rộng xung \\(\\tau\\) và góc lật: xung càng dài, góc lật càng lớn (tới một giới hạn).",
        en: "Relationship between pulse width \\(\\tau\\) and flip angle: the longer the pulse, the larger the flip angle (up to a limit).",
        zh: "脉冲宽度 \\(\\tau\\) 与翻转角的关系：脉冲越长，翻转角越大（直至某个上限）。",
      },
      {
        vi: "Điểm cực đại tín hiệu ứng với \\(\\theta = 90^\\circ\\); tín hiệu gần \\(0\\) ứng với \\(\\theta = 180^\\circ\\).",
        en: "The signal is maximal at \\(\\theta = 90^\\circ\\); the signal is near \\(0\\) at \\(\\theta = 180^\\circ\\).",
        zh: "信号在 \\(\\theta = 90^\\circ\\) 时达到最大；在 \\(\\theta = 180^\\circ\\) 时接近 \\(0\\)。",
      },
    ],
    formula:
      "V(t) \\propto M_0 \\cdot \\sin(\\theta)\\cdot \\cos(\\omega_0 t)\\cdot \\exp\\!\\left(-\\dfrac{t}{T_2^{*}}\\right), \\qquad \\theta = \\gamma \\cdot B_1 \\cdot \\tau",
    formulaExplain: [
      {
        vi: "\\(\\theta\\): góc lật, tỷ lệ thuận với độ rộng xung \\(\\tau\\) (ứng với tham số \\(P1\\) trong bài).",
        en: "\\(\\theta\\): flip angle, proportional to the pulse width \\(\\tau\\) (corresponding to the \\(P1\\) parameter in the lesson).",
        zh: "\\(\\theta\\)：翻转角，与脉冲宽度 \\(\\tau\\) 成正比（对应课程中的 \\(P1\\) 参数）。",
      },
      {
        vi: "\\(\\sin(\\theta)\\): biên độ tín hiệu theo góc lật — cực đại tại \\(90^\\circ\\), cực tiểu tại \\(180^\\circ\\).",
        en: "\\(\\sin(\\theta)\\): signal amplitude vs flip angle — maximal at \\(90^\\circ\\), minimal at \\(180^\\circ\\).",
        zh: "\\(\\sin(\\theta)\\)：信号幅度随翻转角变化——在 \\(90^\\circ\\) 最大，在 \\(180^\\circ\\) 最小。",
      },
      {
        vi: "\\(T_2^{*}\\): hằng số suy giảm (FID thô, chưa tái lập pha).",
        en: "\\(T_2^{*}\\): decay constant (raw FID, not refocused).",
        zh: "\\(T_2^{*}\\)：衰减常数（原始 FID，未经重聚）。",
      },
    ],
  },

  "lesson-6-soft-pulse": {
    lessonId: "lesson-6-soft-pulse",
    context: {
      vi: "Để chụp ảnh theo từng lát cắt, máy cần xung RF \"chọn lọc\" thay vì kích thích toàn bộ mẫu — đây gọi là xung mềm.",
      en: "To image slice by slice, the scanner needs a \"selective\" RF pulse rather than exciting the whole sample — this is called a soft pulse.",
      zh: "为了逐层成像，设备需要“选择性”RF 脉冲，而不是激发整个样品——这称为软脉冲。",
    },
    concepts: [
      {
        vi: "Xung mềm (soft pulse/selective): xung RF có hình bao dạng \\(\\text{sinc}\\), chỉ kích thích một dải tần hẹp tương ứng một lát cắt không gian.",
        en: "Soft pulse (selective): an RF pulse with a \\(\\text{sinc}\\)-shaped envelope, exciting only a narrow frequency band corresponding to one spatial slice.",
        zh: "软脉冲（soft pulse / 选择性）：一种包络为 \\(\\text{sinc}\\) 形的 RF 脉冲，仅激发与一个空间层面相对应的窄频带。",
      },
      {
        vi: "Sự khác biệt xung cứng vs xung mềm: xung cứng ngắn và kích thích rộng; xung mềm dài hơn, kích thích hẹp, có tính chọn lọc.",
        en: "Hard vs soft pulse: a hard pulse is short and excites broadly; a soft pulse is longer, excites narrowly, and is selective.",
        zh: "硬脉冲与软脉冲的区别：硬脉冲短、激发范围宽；软脉冲较长、激发范围窄、具有选择性。",
      },
      {
        vi: "\\(RFA\\) (RF Amplitude): biên độ phát xung mềm, đơn vị phần trăm (\\(\\%\\)) công suất tối đa.",
        en: "\\(RFA\\) (RF Amplitude): soft-pulse transmit amplitude, in percent (\\(\\%\\)) of maximum power.",
        zh: "\\(RFA\\)（RF Amplitude，射频幅度）：软脉冲发射幅度，以最大功率的百分比（\\(\\%\\)）表示。",
      },
    ],
    formula:
      "\\text{Envelope}(t) = RFA \\cdot \\text{sinc}(t) = RFA \\cdot \\dfrac{\\sin(\\pi t)}{\\pi t}",
    formulaExplain: [
      {
        vi: "\\(RFA\\): biên độ phát xung mềm (\\(\\%\\)).",
        en: "\\(RFA\\): soft-pulse transmit amplitude (\\(\\%\\)).",
        zh: "\\(RFA\\)：软脉冲发射幅度（\\(\\%\\)）。",
      },
      {
        vi: "\\(\\text{sinc}(t)\\): hàm sinc — biến đổi Fourier của nó là hình chữ nhật trong miền tần số.",
        en: "\\(\\text{sinc}(t)\\): the sinc function — its Fourier transform is a rectangle in the frequency domain.",
        zh: "\\(\\text{sinc}(t)\\)：sinc 函数——其傅里叶变换在频域为一个矩形。",
      },
      {
        vi: "Dải tần hẹp bị kích thích tương ứng lát cắt không gian được chọn.",
        en: "The narrow excited frequency band corresponds to the selected spatial slice.",
        zh: "被激发的窄频带对应所选的空间层面。",
      },
    ],
  },

  "lesson-7-prescan": {
    lessonId: "lesson-7-prescan",
    context: {
      vi: "Trước mỗi lần chụp ảnh thật, máy MRI luôn thực hiện một chuỗi hiệu chỉnh tự động (prescan) — bài này ghép lại các kỹ năng đã học thành một quy trình liền mạch.",
      en: "Before each real scan, an MRI scanner always runs an automatic calibration sequence (prescan) — this lesson assembles the skills already learned into one seamless workflow.",
      zh: "每次真实扫描之前，MRI 扫描仪都会运行一套自动校准流程（prescan）——本课将已学技能整合为一个连贯的工作流程。",
    },
    concepts: [
      {
        vi: "Prescan: chuỗi bước hiệu chỉnh bắt buộc (tìm tần số cộng hưởng → shim → xác định góc lật) trước khi thu ảnh.",
        en: "Prescan: the mandatory calibration sequence (find resonance frequency → shim → determine flip angle) before image acquisition.",
        zh: "Prescan：图像采集前必须完成的校准序列（寻找共振频率 → 匀场 → 确定翻转角）。",
      },
      {
        vi: "Vì sao cần lặp lại prescan mỗi lần chụp: từ trường và mẫu vật (bệnh nhân) thay đổi giữa các lần chụp.",
        en: "Why prescan must be repeated each scan: the magnetic field and the sample (patient) change between scans.",
        zh: "为何每次扫描都要重复 prescan：磁场和样品（患者）在不同扫描之间会发生变化。",
      },
      {
        vi: "Bài này tổng hợp lại 3 công thức đã học ở Bài 1, Bài 3, Bài 6 — không có công thức mới.",
        en: "This lesson consolidates the three formulas learned in Lessons 1, 3, and 6 — no new formulas.",
        zh: "本课综合第 1、3、6 课已学的三个公式——没有新公式。",
      },
    ],
    formula: {
      vi: "\\text{Prescan} = \\bigl[\\text{tìm } O1\\bigr] \\to \\bigl[\\text{shim } G_x,G_y,G_z\\bigr] \\to \\bigl[\\text{xung mềm } RFA\\bigr]",
      en: "\\text{Prescan} = \\bigl[\\text{find } O1\\bigr] \\to \\bigl[\\text{shim } G_x,G_y,G_z\\bigr] \\to \\bigl[\\text{soft pulse } RFA\\bigr]",
      zh: "\\text{Prescan} = \\bigl[\\text{寻找 } O1\\bigr] \\to \\bigl[\\text{匀场 } G_x,G_y,G_z\\bigr] \\to \\bigl[\\text{软脉冲 } RFA\\bigr]",
    },
    formulaExplain: [
      {
        vi: "Bước 1: tìm tần số cộng hưởng (kéo \\(O1\\)).",
        en: "Step 1: find the resonance frequency (adjust \\(O1\\)).",
        zh: "步骤 1：寻找共振频率（调节 \\(O1\\)）。",
      },
      {
        vi: "Bước 2: vô từ trường (kéo 3 tham số shim).",
        en: "Step 2: shim the field (adjust the three shim parameters).",
        zh: "步骤 2：匀场（调节三个 shim 参数）。",
      },
      {
        vi: "Bước 3: xác định xung mềm \\(90^\\circ/180^\\circ\\) (kéo \\(RFA\\)).",
        en: "Step 3: determine the soft \\(90^\\circ/180^\\circ\\) pulse (adjust \\(RFA\\)).",
        zh: "步骤 3：确定 \\(90^\\circ/180^\\circ\\) 软脉冲（调节 \\(RFA\\)）。",
      },
    ],
  },

  "lesson-8-spin-echo-fov": {
    lessonId: "lesson-8-spin-echo-fov",
    context: {
      vi: "Sau khi máy đã \"sẵn sàng\" (qua prescan), bước tiếp theo là xác định vùng nhìn thấy được của ảnh — trường nhìn (FOV) — và cách nó ảnh hưởng tới độ phân giải.",
      en: "Once the scanner is \"ready\" (after prescan), the next step is to determine the visible region of the image — the field of view (FOV) — and how it affects resolution.",
      zh: "当设备“就绪”（经过 prescan）之后，下一步是确定图像的可视区域——视野（FOV）——以及它如何影响分辨率。",
    },
    concepts: [
      {
        vi: "\\(FOV\\) (Field of View): kích thước vùng không gian thực được tái tạo thành ảnh.",
        en: "\\(FOV\\) (Field of View): the size of the spatial region actually reconstructed into the image.",
        zh: "\\(FOV\\)（Field of View，视野）：实际被重建为图像的空间区域大小。",
      },
      {
        vi: "Gradient mã hóa tần số (\\(G_x\\)) và mã hóa pha (\\(G_y\\)): hai gradient từ trường dùng để mã hóa vị trí không gian.",
        en: "Frequency-encoding (\\(G_x\\)) and phase-encoding (\\(G_y\\)) gradients: two magnetic-field gradients used to encode spatial position.",
        zh: "频率编码（\\(G_x\\)）与相位编码（\\(G_y\\)）梯度：用于编码空间位置的两个磁场梯度。",
      },
      {
        vi: "Băng thông thu tín hiệu \\(sw\\) (sweep width) và số điểm mã hóa pha \\(NE\\).",
        en: "Signal acquisition bandwidth \\(sw\\) (sweep width) and the number of phase-encoding steps \\(NE\\).",
        zh: "信号采集带宽 \\(sw\\)（sweep width）与相位编码步数 \\(NE\\)。",
      },
      {
        vi: "Quan hệ nghịch đảo: \\(FOV\\) càng nhỏ, độ phân giải không gian trên cùng kích thước ảnh càng cao.",
        en: "Inverse relationship: the smaller the \\(FOV\\), the higher the spatial resolution for the same image size.",
        zh: "反比关系：\\(FOV\\) 越小，在相同图像尺寸下空间分辨率越高。",
      },
    ],
    formula:
      "FOV_x = \\dfrac{sw}{\\gamma \\cdot G_x}, \\qquad FOV_y = \\dfrac{NE}{\\gamma \\cdot G_y \\cdot D_y}",
    formulaExplain: [
      {
        vi: "\\(sw\\): băng thông thu tín hiệu.",
        en: "\\(sw\\): signal acquisition bandwidth.",
        zh: "\\(sw\\)：信号采集带宽。",
      },
      {
        vi: "\\(G_x, G_y\\): gradient mã hóa tần số / pha.",
        en: "\\(G_x, G_y\\): frequency- / phase-encoding gradients.",
        zh: "\\(G_x, G_y\\)：频率/相位编码梯度。",
      },
      {
        vi: "\\(NE\\): số bước mã hóa pha, \\(D_y\\): thời gian mã hóa pha (đặc thù thiết bị EDUMR).",
        en: "\\(NE\\): number of phase-encoding steps, \\(D_y\\): phase-encoding duration (specific to the EDUMR device).",
        zh: "\\(NE\\)：相位编码步数，\\(D_y\\)：相位编码时长（EDUMR 设备特有）。",
      },
    ],
  },

  "lesson-9-weighting": {
    lessonId: "lesson-9-weighting",
    context: {
      vi: "Đây là bài quan trọng nhất về mặt lâm sàng — cùng một mẫu vật có thể cho ra nhiều loại ảnh khác nhau tùy cách chọn tham số quét, và mỗi loại ảnh mang ý nghĩa chẩn đoán riêng.",
      en: "This is the most clinically important lesson — the same sample can yield several different image types depending on the chosen scan parameters, and each carries its own diagnostic meaning.",
      zh: "这是临床上最重要的一课——同一样本会因所选扫描参数不同而产生多种图像，每种图像都有各自的诊断意义。",
    },
    concepts: [
      {
        vi: "\\(TR\\) (Repetition Time): thời gian lặp lại giữa hai lần kích thích liên tiếp.",
        en: "\\(TR\\) (Repetition Time): the time between two consecutive excitations.",
        zh: "\\(TR\\)（Repetition Time，重复时间）：两次连续激发之间的时间。",
      },
      {
        vi: "\\(TE\\) (Echo Time): thời gian từ lúc kích thích đến lúc thu tín hiệu echo.",
        en: "\\(TE\\) (Echo Time): the time from excitation to echo signal acquisition.",
        zh: "\\(TE\\)（Echo Time，回波时间）：从激发到回波信号采集之间的时间。",
      },
      {
        vi: "Ảnh trọng số \\(T_1\\) (\\(T_1WI\\)), trọng số \\(T_2\\) (\\(T_2WI\\)), trọng số mật độ proton (\\(PDWI\\)): ba kiểu ảnh ứng với các vùng \\(TR/TE\\) khác nhau.",
        en: "T1-weighted (\\(T_1WI\\)), T2-weighted (\\(T_2WI\\)), and proton-density-weighted (\\(PDWI\\)) images: three image types corresponding to different \\(TR/TE\\) ranges.",
        zh: "T1 加权（\\(T_1WI\\)）、T2 加权（\\(T_2WI\\)）和质子密度加权（\\(PDWI\\)）图像：对应不同 \\(TR/TE\\) 范围的三类图像。",
      },
      {
        vi: "Mật độ proton \\(\\rho(H)\\): số lượng hạt nhân hydro trên một đơn vị thể tích mô.",
        en: "Proton density \\(\\rho(H)\\): the number of hydrogen nuclei per unit tissue volume.",
        zh: "质子密度 \\(\\rho(H)\\)：单位组织体积内的氢原子核数量。",
      },
    ],
    formula:
      "S \\propto \\rho(H)\\cdot\\bigl[1-\\exp(-TR/T_1)\\bigr]\\cdot \\exp(-TE/T_2)",
    formulaExplain: [
      {
        vi: "\\(TR, TE\\): tham số quét do người vận hành chọn.",
        en: "\\(TR, TE\\): scan parameters chosen by the operator.",
        zh: "\\(TR, TE\\)：由操作者选择的扫描参数。",
      },
      {
        vi: "\\(T_1, T_2\\): đặc trưng của mô (dầu \\(T_1,T_2\\) ngắn; nước \\(T_1,T_2\\) dài).",
        en: "\\(T_1, T_2\\): tissue characteristics (fat has short \\(T_1,T_2\\); water has long \\(T_1,T_2\\)).",
        zh: "\\(T_1, T_2\\)：组织特征（脂肪 \\(T_1,T_2\\) 短；水 \\(T_1,T_2\\) 长）。",
      },
      {
        vi: "Vùng \\(TR/TE\\) quyết định ảnh mang trọng số \\(T_1WI\\), \\(T_2WI\\) hay \\(PDWI\\).",
        en: "The \\(TR/TE\\) range determines whether the image is \\(T_1WI\\), \\(T_2WI\\), or \\(PDWI\\).",
        zh: "\\(TR/TE\\) 范围决定图像是 \\(T_1WI\\)、\\(T_2WI\\) 还是 \\(PDWI\\)。",
      },
    ],
  },

  "lesson-10-t1-ir": {
    lessonId: "lesson-10-t1-ir",
    context: {
      vi: "Muốn biết chính xác giá trị \\(T_1\\) của một mô/chất, cần một chuỗi xung chuyên biệt đo qua nhiều thời điểm — Inversion Recovery là kỹ thuật kinh điển cho việc này.",
      en: "To know the exact \\(T_1\\) value of a tissue/substance, a dedicated pulse sequence that measures at multiple time points is needed — Inversion Recovery is the classic technique for this.",
      zh: "要准确获知某种组织/物质的 \\(T_1\\) 值，需要一种在多个时间点进行测量的专用脉冲序列——Inversion Recovery（反转恢复）是这方面的经典技术。",
    },
    concepts: [
      {
        vi: "Thời gian đảo ngược \\(TI\\) (Inversion Time): thời gian từ xung đảo \\(180^\\circ\\) đến xung đọc tín hiệu.",
        en: "Inversion time \\(TI\\): the time from the \\(180^\\circ\\) inversion pulse to the readout pulse.",
        zh: "反转时间 \\(TI\\)（Inversion Time）：从 \\(180^\\circ\\) 反转脉冲到读出脉冲之间的时间。",
      },
      {
        vi: "\\(T_1\\) (thời gian hồi phục dọc/longitudinal relaxation): đặc trưng tốc độ từ hóa hồi phục lại trục \\(z\\).",
        en: "\\(T_1\\) (longitudinal relaxation time): characterizes the rate at which magnetization recovers along the \\(z\\)-axis.",
        zh: "\\(T_1\\)（纵向弛豫时间）：表征磁化沿 \\(z\\) 轴恢复的速率。",
      },
      {
        vi: "Đường cong hồi phục \\(M_z(TI)\\): hàm mô tả từ hóa dọc theo \\(TI\\), dùng để \"fit\" ra giá trị \\(T_1\\).",
        en: "Recovery curve \\(M_z(TI)\\): a function describing longitudinal magnetization vs \\(TI\\), used to fit out the \\(T_1\\) value.",
        zh: "恢复曲线 \\(M_z(TI)\\)：描述纵向磁化随 \\(TI\\) 变化的函数，用于拟合出 \\(T_1\\) 值。",
      },
      {
        vi: "Phổ phân bố \\(T_1\\) đa thành phần: khi mẫu vật gồm nhiều chất, phổ sau fit sẽ có nhiều đỉnh riêng biệt.",
        en: "Multi-component \\(T_1\\) distribution: when the sample contains multiple substances, the fitted spectrum shows several distinct peaks.",
        zh: "多组分 \\(T_1\\) 分布：当样品含有多种物质时，拟合后的谱会出现多个独立峰。",
      },
    ],
    formula:
      "M_z(TI) = M_0\\cdot\\bigl[1-2\\exp(-TI/T_1)\\bigr]",
    formulaExplain: [
      {
        vi: "\\(M_0\\): từ hóa dọc cân bằng.",
        en: "\\(M_0\\): equilibrium longitudinal magnetization.",
        zh: "\\(M_0\\)：平衡纵向磁化。",
      },
      {
        vi: "\\(TI\\): thời gian đảo ngược.",
        en: "\\(TI\\): inversion time.",
        zh: "\\(TI\\)：反转时间。",
      },
      {
        vi: "\\(T_1\\): thời gian hồi phục dọc — giá trị cần đo. Dạng lý tưởng hóa, đúng khi \\(TR \\gg T_1\\).",
        en: "\\(T_1\\): longitudinal relaxation time — the value to measure. Idealized form, valid when \\(TR \\gg T_1\\).",
        zh: "\\(T_1\\)：纵向弛豫时间——待测值。理想化形式，当 \\(TR \\gg T_1\\) 时成立。",
      },
    ],
  },

  "lesson-11-t2-cpmg": {
    lessonId: "lesson-11-t2-cpmg",
    context: {
      vi: "Tương tự Bài 10 nhưng đo \\(T_2\\) — đại lượng đặc trưng khác của mô, dùng chuỗi xung CPMG để loại trừ ảnh hưởng của không đồng nhất từ trường.",
      en: "Similar to Lesson 10 but measuring \\(T_2\\) — another characteristic quantity of tissue, using the CPMG pulse sequence to remove the effect of field inhomogeneity.",
      zh: "与第 10 课类似，但测量的是 \\(T_2\\)——组织的另一个特征量，使用 CPMG 脉冲序列来消除磁场不均匀性的影响。",
    },
    concepts: [
      {
        vi: "\\(T_2\\) (thời gian hồi phục ngang/transverse relaxation) — khác với \\(T_2^{*}\\) ở Bài 3 vì CPMG loại bỏ được ảnh hưởng của \\(\\Delta B_0\\).",
        en: "\\(T_2\\) (transverse relaxation time) — unlike \\(T_2^{*}\\) in Lesson 3, CPMG removes the effect of \\(\\Delta B_0\\).",
        zh: "\\(T_2\\)（横向弛豫时间）——与第 3 课的 \\(T_2^{*}\\) 不同，CPMG 能消除 \\(\\Delta B_0\\) 的影响。",
      },
      {
        vi: "Chuỗi CPMG (Carr-Purcell-Meiboom-Gill): chuỗi nhiều xung \\(180^\\circ\\) liên tiếp tạo ra chuỗi echo, mỗi echo cách nhau \\(TE\\).",
        en: "CPMG sequence (Carr-Purcell-Meiboom-Gill): a train of consecutive \\(180^\\circ\\) pulses producing an echo train, with echoes spaced by \\(TE\\).",
        zh: "CPMG 序列（Carr-Purcell-Meiboom-Gill）：一串连续的 \\(180^\\circ\\) 脉冲产生回波链，相邻回波间隔为 \\(TE\\)。",
      },
      {
        vi: "Số lượng echo \\(NE\\): càng nhiều echo, đường cong suy giảm càng được lấy mẫu chi tiết, fit \\(T_2\\) càng chính xác.",
        en: "Number of echoes \\(NE\\): the more echoes, the more finely the decay curve is sampled and the more accurate the \\(T_2\\) fit.",
        zh: "回波数 \\(NE\\)：回波越多，衰减曲线采样越精细，\\(T_2\\) 拟合越准确。",
      },
    ],
    formula:
      "M_{xy}(n\\cdot TE) = M_0\\cdot \\exp(-n\\cdot TE/T_2)",
    formulaExplain: [
      {
        vi: "\\(n\\): chỉ số echo (\\(n = 0,1,2,\\dots\\)).",
        en: "\\(n\\): echo index (\\(n = 0,1,2,\\dots\\)).",
        zh: "\\(n\\)：回波索引（\\(n = 0,1,2,\\dots\\)）。",
      },
      {
        vi: "\\(TE\\): thời gian echo, \\(NE\\): số lượng echo.",
        en: "\\(TE\\): echo time, \\(NE\\): number of echoes.",
        zh: "\\(TE\\)：回波时间，\\(NE\\)：回波数量。",
      },
      {
        vi: "\\(T_2\\): thời gian hồi phục ngang — giá trị cần đo (loại trừ \\(\\Delta B_0\\)).",
        en: "\\(T_2\\): transverse relaxation time — the value to measure (excluding \\(\\Delta B_0\\)).",
        zh: "\\(T_2\\)：横向弛豫时间——待测值（已排除 \\(\\Delta B_0\\)）。",
      },
    ],
  },
};

export function getLessonKnowledge(lessonId: string): LessonKnowledge | undefined {
  return lessonKnowledge[lessonId];
}
