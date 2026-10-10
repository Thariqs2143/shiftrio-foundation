import { createFileRoute } from "@tanstack/react-router";
import { AdminProfile } from "@/components/shiftrio/admin-profile";
export const Route = createFileRoute("/admin/profile")({
  head: () => ({ meta: [
    { title: "Profile — Shiftrio" },
    { name: "description", content: "Personal profile and organization shift policies." },
    { property: "og:title", content: "Profile — Shiftrio" },
    { property: "og:description", content: "Personal profile and organization shift policies." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AdminProfile,
});
