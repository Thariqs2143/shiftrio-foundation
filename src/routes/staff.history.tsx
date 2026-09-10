import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading, StatCard } from "@/components/shiftrio/stat-card";
import { StatusBadge } from "@/components/shiftrio/status-badge";
import { EmptyState } from "@/components/shiftrio/empty-state";
import { useStaffIdentity } from "@/lib/session";
import {
  byId,
  downloadCsv,
  formatDate,
  formatTime,
  shiftHours,
  shiftsFor,
  useDb,
} from "@/lib/store";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/staff/history")({
  head: () => ({
    meta: [
      { title: "Shift History — Shiftrio Staff" },
      {
        name: "description",
        content: "Every shift you have logged, with hours, breaks, overtime and site details.",
      },
      { property: "og:title", content: "Shift History — Shiftrio Staff" },
      { property: "og:description", content: "All your logged shifts in one list." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryLayout,
});

function HistoryLayout() {
  const isChild = useRouterState({
    select: (s) => s.location.pathname.startsWith("/staff/history/"),
  });
  return isChild ? <Outlet /> : <HistoryList />;
}

function HistoryList() {
  const { t } = useLang();
  const db = useDb();
  const identity = useStaffIdentity();
  const shifts = identity ? shiftsFor(db, identity.worker.id) : [];
  const completed = shifts.filter((s) => s.status === "completed");
  const totalHours = +completed.reduce((sum, s) => sum + shiftHours(s), 0).toFixed(1);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-eyebrow text-muted-foreground">{t("history")}</p>
        <h1 className="font-display text-3xl font-bold uppercase leading-none">Shift history</h1>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Shifts logged" value={String(completed.length)} accent />
        <StatCard label="Total hours" value={`${totalHours} h`} />
        <StatCard label="Night shifts" value={String(completed.filter((s) => s.shiftType === "night").length)} />
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <SectionHeading
          title="All shifts"
          subtitle="Newest first"
          action={
            <Button
              variant="outline"
              size="sm"
              disabled={shifts.length === 0}
              onClick={() =>
                downloadCsv("shiftrio-my-shifts.csv", [
                  ["Date", "Site", "Start", "End", "Break (min)", "Hours", "Type", "Status"],
                  ...shifts.map((s) => [
                    s.startedAt.slice(0, 10),
                    byId(db.sites, s.siteId)?.name ?? "",
                    formatTime(s.startedAt),
                    s.endedAt ? formatTime(s.endedAt) : "",
                    s.breakMinutes,
                    s.status === "completed" ? shiftHours(s) : "",
                    s.shiftType,
                    s.status,
                  ]),
                ])
              }
            >
              <Download className="size-4" /> Export
            </Button>
          }
        />
        {shifts.length === 0 ? (
          <EmptyState
            title="No shifts yet"
            body="Once you complete a shift it will show up here."
            action={
              <Button asChild>
                <Link to="/staff/start">{t("startShift")}</Link>
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {shifts.map((s) => (
              <li key={s.id}>
                <Link
                  to="/staff/history/$shiftId"
                  params={{ shiftId: s.id }}
                  className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {formatDate(s.startedAt)} · {byId(db.sites, s.siteId)?.name ?? "Site"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatTime(s.startedAt)} – {s.endedAt ? formatTime(s.endedAt) : "running"} ·{" "}
                      {s.status === "completed" ? `${shiftHours(s)} h` : "in progress"} ·{" "}
                      {s.shiftType === "night" ? t("night") : t("day")}
                    </p>
                  </div>
                  <StatusBadge status={s.status === "completed" ? "present" : "in_progress"} />
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
