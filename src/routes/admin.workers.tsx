import { createFileRoute } from "@tanstack/react-router";
import { AdminRegistry } from "@/components/shiftrio/admin-registry";

export const Route = createFileRoute("/admin/workers")({
  head: () => ({ meta: [
    { title: "Workers — Shiftrio" },
    { name: "description", content: "Search, review, and manage worker records and site assignments." },
    { property: "og:title", content: "Workers — Shiftrio" },
    { property: "og:description", content: "Manage workforce records and site assignments." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <AdminRegistry entity="workers" />,
});