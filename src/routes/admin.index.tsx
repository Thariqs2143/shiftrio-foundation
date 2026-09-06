import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users,
  MapPin,
  Clock,
  AlertTriangle,
  Camera,
  Coffee,
  LogIn,
  LogOut,
  Wrench,
  Activity,
  ChevronRight,
} from "lucide-react";
import { StatCard, SectionHeading } from "@/components/shiftrio/stat-card";
import { StatusBadge } from "@/components/shiftrio/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  activeShifts,
  activity,
  attendance,
  formatElapsed,
  siteById,
  sites,
  workerById,
  workers,
} from "@/lib/mock-data";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Shiftrio Site Control" },
      {
        name: "description",
        content:
          "Live view of active shifts, crew status, sites, attendance and site activity across your industrial operations.",
      },
      { property: "og:title", content: "Admin Dashboard — Shiftrio" },
      {
        property: "og:description",
        content: "Active shifts, workers, sites and live activity in one control screen.",
      },
    ],
  }),
  component: AdminDashboard,
});

const activityIcon = {
  check_in: LogIn,
  check_out: LogOut,
  break_start: Coffee,
  break_end: Coffee,
  photo: Camera,
  geofence_exit: AlertTriangle,
  machine_assigned: Wrench,
} as const;

function AdminDashboard() {
  const onShift = workers.filter((w) => w.status === "on_shift").length;
  const absent = workers.filter((w) => w.status === "absent").length;
  const activeSites = sites.filter((s) => s.status === "active").length;
  const totalHours = activeShifts.reduce((s, x) => s + x.elapsedMinutes, 0) / 60;

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <p className="text-eyebrow text-muted-foreground">Live overview</p>
          <h1 className="truncate font-display text-3xl font-bold uppercase leading-none">
            Site control
          </h1>
        </div>
        <Badge variant="secondary" className="shrink-0">
          <Activity className="size-3.5" /> Live
        </Badge>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Active shifts" value={String(activeShifts.length)} hint={`${onShift} workers clocked in`} icon={Clock} accent />
        <StatCard label="Workers" value={String(workers.length)} hint={`${absent} absent today`} icon={Users} />
        <StatCard label="Active sites" value={String(activeSites)} hint={`${sites.length} total`} icon={MapPin} />
        <StatCard label="Hours today" value={totalHours.toFixed(1)} hint="Running total" icon={Clock} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <SectionHeading
            title="Active shifts"
            subtitle="Timers running now"
            action={
              <Button asChild variant="outline" size="sm">
                <Link to="/admin/attendance">Attendance</Link>
              </Button>
            }
          />
          <ul className="divide-y divide-border">
            {activeShifts.map((shift) => {
              const worker = workerById(shift.workerId)!;
              const site = siteById(shift.siteId)!;
              return (
                <li key={shift.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-sm font-semibold">{worker.name}</p>
                      {!shift.gpsVerified ? (
                        <Badge variant="destructive" className="shrink-0">GPS</Badge>
                      ) : null}
                      {!shift.hasCheckInPhoto ? (
                        <Badge variant="secondary" className="shrink-0">No photo</Badge>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {worker.role} · {site.code} · from {shift.startedAt}
                      {shift.machine ? ` · ${shift.machine}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 font-display text-lg font-bold tabular-nums text-primary">
                    {formatElapsed(shift.elapsedMinutes)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <SectionHeading title="Live activity" subtitle="Last 24 hours" />
          <ol className="space-y-4">
            {activity.map((event) => {
              const Icon = activityIcon[event.kind];
              const worker = workerById(event.workerId)!;
              const alert = event.kind === "geofence_exit";
              return (
                <li key={event.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                  <span
                    className={
                      alert
                        ? "grid size-8 shrink-0 place-items-center rounded-lg border border-destructive/30 bg-destructive/15 text-destructive"
                        : "grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-muted text-muted-foreground"
                    }
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{worker.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {event.kind.replace(/_/g, " ")}
                      {event.note ? ` · ${event.note}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground/70">{event.at}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <SectionHeading
            title="Sites"
            subtitle="Headcount vs target"
            action={
              <Button asChild variant="outline" size="sm">
                <Link to="/admin/sites">All sites</Link>
              </Button>
            }
          />
          <ul className="space-y-4">
            {sites.map((site) => (
              <li key={site.id}>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <p className="truncate text-sm font-semibold">{site.name}</p>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {site.workersOnSite}/{site.headcountTarget}
                  </span>
                </div>
                <Progress
                  value={(site.workersOnSite / site.headcountTarget) * 100}
                  className="mt-2 h-2"
                />
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <SectionHeading
            title="Workers"
            subtitle="Crew status right now"
            action={
              <Button asChild variant="outline" size="sm">
                <Link to="/admin/workers">Manage</Link>
              </Button>
            }
          />
          <ul className="divide-y divide-border">
            {workers.slice(0, 5).map((worker) => (
              <li key={worker.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{worker.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {worker.role} · {siteById(worker.siteId)?.code}
                  </p>
                </div>
                <StatusBadge status={worker.status} />
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <SectionHeading title="Today's attendance" subtitle="Check-ins and exceptions" />
        <ul className="divide-y divide-border">
          {attendance
            .filter((r) => r.date === "Today")
            .map((row) => (
              <li key={row.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{workerById(row.workerId)?.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {siteById(row.siteId)?.code} · in {row.checkIn}
                    {row.checkOut ? ` · out ${row.checkOut}` : ""}
                  </p>
                </div>
                <StatusBadge status={row.status} />
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
