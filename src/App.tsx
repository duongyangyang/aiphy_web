import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { RequireAdmin, RequireAuth } from "./auth/RequireAuth";
import HomePage from "./routes/HomePage";
import Module1Page from "./routes/Module1Page";
import Module2Page from "./routes/Module2Page";
import SpinEchoView from "./mri-sim/SpinEchoView";
import KSpaceView from "./mri-sim/KSpaceView";
import AuthPage from "./routes/AuthPage";
import Module3Page from "./routes/Module3Page";
import Module4Page from "./routes/Module4Page";
import AdminDashboardPage from "./routes/AdminDashboardPage";
import NotFoundPage from "./routes/NotFoundPage";
import { useLocaleStore } from "./i18n/store";
import { LOCALE_HTML_LANG } from "./i18n/types";

/**
 * App — đăng ký toàn bộ route của website học MRI.
 *
 * Toàn bộ route (trừ /login và /register) nằm sau `RequireAuth`: hệ thống yêu
 * cầu đăng nhập để mọi số liệu nghiên cứu đều gắn với một người dùng xác định.
 * /admin nằm sau `RequireAdmin`.
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
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />

        {/* Trang chủ công khai: người chưa có tài khoản vẫn xem được giới thiệu
            và liên hệ; vào module mới cần đăng nhập. */}
        <Route path="/" element={<HomePage />} />
        <Route
          path="/module-1/*"
          element={
            <RequireAuth>
              <Module1Page />
            </RequireAuth>
          }
        />
        <Route
          path="/module-2/*"
          element={
            <RequireAuth>
              <Module2Page />
            </RequireAuth>
          }
        />
        <Route
          path="/mri-sim"
          element={
            <RequireAuth>
              <SpinEchoView />
            </RequireAuth>
          }
        />
        <Route
          path="/mri-sim/kspace"
          element={
            <RequireAuth>
              <KSpaceView />
            </RequireAuth>
          }
        />
        <Route
          path="/module-3/*"
          element={
            <RequireAuth>
              <Module3Page />
            </RequireAuth>
          }
        />
        <Route
          path="/module-4/*"
          element={
            <RequireAuth>
              <Module4Page />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminDashboardPage />
            </RequireAdmin>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}
