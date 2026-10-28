import { Routes, Route } from "react-router-dom";
import { ModuleIntroPage } from "../components/learning/ModuleIntroPage";
import Module3Lab from "./Module3Lab";

/**
 * Module3Page — Dự đoán tham số MRI gần tối ưu.
 *
 *   /module-3      → trang giới thiệu (dùng chung ModuleIntroPage)
 *   /module-3/lab  → phòng thí nghiệm: tải ảnh, chạy mô hình, xem heatmap
 */
export default function Module3Page() {
  return (
    <Routes>
      <Route index element={<ModuleIntroPage moduleId="module-3" ctaTo="/module-3/lab" />} />
      <Route path="lab" element={<Module3Lab />} />
      <Route path="*" element={<ModuleIntroPage moduleId="module-3" ctaTo="/module-3/lab" />} />
    </Routes>
  );
}
