import { createFileRoute } from "@tanstack/react-router";
import { ActivityFeed } from "@/components/shiftrio/activity-feed";
export const Route = createFileRoute("/admin/notifications")({
 head: () => ({ meta: [{ title: "Notifications — Shiftrio" }, { name: "description", content: "Notifications for your Shiftrio organization." }, { property: "og:title", content: "Notifications — Shiftrio" }, { property: "og:description", content: "Organization updates and recorded activity." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
 component: () => <ActivityFeed audit=false />,
});
