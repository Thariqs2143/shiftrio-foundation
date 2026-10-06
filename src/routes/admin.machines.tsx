import { createFileRoute } from "@tanstack/react-router";
import { AdminRegistry } from "@/components/shiftrio/admin-registry";

export const Route = createFileRoute("/admin/machines")({
  head: () => ({ meta: [
    { title: "Machines — Shiftrio" },
    { name: "description", content: "Manage equipment, operating status, and site allocation." },
    { property: "og:title", content: "Machines — Shiftrio" },
    { property: "og:description", content: "Equipment records and site allocation for Shiftrio." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <AdminRegistry entity="machines" />,
});