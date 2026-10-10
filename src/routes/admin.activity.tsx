import { createFileRoute } from "@tanstack/react-router";
import { ActivityFeed } from "@/components/shiftrio/activity-feed";
export const Route = createFileRoute("/admin/activity")({
 head: () => ({ meta: [{ title: "Activity log — Shiftrio" }, { name: "description", content: "Activity log for your Shiftrio organization." }, { property: "og:title", content: "Activity log — Shiftrio" }, { property: "og:description", content: "Organization updates and recorded activity." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
 component: () => <ActivityFeed audit=true />,
});
