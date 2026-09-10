import { Link, useNavigate } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { LogOut, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShiftrioLogo } from "./brand";
import { signOut } from "@/lib/session";
import { useLang } from "@/lib/i18n";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

export function AppShell({
  navItems,
  userName,
  userMeta,
  children,
}: {
  navItems: NavItem[];
  userName: string;
  userMeta: string;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const { lang, setLang } = useLang();

  function handleSignOut() {
    signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-7xl">
        {/* Desktop side navigation */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 border-r border-border bg-sidebar px-4 py-6 lg:flex">
          <ShiftrioLogo tagline="Shift control" />
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to.split("/").length <= 2 }}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                activeProps={{
                  className:
                    "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary",
                }}
              >
                <item.icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl border border-border bg-surface p-3">
            <p className="truncate text-sm font-semibold">{userName}</p>
            <p className="truncate text-xs text-muted-foreground">{userMeta}</p>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="size-3.5" /> Sign out
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Mobile / shared top bar */}
          <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
              <div className="min-w-0 lg:hidden">
                <ShiftrioLogo tagline={userMeta} />
              </div>
              <div className="hidden min-w-0 lg:block">
                <p className="truncate font-display text-lg font-bold uppercase tracking-wide">
                  {userName}
                </p>
                <p className="truncate text-xs text-muted-foreground">{userMeta}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLang(lang === "en" ? "ta" : "en")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={`Switch language, currently ${lang === "en" ? "English" : "Tamil"}`}
                >
                  <Languages className="size-3.5" /> {lang === "en" ? "EN" : "TA"}
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground lg:hidden"
                  aria-label="Sign out"
                >
                  <LogOut className="size-4" />
                </button>
              </div>
            </div>
          </header>

          <main className="px-4 pb-28 pt-4 lg:pb-10 lg:pt-6">{children}</main>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur lg:hidden">
        <ul
          className="grid"
          style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0,1fr))` }}
        >
          {navItems.map((item) => (
            <li key={item.to} className="min-w-0">
              <Link
                to={item.to}
                activeOptions={{ exact: item.to.split("/").length <= 2 }}
                className={cn(
                  "flex flex-col items-center gap-1 px-1 py-2.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground transition-colors",
                )}
                activeProps={{ className: "text-primary" }}
              >
                <item.icon className="size-5 shrink-0" />
                <span className="w-full truncate text-center">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
