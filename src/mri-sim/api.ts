/**
 * mri-sim/api — client fetch cho scan records (Module 2).
 * Gọi qua proxy Vite `/api/*` → :8787 trong dev.
 */

export interface ScanRecordInput {
  protocolId: string;
  protocolName: string;
  sequence: string;
  params: {
    TR: number;
    TE: number;
    TI: number | null;
    flipAngle: number;
    matrixSize: number;
  };
  groundTruth: number[][];
  result: number[][];
}

export interface ScanSummary {
  id: string;
  protocolId: string;
  protocolName: string;
  sequence: string;
  params: Record<string, number | null>;
  savedAt: string;
}

export interface ScanRecord extends ScanRecordInput {
  id: string;
  savedAt: string;
}

export async function saveScan(record: ScanRecordInput): Promise<{ id: string; savedAt: string }> {
  const res = await fetch("/api/scans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error(`Lưu ca chụp thất bại (HTTP ${res.status})`);
  return res.json();
}

export async function getScan(id: string): Promise<ScanRecord> {
  const res = await fetch(`/api/scans/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Không lấy được ca chụp (HTTP ${res.status})`);
  return res.json();
}

export async function listScans(): Promise<ScanSummary[]> {
  const res = await fetch("/api/scans");
  if (!res.ok) throw new Error(`Không lấy được danh sách ca chụp (HTTP ${res.status})`);
  return res.json();
}
