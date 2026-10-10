import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/components/shiftrio/admin-dashboard";
export const Route = createFileRoute("/admin/")({
 head: () => ({ meta: [{ title: "Site control — Shiftrio" }, { name: "description", content: "Your organization’s active shifts, workforce, sites and recent activity." }, { property: "og:title", content: "Site control — Shiftrio" }, { property: "og:description", content: "Monitor workforce and shift activity across your organization." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: AdminDashboard,
});
