import { createFileRoute } from "@tanstack/react-router";
import { AdminReports } from "@/components/shiftrio/admin-reports";
export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [
    { title: "Reports — Shiftrio" },
    { name: "description", content: "Hours, attendance, site summaries and CSV reports." },
    { property: "og:title", content: "Reports — Shiftrio" },
    { property: "og:description", content: "Hours, attendance, site summaries and CSV reports." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AdminReports,
});
