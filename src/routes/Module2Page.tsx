import { Routes, Route } from "react-router-dom";
import { Module2Shell } from "./module2/Module2Shell";
import { ModuleIntroPage } from "../components/learning/ModuleIntroPage";

const SIM_PATH = "/module-2/simulator";

/**
 * Module2Page — MRI Simulator.
 *
 * Routing lồng:
 *   /module-2            → trang giới thiệu (dùng chung ModuleIntroPage)
 *   /module-2/simulator  → Module2Shell (luồng 5 bước)
 *
 * Luồng 5 bước mô phỏng phần mềm NMR thật: Prescan → Scout → Scan setup →
 * Scan → Image processing. Toàn bộ trạng thái nằm trong `useModule2Store`
 * (Zustand) và không lưu qua lần tải trang — mỗi ca chụp bắt đầu lại từ đầu.
 */
export default function Module2Page() {
  return (
    <Routes>
      <Route index element={<ModuleIntroPage moduleId="module-2" ctaTo={SIM_PATH} />} />
      <Route path="simulator" element={<Module2Shell />} />
      <Route path="*" element={<ModuleIntroPage moduleId="module-2" ctaTo={SIM_PATH} />} />
    </Routes>
  );
}
