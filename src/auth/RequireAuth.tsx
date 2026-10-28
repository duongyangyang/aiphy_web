import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "./store";
import { LoadingSpinner } from "../components/learning/LoadingSpinner";

/**
 * RequireAuth — chặn mọi route khi chưa đăng nhập.
 *
 * Đang hỏi server (lần tải đầu): hiện spinner thay vì nháy sang /login rồi quay
 * lại. Chưa đăng nhập: chuyển về /login kèm `from` để đăng nhập xong quay lại
 * đúng trang người dùng định vào.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status === "loading") {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (status === "anon") {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <>{children}</>;
}

/** RequireAdmin — như RequireAuth nhưng chỉ cho vai trò admin. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (status === "loading") {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (status === "anon") {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
