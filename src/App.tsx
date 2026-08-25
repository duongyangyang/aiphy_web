import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import HomePage from "./routes/HomePage";
import Module1Page from "./routes/Module1Page";
import Module2Page from "./routes/Module2Page";
import SpinEchoView from "./mri-sim/SpinEchoView";
import KSpaceView from "./mri-sim/KSpaceView";
import AuthDemoPage from "./routes/AuthDemoPage";
import Module3Page from "./routes/Module3Page";
import Module4Page from "./routes/Module4Page";
import NotFoundPage from "./routes/NotFoundPage";
import { useLocaleStore } from "./i18n/store";
import { LOCALE_HTML_LANG } from "./i18n/types";

/**
 * App — đăng ký toàn bộ route của website học MRI.
 *
 * Cấu trúc route data-driven: route của từng module khớp với `id` trong
 * `src/data/modules.ts`. Khi thêm module mới, thêm record trong data rồi
 * thêm route tương ứng tại đây.
 */
export default function App() {
  const locale = useLocaleStore((s) => s.locale);

  // Đồng bộ <html lang> theo locale hiện tại (a11y / SEO).
  useEffect(() => {
    document.documentElement.lang = LOCALE_HTML_LANG[locale];
  }, [locale]);

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/module-1/*" element={<Module1Page />} />
        <Route path="/module-2/*" element={<Module2Page />} />
        <Route path="/mri-sim" element={<SpinEchoView />} />
        <Route path="/mri-sim/kspace" element={<KSpaceView />} />
        <Route path="/module-3" element={<Module3Page />} />
        <Route path="/module-4" element={<Module4Page />} />
        <Route path="/login" element={<AuthDemoPage mode="login" />} />
        <Route path="/register" element={<AuthDemoPage mode="register" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}
