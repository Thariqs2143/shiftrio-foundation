import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = false,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface-gradient p-4 shadow-elevated",
        accent && "border-primary/40",
        className,
      )}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <p className="min-w-0 text-eyebrow text-muted-foreground">{label}</p>
        {Icon ? (
          <Icon
            className={cn("size-4 shrink-0", accent ? "text-primary" : "text-muted-foreground")}
          />
        ) : null}
      </div>
      <p
        className={cn(
          "mt-2 font-display text-3xl font-bold leading-none",
          accent && "text-primary",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function SectionHeading({
  title,
  action,
  subtitle,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 pb-3">
      <div className="min-w-0">
        <h2 className="truncate font-display text-lg font-bold uppercase tracking-wide">
          {title}
        </h2>
        {subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
