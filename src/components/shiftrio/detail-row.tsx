export function DetailRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-start gap-3 py-2.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0">
        <span className="block break-words text-sm font-medium">{value}</span>
        {hint ? (
          <span className="mt-0.5 block break-words text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </span>
    </div>
  );
}

export function DetailCard({
  title,
  children,
  action,
}: {
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      {title ? (
        <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h2 className="font-display text-lg font-bold uppercase leading-none">{title}</h2>
          {action}
        </div>
      ) : null}
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}
