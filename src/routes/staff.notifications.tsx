import { createFileRoute } from "@tanstack/react-router";
import { ActivityFeed } from "@/components/shiftrio/activity-feed";
export const Route = createFileRoute("/staff/notifications")({
 head: () => ({ meta: [{ title: "My notifications — Shiftrio" }, { name: "description", content: "My notifications for your Shiftrio organization." }, { property: "og:title", content: "My notifications — Shiftrio" }, { property: "og:description", content: "Organization updates and recorded activity." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
 component: () => <ActivityFeed audit=false />,
});
