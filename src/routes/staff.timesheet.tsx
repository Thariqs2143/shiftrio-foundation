import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading, StatCard } from "@/components/shiftrio/stat-card";
import { StatusBadge } from "@/components/shiftrio/status-badge";
import { attendance, currentStaff, siteById } from "@/lib/mock-data";

export const Route = createFileRoute("/staff/timesheet")({
  head: () => ({
    meta: [
      { title: "My Timesheet — Shiftrio Staff" },
      {
        name: "description",
        content:
          "Review your logged shifts, breaks and overtime hours before payroll approval in Shiftrio.",
      },
      { property: "og:title", content: "My Timesheet — Shiftrio Staff" },
      {
        property: "og:description",
        content: "Logged shifts, breaks and overtime, ready for approval.",
      },
    ],
  }),
  component: StaffTimesheet,
});

function StaffTimesheet() {
  const rows = attendance.filter((r) => r.workerId === currentStaff.id || r.siteId === currentStaff.siteId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-eyebrow text-muted-foreground">Week 36</p>
        <h1 className="font-display text-3xl font-bold uppercase leading-none">Timesheet</h1>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Logged" value="38.5 h" icon={CalendarClock} accent />
        <StatCard label="Overtime" value="3.5 h" hint="1.5× rate" />
        <StatCard label="Days worked" value="5" hint="of 6 scheduled" />
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <SectionHeading
          title="Shift log"
          subtitle="Pending supervisor approval"
          action={
            <Button variant="outline" size="sm">
              <Download className="size-4" /> Export
            </Button>
          }
        />
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {r.date} · {r.checkIn} – {r.checkOut ?? "running"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {siteById(r.siteId)?.name} · {r.totalHours ? `${r.totalHours} h` : "in progress"}
                  {r.overtimeHours ? ` · +${r.overtimeHours} h OT` : ""}
                </p>
              </div>
              <StatusBadge status={r.status} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
