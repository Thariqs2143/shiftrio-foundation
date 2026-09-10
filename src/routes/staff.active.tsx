import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Coffee, MapPin, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DetailCard, DetailRow } from "@/components/shiftrio/detail-row";
import { EmptyState } from "@/components/shiftrio/empty-state";
import { useStaffIdentity } from "@/lib/session";
import { activeShiftFor, byId, formatDuration, formatTime, shiftService, useDb } from "@/lib/store";
import { useNow } from "@/lib/use-now";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/staff/active")({
  head: () => ({
    meta: [
      { title: "Active Shift — Shiftrio Staff" },
      {
        name: "description",
        content: "Live shift timer, break logging and shift details while you are on site.",
      },
      { property: "og:title", content: "Active Shift — Shiftrio Staff" },
      { property: "og:description", content: "Your live shift timer and break log." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ActiveShift,
});

function ActiveShift() {
  const { t } = useLang();
  const db = useDb();
  const navigate = useNavigate();
  const identity = useStaffIdentity();
  const now = useNow(1000);
  const shift = identity ? activeShiftFor(db, identity.worker.id) : undefined;

  if (!shift) {
    return (
      <EmptyState
        title="No active shift"
        body="Start a shift to see your live timer here."
        action={<Button onClick={() => navigate({ to: "/staff/start" })}>{t("startShift")}</Button>}
      />
    );
  }

  const elapsed = now ? (now - new Date(shift.startedAt).getTime()) / 1000 : 0;
  const worked = Math.max(0, elapsed - shift.breakMinutes * 60);
  const site = byId(db.sites, shift.siteId);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <section className="overflow-hidden rounded-3xl border border-primary/40 bg-surface-gradient shadow-elevated">
        <div className="hazard-stripe h-1.5" />
        <div className="p-6 text-center">
          <p className="text-eyebrow text-muted-foreground">{t("activeShift")}</p>
          <p className="mt-2 font-display text-5xl font-bold leading-none tabular-nums text-primary sm:text-6xl">
            {formatDuration(worked)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Started {formatTime(shift.startedAt)} · total {formatDuration(elapsed)} · break{" "}
            {shift.breakMinutes} min
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button
              variant="secondary"
              size="lg"
              className="h-14 font-display uppercase tracking-wide"
              onClick={() =>
                shiftService.update(shift.id, { breakMinutes: shift.breakMinutes + 15 })
              }
            >
              <Coffee className="size-4" /> Log 15 min break
            </Button>
            <Button
              asChild
              variant="destructive"
              size="lg"
              className="h-14 font-display uppercase tracking-wide"
            >
              <Link to="/staff/end">
                <Square className="size-4" /> {t("endShift")}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <DetailCard title="Shift details">
        <DetailRow label={t("site")} value={site?.name ?? "—"} hint={site?.address} />
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
          label={t("shiftType")}
          value={shift.shiftType === "night" ? t("night") : t("day")}
        />
        <DetailRow
          label={t("gps")}
          value={
            shift.checkInLocation ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" /> {shift.checkInLocation.distanceM} m ·{" "}
                {shift.checkInLocation.verified ? "verified" : "outside geofence"}
              </span>
            ) : (
              "Not checked"
            )
          }
          hint={shift.checkInLocation?.method === "simulated" ? "Simulated (demo)" : undefined}
        />
        <DetailRow label={t("notes")} value={shift.notes || "—"} />
      </DetailCard>

      {(shift.checkInPhotos ?? []).length > 0 ? (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 font-display text-lg font-bold uppercase">{t("photos")}</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(shift.checkInPhotos ?? []).map((p) => (
              <li key={p.id} className="overflow-hidden rounded-xl border border-border">
                {p.dataUrl ? (
                  <img
                    src={p.dataUrl}
                    alt={`Check-in photo ${p.fileName}`}
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="grid aspect-[4/3] place-items-center bg-surface text-xs text-muted-foreground">
                    No preview
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
