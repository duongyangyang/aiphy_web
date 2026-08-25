/**
 * softPulse — Bài 6: xác định góc lật xung mềm.
 *
 * Bao hình sinc: Envelope(t) = RFA · sin(πt)/(πt).
 * Phổ (Fourier của sinc) = hình chữ nhật trong miền tần số, dải hẹp.
 */

export interface EnvelopePoint {
  tUs: number;
  amplitude: number;
}

export interface SpectrumPoint {
  freqHz: number;
  intensity: number;
}

/**
 * Bao sinc trong thời gian. Tránh chia 0 tại t=0 (lim = 1).
 */
export function sincEnvelope(rfaPercent: number, durationUs = 10, count = 200): EnvelopePoint[] {
  const rfa = rfaPercent / 100;
  const points: EnvelopePoint[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const tUs = -durationUs + (i / (count - 1)) * 2 * durationUs;
    const x = Math.PI * tUs * 0.6; // scaled
    const sinc = x === 0 ? 1 : Math.sin(x) / x;
    points[i] = { tUs, amplitude: rfa * sinc };
  }
  return points;
}

/**
 * Phổ xung mềm = hình chữ nhật hẹp (Fourier của sinc).
 * Băng thông tỷ lệ nghịch với độ rộng xung; RFA ảnh hưởng biên độ.
 * Đơn giản: rect từ -BW/2 đến +BW/2, nhân RFA.
 */
export function softPulseSpectrum(rfaPercent: number, freqRangeHz = 500, count = 200): SpectrumPoint[] {
  const rfa = rfaPercent / 100;
  const bwHz = 40; // dải hẹp đặc trưng cho xung mềm
  const points: SpectrumPoint[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const f = -freqRangeHz + (i / (count - 1)) * 2 * freqRangeHz;
    const inside = Math.abs(f) <= bwHz / 2 ? 1 : 0;
    // Làm mềm rìa bằng một chút dốc.
    const edge = Math.exp(-Math.pow((Math.abs(f) - bwHz / 2) / 8, 2));
    const intensity = inside ? rfa : rfa * edge * 0.3;
    points[i] = { freqHz: f, intensity };
  }
  return points;
}
