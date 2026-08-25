/**
 * mri-sim/fft — biến đổi Fourier 2D (Cooley–Tukey, radix-2, thuận + nghịch).
 *
 * Hoạt động trên mảng phẳng Float64Array độ dài N·N (N là lũy thừa 2), với
 * chỉ số `r·N + c`. Dùng cho module k-space: FFT thuận ảnh → k-space, đảo
 * mask, FFT nghịch → ảnh tái tạo.
 *
 * Tự viết (không phụ thuộc thư viện ngoài) để giữ module nhỏ và chạy client.
 */

/** FFT 1D in-place trên cặp (re, im) độ dài n = 2^k. */
export function fft1d(re: Float64Array, im: Float64Array, inverse: boolean): void {
  const n = re.length;
  if (n <= 1) return;

  // Bit-reversal permutation.
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i]; re[i] = re[j]; re[j] = tr;
      const ti = im[i]; im[i] = im[j]; im[j] = ti;
    }
  }

  // Butterfly.
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (inverse ? 2 : -2) * Math.PI / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    const half = len >> 1;
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < half; k++) {
        const a = i + k;
        const b = a + half;
        const xr = re[b] * cr - im[b] * ci;
        const xi = re[b] * ci + im[b] * cr;
        re[b] = re[a] - xr;
        im[b] = im[a] - xi;
        re[a] += xr;
        im[a] += xi;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = ncr;
      }
    }
  }

  if (inverse) {
    for (let i = 0; i < n; i++) {
      re[i] /= n;
      im[i] /= n;
    }
  }
}

/** FFT 2D in-place trên (re, im) phẳng N·N. */
export function fft2d(re: Float64Array, im: Float64Array, n: number, inverse: boolean): void {
  const rowRe = new Float64Array(n);
  const rowIm = new Float64Array(n);
  // Hàng.
  for (let r = 0; r < n; r++) {
    const base = r * n;
    for (let c = 0; c < n; c++) {
      rowRe[c] = re[base + c];
      rowIm[c] = im[base + c];
    }
    fft1d(rowRe, rowIm, inverse);
    for (let c = 0; c < n; c++) {
      re[base + c] = rowRe[c];
      im[base + c] = rowIm[c];
    }
  }
  // Cột.
  const colRe = new Float64Array(n);
  const colIm = new Float64Array(n);
  for (let c = 0; c < n; c++) {
    for (let r = 0; r < n; r++) {
      colRe[r] = re[r * n + c];
      colIm[r] = im[r * n + c];
    }
    fft1d(colRe, colIm, inverse);
    for (let r = 0; r < n; r++) {
      re[r * n + c] = colRe[r];
      im[r * n + c] = colIm[r];
    }
  }
}

/**
 * fftshift — dịch tâm: DC về giữa, để hiển thị và mask k-space theo tọa độ
 * "tâm = tần số thấp, biên = tần số cao". Trả về mảng mới.
 */
export function fftshiftFlat(src: Float64Array, n: number): Float64Array {
  const out = new Float64Array(n * n);
  const h = n >> 1;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const sr = (r + h) % n;
      const sc = (c + h) % n;
      out[sr * n + sc] = src[r * n + c];
    }
  }
  return out;
}

/** Ngược của fftshift. */
export function ifftshiftFlat(src: Float64Array, n: number): Float64Array {
  const out = new Float64Array(n * n);
  const h = n >> 1;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const dr = (r + h) % n;
      const dc = (c + h) % n;
      out[dr * n + dc] = src[r * n + c];
    }
  }
  return out;
}

/**
 * Tính biên độ log để hiển thị k-space: log(1 + |F|), chuẩn hoá về [0,1].
 * Càng sáng = năng lượng càng cao (thường tập trung ở tâm).
 */
export function kspaceMagnitude(re: Float64Array, im: Float64Array, n: number): Float64Array {
  const mag = new Float64Array(n * n);
  let maxLog = 0;
  for (let i = 0; i < n * n; i++) {
    const m = Math.hypot(re[i], im[i]);
    const lm = Math.log(1 + m);
    mag[i] = lm;
    if (lm > maxLog) maxLog = lm;
  }
  if (maxLog > 0) {
    for (let i = 0; i < n * n; i++) mag[i] /= maxLog;
  }
  return mag;
}
