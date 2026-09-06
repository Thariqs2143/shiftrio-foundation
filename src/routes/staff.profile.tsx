import { createFileRoute } from "@tanstack/react-router";
import { Phone, Languages, BadgeCheck, HardHat, Bell } from "lucide-react";
import { SectionHeading } from "@/components/shiftrio/stat-card";
import { StatusBadge } from "@/components/shiftrio/status-badge";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { currentStaff, siteById } from "@/lib/mock-data";

export const Route = createFileRoute("/staff/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — Shiftrio Staff" },
      {
        name: "description",
        content:
          "Your Shiftrio worker profile: skills, certifications, assigned site and shift preferences.",
      },
      { property: "og:title", content: "My Profile — Shiftrio Staff" },
      {
        property: "og:description",
        content: "Skills, certifications and shift preferences in one place.",
      },
    ],
  }),
  component: StaffProfile,
});

function StaffProfile() {
  const site = siteById(currentStaff.siteId)!;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-3xl border border-border bg-surface-gradient p-5 shadow-elevated">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-gradient font-display text-2xl font-bold text-primary-foreground">
            MS
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-bold uppercase leading-none">
              {currentStaff.name}
            </h1>
            <p className="truncate text-sm text-muted-foreground">{currentStaff.nameTa}</p>
            <p className="mt-1 truncate text-sm">{currentStaff.role}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge status={currentStaff.status} />
          <Badge variant="secondary">
            <BadgeCheck className="size-3.5" /> Crane licence valid
          </Badge>
          <Badge variant="secondary">
            <HardHat className="size-3.5" /> {site.code}
          </Badge>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <SectionHeading title="Details" />
        <dl className="divide-y divide-border text-sm">
          {[
            { label: "Phone", value: currentStaff.phone, icon: Phone },
            { label: "Assigned site", value: site.name, icon: HardHat },
            { label: "Skills", value: currentStaff.skills.join(", "), icon: BadgeCheck },
            { label: "Rating", value: `${currentStaff.rating} / 5`, icon: BadgeCheck },
          ].map((row) => (
            <div key={row.label} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-3">
              <dt className="flex min-w-0 items-center gap-2 text-muted-foreground">
                <row.icon className="size-4 shrink-0" />
                <span className="truncate">{row.label}</span>
              </dt>
              <dd className="truncate text-right font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <SectionHeading title="Preferences" subtitle="Saved on this device" />
        <ul className="divide-y divide-border">
          {[
            { label: "Shift reminders", hint: "30 min before start", icon: Bell, on: true },
            { label: "Tamil interface", hint: "தமிழ் · rolling out soon", icon: Languages, on: false },
          ].map((p) => (
            <li key={p.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <p.icon className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.hint}</p>
                </div>
              </div>
              <Switch defaultChecked={p.on} aria-label={p.label} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
