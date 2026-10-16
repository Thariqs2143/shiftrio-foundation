import { describe, expect, it } from "vitest";
import { PLANS, planState, withGst } from "./plan";

const now = new Date("2026-10-16T00:00:00Z").getTime();

describe("plans", () => {
  it("trial lasts 7 days then expires", () => {
    const start = now;
    const trialEndsAt = new Date(start + 7 * 86_400_000).toISOString();
    expect(planState({ plan: "trial", trialEndsAt, subscriptionEndsAt: null }, now)).toEqual({ kind: "trial", daysLeft: 7 });
    expect(planState({ plan: "trial", trialEndsAt, subscriptionEndsAt: null }, start + 7 * 86_400_000 + 1).kind).toBe("expired");
  });
  it("monthly costs more than yearly over 12 months", () => {
    for (const p of PLANS) expect(p.price.monthly * 12).toBeGreaterThan(p.price.yearly);
  });
  it("adds 18% GST", () => {
    expect(withGst(36000)).toBe(42480);
  });
});
