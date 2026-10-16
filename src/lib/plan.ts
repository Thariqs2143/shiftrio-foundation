import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const GST_RATE = 0.18;
export const TRIAL_DAYS = 7;

export type BillingCycle = "monthly" | "yearly";
export type PlanId = "business" | "business_plus";

export type PlanDef = {
  id: PlanId;
  name: string;
  users: number;
  popular?: boolean;
  /** Price excluding GST, in INR. Monthly is charged per month; yearly per year. */
  price: Record<BillingCycle, number>;
  /** Strikethrough list price shown on the yearly plan. */
  listYearly: number;
};

export const PLANS: PlanDef[] = [
  { id: "business", name: "Business", users: 3, price: { monthly: 3900, yearly: 36000 }, listYearly: 46800 },
  { id: "business_plus", name: "Business Plus", users: 3, popular: true, price: { monthly: 4900, yearly: 45000 }, listYearly: 58500 },
];

export const PLAN_FEATURES = [
  "Unlimited sites & projects",
  "Live shift tracking with GPS check-in",
  "Check-in & check-out photos",
  "Labour attendance & hours",
  "Machines, operators & incharges",
  "Shift assignments & roster",
  "Reports with CSV export",
  "Notifications & activity log",
];

export function withGst(amount: number) {
  return Math.round(amount * (1 + GST_RATE));
}
export function gstOf(amount: number) {
  return Math.round(amount * GST_RATE);
}
export function formatInr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}
/** Percentage saved on yearly vs paying monthly for 12 months. */
export function yearlySavingPct(plan: PlanDef) {
  const monthlyYear = plan.price.monthly * 12;
  return Math.round(((monthlyYear - plan.price.yearly) / monthlyYear) * 100);
}

export type OrgPlan = {
  orgId: string;
  orgName: string;
  plan: string;
  trialEndsAt: string;
  subscriptionEndsAt: string | null;
};

export type PlanState = { kind: "trial"; daysLeft: number } | { kind: "expired" } | { kind: "paid" };

export function planState(p: Pick<OrgPlan, "plan" | "trialEndsAt" | "subscriptionEndsAt">, now = Date.now()): PlanState {
  if (p.plan !== "trial" && (!p.subscriptionEndsAt || new Date(p.subscriptionEndsAt).getTime() > now)) return { kind: "paid" };
  const ms = new Date(p.trialEndsAt).getTime() - now;
  if (p.plan === "trial" && ms > 0) return { kind: "trial", daysLeft: Math.max(1, Math.ceil(ms / 86_400_000)) };
  return { kind: "expired" };
}

export async function fetchOrgPlan(): Promise<OrgPlan | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", auth.user.id).maybeSingle();
  if (!profile) return null;
  const { data } = await supabase.from("organizations").select("*").eq("id", profile.org_id).maybeSingle();
  if (!data) return null;
  const row = data as Record<string, unknown>;
  return {
    orgId: String(row.id),
    orgName: String(row.name ?? ""),
    plan: String(row.plan ?? "trial"),
    trialEndsAt: String(row.trial_ends_at ?? new Date().toISOString()),
    subscriptionEndsAt: (row.subscription_ends_at as string | null) ?? null,
  };
}

export function useOrgPlan() {
  const [plan, setPlan] = useState<OrgPlan | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    fetchOrgPlan()
      .then((p) => alive && setPlan(p))
      .catch(() => undefined)
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, []);
  return { plan, loaded, state: plan ? planState(plan) : null };
}
