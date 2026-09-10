import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Clock,
  HardHat,
  MapPin,
  Play,
  ChevronRight,
  Timer,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SectionHeading, StatCard } from "@/components/shiftrio/stat-card";
import { StatusBadge } from "@/components/shiftrio/status-badge";
import { EmptyState } from "@/components/shiftrio/empty-state";
import { useStaffIdentity } from "@/lib/session";
import {
  activeShiftFor,
  byId,
  formatDate,
  formatDuration,
  formatTime,
  shiftHours,
  shiftsFor,
  todayKey,
  useDb,
} from "@/lib/store";
import { useNow } from "@/lib/use-now";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/staff/")({
  head: () => ({
    meta: [
      { title: "My Shift — Shiftrio Staff" },
      {
        name: "description",
        content:
          "Start your shift, track hours and see today's site assignment in Shiftrio.",
      },
      { property: "og:title", content: "My Shift — Shiftrio Staff" },
      {
        property: "og:description",
        content: "One tap to start your shift and keep your hours accurate.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StaffHome,
});

function StaffHome() {
  const { t } = useLang();
  const db = useDb();
  const identity = useStaffIdentity();
  const now = useNow(1000);

  if (!identity) {
    return <EmptyState title="No worker profile" body="Sign in again to load your profile." />;
  }

  const { worker } = identity;
  const activeShift = activeShiftFor(db, worker.id);
  const site = byId(db.sites, worker.siteId);
  const assignment = db.assignments.find(
    (a) => a.workerId === worker.id && a.date >= todayKey() && a.status !== "cancelled",
  );
  const assignmentSite = byId(db.sites, assignment?.siteId) ?? site;
  const shifts = shiftsFor(db, worker.id);

  const elapsed = activeShift && now ? (now - new Date(activeShift.startedAt).getTime()) / 1000 : 0;

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const weekKey = weekStart.toISOString().slice(0, 10);
  const weekShifts = shifts.filter((s) => s.status === "completed" && s.startedAt.slice(0, 10) >= weekKey);
  const weekHours = +weekShifts.reduce((sum, s) => sum + shiftHours(s), 0).toFixed(1);
  const overtime = +weekShifts
    .reduce((sum, s) => sum + Math.max(0, shiftHours(s) - db.organization.overtimeAfterHours), 0)
    .toFixed(1);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const hours = +shifts
      .filter((s) => s.status === "completed" && s.startedAt.slice(0, 10) === key)
      .reduce((sum, s) => sum + shiftHours(s), 0)
      .toFixed(1);
    return { label: d.toLocaleDateString("en-GB", { weekday: "short" }), hours };
  });
  const maxHours = Math.max(...days.map((d) => d.hours), db.organization.standardShiftHours);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <p className="text-eyebrow text-muted-foreground">
            {new Date().getHours() < 12 ? "Good morning" : "Welcome back"}
          </p>
          <h1 className="truncate font-display text-3xl font-bold uppercase leading-none">
            {worker.name}
          </h1>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {worker.designation}
            {worker.nameTa ? ` · ${worker.nameTa}` : ""}
          </p>
        </div>
        <StatusBadge status={activeShift ? "on_shift" : "off_shift"} />
      </header>

      {/* Shift control card */}
      <section className="overflow-hidden rounded-3xl border border-border bg-surface-gradient shadow-elevated">
        <div className="hazard-stripe h-1.5" />
        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <p className="text-eyebrow text-muted-foreground">
                {activeShift ? t("activeShift") : "Next assignment"}
              </p>
              <p className="mt-1 truncate font-display text-xl font-bold">
                {activeShift
                  ? (byId(db.sites, activeShift.siteId)?.name ?? "Site")
                  : (assignmentSite?.name ?? "No site assigned")}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {activeShift
                  ? `Started ${formatTime(activeShift.startedAt)} · ${activeShift.shiftType === "day" ? t("day") : t("night")} shift`
                  : assignment
                    ? `${formatDate(assignment.date)} · ${assignment.startTime}–${assignment.endTime}`
                    : "Start a shift whenever you reach site"}
              </p>
            </div>
            {activeShift?.checkInLocation ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-success/30 bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
                <MapPin className="size-3.5" /> {activeShift.checkInLocation.distanceM} m
              </span>
            ) : null}
          </div>

          <div className="mt-6 text-center">
            <p className="text-eyebrow text-muted-foreground">{t("shiftTimer")}</p>
            <p className="mt-1 font-display text-5xl font-bold leading-none tabular-nums text-primary sm:text-6xl">
              {activeShift ? formatDuration(elapsed) : "00:00:00"}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {activeShift
                ? `Break logged: ${activeShift.breakMinutes} min · timer survives refresh`
                : "Timer starts when you complete the start-shift checks"}
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {activeShift ? (
              <Button
                asChild
                size="lg"
                className="h-16 w-full font-display text-lg uppercase tracking-widest shadow-glow"
              >
                <Link to="/staff/active">
                  <Timer className="size-5" /> {t("continueShift")}
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                className="h-16 w-full font-display text-xl uppercase tracking-widest shadow-glow"
              >
                <Link to="/staff/start">
                  <Play className="size-5" /> {t("startShift")}
                </Link>
              </Button>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline" className="h-12 justify-start">
                <Link to="/staff/history">
                  <ClipboardIcon /> {t("history")}
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-12 justify-start">
                <Link to="/staff/attendance">
                  <CalendarClock className="size-4" /> {t("attendance")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Last 7 days"
          value={`${weekHours} h`}
          hint={`Standard ${db.organization.standardShiftHours} h/shift`}
          icon={Clock}
          accent
        />
        <StatCard label="Overtime" value={`${overtime} h`} hint="Pending approval" icon={Clock} />
        <StatCard
          label="Site"
          value={site?.code ?? "—"}
          hint={site?.city ?? "Unassigned"}
          icon={HardHat}
        />
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <SectionHeading title="Last 7 days" subtitle="Hours logged per day" />
        <ul className="space-y-3">
          {days.map((d, i) => (
            <li
              key={`${d.label}-${i}`}
              className="grid grid-cols-[3rem_minmax(0,1fr)_3.5rem] items-center gap-3"
            >
              <span className="text-sm font-semibold text-muted-foreground">{d.label}</span>
              <Progress value={(d.hours / maxHours) * 100} className="h-2" />
              <span className="text-right text-sm tabular-nums">{d.hours} h</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <SectionHeading
          title="Recent shifts"
          subtitle="Your logged work"
          action={
            <Button asChild variant="outline" size="sm">
              <Link to="/staff/history">View all</Link>
            </Button>
          }
        />
        {shifts.length === 0 ? (
          <EmptyState
            title="No shifts yet"
            body="Your completed shifts will appear here once you finish your first one."
          />
        ) : (
          <ul className="divide-y divide-border">
            {shifts.slice(0, 3).map((s) => (
              <li key={s.id}>
                <Link
                  to="/staff/history/$shiftId"
                  params={{ shiftId: s.id }}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {formatDate(s.startedAt)} · {byId(db.sites, s.siteId)?.name ?? "Site"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatTime(s.startedAt)} – {s.endedAt ? formatTime(s.endedAt) : "running"} ·{" "}
                      {s.status === "completed" ? `${shiftHours(s)} h` : s.status}
                    </p>
                  </div>
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

function ClipboardIcon() {
  return <ClipboardList className="size-4" />;
}

import { ClipboardList } from "lucide-react";
