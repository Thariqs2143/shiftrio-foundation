import { createFileRoute } from "@tanstack/react-router";
import { AdminOperations } from "@/components/shiftrio/admin-operations";
export const Route = createFileRoute("/admin/operations")({
  head: () => ({ meta: [
    { title: "Operations — Shiftrio" },
    { name: "description", content: "Live shifts, shift history, attendance and crew assignments." },
    { property: "og:title", content: "Operations — Shiftrio" },
    { property: "og:description", content: "Live shifts, shift history, attendance and crew assignments." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AdminOperations,
});
