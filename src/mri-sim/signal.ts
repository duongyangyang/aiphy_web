/**
 * mri-sim/signal — Bước 2 của module MRI Simulator.
 *
 * Tính tín hiệu MR cho chuỗi xung Spin Echo theo công thức chuẩn:
 *   S = PD · (1 − exp(−TR/T1)) · exp(−TE/T2)
 *
 * - Hồi phục dọc (T1): ((1 − exp(−TR/T1)) — TR dài → hồi phục đầy đủ.
 * - Suy giảm ngang (T2): exp(−TE/T2) — TE ngắn → ít suy giảm.
 * - PD (mật độ proton) là hệ số tỉ lệ toàn cục.
 *
 * Đầu vào: phantom từ `generatePhantom` + TR (ms) + TE (ms).
 * Đầu ra: mảng 2D cường độ tín hiệu [0..1] cho từng pixel.
 */

import type { Phantom, PhantomCell } from "./phantom";
import type { MriProtocol } from "./protocols";

/** Tín hiệu của 1 pixel. Tách riêng để dễ test/dùng lại. */
export function pixelSignal(cell: PhantomCell, trMs: number, teMs: number): number {
  if (cell.PD <= 0 || cell.T1 <= 0 || cell.T2 <= 0) return 0;
  const recovery = 1 - Math.exp(-trMs / cell.T1);
  const decay = Math.exp(-teMs / cell.T2);
  return cell.PD * recovery * decay;
}

/**
 * spinEchoSignal — tính cường độ spin echo cho toàn phantom.
 * Trả về number[][] cùng kích thước với phantom.
 */
export function spinEchoSignal(phantom: Phantom, trMs: number, teMs: number): number[][] {
  const rows = phantom.length;
  const out: number[][] = new Array(rows);
  for (let r = 0; r < rows; r++) {
    const row = phantom[r];
    const cols = row.length;
    const line: number[] = new Array(cols);
    for (let c = 0; c < cols; c++) {
      line[c] = pixelSignal(row[c], trMs, teMs);
    }
    out[r] = line;
  }
  return out;
}

/**
 * Tín hiệu Inversion Recovery cho 1 pixel (FLAIR).
 *   S = PD · (1 − 2·e^{−TI/T1}) · e^{−TE/T2}
 * Có thể âm (vùng chưa qua điểm null) → caller lấy magnitude |S| khi dựng ảnh.
 */
export function pixelSignalIR(cell: PhantomCell, _trMs: number, teMs: number, tiMs: number): number {
  if (cell.PD <= 0 || cell.T1 <= 0 || cell.T2 <= 0) return 0;
  // TR dài (IR/FLAIR TR rất dài) → hồi phục đầy đủ trước xung đảo kế tiếp;
  // dạng lý tưởng hóa, bỏ hệ số e^{−TR/T1} (xem Phụ lục A, Bài 10).
  const inversion = 1 - 2 * Math.exp(-tiMs / cell.T1);
  const decay = Math.exp(-teMs / cell.T2);
  return cell.PD * inversion * decay;
}

/**
 * inversionRecoverySignal — cường độ IR cho toàn phantom.
 * Trả về giá trị mang dấu (raw); render nên lấy |S| (magnitude reconstruction).
 */
export function inversionRecoverySignal(phantom: Phantom, trMs: number, teMs: number, tiMs: number): number[][] {
  const rows = phantom.length;
  const out: number[][] = new Array(rows);
  for (let r = 0; r < rows; r++) {
    const row = phantom[r];
    const cols = row.length;
    const line: number[] = new Array(cols);
    for (let c = 0; c < cols; c++) {
      line[c] = pixelSignalIR(row[c], trMs, teMs, tiMs);
    }
    out[r] = line;
  }
  return out;
}

/**
 * computeProtocolSignal — dispatcher theo loại chuỗi xung.
 * SE/TSE → spin echo; IR → inversion recovery (magnitude).
 */
export function computeProtocolSignal(phantom: Phantom, protocol: MriProtocol): number[][] {
  const p = protocol.params;
  if (protocol.sequence === "IR" && p.TI !== undefined && p.TI !== null) {
    const raw = inversionRecoverySignal(phantom, p.TR, p.TE, p.TI);
    // Magnitude reconstruction (chuẩn cho IR/FLAIR).
    for (let r = 0; r < raw.length; r++) {
      for (let c = 0; c < raw[r].length; c++) raw[r][c] = Math.abs(raw[r][c]);
    }
    return raw;
  }
  return spinEchoSignal(phantom, p.TR, p.TE);
}

