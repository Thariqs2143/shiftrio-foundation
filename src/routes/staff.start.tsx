import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  MapPin,
  Moon,
  Sun,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { SelectList, type SelectOption } from "@/components/shiftrio/select-list";
import { PhotoCapture } from "@/components/shiftrio/photo-capture";
import { DetailCard, DetailRow } from "@/components/shiftrio/detail-row";
import { EmptyState } from "@/components/shiftrio/empty-state";
import { StatusBadge } from "@/components/shiftrio/status-badge";
import { useStaffIdentity } from "@/lib/session";
import {
  activeShiftFor,
  byId,
  distanceMeters,
  shiftService,
  useDb,
} from "@/lib/store";
import {
  clearDraft,
  stepIndex,
  updateDraft,
  useShiftDraft,
  WIZARD_STEPS,
  type WizardStep,
} from "@/lib/shift-draft";
import type { LocationVerification, ShiftType } from "@/lib/models";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/staff/start")({
  head: () => ({
    meta: [
      { title: "Start Shift — Shiftrio Staff" },
      {
        name: "description",
        content:
          "Pick your site, machine, operator and incharge, verify location and add photos before starting your shift.",
      },
      { property: "og:title", content: "Start Shift — Shiftrio Staff" },
      {
        property: "og:description",
        content: "Guided shift start with location check and photo proof.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StartShiftWizard,
});

const stepTitles: Record<WizardStep, string> = {
  site: "Select site",
  machine: "Select machine",
  operator: "Select operator",
  incharge: "Select incharge",
  type: "Shift type",
  gps: "Location check",
  photos: "Check-in photos",
  review: "Review & confirm",
};

function StartShiftWizard() {
  const { t } = useLang();
  const db = useDb();
  const navigate = useNavigate();
  const identity = useStaffIdentity();
  const draft = useShiftDraft();
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!identity) {
    return <EmptyState title="No worker profile" body="Sign in again to start a shift." />;
  }
  const { worker } = identity;
  const existing = activeShiftFor(db, worker.id);

  if (existing) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <EmptyState
          title="Shift already running"
          body="End your current shift before starting a new one."
          action={
            <Button onClick={() => navigate({ to: "/staff/active" })}>
              Go to active shift
            </Button>
          }
        />
      </div>
    );
  }

  const step = draft.step;
  const index = stepIndex(step);
  const site = byId(db.sites, draft.siteId);

  const siteOptions: SelectOption[] = db.sites.map((s) => ({
    id: s.id,
    title: s.name,
    subtitle: `${s.code} · ${s.city}`,
    meta: s.address,
    badge: <StatusBadge status={s.status} />,
    disabled: s.status === "closed",
    keywords: s.city,
  }));

  const machineOptions: SelectOption[] = db.machines
    .filter((m) => !draft.siteId || m.siteId === draft.siteId)
    .map((m) => ({
      id: m.id,
      title: m.name,
      subtitle: `${m.code} · ${m.category}`,
      meta: `${m.hoursRun} h run`,
      badge: <StatusBadge status={m.status === "maintenance" ? "paused" : "active"} />,
      disabled: m.status === "maintenance",
    }));

  const operatorOptions: SelectOption[] = db.operators
    .filter((o) => !draft.siteId || o.siteId === draft.siteId)
    .map((o) => ({
      id: o.id,
      title: o.name,
      subtitle: `Licence ${o.licenseNo}`,
      meta: o.certifiedFor.join(", "),
    }));

  const inchargeOptions: SelectOption[] = db.incharges
    .filter((i) => !draft.siteId || i.siteId === draft.siteId)
    .map((i) => ({
      id: i.id,
      title: i.name,
      subtitle: i.phone,
      meta: `Prefers ${i.shiftPreference} shift`,
    }));

  function goTo(next: WizardStep) {
    setError(null);
    updateDraft({ step: next });
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }

  function nextStep() {
    const missing = validate(step);
    if (missing) {
      setError(missing);
      return;
    }
    const next = WIZARD_STEPS[Math.min(WIZARD_STEPS.length - 1, index + 1)];
    goTo(next);
  }

  function prevStep() {
    if (index === 0) {
      navigate({ to: "/staff" });
      return;
    }
    goTo(WIZARD_STEPS[index - 1]);
  }

  function validate(current: WizardStep): string | null {
    switch (current) {
      case "site":
        return draft.siteId ? null : "Choose the site you are working at.";
      case "machine":
        return draft.machineId || machineOptions.length === 0
          ? null
          : "Choose a machine, or pick “No machine”.";
      case "type":
        return draft.shiftType ? null : "Choose a day or night shift.";
      case "gps":
        return draft.location ? null : "Run the location check before continuing.";
      case "photos":
        return db.organization.requireCheckInPhoto && draft.photos.length === 0
          ? "Add at least one check-in photo."
          : null;
      default:
        return null;
    }
  }

  function runDeviceCheck() {
    if (!site) return;
    setError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("This device cannot share location. Use the simulated check instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const distance = distanceMeters(
          { lat: pos.coords.latitude, lng: pos.coords.longitude },
          { lat: site.lat, lng: site.lng },
        );
        const verification: LocationVerification = {
          verified: distance <= site.geofenceRadiusM,
          distanceM: distance,
          accuracyM: Math.round(pos.coords.accuracy),
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          method: "device",
          checkedAt: new Date().toISOString(),
        };
        updateDraft({ location: verification });
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError("Location permission denied. Use the simulated check for this demo.");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  function runSimulatedCheck() {
    if (!site) return;
    setError(null);
    const distance = 20 + Math.round(Math.random() * 80);
    updateDraft({
      location: {
        verified: distance <= site.geofenceRadiusM,
        distanceM: distance,
        accuracyM: 12,
        lat: site.lat,
        lng: site.lng,
        method: "simulated",
        checkedAt: new Date().toISOString(),
      },
    });
  }

  function confirm() {
    const blocking = WIZARD_STEPS.map(validate).find(Boolean);
    if (blocking) {
      setError(blocking);
      return;
    }
    setSubmitting(true);
    const created = shiftService.start({
      workerId: worker.id,
      siteId: draft.siteId!,
      machineId: draft.machineId,
      operatorId: draft.operatorId,
      inchargeId: draft.inchargeId,
      shiftType: (draft.shiftType ?? "day") as ShiftType,
      startedAt: new Date().toISOString(),
      breakMinutes: 0,
      checkInPhoto: draft.photos[0] ?? null,
      checkOutPhoto: null,
      checkInPhotos: draft.photos,
      checkOutPhotos: [],
      checkInLocation: draft.location,
      notes: draft.notes,
    });
    clearDraft();
    setSubmitting(false);
    navigate({ to: "/staff/active", search: { started: created.id } as never });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="space-y-3">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <Button variant="outline" size="icon" onClick={prevStep} aria-label={t("back")}>
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <p className="text-eyebrow text-muted-foreground">
              Step {index + 1} of {WIZARD_STEPS.length}
            </p>
            <h1 className="truncate font-display text-2xl font-bold uppercase leading-none">
              {stepTitles[step]}
            </h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("cancel")}
            onClick={() => {
              clearDraft();
              navigate({ to: "/staff" });
            }}
          >
            <X className="size-4" />
          </Button>
        </div>
        <Progress value={((index + 1) / WIZARD_STEPS.length) * 100} className="h-1.5" />
      </header>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
        >
          {error}
        </p>
      ) : null}

      {step === "site" ? (
        <SelectList
          options={siteOptions}
          value={draft.siteId}
          onChange={(id) =>
            updateDraft({ siteId: id, machineId: null, operatorId: null, inchargeId: null })
          }
          searchPlaceholder="Search sites"
          emptyTitle="No sites match"
        />
      ) : null}

      {step === "machine" ? (
        <div className="space-y-3">
          <SelectList
            options={[
              { id: "none", title: "No machine", subtitle: "Working without equipment" },
              ...machineOptions,
            ]}
            value={draft.machineId ?? "none"}
            onChange={(id) => updateDraft({ machineId: id === "none" ? null : id })}
            searchPlaceholder="Search machines"
            emptyTitle="No machines at this site"
          />
        </div>
      ) : null}

      {step === "operator" ? (
        <SelectList
          options={[
            { id: "none", title: "No operator", subtitle: "I am operating myself" },
            ...operatorOptions,
          ]}
          value={draft.operatorId ?? "none"}
          onChange={(id) => updateDraft({ operatorId: id === "none" ? null : id })}
          searchPlaceholder="Search operators"
          emptyTitle="No operators at this site"
        />
      ) : null}

      {step === "incharge" ? (
        <SelectList
          options={[
            { id: "none", title: "No incharge", subtitle: "Unsupervised shift" },
            ...inchargeOptions,
          ]}
          value={draft.inchargeId ?? "none"}
          onChange={(id) => updateDraft({ inchargeId: id === "none" ? null : id })}
          searchPlaceholder="Search incharges"
          emptyTitle="No incharge at this site"
        />
      ) : null}

      {step === "type" ? (
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Shift type">
          {(
            [
              { value: "day", label: t("day"), hint: "06:00 – 15:00", icon: Sun },
              { value: "night", label: t("night"), hint: "19:00 – 04:00", icon: Moon },
            ] as const
          ).map((option) => {
            const selected = draft.shiftType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => updateDraft({ shiftType: option.value })}
                className={cn(
                  "rounded-2xl border p-5 text-left transition-colors",
                  selected
                    ? "border-primary bg-primary/10 shadow-glow"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                <option.icon
                  className={cn("size-6", selected ? "text-primary" : "text-muted-foreground")}
                />
                <p className="mt-3 font-display text-xl font-bold uppercase leading-none">
                  {option.label}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{option.hint}</p>
              </button>
            );
          })}
        </div>
      ) : null}

      {step === "gps" ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-eyebrow text-muted-foreground">Geofence</p>
            <p className="mt-1 font-display text-lg font-bold">{site?.name ?? "Select a site"}</p>
            <p className="text-sm text-muted-foreground">
              Allowed radius {site?.geofenceRadiusM ?? db.organization.geofenceRadiusM} m
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Button className="h-12" onClick={runDeviceCheck} disabled={locating || !site}>
                {locating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <MapPin className="size-4" />
                )}
                Use device location
              </Button>
              <Button
                variant="outline"
                className="h-12"
                onClick={runSimulatedCheck}
                disabled={!site}
              >
                Use simulated check
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Demo build: the simulated check generates a sample distance. Real geofencing
              arrives with the backend.
            </p>
          </div>

          {draft.location ? (
            <DetailCard title="Result">
              <DetailRow
                label="Status"
                value={
                  draft.location.verified ? (
                    <span className="font-semibold text-success">Inside geofence</span>
                  ) : (
                    <span className="font-semibold text-warning">
                      Outside geofence — flagged for review
                    </span>
                  )
                }
              />
              <DetailRow label="Distance" value={`${draft.location.distanceM} m from site`} />
              <DetailRow label="Accuracy" value={`± ${draft.location.accuracyM} m`} />
              <DetailRow
                label="Method"
                value={draft.location.method === "device" ? "Device GPS" : "Simulated (demo)"}
              />
            </DetailCard>
          ) : null}
        </div>
      ) : null}

      {step === "photos" ? (
        <div className="space-y-4">
          <PhotoCapture
            photos={draft.photos}
            kind="check_in"
            onChange={(next) => updateDraft({ photos: next })}
            hint="Photos stay on this device in the demo build."
          />
          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-semibold">
              {t("notes")} (optional)
            </label>
            <Textarea
              id="notes"
              value={draft.notes}
              onChange={(e) => updateDraft({ notes: e.target.value })}
              placeholder="Anything the incharge should know at handover"
              maxLength={500}
            />
          </div>
        </div>
      ) : null}

      {step === "review" ? (
        <DetailCard title={t("review")}>
          <DetailRow label={t("site")} value={site?.name ?? "—"} hint={site?.address} />
          <DetailRow
            label={t("machine")}
            value={byId(db.machines, draft.machineId)?.name ?? t("none")}
          />
          <DetailRow
            label={t("operator")}
            value={byId(db.operators, draft.operatorId)?.name ?? t("none")}
          />
          <DetailRow
            label={t("incharge")}
            value={byId(db.incharges, draft.inchargeId)?.name ?? t("none")}
          />
          <DetailRow
            label={t("shiftType")}
            value={draft.shiftType === "night" ? t("night") : t("day")}
          />
          <DetailRow
            label={t("gps")}
            value={
              draft.location
                ? `${draft.location.distanceM} m · ${draft.location.verified ? "verified" : "outside geofence"}`
                : "Not checked"
            }
            hint={draft.location?.method === "simulated" ? "Simulated location (demo)" : undefined}
          />
          <DetailRow label={t("photos")} value={`${draft.photos.length} attached`} />
          <DetailRow label={t("notes")} value={draft.notes || "—"} />
        </DetailCard>
      ) : null}

      <div className="sticky bottom-20 grid gap-2 lg:bottom-4">
        {step === "review" ? (
          <Button
            size="lg"
            className="h-14 w-full font-display text-lg uppercase tracking-widest shadow-glow"
            onClick={confirm}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />}
            {t("startShift")}
          </Button>
        ) : (
          <Button
            size="lg"
            className="h-14 w-full font-display text-base uppercase tracking-wide"
            onClick={nextStep}
          >
            {t("next")} <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
