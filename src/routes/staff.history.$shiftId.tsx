import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DetailCard, DetailRow } from "@/components/shiftrio/detail-row";
import { EmptyState } from "@/components/shiftrio/empty-state";
import { byId, formatDate, formatTime, shiftHours, useDb } from "@/lib/store";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/staff/history/$shiftId")({
  head: () => ({
    meta: [
      { title: "Shift Detail — Shiftrio Staff" },
      {
        name: "description",
        content: "Full record of one shift: site, machine, hours, location check and photos.",
      },
      { property: "og:title", content: "Shift Detail — Shiftrio Staff" },
      { property: "og:description", content: "Everything logged for this shift." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShiftDetail,
});

function ShiftDetail() {
  const { t } = useLang();
  const { shiftId } = Route.useParams();
  const db = useDb();
  const navigate = useNavigate();
  const shift = db.shifts.find((s) => s.id === shiftId);

  if (!shift) {
    return (
      <EmptyState
        title="Shift not found"
        body="This shift is not stored on this device."
        action={
          <Button asChild>
            <Link to="/staff/history">{t("history")}</Link>
          </Button>
        }
      />
    );
  }

  const photos = [...(shift.checkInPhotos ?? []), ...(shift.checkOutPhotos ?? [])].filter(Boolean);
  const hours = shiftHours(shift);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          aria-label={t("back")}
          onClick={() => navigate({ to: "/staff/history" })}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0">
          <p className="text-eyebrow text-muted-foreground">{formatDate(shift.startedAt)}</p>
          <h1 className="truncate font-display text-2xl font-bold uppercase leading-none">
            {byId(db.sites, shift.siteId)?.name ?? "Shift"}
          </h1>
        </div>
      </header>

      <DetailCard title="Record">
        <DetailRow
          label="Timing"
          value={`${formatTime(shift.startedAt)} – ${shift.endedAt ? formatTime(shift.endedAt) : "running"}`}
        />
        <DetailRow label="Hours" value={shift.endedAt ? `${hours} h` : "In progress"} />
        <DetailRow label="Break" value={`${shift.breakMinutes} min`} />
        <DetailRow
          label={t("shiftType")}
          value={shift.shiftType === "night" ? t("night") : t("day")}
        />
        <DetailRow label={t("machine")} value={byId(db.machines, shift.machineId)?.name ?? t("none")} />
        <DetailRow
          label={t("operator")}
          value={byId(db.operators, shift.operatorId)?.name ?? t("none")}
        />
        <DetailRow
          label={t("incharge")}
          value={byId(db.incharges, shift.inchargeId)?.name ?? t("none")}
        />
        <DetailRow
          label={t("gps")}
          value={
            shift.checkInLocation
              ? `${shift.checkInLocation.distanceM} m · ${shift.checkInLocation.verified ? "verified" : "outside geofence"}`
              : "Not checked"
          }
          hint={shift.checkInLocation?.method === "simulated" ? "Simulated (demo)" : undefined}
        />
        <DetailRow label={t("notes")} value={shift.notes || "—"} />
      </DetailCard>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-display text-lg font-bold uppercase">{t("photos")}</h2>
        {photos.length === 0 ? (
          <p className="text-sm text-muted-foreground">No photos attached to this shift.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((p) => (
              <li key={p.id} className="overflow-hidden rounded-xl border border-border">
                {p.dataUrl ? (
                  <img
                    src={p.dataUrl}
                    alt={`Shift photo ${p.fileName}`}
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="grid aspect-[4/3] place-items-center bg-surface text-xs text-muted-foreground">
                    {p.kind === "check_in" ? "Check-in" : "Check-out"}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
