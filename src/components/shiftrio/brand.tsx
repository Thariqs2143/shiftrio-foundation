import { cn } from "@/lib/utils";

export function ShiftrioMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-xl bg-brand-gradient text-primary-foreground shadow-glow",
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
      </svg>
    </span>
  );
}

export function ShiftrioLogo({
  className,
  tagline,
}: {
  className?: string;
  tagline?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <ShiftrioMark />
      <div className="min-w-0">
        <p className="truncate font-display text-xl font-bold uppercase leading-none tracking-wide">
          Shiftrio
        </p>
        {tagline ? (
          <p className="truncate text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
            {tagline}
          </p>
        ) : null}
      </div>
    </div>
  );
}
