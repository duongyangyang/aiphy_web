import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { useT } from "../../i18n/useT";
import { formatDateTime } from "../../i18n/format";
import { formatDuration, moduleLabel } from "./duration";

/**
 * AdminUserDetail — chi tiết một người dùng trong modal.
 *
 * Bốn khối: tiến độ 11 bài Module 1, phiên gần đây (thời lượng từng phiên),
 * thời gian theo module, và các sự kiện Module 2/3/4 gần nhất.
 */

interface Detail {
  user: {
    id: string;
    email: string;
    name: string;
    role: "user" | "admin";
    createdAt: string;
    lastLoginAt: string | null;
    isActive: boolean;
  };
  lessons: { lessonId: string; startedAt: string | null; completedAt: string | null }[];
  sessions: {
    id: string;
    openedAt: string;
    lastSeenAt: string;
    closedAt: string | null;
    durationSeconds: number;
    beats: number;
  }[];
  moduleTime: { module: string; seconds: number }[];
  events: { kind: string; module: string | null; payload: unknown; createdAt: string }[];
}

export function AdminUserDetail({
  userId,
  onClose,
  onChanged,
}: {
  userId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { t, locale } = useT();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/users/${userId}`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as Detail;
      })
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch(() => {
        if (!cancelled) setError(t("admin.error.load"));
      });
    return () => {
      cancelled = true;
    };
  }, [userId, t]);

  const toggleRole = async () => {
    if (!detail) return;
    const nextRole = detail.user.role === "admin" ? "user" : "admin";
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    });
    if (res.ok) {
      setDetail({ ...detail, user: { ...detail.user, role: nextRole } });
      onChanged();
    } else {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? t("admin.error.load"));
    }
  };

  return (
    <>
      <h2 id="admin-detail-title" style={{ fontSize: "1.3rem", margin: 0 }}>
        {t("admin.detail.title")}
      </h2>

      {error && (
        <p className="mono" style={{ color: "var(--color-danger-red)", fontSize: "0.8rem" }}>{error}</p>
      )}

      {!detail && !error && (
        <p className="muted">{t("admin.loading")}</p>
      )}

      {detail && (
        <div style={{ display: "grid", gap: "var(--space-4)", marginTop: "var(--space-3)" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600 }}>{detail.user.name}</p>
            <p className="mono" style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-muted)" }}>
              {detail.user.email} · {detail.user.role === "admin" ? t("admin.users.roleAdmin") : t("admin.users.roleUser")}
              {!detail.user.isActive && ` · ${t("admin.users.inactive")}`}
            </p>
            <p className="mono" style={{ margin: 0, fontSize: "0.72rem", color: "var(--color-faint)" }}>
              {formatDateTime(detail.user.createdAt, locale)}
              {detail.user.lastLoginAt && ` · ${formatDateTime(detail.user.lastLoginAt, locale)}`}
            </p>
          </div>

          <Section title={t("admin.detail.modules")}>
            {detail.moduleTime.length === 0 ? (
              <Empty />
            ) : (
              <div style={{ display: "grid", gap: 4 }}>
                {detail.moduleTime.map((m) => (
                  <Row key={m.module} k={moduleLabel(m.module)} v={formatDuration(m.seconds, t)} />
                ))}
              </div>
            )}
          </Section>

          <Section title={t("admin.detail.lessons")}>
            {detail.lessons.length === 0 ? (
              <Empty />
            ) : (
              <div style={{ display: "grid", gap: 4, maxHeight: 200, overflowY: "auto" }}>
                {detail.lessons.map((l) => (
                  <Row
                    key={l.lessonId}
                    k={l.lessonId}
                    v={
                      l.completedAt
                        ? `✓ ${formatDateTime(l.completedAt, locale)}`
                        : `… ${formatDateTime(l.startedAt ?? "", locale)}`
                    }
                    tone={l.completedAt ? "success" : "muted"}
                  />
                ))}
              </div>
            )}
          </Section>

          <Section title={t("admin.detail.sessions")}>
            {detail.sessions.length === 0 ? (
              <Empty />
            ) : (
              <div style={{ display: "grid", gap: 4, maxHeight: 200, overflowY: "auto" }}>
                {detail.sessions.map((s) => (
                  <Row
                    key={s.id}
                    k={formatDateTime(s.openedAt, locale)}
                    v={`${formatDuration(s.durationSeconds, t)} · ${s.beats} ♥`}
                  />
                ))}
              </div>
            )}
          </Section>

          <Section title={t("admin.detail.events")}>
            {detail.events.length === 0 ? (
              <Empty />
            ) : (
              <div style={{ display: "grid", gap: 4, maxHeight: 200, overflowY: "auto" }}>
                {detail.events.map((e, i) => (
                  <Row
                    key={i}
                    k={`${e.kind}${e.module ? ` · ${e.module}` : ""}`}
                    v={formatDateTime(e.createdAt, locale)}
                  />
                ))}
              </div>
            )}
          </Section>

          <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="secondary" size="sm" onClick={() => void toggleRole()}>
              {detail.user.role === "admin" ? `→ ${t("admin.users.roleUser")}` : `→ ${t("admin.users.roleAdmin")}`}
            </Button>
            <Button variant="secondary" size="sm" onClick={onClose}>
              {t("admin.detail.close")}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow" style={{ margin: "0 0 var(--space-2)" }}>{title}</p>
      {children}
    </div>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: "success" | "muted" }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)", fontFamily: "var(--font-data)", fontSize: "0.76rem" }}>
      <span style={{ color: "var(--color-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k}</span>
      <span
        style={{
          color:
            tone === "success"
              ? "var(--color-success-green)"
              : tone === "muted"
                ? "var(--color-faint)"
                : "var(--color-paper)",
          whiteSpace: "nowrap",
        }}
      >
        {v}
      </span>
    </div>
  );
}

function Empty() {
  const { t } = useT();
  return (
    <p className="mono" style={{ margin: 0, fontSize: "0.76rem", color: "var(--color-faint)" }}>
      {t("admin.detail.noData")}
    </p>
  );
}
