import { createFileRoute } from "@tanstack/react-router";
import { AdminRegistry } from "@/components/shiftrio/admin-registry";

export const Route = createFileRoute("/admin/operators")({
  head: () => ({ meta: [
    { title: "Operators — Shiftrio" },
    { name: "description", content: "Manage certified equipment operators and their site assignments." },
    { property: "og:title", content: "Operators — Shiftrio" },
    { property: "og:description", content: "Manage operator credentials, certifications, and sites." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <AdminRegistry entity="operators" />,
});