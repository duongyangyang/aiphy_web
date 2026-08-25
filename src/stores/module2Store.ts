import { create } from "zustand";
import type { ModuleStep } from "./module2Types";
import type { ColormapName } from "../mri-sim/colormap";

/**
 * Module2State — trạng thái chung của Module 2 (MRI simulator), mô phỏng
 * luồng vận hành máy MRI/NMR thật: Prescan → Scout → Scan setup → Scan →
 * Image processing.
 *
 * Một store duy nhất thay cho nhiều useState rời rạc ở từng component — đây
 * là điểm neo để các màn hình liên kết (sidebar điều hướng, bảng điều khiển,
 * vùng kết quả) cùng đọc/viết chung một nguồn sự thật. Tránh "vibe-code" rắc
 * rối prop-drilling khi app có nhiều màn hình phụ thuộc nhau.
 *
 * Quy ước: mỗi mảnh dữ liệu (calibration, scoutImages, sliceLocation,
 * sequenceParams, scanResults) đi kèm một setter riêng; `setStep` đổi bước;
 * `reset` trả toàn bộ về ban đầu để bắt đầu ca chụp mới.
 */
interface Module2Store {
  /** Bước hiện tại trong luồng 5 bước. */
  currentStep: ModuleStep;

  /** Kết quả hiệu chỉnh prescan: O1, đường cong shim, biên độ & độ rộng xung RF. */
  calibration: Calibration | null;

  /** 3 ảnh định vị (scout) theo 3 mặt phẳng. */
  scoutImages: ScoutImages | null;

  /** Vị trí lát cắt / FOV / hướng đáy góc (alpha, beta, gamma). */
  sliceLocation: SliceLocation;

  /** Tham số chuỗi xung: TR, TE, gật góc, loại chuỗi, matrix size, bandwidth, NEX. */
  sequenceParams: SequenceParams;

  /** Tham số hậu xử lý ảnh: blockSize, searchSize, WW, WL. */
  processingParams: ProcessingParams;

  /** Nhiều ảnh kết quả (lưới 1×1 / 2×4 / 3×6). */
  scanResults: ScanResult[];

  /**
   * Ground-truth ẩn của mẫu hiện tại — sinh khi bắt đầu phiên mới.
   * Dùng để tính calibrationQuality; không hiển thị cho người dùng.
   */
  hiddenGroundTruth: HiddenGroundTruth | null;

  // --- actions ---
  setStep: (step: ModuleStep) => void;
  setCalibration: (c: Calibration | null) => void;
  setScoutImages: (s: ScoutImages | null) => void;
  setSliceLocation: (patch: Partial<SliceLocation>) => void;
  setSequenceParams: (patch: Partial<SequenceParams>) => void;
  setProcessingParams: (patch: Partial<ProcessingParams>) => void;
  addScanResult: (r: ScanResult) => void;
  clearScanResults: () => void;
  /** Lưu thiết lập hiển thị (WW/WL + colormap) cho một ảnh kết quả. */
  setScanResultDisplay: (id: string, display: ScanResultDisplay) => void;
  /** Sinh lại ground-truth ẩn cho một phiên/mẫu mới. */
  regenerateGroundTruth: () => void;
  reset: () => void;

  // --- Prescan instrument (Niumag) ---
  /** Cuộn thu (Receiving Coil): "5mm" | "10mm" | ... */
  receivingCoil: string;
  /** Metadata hiển thị ở sidebar. */
  sample: string;
  tester: string;
  /** Job hiệu chỉnh đang chạy (null = rảnh); sidebar đọc để vẽ progress+status. */
  prescanJob: PrescanJob | null;
  /** Bộ đếm trigger: nút "Prescan" ở sidebar tăng số này để PrescanStep chạy. */
  prescanRequest: number;
  /** Bộ đếm trigger dừng: nút "Stop" tăng để PrescanStep hủy job đang chạy. */
  stopRequest: number;

  setReceivingCoil: (v: string) => void;
  setPrescanJob: (j: PrescanJob | null) => void;
  /** Yêu cầu chạy full Prescan (4 khối tuần tự) — PrescanStep lắng nghe. */
  requestPrescan: () => void;
  /** Yêu cầu dừng job hiện tại. */
  requestStop: () => void;

  // --- Scout instrument ---
  /** Tham số quét Scout (RG/PRG/DRG/TR). */
  scoutParams: ScoutParams;
  /** Job Scout đang chạy (null = rảnh); sidebar đọc để glow nút Scout. */
  scoutJob: PrescanJob | null;
  /** Bộ đếm trigger: nút "Scout" ở sidebar tăng để ScoutStep chạy. */
  scoutRequest: number;

  setScoutParams: (patch: Partial<ScoutParams>) => void;
  setScoutJob: (j: PrescanJob | null) => void;
  /** Yêu cầu chạy Scout — ScoutStep lắng nghe. */
  requestScout: () => void;
}

/** Trạng thái một job hiệu chỉnh đang chạy trên panel Prescan. */
export interface PrescanJob {
  label: string; // vd "Auto Shimming"
  progress: number; // 0..100
  startedAt: number; // Date.now() lúc bắt đầu (để tính thời gian trôi qua)
}

/**
 * Calibration — kết quả Prescan do người dùng cấu hình + chất lượng dẫn xuất.
 *
 * `quality` (0..1) được tính từ độ lệch giữa input người dùng và
 * `HiddenGroundTruth`; sẽ ảnh hưởng tới ảnh chụp ở các bước sau (độ nét/,
 * artifact). `shimCurve` là đường hội tụ trên biểu đồ Shimming.
 */
export interface Calibration {
  o1: number; // MHz
  shimOffsets: { x: number; y: number; z: number };
  rfA90: number; // % mức danh định
  rfA180: number; // % mức danh định
  shimCurve: number[]; // trace biểu đồ Shimming
  quality: number; // 0..1 — exp(-k1·o1Error - k2·shimError - k3·rfaError)
}

/**
 * HiddenGroundTruth — giá trị "thật" ẩn, sinh ngẫu nhiên mỗi phiên/mẫu mới.
 * Người dùng không thấy trực tiếp; chỉ dùng để tính calibrationQuality. Giá
 * trị này sinh một lần (Math.random) — không liên quan tới flicker chart.
 */
export interface HiddenGroundTruth {
  trueO1: number; // MHz, quanh O1 mặc định ±0.5
  trueShim: { gx: number; gy: number; gz: number }; // quanh 0
  trueRFA90: number; // % quanh 100
  trueRFA180: number; // % quanh 100
}

/**
 * ScoutImages — 3 ảnh định vị grayscale [0,1] theo 3 mặt phẳng. Dùng
 * `number[][]` (không phải ImageData) để vẽ dần bằng `drawGrayscale` khi scan
 * line chạy, và để noise/clipping do `scoutParams` tính được lưu sẵn.
 */
export interface ScoutImages {
  sagittal: number[][];
  coronal: number[][];
  axial: number[][];
}

/** Tham số quét Scout (Niumag). Ảnh hưởng noise/clipping/độ sáng ảnh scout. */
export interface ScoutParams {
  rg: number; // Receiver Gain — quá cao → clipping (cháy sáng), quá thấp → tối/nhiễu
  prg: number; // Pre-amp Gain
  drg: number; // Digital Gain
  tr: number; // ms — TR ngắn → bão hoà T1, tín hiệu thấp/nhiễu hơn
}

export interface SliceLocation {
  fovRead: number;
  fovPhase: number;
  offsetRead: number;
  offsetPhase: number;
  offsetSlice: number;
  sliceThickness: number;
  sliceGap: number;
  sliceCount: number;
  alpha: number;
  beta: number;
  gamma: number;
}

export interface SequenceParams {
  TR: number;
  TE: number;
  FA: number;
  /** Nhãn chuỗi xung: "SE" | "TSE" | "FLAIR" (map sang protocol JSON). */
  sequence: string;
  /** Thời gian đảo (ms) — chỉ dùng cho FLAIR (IR); null với SE/TSE. */
  TI: number | null;
  matrixSize: number;
  /** Bandwidth thu (Hz/pixel·matrix ~ tổng Hz). Ảnh hưởng chemical shift + noise. */
  bandwidth: number;
  /** Số lần trung bình tín hiệu (NEX). ↑ → noise/√NEX, thời gian scan ↑. */
  nex: number;
}

/**
 * ProcessingParams — tham số hậu xử lý ảnh (bước Image processing).
 *  - blockSize/searchSize: cửa sổ bộ lọc khử nhiễu (non-local means / median),
 *    dùng làm mặc định cho mọi ô khi chưa có display riêng.
 *  - ww/wl: Window Width / Level — chỉ đổi cách map pixel → grayscale khi vẽ,
 *    KHÔNG đổi dữ liệu gốc.
 *  - colormap: colormap mặc định (LUT) khi ô chưa có display riêng.
 *
 * ww/wl/colormap cho từng ô riêng lưu ở `ScanResult.display`; bản này chỉ là
 * nguồn mặc định ban đầu khi mở modal xử lý ảnh (và khi chưa bấm vào ô nào).
 */
export interface ProcessingParams {
  blockSize: number;
  searchSize: number;
  ww: number; // window width (0..1 thang tín hiệu chuẩn hoá)
  wl: number; // window level
  colormap: ColormapName; // colormap mặc định
}

/**
 * ScanResultDisplay — thiết lập hiển thị cho một ảnh kết quả, được lưu khi bấm
 * "Áp dụng" trong modal xử lý ảnh. Chỉ ảnh hưởng lúc vẽ (windowing + colormap),
 * không đổi dữ liệu gốc `image`.
 */
export interface ScanResultDisplay {
  ww: number;
  wl: number;
  colormap: ColormapName;
}

/**
 * Một ảnh kết quả trong lưới (vd. 2×4 = 8 ảnh). Lưu `image` (đã tái tạo, có
 * noise) và `groundTruth` (tín hiệu lý tưởng) dưới dạng number[][] [0,1] để
 * còn re-filter (khử nhiễu) và re-window (WW/WL) lúc hiển thị.
 *
 * `display` (tuỳ chọn) là thiết lập hiển thị riêng cho ảnh này (WW/WL + colormap),
 * được lưu khi bấm "Áp dụng" trong modal xử lý ảnh. Khi undefined, ô dùng mặc
 * định từ ProcessingParams.
 */
export interface ScanResult {
  id: string;
  index: number; // vị trí lát trong loạt
  image: number[][]; // ảnh tái tạo (có noise)
  groundTruth: number[][]; // tín hiệu lý tưởng (không noise)
  quality: number; // calibrationQuality lúc chụp
  display?: ScanResultDisplay; // WW/WL + colormap riêng (lưu qua modal xử lý ảnh)
  snapshot: {
    TR: number;
    TE: number;
    FA: number;
    sequence: string;
    matrixSize: number;
    sliceThickness: number;
  };
}

/** Trạng thái mặc định cho sliceLocation/sequenceParams khi chưa cấu hình. */
const defaultSliceLocation: SliceLocation = {
  fovRead: 25,
  fovPhase: 25,
  offsetRead: 0,
  offsetPhase: 0,
  offsetSlice: 0,
  sliceThickness: 5,
  sliceGap: 1,
  sliceCount: 3,
  alpha: 0,
  beta: 0,
  gamma: 0,
};

const defaultSequenceParams: SequenceParams = {
  TR: 500,
  TE: 15,
  FA: 90,
  sequence: "SE",
  TI: null,
  matrixSize: 256,
  bandwidth: 32000, // Hz (≈ 125 Hz/pixel @ 256) — tham chiếu
  nex: 1,
};

const defaultProcessingParams: ProcessingParams = {
  blockSize: 3,
  searchSize: 7,
  ww: 0.7, // window width (thang [0,1])
  wl: 0.5, // window level
  colormap: "grayscale",
};

/** Tham số Scout mặc định (gain vừa phải, TR đủ dài cho ảnh sáng, ít nhiễu). */
const defaultScoutParams: ScoutParams = {
  rg: 20,
  prg: 3,
  drg: 3,
  tr: 1000,
};

/** O1 mặc định (MHz) — 1H @ 1.5T ~63.87 MHz. */
export const DEFAULT_O1_MHZ = 63.87;

/**
 * Sinh một HiddenGroundTruth ngẫu nhiên cho phiên/mẫu mới. Math.random() ở
 * đây dùng một lần khi đổi phiên — không phải nhiễu chart, nên không vi phạm
 * quy ước pseudo-noise deterministic của CLAUDE.md.
 */
export function generateGroundTruth(): HiddenGroundTruth {
  const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
  return {
    trueO1: DEFAULT_O1_MHZ + rand(-0.5, 0.5),
    trueShim: { gx: rand(-1.2, 1.2), gy: rand(-1.2, 1.2), gz: rand(-1.2, 1.2) },
    trueRFA90: 100 + rand(-6, 6),
    trueRFA180: 100 + rand(-6, 6),
  };
}

const initialState = {
  currentStep: "prescan" as ModuleStep,
  calibration: null,
  scoutImages: null,
  sliceLocation: defaultSliceLocation,
  sequenceParams: defaultSequenceParams,
  processingParams: defaultProcessingParams,
  scanResults: [] as ScanResult[],
  hiddenGroundTruth: generateGroundTruth(),
  receivingCoil: "10mm",
  sample: "Sample-01",
  tester: "Guest",
  prescanJob: null as PrescanJob | null,
  prescanRequest: 0,
  stopRequest: 0,
  scoutParams: defaultScoutParams,
  scoutJob: null as PrescanJob | null,
  scoutRequest: 0,
};

export const useModule2Store = create<Module2Store>((set) => ({
  ...initialState,
  setStep: (step) => set({ currentStep: step }),
  setCalibration: (c) => set({ calibration: c }),
  setScoutImages: (s) => set({ scoutImages: s }),
  setSliceLocation: (patch) =>
    set((state) => ({ sliceLocation: { ...state.sliceLocation, ...patch } })),
  setSequenceParams: (patch) =>
    set((state) => ({ sequenceParams: { ...state.sequenceParams, ...patch } })),
  setProcessingParams: (patch) =>
    set((state) => ({ processingParams: { ...state.processingParams, ...patch } })),
  addScanResult: (r) => set((state) => ({ scanResults: [...state.scanResults, r] })),
  clearScanResults: () => set({ scanResults: [] }),
  setScanResultDisplay: (id, display) =>
    set((state) => ({
      scanResults: state.scanResults.map((r) => (r.id === id ? { ...r, display } : r)),
    })),
  regenerateGroundTruth: () => set({ hiddenGroundTruth: generateGroundTruth() }),
  // Reset = phiên/mẫu mới: sinh lại ground-truth ẩn.
  reset: () =>
    set((state) => ({
      ...initialState,
      hiddenGroundTruth: generateGroundTruth(),
      // giữ metadata & cuộn thu người dùng đã chọn qua các phiên
      receivingCoil: state.receivingCoil,
      sample: state.sample,
      tester: state.tester,
      // stopRequest tăng để job đang chạy (nếu có) bị hủy
      stopRequest: state.stopRequest + 1,
    })),

  setReceivingCoil: (v) => set({ receivingCoil: v }),
  setPrescanJob: (j) => set({ prescanJob: j }),
  requestPrescan: () => set((state) => ({ prescanRequest: state.prescanRequest + 1 })),
  requestStop: () => set((state) => ({ stopRequest: state.stopRequest + 1 })),

  setScoutParams: (patch) => set((state) => ({ scoutParams: { ...state.scoutParams, ...patch } })),
  setScoutJob: (j) => set({ scoutJob: j }),
  requestScout: () => set((state) => ({ scoutRequest: state.scoutRequest + 1 })),
}));
