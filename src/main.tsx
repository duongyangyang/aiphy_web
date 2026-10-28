import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ErrorBoundary } from "./components/layout/ErrorBoundary";
import { useAuthStore } from "./auth/store";
import "./styles/global.css";

/**
 * main — điểm vào của app.
 *
 * Khôi phục phiên đăng nhập từ cookie trước khi render lần đầu: `refresh()`
 * đặt `status` về "authed"/"anon", `RequireAuth` hiện spinner trong lúc chờ
 * nên không có nháy màn hình login.
 */

void useAuthStore.getState().refresh();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
