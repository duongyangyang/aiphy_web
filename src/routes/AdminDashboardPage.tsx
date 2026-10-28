import { useEffect, useMemo, useState } from "react";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { useT } from "../i18n/useT";
import { AdminCharts } from "../components/admin/AdminCharts";
import { AdminUserTable } from "../components/admin/AdminUserTable";
import { AdminUserDetail } from "../components/admin/AdminUserDetail";
import { formatDuration } from "../components/admin/duration";

/**
 * AdminDashboardPage — số liệu sử dụng thật cho nghiên cứu đánh giá hiệu quả.
 *
 * Toàn bộ số liệu tính từ bảng usage_sessions / lesson_progress / events.
 * Không có số liệu mô phỏng: dashboard rỗng khi chưa có người dùng thật, đó là
 * tín hiệu trung thực chứ không phải lỗi.
 */

export interface Overview {
  totals: {
    users: number;
    activeUsers: number;
    activeToday: number;
    activeWeek: number;
    totalSeconds: number;
    sessionCount: number;
    avgSessionSeconds: number;
    completedLessons: number;
    startedLessons: number;
    courseCompletion: number;
    totalLessons: number;
  };
  daily: { day: string; users: number; seconds: number }[];
  modules: { module: string; seconds: number }[];
  completionHistogram: { n: number; users: number }[];
}

export default function AdminDashboardPage() {
  const { t } = useT();

  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/admin/overview", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as Overview;
      })
      .then((data) => {
        if (cancelled) return;
        setOverview(data);
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError(t("admin.error.load"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t, refreshKey]);

  const stats = useMemo(() => {
    if (!overview) return [];
    const s = overview.totals;
    return [
      { label: t("admin.stat.users"), value: String(s.users), tone: "cyan" },
      { label: t("admin.stat.activeToday"), value: String(s.activeToday), tone: "green" },
      { label: t("admin.stat.totalHours"), value: formatDuration(s.totalSeconds, t, { short: true }), tone: "amber" },
      { label: t("admin.stat.avgSession"), value: formatDuration(s.avgSessionSeconds, t, { short: true }), tone: "violet" },
      {
        label: t("admin.stat.completion"),
        value: `${Math.round(s.courseCompletion * 100)}%`,
        tone: "cyan",
      },
    ];
  }, [overview, t]);

  return (
    <section
      className="container"
      style={{ padding: "var(--space-6) var(--space-5) var(--space-8)", display: "grid", gap: "var(--space-5)" }}
    >
      <header>
        <p className="eyebrow">{t("admin.eyebrow")}</p>
        <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", marginTop: "var(--space-2)", marginBottom: "var(--space-2)" }}>
          {t("admin.title")}
        </h1>
        <p className="muted" style={{ margin: 0, maxWidth: "65ch" }}>{t("admin.subtitle")}</p>
      </header>

      {loading && !overview && <Card><p className="muted" style={{ margin: 0 }}>{t("admin.loading")}</p></Card>}

      {error && (
        <Card>
          <p className="mono" style={{ color: "var(--color-danger-red)", margin: 0 }}>{error}</p>
        </Card>
      )}

      {overview && (
        <>
          {/* Hàng ô số liệu lớn */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "var(--space-3)",
            }}
          >
            {stats.map((s) => (
              <Card key={s.label} style={{ padding: "var(--space-4)" }}>
                <p className="mono" style={{ fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-faint)", margin: 0 }}>
                  {s.label}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.85rem",
                    fontWeight: 600,
                    margin: "var(--space-2) 0 0",
                    color: TONE_COLOR[s.tone] ?? "var(--color-paper)",
                  }}
                >
                  {s.value}
                </p>
              </Card>
            ))}
          </div>

          <AdminCharts overview={overview} />

          <Card style={{ padding: "var(--space-4)" }}>
            <p className="eyebrow" style={{ margin: 0 }}>{t("admin.export.title")}</p>
            <p className="muted" style={{ fontSize: "0.88rem", margin: "var(--space-1) 0 var(--space-3)" }}>
              {t("admin.export.hint")}
            </p>
            <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
              {(["users", "sessions", "lessons", "events"] as const).map((ds) => (
                <a
                  key={ds}
                  href={`/api/admin/export.csv?dataset=${ds}`}
                  className="mono"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    minHeight: 40,
                    padding: "8px 16px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-line-strong)",
                    color: "var(--color-paper)",
                    textDecoration: "none",
                    fontSize: "0.84rem",
                  }}
                >
                  ↓ {t(`admin.export.${ds}`)}
                </a>
              ))}
            </div>
          </Card>

          <AdminUserTable
            refreshKey={refreshKey}
            onOpenUser={(id, name) => setSelectedUser({ id, name })}
            onChanged={() => setRefreshKey((k) => k + 1)}
          />
        </>
      )}

      <Modal open={selectedUser !== null} onClose={() => setSelectedUser(null)} labelledBy="admin-detail-title">
        {selectedUser && (
          <AdminUserDetail
            userId={selectedUser.id}
            onClose={() => setSelectedUser(null)}
            onChanged={() => setRefreshKey((k) => k + 1)}
          />
        )}
      </Modal>
    </section>
  );
}

const TONE_COLOR: Record<string, string> = {
  cyan: "var(--color-proton-cyan)",
  green: "var(--color-success-green)",
  amber: "var(--color-field-amber)",
  violet: "var(--color-rf-violet)",
};
