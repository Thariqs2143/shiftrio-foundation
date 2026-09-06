import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  MapPin,
  Camera,
  Coffee,
  Play,
  Square,
  Clock,
  HardHat,
  ShieldAlert,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatCard, SectionHeading } from "@/components/shiftrio/stat-card";
import { StatusBadge } from "@/components/shiftrio/status-badge";
import {
  currentStaff,
  siteById,
  staffShiftPlan,
  staffWeek,
  formatElapsed,
} from "@/lib/mock-data";

export const Route = createFileRoute("/staff/")({
  head: () => ({
    meta: [
      { title: "My Shift — Shiftrio Staff" },
      {
        name: "description",
        content:
          "Start your shift, track hours, log breaks and see today's site assignment in Shiftrio.",
      },
      { property: "og:title", content: "My Shift — Shiftrio Staff" },
      {
        property: "og:description",
        content: "One tap to start your shift and keep your hours accurate.",
      },
    ],
  }),
  component: StaffHome,
});

type ShiftState = "idle" | "running" | "break";

function StaffHome() {
  const site = siteById(staffShiftPlan.siteId)!;
  const [state, setState] = useState<ShiftState>("idle");
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (state !== "running") return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [state]);

  const hhmmss = [
    Math.floor(seconds / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60,
  ]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");

  const weekHours = staffWeek.reduce((sum, d) => sum + d.hours, 0);
  const maxHours = Math.max(...staffWeek.map((d) => d.hours), 8);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <p className="text-eyebrow text-muted-foreground">Good morning</p>
          <h1 className="truncate font-display text-3xl font-bold uppercase leading-none">
            {currentStaff.name}
          </h1>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {currentStaff.role} · {currentStaff.nameTa}
          </p>
        </div>
        <StatusBadge status={state === "idle" ? "off_shift" : state === "break" ? "on_break" : "on_shift"} />
      </header>

      {/* Shift control card */}
      <section className="overflow-hidden rounded-3xl border border-border bg-surface-gradient shadow-elevated">
        <div className="hazard-stripe h-1.5" />
        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <p className="text-eyebrow text-muted-foreground">Today's assignment</p>
              <p className="mt-1 truncate font-display text-xl font-bold">{site.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {staffShiftPlan.scheduledStart}–{staffShiftPlan.scheduledEnd} · {site.code}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-success/30 bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
              <MapPin className="size-3.5" /> {staffShiftPlan.distanceToSiteM} m away
            </span>
          </div>

          <div className="mt-6 text-center">
            <p className="text-eyebrow text-muted-foreground">Shift timer</p>
            <p className="mt-1 font-display text-6xl font-bold leading-none tabular-nums text-primary">
              {hhmmss}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {state === "idle"
                ? "Timer starts when you check in at the gate"
                : state === "break"
                  ? "Break running — timer paused"
                  : "GPS verified · photo attached"}
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {state === "idle" ? (
              <Button
                size="lg"
                onClick={() => setState("running")}
                className="h-16 w-full font-display text-xl uppercase tracking-widest shadow-glow"
              >
                <Play className="size-5" /> Start shift
              </Button>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-14 font-display text-base uppercase tracking-wide"
                  onClick={() => setState(state === "break" ? "running" : "break")}
                >
                  <Coffee className="size-4" />
                  {state === "break" ? "End break" : "Start break"}
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  className="h-14 font-display text-base uppercase tracking-wide"
                  onClick={() => {
                    setState("idle");
                    setSeconds(0);
                  }}
                >
                  <Square className="size-4" /> End shift
                </Button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-12 justify-start">
                <Camera className="size-4" /> Site photo
              </Button>
              <Button variant="outline" className="h-12 justify-start">
                <ShieldAlert className="size-4" /> Report issue
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="This week" value={`${weekHours} h`} hint="Target 45 h" icon={Clock} accent />
        <StatCard label="Overtime" value="3.5 h" hint="Approved by foreman" icon={Clock} />
        <StatCard label="Machine" value="TC-02" hint={staffShiftPlan.machine} icon={HardHat} />
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <SectionHeading title="This week" subtitle="Hours logged per day" />
        <ul className="space-y-3">
          {staffWeek.map((d) => (
            <li key={d.day} className="grid grid-cols-[3rem_minmax(0,1fr)_3.5rem] items-center gap-3">
              <span className="text-sm font-semibold text-muted-foreground">{d.day}</span>
              <Progress value={(d.hours / maxHours) * 100} className="h-2" />
              <span className="text-right text-sm tabular-nums">{d.hours} h</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <SectionHeading title="Next up" subtitle="Upcoming assignments" />
        <ul className="divide-y divide-border">
          {[
            { day: "Tomorrow", time: "06:00 – 15:00", site: "Kovai Steel Yard", machine: "Tower Crane TC-02" },
            { day: "Wed", time: "07:00 – 16:00", site: "Hosur Precast Plant", machine: "Gantry G-1" },
          ].map((s) => (
            <li key={s.day} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {s.day} · {s.time}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {s.site} · {s.machine}
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
