import { createFileRoute } from "@tanstack/react-router";
import { AccountForm } from "@/components/shiftrio/account-form";
export const Route = createFileRoute("/reset-password")({
 head: () => ({ meta: [{ title: "Reset password — Shiftrio" }, { name: "description", content: "Reset password for your Shiftrio organization." }, { property: "og:title", content: "Reset password — Shiftrio" }, { property: "og:description", content: "Manage access to your Shiftrio account." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
 component: () => <AccountForm mode="reset" />,
});
