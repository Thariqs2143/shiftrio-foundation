import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { CalendarCheck, ClipboardList, Home, User } from "lucide-react";
import { AppShell, type NavItem } from "@/components/shiftrio/app-shell";
import { useLang } from "@/lib/i18n";
import { useStaffIdentity, useStoredSession } from "@/lib/session";
import { useDb } from "@/lib/store";
import { useHydrated } from "@/lib/use-now";

export const Route = createFileRoute("/staff")({
  component: StaffLayout,
});

function StaffLayout() {
  const { t } = useLang();
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const session = useStoredSession();
  const identity = useStaffIdentity();
  const db = useDb();

  // Demo gate: without a stored session, send people back to sign in.
  useEffect(() => {
    if (hydrated && !session) navigate({ to: "/", replace: true });
  }, [hydrated, session, navigate]);

  const navItems: NavItem[] = [
    { to: "/staff", label: t("home"), icon: Home },
    { to: "/staff/history", label: t("history"), icon: ClipboardList },
    { to: "/staff/attendance", label: t("attendance"), icon: CalendarCheck },
    { to: "/staff/profile", label: t("profile"), icon: User },
  ];

  const site = db.sites.find((s) => s.id === identity?.worker.siteId);

  return (
    <AppShell
      navItems={navItems}
      userName={identity?.worker.name ?? "Shiftrio worker"}
      userMeta={`${identity?.worker.designation ?? "Crew"} · ${site?.code ?? "Unassigned"}`}
    >
      <Outlet />
    </AppShell>
  );
}
