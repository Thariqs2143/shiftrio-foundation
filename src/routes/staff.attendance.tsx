import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading, StatCard } from "@/components/shiftrio/stat-card";
import { StatusBadge } from "@/components/shiftrio/status-badge";
import { EmptyState } from "@/components/shiftrio/empty-state";
import { useStaffIdentity } from "@/lib/session";
import { attendanceRows, byId, formatDate, useDb } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/staff/attendance")({
  head: () => ({
    meta: [
      { title: "My Attendance — Shiftrio Staff" },
      {
        name: "description",
        content: "Month-by-month attendance calendar built from your logged shifts and hours.",
      },
      { property: "og:title", content: "My Attendance — Shiftrio Staff" },
      { property: "og:description", content: "See present, late and in-progress days at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StaffAttendance,
});

function StaffAttendance() {
  const { t } = useLang();
  const db = useDb();
  const identity = useStaffIdentity();
  const [offset, setOffset] = useState(0);

  const base = new Date();
  base.setDate(1);
  base.setMonth(base.getMonth() + offset);
  const year = base.getFullYear();
  const month = base.getMonth();

  const rows = identity
    ? attendanceRows(db).filter((r) => r.workerId === identity.worker.id)
    : [];
  const monthRows = rows.filter((r) => {
    const d = new Date(`${r.date}T00:00:00`);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first
  const byDate = new Map(monthRows.map((r) => [r.date, r]));

  const presentDays = monthRows.filter((r) => r.status === "present").length;
  const totalHours = +monthRows.reduce((sum, r) => sum + r.totalHours, 0).toFixed(1);
  const overtime = +monthRows.reduce((sum, r) => sum + r.overtimeHours, 0).toFixed(1);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-eyebrow text-muted-foreground">{t("attendance")}</p>
        <h1 className="font-display text-3xl font-bold uppercase leading-none">My attendance</h1>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Days present" value={String(presentDays)} accent />
        <StatCard label="Hours" value={`${totalHours} h`} />
        <StatCard label="Overtime" value={`${overtime} h`} />
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 pb-4">
          <Button variant="outline" size="icon" aria-label="Previous month" onClick={() => setOffset(offset - 1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <p className="truncate text-center font-display text-lg font-bold uppercase">
            {base.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </p>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next month"
            disabled={offset >= 0}
            onClick={() => setOffset(offset + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[0.65rem] font-semibold uppercase text-muted-foreground">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span key={`${d}-${i}`}>{d}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <span key={`pad-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const row = byDate.get(key);
            return (
              <span
                key={key}
                title={row ? `${row.totalHours} h · ${row.status}` : "No shift"}
                className={cn(
                  "grid aspect-square place-items-center rounded-lg border text-xs font-semibold",
                  !row && "border-border/60 text-muted-foreground",
                  row?.status === "present" && "border-success/40 bg-success/15 text-success",
                  row?.status === "in_progress" && "border-accent/40 bg-accent/15 text-accent",
                  row?.status === "late" && "border-warning/40 bg-warning/15 text-warning",
                  row?.status === "absent" && "border-destructive/40 bg-destructive/15 text-destructive",
                )}
              >
                {day}
              </span>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <SectionHeading title="Day details" subtitle="From your logged shifts" />
        {monthRows.length === 0 ? (
          <EmptyState title="Nothing logged this month" body="Complete a shift to build your attendance." />
        ) : (
          <ul className="divide-y divide-border">
            {monthRows.map((r) => (
              <li key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {formatDate(r.date)} · {r.checkIn ?? "—"} – {r.checkOut ?? "running"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {byId(db.sites, r.siteId)?.name ?? "Site"} ·{" "}
                    {r.totalHours ? `${r.totalHours} h` : "in progress"}
                    {r.overtimeHours ? ` · +${r.overtimeHours} h OT` : ""}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
