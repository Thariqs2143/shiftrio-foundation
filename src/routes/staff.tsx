import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Home, CalendarClock, User } from "lucide-react";
import { AppShell, type NavItem } from "@/components/shiftrio/app-shell";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/staff")({
  component: StaffLayout,
});

const navItems: NavItem[] = [
  { to: "/staff", label: "Home", icon: Home },
  { to: "/staff/timesheet", label: "Timesheet", icon: CalendarClock },
  { to: "/staff/profile", label: "Profile", icon: User },
];

function StaffLayout() {
  const session = useSession("staff");
  return (
    <AppShell
      navItems={navItems}
      userName={session.name}
      userMeta={`Crew · ${session.siteCode}`}
    >
      <Outlet />
    </AppShell>
  );
}
