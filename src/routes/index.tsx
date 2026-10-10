import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, HardHat, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { ShiftrioLogo } from "@/components/shiftrio/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Sign in — Shiftrio" },
    { name: "description", content: "Sign in to your Shiftrio organization to manage shifts and attendance." },
    { property: "og:title", content: "Sign in — Shiftrio" },
    { property: "og:description", content: "Your workforce and shifts, in one place." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: LoginPage,
});
function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"staff" | "admin">("staff");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) throw result.error;
      const user = result.data.user;
      if (!user) throw new Error("Unable to sign in. Please try again.");
      const membership = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      if (membership.error) throw membership.error;
      const admin = membership.data?.some((item) => item.role === "admin" || item.role === "manager");
      if (role === "admin" && !admin) throw new Error("This account does not have administrator access. Choose Staff to continue.");
      if (!membership.data?.length) { navigate({ to: "/register" }); return; }
      navigate({ to: role === "admin" && admin ? "/admin" : "/staff" });
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to sign in. Check your connection and try again."); }
    finally { setBusy(false); }
  }
  return <main className="flex min-h-dvh flex-col bg-background">
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between border-b border-border px-5 py-6"><ShiftrioLogo tagline="Workforce & shift control" /><span className="hidden text-xs text-muted-foreground sm:block">Your team. Your sites. Your shifts.</span></header>
    <section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10">
      <p className="text-eyebrow text-primary">Shiftrio</p><h1 className="mt-2 font-display text-4xl font-bold uppercase">Welcome back</h1><p className="mt-2 text-sm text-muted-foreground">Sign in to your organization.</p>
      <div className="mt-7 grid grid-cols-2 gap-2" aria-label="Account type">{(["staff", "admin"] as const).map((item) => <Button key={item} variant={role === item ? "secondary" : "outline"} className="h-12" aria-pressed={role === item} onClick={() => { setRole(item); setError(""); }}>{item === "staff" ? <HardHat className="size-4" /> : <ShieldCheck className="size-4" />}{item === "staff" ? "Staff" : "Admin / manager"}</Button>)}</div>
      <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-5"><div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" type="email" autoComplete="email" required placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} /></div><div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="password">Password</Label><Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link></div><div className="relative"><Input id="password" type={visible ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="pr-12" /><Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" aria-label={visible ? "Hide password" : "Show password"} onClick={() => setVisible(!visible)}>{visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</Button></div></div>{error ? <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}<Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}{busy ? "Signing in…" : "Sign in"}</Button></form>
      <p className="mt-6 text-center text-sm text-muted-foreground">New to Shiftrio? <Link to="/register" className="font-semibold text-primary hover:underline">Create an account</Link></p>
    </section><footer className="border-t border-border px-5 py-5 text-center text-xs text-muted-foreground">Shiftrio · Workforce & shift control</footer>
  </main>;
}
