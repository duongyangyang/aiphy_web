/**
 * mri-sim/protocols — lớp TypeScript mỏng bọc JSON protocol.
 * `src/data/mriProtocols.json` là nguồn sự thật (theo yêu cầu spec). File này
 * cung cấp kiểu + helper để code dùng an toàn.
 */

import protocolsJson from "../data/mriProtocols.json";

export type SequenceType = "SE" | "IR";

export interface MriProtocolParams {
  TR: number; // ms
  TE: number; // ms
  TI: number | null; // ms (chỉ IR)
  flipAngle: number; // độ
  matrixSize: number; // số điểm k-space mỗi chiều
}

export interface MriProtocol {
  id: string;
  name: string;
  sequence: SequenceType;
  description: string;
  params: MriProtocolParams;
  ranges: {
    TR: [number, number, number]; // [min, max, step]
    TE: [number, number, number];
    TI?: [number, number, number];
    matrixSize: [number, number, number];
  };
}

const PROTOCOLS: MriProtocol[] = (protocolsJson.protocols as MriProtocol[]).map((p) => ({
  ...p,
  params: { ...p.params },
}));

export function getProtocols(): MriProtocol[] {
  return PROTOCOLS;
}

export function getProtocol(id: string): MriProtocol | undefined {
  return PROTOCOLS.find((p) => p.id === id);
}

/** Sinh danh sách matrix size rời rạc từ range (vd 64..256 step 64). */
export function matrixSizeOptions(p: MriProtocol): number[] {
  const [min, max, step] = p.ranges.matrixSize;
  const opts: number[] = [];
  for (let v = min; v <= max; v += step) opts.push(v);
  return opts;
}
