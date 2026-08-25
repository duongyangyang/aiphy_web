import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

/**
 * AppShell — khung trang dùng chung: Header + nội dung + Footer.
 * Giữ padding dọc cho main để mọi route dùng chung nhịp độ.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      <main style={{ flex: 1, display: "block" }}>{children}</main>
      <Footer />
    </div>
  );
}
