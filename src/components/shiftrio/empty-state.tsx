import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  body,
  icon: Icon = Inbox,
  action,
}: {
  title: string;
  body?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 px-5 py-10 text-center">
      <span className="mx-auto grid size-11 place-items-center rounded-xl border border-border bg-surface text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <p className="mt-3 font-display text-base font-bold uppercase">{title}</p>
      {body ? (
        <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-muted-foreground">
          {body}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
