import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Activity, BarChart3, LayoutDashboard, User, Users } from "lucide-react";
import { AppShell, type NavItem } from "@/components/shiftrio/app-shell";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const navItems: NavItem[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/workers", label: "Team", icon: Users },
  { to: "/admin/operations", label: "Operations", icon: Activity },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/profile", label: "Profile", icon: User },
];

function AdminLayout() {
  const session = useSession("admin");
  return (
    <AppShell
      navItems={navItems}
      userName={session.name}
      userMeta={`Admin · ${session.siteCode}`}
    >
      <Outlet />
    </AppShell>
  );
}
