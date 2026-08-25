/**
 * weighting — Bài 9: ảnh trọng số T1WI / T2WI / PDWI.
 *
 * Công thức chuẩn (khớp Phụ lục A, Bài 9):
 *   S ∝ ρ(H)·[1 - exp(-TR/T1)]·exp(-TE/T2)
 *
 * Defaults từ tài liệu: dầu T1/T2 ngắn; nước T1/T2 dài.
 */

import type { MriSample } from "../components/charts/MriImageCanvas";
import type { LocalizedString } from "../i18n/types";

export type Weighting = "T1WI" | "T2WI" | "PDWI";

export interface TissueParams {
  name: LocalizedString;
  t1Ms: number;
  t2Ms: number;
  rho: number; // mật độ proton tương đối
}

export const TISSUES = {
  oil: {
    name: { vi: "Dầu", en: "Oil", zh: "脂肪" },
    t1Ms: 150,
    t2Ms: 90,
    rho: 0.8,
  },
  water: {
    name: { vi: "Nước", en: "Water", zh: "水" },
    t1Ms: 2500,
    t2Ms: 1200,
    rho: 1.0,
  },
} as const;

/**
 * Cường độ tín hiệu chuẩn hóa [0..1] theo TR/TE và mô.
 */
export function signalIntensity(tr: number, te: number, t: TissueParams): number {
  const t1Part = 1 - Math.exp(-tr / t.t1Ms);
  const t2Part = Math.exp(-te / t.t2Ms);
  return t.rho * t1Part * t2Part;
}

/**
 * Phân loại trọng số ảnh theo vùng TR/TE (đơn giản giáo dục):
 *   - TR ngắn & TE ngắn → T1WI
 *   - TR dài & TE dài   → T2WI
 *   - TR dài & TE ngắn  → PDWI
 */
export function classifyWeighting(tr: number, te: number): Weighting {
  const trLong = tr >= 1500;
  const teLong = te >= 60;
  if (!trLong && !teLong) return "T1WI";
  if (trLong && teLong) return "T2WI";
  return "PDWI";
}

/**
 * Hai mẫu cạnh nhau (dầu + nước), brightness thay đổi theo TR/TE.
 */
export function weightingSamples(tr: number, te: number): MriSample[] {
  return [
    {
      kind: "oil",
      cx: 0.3,
      cy: 0.5,
      radius: 0.32,
      brightness: signalIntensity(tr, te, TISSUES.oil),
      label: { vi: "Dầu", en: "Oil", zh: "脂肪" },
    },
    {
      kind: "water",
      cx: 0.7,
      cy: 0.5,
      radius: 0.32,
      brightness: signalIntensity(tr, te, TISSUES.water),
      label: { vi: "Nước", en: "Water", zh: "水" },
    },
  ];
}
