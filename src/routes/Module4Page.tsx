import { Routes, Route } from "react-router-dom";
import { ModuleIntroPage } from "../components/learning/ModuleIntroPage";
import Module4Lab from "./Module4Lab";

/**
 * Module4Page — Nghiên cứu MRI Super Resolution.
 *
 *   /module-4      → trang giới thiệu (dùng chung ModuleIntroPage)
 *   /module-4/lab  → phòng thí nghiệm: tải ảnh, chạy CHARMS-Lite, xem bản đồ bất định
 */
export default function Module4Page() {
  return (
    <Routes>
      <Route index element={<ModuleIntroPage moduleId="module-4" ctaTo="/module-4/lab" />} />
      <Route path="lab" element={<Module4Lab />} />
      <Route path="*" element={<ModuleIntroPage moduleId="module-4" ctaTo="/module-4/lab" />} />
    </Routes>
  );
}
