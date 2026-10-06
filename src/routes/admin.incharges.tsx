import { createFileRoute } from "@tanstack/react-router";
import { AdminRegistry } from "@/components/shiftrio/admin-registry";

export const Route = createFileRoute("/admin/incharges")({
  head: () => ({ meta: [
    { title: "In-charges — Shiftrio" },
    { name: "description", content: "Manage site in-charges, contact details, and shift preferences." },
    { property: "og:title", content: "In-charges — Shiftrio" },
    { property: "og:description", content: "Manage site leadership and shift preferences." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <AdminRegistry entity="incharges" />,
});