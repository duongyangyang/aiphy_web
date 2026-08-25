/**
 * mri-sim/phantom — Bước 1 của module MRI Simulator.
 *
 * Phantom ống nghiệm MRI: ống trụ Ø 1 cm, cao 3 cm, chứa agar gel + 4 ống
 * nhỏ Ø 0.32 cm (PETG) đựng 4 dung dịch khác nhau. Mỗi pixel mang
 * { tissueType, T1, T2, PD } để các bước sau tính tín hiệu MR.
 *
 * Bảng tham số (1.5T, giá trị giáo dục):
 *   - Agar 2%          : T1 ~ 1500 ms, T2 ~ 100 ms,  PD ~ 0.75
 *   - Nước cất          : T1 ~ 3000 ms, T2 ~ 2000 ms, PD ~ 1.00
 *   - CuSO₄ 0.01M       : T1 ~ 800  ms, T2 ~ 600 ms,  PD ~ 0.95
 *   - Dầu khoáng        : T1 ~ 200  ms, T2 ~ 180 ms,  PD ~ 0.90
 *   - MnCl₂ 0.001M      : T1 ~ 300  ms, T2 ~ 50 ms,   PD ~ 0.85
 *   - PETG (vách ống)   : PD = 0 → không phát tín hiệu.
 */

export type TissueType =
  | "agar"
  | "solution1"
  | "solution2"
  | "solution3"
  | "solution4"
  | "petg"
  | "background";

export interface TissueParams {
  T1: number; // ms
  T2: number; // ms
  PD: number; // 0..1, mật độ proton tương đối
  label: string; // nhãn tiếng Việt
}

/** Bảng tham số mô tại 1.5T. Nguồn sự thật cho mọi tính toán mô phỏng. */
export const TISSUE_PARAMS: Record<TissueType, TissueParams> = {
  agar:      { T1: 1500, T2: 100,  PD: 0.75, label: "Agar 2%" },
  solution1: { T1: 3000, T2: 2000, PD: 1.0,  label: "Nước cất" },
  solution2: { T1: 800,  T2: 600,  PD: 0.95, label: "CuSO₄ 0.01M" },
  solution3: { T1: 200,  T2: 180,  PD: 0.9,  label: "Dầu khoáng" },
  solution4: { T1: 300,  T2: 50,   PD: 0.85, label: "MnCl₂ 0.001M" },
  petg:      { T1: 0,    T2: 0,    PD: 0.0,  label: "PETG" },
  background:{ T1: 0,    T2: 0,    PD: 0.0,  label: "Nền" },
};

export interface PhantomCell {
  tissueType: TissueType;
  T1: number;
  T2: number;
  PD: number;
}

export type Phantom = PhantomCell[][]; // [row][col], row hướng xuống

export interface PhantomOptions {
  size?: number;
}

/**
 * generatePhantom — dựng phantom 2D (lát cắt ngang ống nghiệm).
 *
 * Bố cục:
 *   - Nền (air) bao quanh.
 *   - Ống trụ ngoài: vách PETG (1px) + lõi agar gel.
 *   - 4 ống nhỏ PETG xếp 2×2, mỗi ống chứa 1 dung dịch:
 *       solution1 (nước)     solution2 (CuSO₄)
 *       solution3 (dầu)      solution4 (MnCl₂)
 *
 * Không dùng Math.random() — bố cục hoàn toàn xác định.
 */
export function generatePhantom({ size = 128 }: PhantomOptions = {}): Phantom {
  const n = Math.max(8, Math.floor(size));
  const grid: Phantom = new Array(n);
  const cx = (n - 1) / 2;
  const cy = (n - 1) / 2;

  // Bán kính (tỉ lệ với size)
  const rOuter = n * 0.40;   // ống ngoài (Ø 1cm ~ 51px @ 128)
  const rInner = n * 0.065;  // ống nhỏ (Ø 0.32cm ~ 8px @ 128)
  const rWall  = n * 0.40;   // bán kính ngoài vách PETG (lớp ngoài cùng)
  const rAgar  = rOuter - 1; // vách PETG dày 1px

  // Tâm 4 ống nhỏ (2×2 grid, offset ±ratio, cách đều 4 đỉnh hình vuông)
  const off = n * 0.12;
  const tubes: { x: number; y: number; type: TissueType }[] = [
    { x: cx - off, y: cy - off, type: "solution1" },
    { x: cx + off, y: cy - off, type: "solution2" },
    { x: cx - off, y: cy + off, type: "solution3" },
    { x: cx + off, y: cy + off, type: "solution4" },
  ];

  for (let row = 0; row < n; row++) {
    const line: PhantomCell[] = new Array(n);
    for (let col = 0; col < n; col++) {
      const dx = col - cx;
      const dy = row - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let type: TissueType = "background";
      if (dist > rWall) {
        type = "background";
      } else if (dist > rAgar) {
        type = "petg"; // vách PETG ngoài
      } else {
        // Kiểm tra xem pixel có nằm trong ống nhỏ nào không
        let inTube = false;
        for (const tube of tubes) {
          const td = Math.hypot(col - tube.x, row - tube.y);
          if (td <= rInner) {
            type = tube.type;
            inTube = true;
            break;
          }
          // Vách PETG của ống nhỏ (dày 1px)
          if (td <= rInner + 1) {
            type = "petg";
            inTube = true;
            break;
          }
        }
        if (!inTube) type = "agar";
      }

      const p = TISSUE_PARAMS[type];
      line[col] = { tissueType: type, T1: p.T1, T2: p.T2, PD: p.PD };
    }
    grid[row] = line;
  }
  return grid;
}

/** Đếm số pixel theo từng loại mô. */
export function countTissues(phantom: Phantom): Record<TissueType, number> {
  const counts: Record<TissueType, number> = {
    agar: 0, solution1: 0, solution2: 0, solution3: 0, solution4: 0,
    petg: 0, background: 0,
  };
  for (const row of phantom) {
    for (const cell of row) counts[cell.tissueType] += 1;
  }
  return counts;
}

const PREVIEW_CHAR: Record<TissueType, string> = {
  agar:       "A",
  solution1:  "1",
  solution2:  "2",
  solution3:  "3",
  solution4:  "4",
  petg:       "·",
  background: "·",
};

/**
 * In ra console một bản xem trước ASCII (downsample về ~32×32) + thống kê
 * số pixel mỗi mô — để kiểm tra nhanh phantom không cần UI.
 */
export function testPhantom(size = 128): void {
  const phantom = generatePhantom({ size });
  const n = phantom.length;
  const counts = countTissues(phantom);

  // eslint-disable-next-line no-console
  console.log(`\n=== MRI Phantom ${n}×${n} ===`);
  // eslint-disable-next-line no-console
  console.log("Tham số mô (1.5T):");
  (Object.keys(TISSUE_PARAMS) as TissueType[]).forEach((t) => {
    const p = TISSUE_PARAMS[t];
    // eslint-disable-next-line no-console
    console.log(
      `  ${t.padEnd(10)} ${p.label.padEnd(14)} T1=${String(p.T1).padStart(5)} ms  T2=${String(p.T2).padStart(5)} ms  PD=${p.PD.toFixed(2)}`
    );
  });

  // eslint-disable-next-line no-console
  console.log("\nSố pixel mỗi mô:");
  (Object.keys(counts) as TissueType[]).forEach((t) => {
    // eslint-disable-next-line no-console
    console.log(`  ${t.padEnd(10)} ${counts[t].toString().padStart(6)}  (${((counts[t] / (n * n)) * 100).toFixed(1)}%)`);
  });

  // Bản xem trước ASCII 32×32 (lấy mẫu đều).
  const pv = 32;
  let preview = `\nBản xem trước ${pv}×${pv} (A=agar, 1-4=dung dịch, ·=nền/PETG):\n`;
  for (let r = 0; r < pv; r++) {
    const rr = Math.floor((r / (pv - 1)) * (n - 1));
    for (let c = 0; c < pv; c++) {
      const cc = Math.floor((c / (pv - 1)) * (n - 1));
      preview += PREVIEW_CHAR[phantom[rr][cc].tissueType];
    }
    preview += "\n";
  }
  // eslint-disable-next-line no-console
  console.log(preview);
}
