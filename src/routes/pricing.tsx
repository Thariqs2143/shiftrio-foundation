import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Loader2, Monitor, Smartphone, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  PLANS, PLAN_FEATURES, formatInr, gstOf, useOrgPlan, withGst, yearlySavingPct,
  type BillingCycle, type PlanId,
} from "@/lib/plan";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Plans & pricing — Shiftrio" },
      { name: "description", content: "Shiftrio Business and Business Plus plans, billed monthly or yearly, prices in INR plus 18% GST." },
      { property: "og:title", content: "Plans & pricing — Shiftrio" },
      { property: "og:description", content: "Workforce and shift management plans for industrial teams. 7-day free trial." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const navigate = useNavigate();
  const { plan: org, state } = useOrgPlan();
  const [cycle, setCycle] = useState<BillingCycle>("yearly");
  const [selected, setSelected] = useState<PlanId>("business_plus");
  const [open, setOpen] = useState(false);
  const expired = state?.kind === "expired";
  const current = PLANS.find((p) => p.id === selected)!;
  const base = current.price[cycle];

  return (
    <div className="min-h-dvh bg-background pb-36">
      <header className="bg-sidebar text-sidebar-foreground px-5 pt-6 pb-28">
        <div className="mx-auto flex max-w-3xl items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{cycle === "yearly" ? "Annual paid plan" : "Monthly paid plan"}</h1>
            <p className="text-sm opacity-80">{org?.orgName || "Shiftrio"}</p>
            {expired && <p className="mt-2 text-sm font-semibold text-primary">Your 7-day free trial has ended. Choose a plan to continue.</p>}
            {state?.kind === "trial" && <p className="mt-2 text-sm opacity-80">Free trial · {state.daysLeft} day{state.daysLeft === 1 ? "" : "s"} left</p>}
          </div>
          {!expired && (
            <button aria-label="Close" onClick={() => (window.history.length > 1 ? window.history.back() : navigate({ to: "/" }))}
              className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-current">
              <X className="size-5" />
            </button>
          )}
        </div>
        <div className="mx-auto mt-5 flex max-w-3xl">
          <div role="tablist" className="inline-flex rounded-full bg-sidebar-accent p-1">
            {(["monthly", "yearly"] as const).map((c) => (
              <button key={c} role="tab" aria-selected={cycle === c} onClick={() => setCycle(c)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${cycle === c ? "bg-primary text-primary-foreground" : "opacity-80"}`}>
                {c}{c === "yearly" && " · save more"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto -mt-20 max-w-3xl px-4">
        <div className="grid grid-cols-2 gap-3">
          {PLANS.map((p) => {
            const active = p.id === selected;
            return (
              <button key={p.id} onClick={() => setSelected(p.id)} aria-pressed={active}
                className={`relative rounded-xl border p-4 text-center shadow-md transition ${active ? "border-primary bg-primary text-primary-foreground" : "bg-card text-card-foreground"} ${p.popular ? "mt-0" : "mt-0"}`}>
                {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground ring-2 ring-background">POPULAR</span>}
                <div className="text-lg font-bold sm:text-xl">{p.name}</div>
                <div className="my-3 border-t border-dashed border-current opacity-40" />
                {cycle === "yearly" && <div className="text-sm line-through opacity-60">{formatInr(p.listYearly)}</div>}
                <div className="text-xl font-bold sm:text-2xl">{formatInr(p.price[cycle])}</div>
                <div className="text-sm font-medium">Per {cycle === "yearly" ? "Year" : "Month"} + GST</div>
                <div className="text-xs opacity-75">{p.users} users included</div>
                {cycle === "yearly" && <div className="mt-1 text-xs font-semibold">Save {yearlySavingPct(p)}% vs monthly</div>}
                <div className="mt-3 flex justify-center gap-3"><Smartphone className="size-6" /><Monitor className="size-6" /></div>
              </button>
            );
          })}
        </div>

        <section className="mt-5 rounded-2xl border bg-card p-4">
          <h2 className="mb-3 font-semibold">Everything in {current.name}</h2>
          <ul className="space-y-2">
            {PLAN_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 rounded-lg bg-muted/60 p-3 text-sm">
                <Check className="size-4 shrink-0 text-primary" />{f}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-4 rounded-2xl border bg-card p-4 text-sm">
          <div className="flex justify-between"><span>{current.name} ({cycle})</span><span>{formatInr(base)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>GST 18%</span><span>{formatInr(gstOf(base))}</span></div>
          <div className="mt-2 flex justify-between border-t pt-2 font-bold"><span>Total per {cycle === "yearly" ? "year" : "month"}</span><span>{formatInr(withGst(base))}</span></div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 rounded-t-2xl border-t bg-background p-4">
        <div className="mx-auto max-w-3xl">
          <Button className="h-12 w-full text-base" onClick={() => setOpen(true)}>
            Contact us to upgrade · {formatInr(withGst(base))}
          </Button>
        </div>
      </div>

      <RequestDialog open={open} onOpenChange={setOpen} orgId={org?.orgId} planId={selected} cycle={cycle} />
    </div>
  );
}

function RequestDialog({ open, onOpenChange, orgId, planId, cycle }: {
  open: boolean; onOpenChange: (o: boolean) => void; orgId?: string; planId: PlanId; cycle: BillingCycle;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const plan = PLANS.find((p) => p.id === planId)!;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) return toast.error("Sign in with your company admin account to request an upgrade.");
    if (name.trim().length < 2 || !/^[+\d\s-]{8,15}$/.test(phone.trim())) return toast.error("Enter your name and a valid phone number.");
    setBusy(true);
    const { error } = await (supabase.from as unknown as (t: string) => { insert: (v: object) => Promise<{ error: Error | null }> })("plan_requests")
      .insert({ org_id: orgId, plan: planId, billing_cycle: cycle, contact_name: name.trim(), contact_phone: phone.trim(), message: message.trim().slice(0, 1000) });
    setBusy(false);
    if (error) return toast.error(error.message.includes("row-level") ? "Only company admins or managers can request an upgrade." : error.message);
    toast.success("Request sent. Our team will call you shortly.");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upgrade to {plan.name}</DialogTitle>
          <DialogDescription>{formatInr(plan.price[cycle])} per {cycle === "yearly" ? "year" : "month"} + 18% GST. We'll contact you to complete the payment.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label htmlFor="rq-name">Your name</Label><Input id="rq-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></div>
          <div><Label htmlFor="rq-phone">Phone</Label><Input id="rq-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={15} /></div>
          <div><Label htmlFor="rq-msg">Message (optional)</Label><Textarea id="rq-msg" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} /></div>
          <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="mr-2 size-4 animate-spin" />}Send request</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
