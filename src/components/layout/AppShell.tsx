import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { useUsageTracking } from "../../tracking/useUsageTracking";

/**
 * AppShell — khung trang dùng chung: Header + nội dung + Footer.
 *
 * Gắn `useUsageTracking` ở đây (không phải từng trang) để mọi route đều được
 * tính thời lượng và đổi trang không tạo phiên mới.
 */
export function AppShell({ children }: { children: ReactNode }) {
  useUsageTracking();

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      <main style={{ flex: 1, display: "block" }}>{children}</main>
      <Footer />
    </div>
  );
}
