/**
 * scanSetup — helper cho bước Scan setup: map nhãn chuỗi xung ↔ protocol JSON,
 * dựng ảnh preview tương phản theo tham số hiện tại, và tính ma trận hướng cắt
 * từ 3 góc Euler (alpha/beta/gamma).
 */
import { generatePhantom } from "../../mri-sim/phantom";
import { spinEchoSignal, inversionRecoverySignal } from "../../mri-sim/signal";
import type { SequenceParams } from "../../stores/module2Store";

/** Nhãn chuỗi xung hiển thị (dropdown) → id trong mriProtocols.json. */
export const SEQUENCE_OPTIONS: { label: string; value: string; protocolId: string; isIR: boolean }[] = [
  { label: "SE (Spin Echo)", value: "SE", protocolId: "t1-se", isIR: false },
  { label: "TSE (Turbo SE)", value: "TSE", protocolId: "t2-tse", isIR: false },
  { label: "FLAIR", value: "FLAIR", protocolId: "flair", isIR: true },
];

export function isIRSequence(seq: string): boolean {
  return seq === "FLAIR";
}

/** Phantom preview nhỏ (dựng 1 lần, tái dùng cho mọi lần đổi tham số). */
let _previewPhantom: ReturnType<typeof generatePhantom> | null = null;
function previewPhantom() {
  if (!_previewPhantom) _previewPhantom = generatePhantom({ size: 96 });
  return _previewPhantom;
}

/**
 * computePreviewImage — ảnh tương phản [0,1] theo tham số chuỗi xung hiện tại.
 * SE/TSE → spin echo S=PD(1−e^−TR/T1)e^−TE/T2; FLAIR → IR magnitude (dùng TI).
 * Dùng physics engine sẵn có (signal.ts).
 */
export function computePreviewImage(params: SequenceParams): number[][] {
  const ph = previewPhantom();
  if (isIRSequence(params.sequence) && params.TI != null) {
    const raw = inversionRecoverySignal(ph, params.TR, params.TE, params.TI);
    for (let r = 0; r < raw.length; r++)
      for (let c = 0; c < raw[r].length; c++) raw[r][c] = Math.abs(raw[r][c]);
    return raw;
  }
  return spinEchoSignal(ph, params.TR, params.TE);
}

/**
 * orientationMatrix — ma trận hướng cắt 3×3 từ 3 góc Euler (độ). Hàng =
 * Slice / Phase / Read; cột = thành phần theo trục máy (x, y, z). Xoay
 * Rz(gamma)·Ry(beta)·Rx(alpha) áp lên hệ trục chuẩn.
 *
 * Ở góc 0/0/0: Slice=(0,0,1), Phase=(0,1,0), Read=(1,0,0) — cắt axial chuẩn.
 */
export function orientationMatrix(alphaDeg: number, betaDeg: number, gammaDeg: number): number[][] {
  const a = (alphaDeg * Math.PI) / 180;
  const b = (betaDeg * Math.PI) / 180;
  const g = (gammaDeg * Math.PI) / 180;
  const ca = Math.cos(a), sa = Math.sin(a);
  const cb = Math.cos(b), sb = Math.sin(b);
  const cg = Math.cos(g), sg = Math.sin(g);

  // R = Rz(g) · Ry(b) · Rx(a)
  const r00 = cg * cb;
  const r01 = cg * sb * sa - sg * ca;
  const r02 = cg * sb * ca + sg * sa;
  const r10 = sg * cb;
  const r11 = sg * sb * sa + cg * ca;
  const r12 = sg * sb * ca - cg * sa;
  const r20 = -sb;
  const r21 = cb * sa;
  const r22 = cb * ca;

  // Trục máy chuẩn: Read=x, Phase=y, Slice=z. Áp R lên từng trục, xuất theo
  // thứ tự hàng Slice / Phase / Read.
  const read = [r00, r10, r20];
  const phase = [r01, r11, r21];
  const slice = [r02, r12, r22];
  return [slice, phase, read];
}

/** Preset góc cho 3 hướng chuẩn (nút nhanh Sagittal/Coronal/Axial). */
export const ORIENTATION_PRESETS: Record<string, { alpha: number; beta: number; gamma: number }> = {
  Axial: { alpha: 0, beta: 0, gamma: 0 },
  Coronal: { alpha: 90, beta: 0, gamma: 0 },
  Sagittal: { alpha: 90, beta: 90, gamma: 0 },
};

/**
 * FOV danh nghĩa của ảnh Scout (mm) — dùng để quy đổi mm → % viewport. Ảnh
 * scout coi như trải hết một vùng PHANTOM_FOV_MM × PHANTOM_FOV_MM.
 */
export const PHANTOM_FOV_MM = 25;

/**
 * sliceBoxRect — vị trí/kích thước các ô định vị (theo % viewport) tính TỪ
 * sliceLocation. Đây là nguồn sự thật duy nhất cho ô đỏ (không hardcode).
 *
 * ĐÚNG NGUYÊN LÝ: mỗi LÁT là một ô RIÊNG (không gộp thành 1 ô cao).
 *  - Slice Count → SỐ ô (stack nhiều lát song song).
 *  - Slice Thickness → chiều cao MỖI ô.
 *  - Slice Gap → khoảng hở giữa các ô liền nhau.
 * Cả stack căn giữa quanh Offset Slice.
 *
 * Quy ước trục (hệ máy: Read=x, Phase=y, Slice=z):
 *  - Coronal (mặt XZ): NGANG = Read(x) → rộng theo FOV Read, dịch ngang theo
 *    Offset Read; DỌC = Slice(z) → stack lát theo Offset Slice.
 *  - Sagittal (mặt YZ): NGANG = Phase(y) → rộng theo FOV Phase, dịch ngang theo
 *    Offset Phase; DỌC = Slice(z).
 *
 * Trả `{ slices, spanMM }`; mỗi slice là {leftPct, topPct, widthPct, heightPct}.
 */
export interface SliceLocLike {
  fovRead: number;
  fovPhase: number;
  offsetRead: number;
  offsetPhase: number;
  offsetSlice: number;
  sliceThickness: number;
  sliceGap: number;
  sliceCount: number;
}

export interface BoxRect {
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
}

export function sliceBoxRect(
  plane: "sagittal" | "coronal",
  loc: SliceLocLike & { alpha?: number; beta?: number; gamma?: number },
): { slices: BoxRect[]; spanMM: number } {
  const mm = PHANTOM_FOV_MM;

  // Ma trận hướng: hàng [slice, phase, read], mỗi vector theo trục máy (x,y,z).
  const [sliceV, phaseV, readV] = orientationMatrix(loc.alpha ?? 0, loc.beta ?? 0, loc.gamma ?? 0);

  // Trục hiển thị của từng view (chỉ số thành phần x=0,y=1,z=2):
  //  - Coronal (mặt XZ): NGANG = x, DỌC = z.
  //  - Sagittal (mặt YZ): NGANG = y, DỌC = z.
  const hIdx = plane === "coronal" ? 0 : 1;
  const vIdx = 2;

  const count = Math.max(1, Math.round(loc.sliceCount));
  const thick = loc.sliceThickness;
  const gap = loc.sliceGap;
  const spanMM = count * thick + Math.max(0, count - 1) * gap;

  // Dịch tâm trong không gian máy = tổ hợp 3 offset dọc 3 trục logic:
  //  read·readV + phase·phaseV + slice·sliceV  → vector (x,y,z) mm.
  const baseX = loc.offsetRead * readV[0] + loc.offsetPhase * phaseV[0] + loc.offsetSlice * sliceV[0];
  const baseY = loc.offsetRead * readV[1] + loc.offsetPhase * phaseV[1] + loc.offsetSlice * sliceV[1];
  const baseZ = loc.offsetRead * readV[2] + loc.offsetPhase * phaseV[2] + loc.offsetSlice * sliceV[2];
  const base = [baseX, baseY, baseZ];

  // FOV theo trục ngang view: coronal ~ FOV Read, sagittal ~ FOV Phase.
  const fovAxis = plane === "coronal" ? loc.fovRead : loc.fovPhase;
  const wPct = Math.max(2, Math.min(100, (fovAxis / mm) * 100));
  const thickPct = (thick / mm) * 100;

  const toPct = (mmVal: number) => (mmVal / mm) * 100;
  const clamp = (v: number) => Math.max(0, Math.min(100, v));

  // Mỗi lát cách tâm stack một bội số của (thick+gap) DỌC THEO PHÁP TUYẾN lát;
  // dịch đó được chiếu lên trục ngang/dọc của view → stack có thể nằm chéo khi
  // lát nghiêng (đúng vật lý), thẳng đứng khi axial.
  const step = thick + gap;
  const slices: BoxRect[] = [];
  for (let i = 0; i < count; i++) {
    const k = i - (count - 1) / 2; // -…0…+ quanh tâm
    const cx = base[hIdx] + k * step * sliceV[hIdx];
    const cy = base[vIdx] + k * step * sliceV[vIdx];
    const centerHPct = 50 + toPct(cx);
    const centerVPct = 50 + toPct(cy);
    slices.push({
      leftPct: clamp(centerHPct - wPct / 2),
      topPct: centerVPct - thickPct / 2,
      widthPct: wPct,
      heightPct: Math.max(0.8, thickPct),
    });
  }
  return { slices, spanMM };
}
