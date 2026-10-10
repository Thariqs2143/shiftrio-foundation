import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Bell, Languages, LogOut, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShiftrioLogo } from "./brand";
import { signOut } from "@/lib/session";
import { useLang } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { toast } from "sonner";
export type NavItem = { to: string; label: string; icon: LucideIcon };
export function AppShell({ navItems, userName, userMeta, children }: { navItems: NavItem[]; userName: string; userMeta: string; children: React.ReactNode }) {
  const navigate = useNavigate(); const router = useRouter(); const { lang, setLang } = useLang(); const [drawer, setDrawer] = useState(false); const [busy, setBusy] = useState(false);
  const admin = navItems.some((item) => item.to === "/admin");
  async function handleSignOut() {
    setBusy(true);
    try { await router.options.context.queryClient.cancelQueries(); router.options.context.queryClient.clear(); const result = await supabase.auth.signOut(); if (result.error) throw result.error; signOut(); navigate({ to: "/", replace: true }); }
    catch { toast.error("Unable to sign out. Check your connection and try again."); } finally { setBusy(false); }
  }
  const items = navItems.slice(0, 5);
  const navigation = <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-1">{items.map((item, index) => <Button asChild key={item.to} variant="ghost" className={cn("h-11 justify-start px-3 text-muted-foreground", index === items.length - 1 && "mt-auto")}><Link to={item.to} onClick={() => setDrawer(false)} activeOptions={{ exact: item.to === "/admin" || item.to === "/staff" }} activeProps={{ className: "bg-primary/10 text-primary" }}><item.icon className="size-4 shrink-0" /><span>{item.label}</span></Link></Button>)}</nav>;
  return <div className="min-h-dvh bg-background"><a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-primary focus:p-3 focus:text-primary-foreground">Skip to content</a><div className="mx-auto flex w-full max-w-[1600px]">
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-8 border-r border-border bg-sidebar px-4 py-6 lg:flex"><ShiftrioLogo tagline="Shift control" />{navigation}<div className="border-t border-border pt-4"><p className="truncate text-sm font-semibold">{userName}</p><p className="mt-1 truncate text-xs text-muted-foreground">{userMeta}</p><Button variant="ghost" size="sm" className="mt-3 px-0 text-muted-foreground" disabled={busy} onClick={() => void handleSignOut()}><LogOut className="size-4" />Sign out</Button></div></aside>
    <div className="min-w-0 flex-1"><header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur"><div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6"><div className="flex min-w-0 items-center gap-3"><Button variant="ghost" size="icon" className="shrink-0 lg:hidden" aria-label="Open navigation" onClick={() => setDrawer(true)}><Menu className="size-5" /></Button><div className="min-w-0"><p className="truncate font-display text-lg font-bold uppercase">{userName}</p><p className="truncate text-xs text-muted-foreground">{userMeta}</p></div></div><div className="flex shrink-0 items-center gap-1"><Button asChild variant="ghost" size="icon"><Link to={admin ? "/admin/notifications" : "/staff/notifications"} aria-label="Notifications"><Bell className="size-4" /></Link></Button><Button variant="ghost" size="sm" onClick={() => setLang(lang === "en" ? "ta" : "en")} aria-label={`Switch language, currently ${lang === "en" ? "English" : "Tamil"}`}><Languages className="size-4" /><span>{lang === "en" ? "EN" : "TA"}</span></Button></div></div></header><main id="main-content" className="px-4 pb-28 pt-6 sm:px-6 lg:pb-10">{children}</main></div>
  </div><nav aria-label="Bottom navigation" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"><ul className="mx-auto grid max-w-lg grid-cols-5">{items.map((item) => <li key={item.to} className="min-w-0"><Link to={item.to} activeOptions={{ exact: item.to === "/admin" || item.to === "/staff" }} className="flex h-16 flex-col items-center justify-center gap-1 px-1 text-muted-foreground" activeProps={{ className: "bg-primary/10 text-primary" }}><item.icon className="size-5 shrink-0" /><span className="w-full truncate text-center text-[10px] font-semibold">{item.label}</span></Link></li>)}</ul></nav>
  <Sheet open={drawer} onOpenChange={setDrawer}><SheetContent side="left" className="flex w-72 flex-col gap-6"><SheetHeader><SheetTitle><ShiftrioLogo /></SheetTitle><SheetDescription>{userMeta}</SheetDescription></SheetHeader>{navigation}<Button variant="outline" disabled={busy} onClick={() => void handleSignOut()}><LogOut className="size-4" />Sign out</Button></SheetContent></Sheet></div>;
}
