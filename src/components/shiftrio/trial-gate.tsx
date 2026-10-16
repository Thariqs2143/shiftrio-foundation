import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useOrgPlan } from "@/lib/plan";

/** Shows a trial banner during the 7-day trial and sends users to /pricing once it has expired. */
export function TrialGate({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { state } = useOrgPlan();
  useEffect(() => {
    if (state?.kind === "expired") navigate({ to: "/pricing", replace: true });
  }, [state, navigate]);
  return (
    <>
      {state?.kind === "trial" && (
        <div className="bg-primary px-4 py-1.5 text-center text-xs font-semibold text-primary-foreground">
          Free trial · {state.daysLeft} day{state.daysLeft === 1 ? "" : "s"} left ·{" "}
          <Link to="/pricing" className="underline">See plans</Link>
        </div>
      )}
      {children}
    </>
  );
}
