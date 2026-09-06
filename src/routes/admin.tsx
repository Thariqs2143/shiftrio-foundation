import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, Users, MapPin, ClipboardCheck } from "lucide-react";
import { AppShell, type NavItem } from "@/components/shiftrio/app-shell";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const navItems: NavItem[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/workers", label: "Workers", icon: Users },
  { to: "/admin/sites", label: "Sites", icon: MapPin },
  { to: "/admin/attendance", label: "Attendance", icon: ClipboardCheck },
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
