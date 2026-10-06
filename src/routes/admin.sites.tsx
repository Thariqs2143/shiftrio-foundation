import { createFileRoute } from "@tanstack/react-router";
import { AdminRegistry } from "@/components/shiftrio/admin-registry";

export const Route = createFileRoute("/admin/sites")({
  head: () => ({ meta: [
    { title: "Sites — Shiftrio" },
    { name: "description", content: "Manage operating sites, addresses, status, and check-in boundaries." },
    { property: "og:title", content: "Sites — Shiftrio" },
    { property: "og:description", content: "Manage organization sites and check-in boundaries." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <AdminRegistry entity="sites" />,
});