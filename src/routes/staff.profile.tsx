import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, HardHat, Languages, LogOut, Phone, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/shiftrio/stat-card";
import { StatusBadge } from "@/components/shiftrio/status-badge";
import { DetailCard, DetailRow } from "@/components/shiftrio/detail-row";
import { EmptyState } from "@/components/shiftrio/empty-state";
import { signOut, useStaffIdentity } from "@/lib/session";
import { byId, formatDate, resetDemoData, useDb } from "@/lib/store";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/staff/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — Shiftrio Staff" },
      {
        name: "description",
        content: "Your Shiftrio worker profile: skills, site, language preference and sign-out.",
      },
      { property: "og:title", content: "My Profile — Shiftrio Staff" },
      { property: "og:description", content: "Skills, site and preferences in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StaffProfile,
});

function StaffProfile() {
  const { lang, setLang, t } = useLang();
  const db = useDb();
  const navigate = useNavigate();
  const identity = useStaffIdentity();

  if (!identity) {
    return <EmptyState title="No worker profile" body="Sign in again to load your profile." />;
  }

  const { worker, user } = identity;
  const site = byId(db.sites, worker.siteId);
  const initials = worker.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-3xl border border-border bg-surface-gradient p-5 shadow-elevated">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-gradient font-display text-2xl font-bold text-primary-foreground">
            {initials}
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-bold uppercase leading-none">
              {worker.name}
            </h1>
            {worker.nameTa ? (
              <p className="truncate text-sm text-muted-foreground">{worker.nameTa}</p>
            ) : null}
            <p className="mt-1 truncate text-sm">{worker.designation}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge status={worker.status === "active" ? "active" : "off_shift"} />
          <Badge variant="secondary">
            <BadgeCheck className="size-3.5" /> {worker.employeeCode}
          </Badge>
          {site ? (
            <Badge variant="secondary">
              <HardHat className="size-3.5" /> {site.code}
            </Badge>
          ) : null}
        </div>
      </section>

      <DetailCard title="Details">
        <DetailRow label="Phone" value={worker.phone} />
        <DetailRow label="Email" value={user.email} />
        <DetailRow label="Site" value={site?.name ?? "Unassigned"} hint={site?.city} />
        <DetailRow label="Skills" value={worker.skills.join(", ") || "—"} />
        <DetailRow label="Joined" value={formatDate(worker.joinedAt)} />
        <DetailRow label="Rating" value={`${worker.rating} / 5`} />
      </DetailCard>

      <section className="rounded-2xl border border-border bg-card p-5">
        <SectionHeading title={t("language")} subtitle="Saved on this device" />
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label={t("language")}>
          {(
            [
              { value: "en", label: t("english"), hint: "English" },
              { value: "ta", label: t("tamil"), hint: "தமிழ்" },
            ] as const
          ).map((option) => {
            const selected = lang === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setLang(option.value)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition-colors",
                  selected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-surface hover:border-primary/40",
                )}
              >
                <Languages
                  className={cn("size-4", selected ? "text-primary" : "text-muted-foreground")}
                />
                <p className="mt-2 text-sm font-semibold">{option.label}</p>
                <p className="text-xs text-muted-foreground">{option.hint}</p>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Tamil covers the main navigation and shift actions; the rest falls back to English.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Button
          variant="outline"
          size="lg"
          className="h-14"
          onClick={() => {
            resetDemoData();
            navigate({ to: "/staff" });
          }}
        >
          <RotateCcw className="size-4" /> Reset demo data
        </Button>
        <Button
          variant="destructive"
          size="lg"
          className="h-14 font-display uppercase tracking-wide"
          onClick={() => {
            signOut();
            navigate({ to: "/", replace: true });
          }}
        >
          <LogOut className="size-4" /> {t("signOut")}
        </Button>
      </section>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Phone className="size-3.5" /> Support {db.organization.contactPhone}
      </p>
    </div>
  );
}
