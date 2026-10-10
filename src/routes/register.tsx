import { createFileRoute } from "@tanstack/react-router";
import { AccountForm } from "@/components/shiftrio/account-form";
export const Route = createFileRoute("/register")({
 head: () => ({ meta: [{ title: "Create account — Shiftrio" }, { name: "description", content: "Create account for your Shiftrio organization." }, { property: "og:title", content: "Create account — Shiftrio" }, { property: "og:description", content: "Manage access to your Shiftrio account." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
 component: () => <AccountForm mode="register" />,
});
