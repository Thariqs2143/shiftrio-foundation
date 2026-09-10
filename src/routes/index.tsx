import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  HardHat,
  ShieldCheck,
  MapPin,
  Camera,
  Clock,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { ShiftrioLogo } from "@/components/shiftrio/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signInWithCredentials, DEMO_PIN } from "@/lib/session";
import type { Role } from "@/lib/models";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shiftrio — Shift & Workforce Control for Site Teams" },
      {
        name: "description",
        content:
          "Sign in to Shiftrio to start shifts, track attendance and monitor crews across construction and industrial sites.",
      },
      { property: "og:title", content: "Shiftrio — Shift & Workforce Control" },
      {
        property: "og:description",
        content:
          "Mobile-first shift tracking, attendance and live site activity for industrial and construction teams.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

const roles: {
  role: Role;
  title: string;
  blurb: string;
  icon: typeof HardHat;
  phone: string;
  workerId?: string;
}[] = [
  {
    role: "staff",
    title: "Staff",
    blurb: "Start your shift, log breaks, upload site photos.",
    icon: HardHat,
    phone: "98400 11223",
    workerId: "VIW-1042",
  },
  {
    role: "admin",
    title: "Admin",
    blurb: "Live crews, sites, attendance and approvals.",
    icon: ShieldCheck,
    phone: "98400 10101",
  },
];

function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("staff");
  const [phone, setPhone] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const active = roles.find((r) => r.role === role)!;

  function go(target: Role) {
    navigate({ to: target === "admin" ? "/admin" : "/staff" });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    // Simulated network latency so the demo shows a real loading state.
    window.setTimeout(() => {
      const result = signInWithCredentials({ role, phone, workerId, pin });
      setBusy(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      go(result.role);
    }, 350);
  }

  function fillDemo() {
    setError(null);
    setPhone(active.phone);
    setWorkerId(active.workerId ?? "");
    setPin(DEMO_PIN);
  }

  function demoLogin() {
    setError(null);
    signIn(role);
    go(role);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl lg:grid-cols-2">
        {/* Brand panel */}
        <section className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-surface-gradient p-10 lg:flex">
          <div className="hazard-stripe absolute inset-x-0 top-0 h-1.5" />
          <ShiftrioLogo tagline="Workforce & shift control" />
          <div>
            <h1 className="max-w-sm font-display text-5xl font-bold uppercase leading-[1.05]">
              Every shift, <span className="text-primary">accounted for.</span>
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Built for steel yards, precast plants and tower sites. One tap to clock in,
              one screen to see the whole crew.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                { icon: MapPin, text: "Geofenced check-in at the gate" },
                { icon: Camera, text: "Photo proof on every shift start" },
                { icon: Clock, text: "Live timers, breaks and overtime" },
              ].map((f) => (
                <li key={f.text} className="flex items-center gap-3 text-sm">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                    <f.icon className="size-4" />
                  </span>
                  <span className="min-w-0 text-muted-foreground">{f.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">English · தமிழ் ready</p>
        </section>

        {/* Login panel */}
        <section className="flex flex-col justify-center px-5 py-10 sm:px-10">
          <div className="mx-auto w-full max-w-sm">
            <div className="lg:hidden">
              <ShiftrioLogo tagline="Workforce & shift control" />
            </div>

            <h2 className="mt-8 font-display text-3xl font-bold uppercase leading-none">
              Sign in
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose how you're joining today's shift.
            </p>

            <div
              className="mt-6 grid gap-3 sm:grid-cols-2"
              role="radiogroup"
              aria-label="Select role"
            >
              {roles.map((r) => {
                const selected = r.role === role;
                return (
                  <button
                    key={r.role}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      setRole(r.role);
                      setError(null);
                    }}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition-colors",
                      selected
                        ? "border-primary bg-primary/10 shadow-glow"
                        : "border-border bg-surface hover:border-primary/40",
                    )}
                  >
                    <r.icon
                      className={cn(
                        "size-5",
                        selected ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                    <p className="mt-2 font-display text-lg font-bold uppercase leading-none">
                      {r.title}
                    </p>
                    <p className="mt-1 text-xs leading-snug text-muted-foreground">
                      {r.blurb}
                    </p>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="98400 11223"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {role === "staff" ? (
                <div className="space-y-2">
                  <Label htmlFor="workerId">Worker ID</Label>
                  <Input
                    id="workerId"
                    type="text"
                    placeholder="VIW-1042"
                    value={workerId}
                    onChange={(e) => setWorkerId(e.target.value)}
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="pin">4-digit PIN</Label>
                <Input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  autoComplete="current-password"
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                />
              </div>

              {error ? (
                <p role="alert" className="text-sm font-medium text-destructive">
                  {error}
                </p>
              ) : null}

              <Button
                type="submit"
                size="lg"
                disabled={busy}
                className="w-full font-display text-base uppercase tracking-wide"
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ArrowRight className="size-4" />
                )}
                {busy ? "Signing in" : `Continue as ${active.title}`}
              </Button>
            </form>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={fillDemo}>
                Fill demo details
              </Button>
              <Button type="button" variant="secondary" onClick={demoLogin}>
                Demo login
              </Button>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Demo build — sample data only. PIN for every demo account is {DEMO_PIN}.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
