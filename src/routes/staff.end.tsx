import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhotoCapture } from "@/components/shiftrio/photo-capture";
import { EmptyState } from "@/components/shiftrio/empty-state";
import { DetailCard, DetailRow } from "@/components/shiftrio/detail-row";
import { useStaffIdentity } from "@/lib/session";
import { activeShiftFor, byId, formatDuration, formatTime, shiftService, useDb } from "@/lib/store";
import type { Photo } from "@/lib/models";
import { useNow } from "@/lib/use-now";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/staff/end")({
  head: () => ({
    meta: [
      { title: "End Shift — Shiftrio Staff" },
      {
        name: "description",
        content: "Confirm your hours, add checkout photos and notes before closing your shift.",
      },
      { property: "og:title", content: "End Shift — Shiftrio Staff" },
      { property: "og:description", content: "Close your shift with photos and handover notes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EndShift,
});

function EndShift() {
  const { t } = useLang();
  const db = useDb();
  const navigate = useNavigate();
  const identity = useStaffIdentity();
  const now = useNow(1000);
  const shift = identity ? activeShiftFor(db, identity.worker.id) : undefined;

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [notes, setNotes] = useState("");
  const [breakMinutes, setBreakMinutes] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!shift) {
    return (
      <EmptyState
        title="No active shift"
        body="There is nothing to end right now."
        action={<Button onClick={() => navigate({ to: "/staff" })}>{t("home")}</Button>}
      />
    );
  }

  const elapsed = now ? (now - new Date(shift.startedAt).getTime()) / 1000 : 0;
  const breaks = breakMinutes === "" ? shift.breakMinutes : Number(breakMinutes);

  function submit() {
    if (Number.isNaN(breaks) || breaks < 0 || breaks > 480) {
      setError("Break minutes must be between 0 and 480.");
      return;
    }
    setError(null);
    setBusy(true);
    shiftService.update(shift.id, {
      checkOutPhoto: photos[0] ?? null,
      checkOutPhotos: photos,
    });
    const ended = shiftService.end(shift.id, { breakMinutes: breaks, notes: notes || shift.notes });
    setBusy(false);
    navigate({ to: "/staff/completed/$shiftId", params: { shiftId: ended?.id ?? shift.id } });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/staff/active" })} aria-label={t("back")}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0">
          <p className="text-eyebrow text-muted-foreground">{t("confirm")}</p>
          <h1 className="truncate font-display text-2xl font-bold uppercase leading-none">
            {t("endShift")}
          </h1>
        </div>
      </header>

      <DetailCard title="Summary">
        <DetailRow label={t("site")} value={byId(db.sites, shift.siteId)?.name ?? "—"} />
        <DetailRow label="Started" value={formatTime(shift.startedAt)} />
        <DetailRow label="Elapsed" value={formatDuration(elapsed)} />
      </DetailCard>

      <div className="space-y-2">
        <label htmlFor="breaks" className="text-sm font-semibold">
          Break minutes
        </label>
        <Input
          id="breaks"
          inputMode="numeric"
          placeholder={String(shift.breakMinutes)}
          value={breakMinutes}
          onChange={(e) => setBreakMinutes(e.target.value.replace(/\D/g, "").slice(0, 3))}
        />
      </div>

      <PhotoCapture
        photos={photos}
        kind="check_out"
        onChange={setPhotos}
        hint="Checkout photos are optional."
      />

      <div className="space-y-2">
        <label htmlFor="endnotes" className="text-sm font-semibold">
          {t("notes")} (optional)
        </label>
        <Textarea
          id="endnotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Handover notes for the incharge"
          maxLength={500}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}

      <Button
        size="lg"
        variant="destructive"
        className="h-14 w-full font-display text-lg uppercase tracking-widest"
        onClick={submit}
        disabled={busy}
      >
        {busy ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />}
        {t("endShift")}
      </Button>
    </div>
  );
}
