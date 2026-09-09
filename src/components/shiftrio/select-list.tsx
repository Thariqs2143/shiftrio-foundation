import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { EmptyState } from "./empty-state";

export type SelectOption = {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: React.ReactNode;
  disabled?: boolean;
  keywords?: string;
};

export function SelectList({
  options,
  value,
  onChange,
  searchPlaceholder = "Search",
  emptyTitle = "Nothing to show",
  emptyBody = "Try a different search term.",
}: {
  options: SelectOption[];
  value: string | null;
  onChange: (id: string) => void;
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyBody?: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) =>
      `${o.title} ${o.subtitle ?? ""} ${o.meta ?? ""} ${o.keywords ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [options, query]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9"
          aria-label={searchPlaceholder}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={emptyTitle} body={emptyBody} />
      ) : (
        <ul className="space-y-2" role="radiogroup">
          {filtered.map((o) => {
            const selected = o.id === value;
            return (
              <li key={o.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={o.disabled}
                  onClick={() => onChange(o.id)}
                  className={cn(
                    "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
                    selected
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/40",
                    o.disabled && "cursor-not-allowed opacity-50 hover:border-border",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{o.title}</span>
                    {o.subtitle ? (
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {o.subtitle}
                      </span>
                    ) : null}
                    {o.meta ? (
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {o.meta}
                      </span>
                    ) : null}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {o.badge}
                    <span
                      className={cn(
                        "grid size-6 place-items-center rounded-full border",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border",
                      )}
                    >
                      {selected ? <Check className="size-3.5" /> : null}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
