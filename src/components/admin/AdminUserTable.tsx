import { useCallback, useEffect, useState } from "react";
import { Card } from "../ui/Card";
import { useT } from "../../i18n/useT";
import { formatDateTime } from "../../i18n/format";
import { formatDuration } from "./duration";

/**
 * AdminUserTable — danh sách người dùng kèm tổng thời gian, số bài đã xong.
 *
 * Có tìm kiếm (debounce 300ms), sắp xếp theo cột, phân trang, và thao tác
 * vô hiệu hoá / đặt lại mật khẩu. Mọi thay đổi gọi `onChanged` để dashboard
 * tải lại số liệu tổng quan.
 */

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  createdAt: string;
  lastLoginAt: string | null;
  lastSeenAt: string | null;
  isActive: boolean;
  totalSeconds: number;
  completedLessons: number;
  startedLessons: number;
}

interface UsersResponse {
  users: AdminUser[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

type SortKey = "name" | "email" | "created" | "lastLogin" | "totalSeconds" | "completed";

export function AdminUserTable({
  refreshKey,
  onOpenUser,
  onChanged,
}: {
  refreshKey: number;
  onOpenUser: (id: string, name: string) => void;
  onChanged: () => void;
}) {
  const { t, locale } = useT();

  const [data, setData] = useState<UsersResponse | null>(null);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sort, setSort] = useState<SortKey>("created");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [tempPassword, setTempPassword] = useState<{ name: string; password: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounce ô tìm kiếm để không gọi API mỗi lần gõ phím.
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query.trim()), 300);
    return () => window.clearTimeout(id);
  }, [query]);

  // Đổi bộ lọc thì quay về trang 1.
  useEffect(() => {
    setPage(1);
  }, [debounced, sort, dir]);

  const load = useCallback(async () => {
    const params = new URLSearchParams({
      q: debounced,
      sort,
      dir,
      page: String(page),
      perPage: "25",
    });
    try {
      const res = await fetch(`/api/admin/users?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData((await res.json()) as UsersResponse);
      setError(null);
    } catch {
      setError(t("admin.error.load"));
    }
  }, [debounced, sort, dir, page, t]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const toggleActive = async (user: AdminUser) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? t("admin.error.load"));
        return;
      }
      await load();
      onChanged();
    } catch {
      setError(t("admin.error.load"));
    }
  };

  const resetPassword = async (user: AdminUser) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? t("admin.error.load"));
        return;
      }
      const body = (await res.json()) as { tempPassword: string };
      setTempPassword({ name: user.name, password: body.tempPassword });
      await load();
    } catch {
      setError(t("admin.error.load"));
    }
  };

  const header = (key: SortKey, label: string, align?: "right") => (
    <th
      style={{
        textAlign: align ?? "left",
        padding: "8px 10px",
        fontFamily: "var(--font-data)",
        fontSize: "0.7rem",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: sort === key ? "var(--color-proton-cyan)" : "var(--color-faint)",
        fontWeight: 500,
        borderBottom: "1px solid var(--color-line-strong)",
        whiteSpace: "nowrap",
        cursor: "pointer",
        userSelect: "none",
      }}
      onClick={() => {
        if (sort === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
        else {
          setSort(key);
          setDir(key === "name" || key === "email" ? "asc" : "desc");
        }
      }}
    >
      {label}
      {sort === key && <span aria-hidden> {dir === "asc" ? "↑" : "↓"}</span>}
    </th>
  );

  return (
    <Card style={{ padding: "var(--space-4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <p className="eyebrow" style={{ margin: 0 }}>{t("admin.users.title")}</p>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("admin.users.search")}
          style={{
            minHeight: 40,
            minWidth: 240,
            padding: "8px 12px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--color-line-strong)",
            background: "var(--color-bore-2)",
            color: "var(--color-paper)",
            fontFamily: "var(--font-body)",
            fontSize: "0.86rem",
          }}
        />
      </div>

      {error && (
        <p className="mono" role="alert" style={{ color: "var(--color-danger-red)", fontSize: "0.8rem", marginTop: "var(--space-3)" }}>
          {error}
        </p>
      )}

      {tempPassword && (
        <div
          style={{
            marginTop: "var(--space-3)",
            padding: "var(--space-3)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid rgba(242,184,75,0.4)",
            background: "rgba(242,184,75,0.08)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            flexWrap: "wrap",
          }}
        >
          <span className="mono" style={{ fontSize: "0.78rem", color: "var(--color-field-amber)" }}>
            {tempPassword.name} — {t("admin.users.tempPassword")}
          </span>
          <code
            style={{
              fontFamily: "var(--font-data)",
              fontSize: "0.95rem",
              color: "var(--color-paper)",
              background: "rgba(0,0,0,0.3)",
              padding: "4px 10px",
              borderRadius: 6,
            }}
          >
            {tempPassword.password}
          </code>
          <button
            type="button"
            onClick={() => setTempPassword(null)}
            className="mono"
            style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--color-muted)", cursor: "pointer", fontSize: "0.78rem" }}
          >
            ✕
          </button>
        </div>
      )}

      <div style={{ overflowX: "auto", marginTop: "var(--space-3)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
          <thead>
            <tr>
              {header("name", t("admin.users.col.name"))}
              {header("email", t("admin.users.col.email"))}
              {header("totalSeconds", t("admin.users.col.time"), "right")}
              {header("completed", t("admin.users.col.lessons"), "right")}
              {header("lastLogin", t("admin.users.col.lastSeen"))}
              <th style={{ padding: "8px 10px", borderBottom: "1px solid var(--color-line-strong)" }} />
            </tr>
          </thead>
          <tbody>
            {data?.users.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid var(--color-line)" }}>
                <td style={{ padding: "10px" }}>
                  <button
                    type="button"
                    onClick={() => onOpenUser(u.id, u.name)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      color: "var(--color-paper)",
                      fontFamily: "inherit",
                      fontSize: "inherit",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    {u.name}
                    {u.role === "admin" && (
                      <span
                        className="mono"
                        style={{
                          marginLeft: 8,
                          fontSize: "0.62rem",
                          color: "var(--color-field-amber)",
                          border: "1px solid rgba(242,184,75,0.4)",
                          borderRadius: 999,
                          padding: "1px 6px",
                        }}
                      >
                        {t("admin.users.roleAdmin")}
                      </span>
                    )}
                    {!u.isActive && (
                      <span className="mono" style={{ marginLeft: 8, fontSize: "0.62rem", color: "var(--color-danger-red)" }}>
                        {t("admin.users.inactive")}
                      </span>
                    )}
                  </button>
                </td>
                <td className="mono" style={{ padding: "10px", fontSize: "0.78rem", color: "var(--color-muted)" }}>
                  {u.email}
                </td>
                <td className="mono" style={{ padding: "10px", textAlign: "right", color: "var(--color-proton-cyan)" }}>
                  {formatDuration(u.totalSeconds, t)}
                </td>
                <td className="mono" style={{ padding: "10px", textAlign: "right", color: "var(--color-muted)" }}>
                  {u.completedLessons}
                </td>
                <td className="mono" style={{ padding: "10px", fontSize: "0.76rem", color: "var(--color-faint)" }}>
                  {u.lastSeenAt ? formatDateTime(u.lastSeenAt, locale) : "—"}
                </td>
                <td style={{ padding: "10px", whiteSpace: "nowrap", textAlign: "right" }}>
                  <button
                    type="button"
                    onClick={() => void resetPassword(u)}
                    className="mono"
                    style={actionBtn}
                  >
                    {t("admin.users.resetPassword")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleActive(u)}
                    className="mono"
                    style={{ ...actionBtn, color: u.isActive ? "var(--color-danger-red)" : "var(--color-success-green)" }}
                  >
                    {u.isActive ? t("admin.users.disable") : t("admin.users.enable")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data && data.users.length === 0 && (
          <p className="mono" style={{ fontSize: "0.82rem", color: "var(--color-faint)", padding: "var(--space-3) 0" }}>
            {t("admin.users.empty")}
          </p>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
          <button
            type="button"
            className="mono"
            style={actionBtn}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← {t("admin.users.prev")}
          </button>
          <span className="mono" style={{ fontSize: "0.78rem", color: "var(--color-faint)" }}>
            {t("admin.users.page", { page: data.page, total: data.totalPages })} · {data.total}
          </span>
          <button
            type="button"
            className="mono"
            style={actionBtn}
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("admin.users.next")} →
          </button>
        </div>
      )}
    </Card>
  );
}

const actionBtn: React.CSSProperties = {
  background: "none",
  border: "1px solid var(--color-line)",
  borderRadius: "var(--radius-sm)",
  color: "var(--color-muted)",
  padding: "4px 10px",
  fontSize: "0.72rem",
  fontFamily: "var(--font-data)",
  cursor: "pointer",
  marginLeft: 6,
};
