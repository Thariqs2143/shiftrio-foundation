import { createFileRoute } from "@tanstack/react-router";
import { AccountForm } from "@/components/shiftrio/account-form";
export const Route = createFileRoute("/forgot-password")({
 head: () => ({ meta: [{ title: "Forgot password — Shiftrio" }, { name: "description", content: "Forgot password for your Shiftrio organization." }, { property: "og:title", content: "Forgot password — Shiftrio" }, { property: "og:description", content: "Manage access to your Shiftrio account." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
 component: () => <AccountForm mode="forgot" />,
});
