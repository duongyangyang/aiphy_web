import { useMemo } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";
import { Card } from "../ui/Card";
import { CHART_COLORS } from "../charts/BaseLineChart";
import { useT } from "../../i18n/useT";
import { moduleLabel } from "./duration";
import type { Overview } from "../../routes/AdminDashboardPage";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

/**
 * AdminCharts — ba biểu đồ của dashboard quản trị.
 *
 * 1. Cột đôi 30 ngày: số người dùng hoạt động + số phút học.
 * 2. Vành khuyên: thời gian theo module.
 * 3. Cột: phân bố số bài đã hoàn thành.
 *
 * Tất cả vẽ từ dữ liệu thật trong `usage_sessions` / `lesson_progress`.
 */

const PALETTE = [
  "rgba(55,215,232,0.85)",
  "rgba(139,124,246,0.85)",
  "rgba(242,184,75,0.85)",
  "rgba(76,217,161,0.85)",
  "rgba(255,107,107,0.85)",
];

export function AdminCharts({ overview }: { overview: Overview }) {
  const { t } = useT();

  const dailyData = useMemo(
    () => ({
      labels: overview.daily.map((d) => d.day.slice(5)), // MM-DD
      datasets: [
        {
          label: t("admin.chart.usersAxis"),
          data: overview.daily.map((d) => d.users),
          backgroundColor: "rgba(55,215,232,0.75)",
          borderRadius: 3,
          yAxisID: "y",
        },
        {
          label: t("admin.chart.minutesAxis"),
          data: overview.daily.map((d) => Math.round(d.seconds / 60)),
          backgroundColor: "rgba(242,184,75,0.7)",
          borderRadius: 3,
          yAxisID: "y1",
        },
      ],
    }),
    [overview.daily, t],
  );

  const dailyOptions: ChartOptions<"bar"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { labels: { color: CHART_COLORS.muted, boxWidth: 12, boxHeight: 12 } },
      },
      scales: {
        x: { ticks: { color: CHART_COLORS.faint, maxTicksLimit: 10 }, grid: { color: CHART_COLORS.grid } },
        y: {
          position: "left",
          ticks: { color: CHART_COLORS.faint },
          grid: { color: CHART_COLORS.grid },
          title: { display: true, text: t("admin.chart.usersAxis"), color: CHART_COLORS.muted },
        },
        y1: {
          position: "right",
          ticks: { color: CHART_COLORS.faint },
          grid: { drawOnChartArea: false },
          title: { display: true, text: t("admin.chart.minutesAxis"), color: CHART_COLORS.muted },
        },
      },
    }),
    [t],
  );

  const moduleData = useMemo(() => {
    const filtered = overview.modules.filter((m) => m.seconds > 0);
    return {
      labels: filtered.map((m) => moduleLabel(m.module)),
      datasets: [
        {
          data: filtered.map((m) => Math.round(m.seconds / 60)),
          backgroundColor: filtered.map((_, i) => PALETTE[i % PALETTE.length]),
          borderColor: "rgba(7,17,31,0.9)",
          borderWidth: 2,
        },
      ],
    };
  }, [overview.modules]);

  const completionData = useMemo(() => {
    const total = overview.totals.totalLessons;
    const counts = new Map(overview.completionHistogram.map((r) => [r.n, r.users]));
    const labels = Array.from({ length: total + 1 }, (_, i) => String(i));
    return {
      labels,
      datasets: [
        {
          label: t("admin.chart.usersAxis"),
          data: labels.map((n) => counts.get(Number(n)) ?? 0),
          backgroundColor: labels.map((_, i) =>
            i === total ? "rgba(76,217,161,0.85)" : "rgba(55,215,232,0.55)",
          ),
          borderRadius: 3,
        },
      ],
    };
  }, [overview.completionHistogram, overview.totals.totalLessons, t]);

  const simpleOptions: ChartOptions<"bar"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: CHART_COLORS.faint }, grid: { display: false } },
        y: { ticks: { color: CHART_COLORS.faint, precision: 0 }, grid: { color: CHART_COLORS.grid } },
      },
    }),
    [],
  );

  const doughnutOptions: ChartOptions<"doughnut"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { position: "bottom", labels: { color: CHART_COLORS.muted, boxWidth: 12, boxHeight: 12 } },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.parsed} ${t("admin.chart.minutesAxis").toLowerCase()}`,
          },
        },
      },
    }),
    [t],
  );

  const hasModuleData = overview.modules.some((m) => m.seconds > 0);

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <Card style={{ padding: "var(--space-4)" }}>
        <p className="eyebrow" style={{ margin: 0 }}>{t("admin.chart.daily")}</p>
        <p className="muted" style={{ fontSize: "0.84rem", margin: "var(--space-1) 0 var(--space-3)" }}>
          {t("admin.chart.dailyHint")}
        </p>
        <div style={{ height: 260 }}>
          <Bar data={dailyData} options={dailyOptions} aria-label={t("admin.chart.daily")} />
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--space-4)" }}>
        <Card style={{ padding: "var(--space-4)" }}>
          <p className="eyebrow" style={{ margin: 0 }}>{t("admin.chart.modules")}</p>
          <p className="muted" style={{ fontSize: "0.84rem", margin: "var(--space-1) 0 var(--space-3)" }}>
            {t("admin.chart.modulesHint")}
          </p>
          {hasModuleData ? (
            <div style={{ height: 240 }}>
              <Doughnut data={moduleData} options={doughnutOptions} aria-label={t("admin.chart.modules")} />
            </div>
          ) : (
            <p className="mono" style={{ fontSize: "0.8rem", color: "var(--color-faint)" }}>
              {t("admin.detail.noData")}
            </p>
          )}
        </Card>

        <Card style={{ padding: "var(--space-4)" }}>
          <p className="eyebrow" style={{ margin: 0 }}>{t("admin.chart.completion")}</p>
          <p className="muted" style={{ fontSize: "0.84rem", margin: "var(--space-1) 0 var(--space-3)" }}>
            {t("admin.chart.completionHint")}
          </p>
          <div style={{ height: 240 }}>
            <Bar data={completionData} options={simpleOptions} aria-label={t("admin.chart.completion")} />
          </div>
        </Card>
      </div>
    </div>
  );
}
