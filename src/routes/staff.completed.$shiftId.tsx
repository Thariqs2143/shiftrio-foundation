import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DetailCard, DetailRow } from "@/components/shiftrio/detail-row";
import { EmptyState } from "@/components/shiftrio/empty-state";
import { byId, formatDate, formatTime, shiftHours, useDb } from "@/lib/store";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/staff/completed/$shiftId")({
  head: () => ({
    meta: [
      { title: "Shift Completed — Shiftrio Staff" },
      { name: "description", content: "Your shift is logged with hours, breaks and overtime." },
      { property: "og:title", content: "Shift Completed — Shiftrio Staff" },
      { property: "og:description", content: "Shift logged and sent for approval." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShiftCompleted,
});

function ShiftCompleted() {
  const { t } = useLang();
  const { shiftId } = Route.useParams();
  const db = useDb();
  const shift = db.shifts.find((s) => s.id === shiftId);

  if (!shift) {
    return (
      <EmptyState
        title="Shift not found"
        body="This shift is no longer stored on this device."
        action={
          <Button asChild>
            <Link to="/staff/history">{t("history")}</Link>
          </Button>
        }
      />
    );
  }

  const hours = shiftHours(shift);
  const overtime = Math.max(0, +(hours - db.organization.overtimeAfterHours).toFixed(2));

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <section className="rounded-3xl border border-success/40 bg-success/10 p-6 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-success/20 text-success">
          <CheckCircle2 className="size-7" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold uppercase leading-none">
          Shift completed
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {hours} hours logged · sent to your incharge for approval.
        </p>
      </section>

      <DetailCard title="Shift record">
        <DetailRow label="Date" value={formatDate(shift.startedAt)} />
        <DetailRow label={t("site")} value={byId(db.sites, shift.siteId)?.name ?? "—"} />
        <DetailRow
          label="Timing"
          value={`${formatTime(shift.startedAt)} – ${shift.endedAt ? formatTime(shift.endedAt) : "—"}`}
        />
        <DetailRow label="Break" value={`${shift.breakMinutes} min`} />
        <DetailRow label="Hours" value={`${hours} h`} hint={overtime ? `${overtime} h overtime` : undefined} />
        <DetailRow label={t("notes")} value={shift.notes || "—"} />
      </DetailCard>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button asChild size="lg" className="h-14 font-display uppercase tracking-wide">
          <Link to="/staff">{t("home")}</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-14 font-display uppercase tracking-wide">
          <Link to="/staff/history/$shiftId" params={{ shiftId: shift.id }}>
            View details
          </Link>
        </Button>
      </div>
    </div>
  );
}
