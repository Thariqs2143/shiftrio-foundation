import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ShiftrioLogo } from "./brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export function AccountForm({ mode }: { mode: "register" | "forgot" | "reset" }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [name, setName] = useState(""); const [company, setCompany] = useState(""); const [code, setCode] = useState(""); const [phone, setPhone] = useState(""); const [employee, setEmployee] = useState("");
  const [join, setJoin] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      if (mode === "forgot") {
        const result = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` }); if (result.error) throw result.error;
        setSuccess("If an account exists for this email, a password reset link will arrive shortly.");
      } else if (mode === "reset") {
        const result = await supabase.auth.updateUser({ password }); if (result.error) throw result.error; setSuccess("Your password has been updated. You can now sign in.");
      } else {
        const existing = await supabase.auth.getUser();
        if (!existing.data.user) {
          const result = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${window.location.origin}/register`, data: { full_name: name } } }); if (result.error) throw result.error;
          if (!result.data.session) { setSuccess("Check your email to confirm your account. After confirmation, return here to finish joining your organization."); return; }
        }
        const result = join ? await supabase.rpc("join_organization", { _join_code: code, _full_name: name, _phone: phone, _employee_code: employee }) : await supabase.rpc("bootstrap_organization", { _org_name: company, _full_name: name, _phone: phone });
        if (result.error) throw result.error; navigate({ to: join ? "/staff" : "/admin" });
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to continue. Please try again."); } finally { setBusy(false); }
  }
  const title = mode === "register" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Choose a new password";
  return <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10"><ShiftrioLogo tagline="Workforce & shift control" /><h1 className="mt-8 font-display text-3xl font-bold uppercase">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{mode === "register" ? "Join your crew or set up your organization." : "Keep your Shiftrio account secure."}</p>{success ? <div role="status" className="mt-6 space-y-3 rounded-lg border border-success/30 bg-success/10 p-5"><CheckCircle2 className="size-6 text-success" /><p className="text-sm">{success}</p></div> : <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-4">{mode === "register" ? <><div className="grid grid-cols-2 gap-2"><Button type="button" variant={join ? "secondary" : "outline"} onClick={() => setJoin(true)} aria-pressed={join}>Join organization</Button><Button type="button" variant={!join ? "secondary" : "outline"} onClick={() => setJoin(false)} aria-pressed={!join}>Create organization</Button></div><div className="space-y-2"><Label htmlFor="full-name">Full name</Label><Input id="full-name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="organization">{join ? "Organization join code" : "Organization name"}</Label><Input id="organization" required value={join ? code : company} onChange={(e) => join ? setCode(e.target.value.toUpperCase()) : setCompany(e.target.value)} /></div>{join ? <div className="space-y-2"><Label htmlFor="employee">Worker ID</Label><Input id="employee" required value={employee} onChange={(e) => setEmployee(e.target.value)} /></div> : null}<div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></div></> : null}{mode !== "reset" ? <div className="space-y-2"><Label htmlFor="account-email">Email address</Label><Input id="account-email" required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div> : null}{mode !== "forgot" ? <div className="space-y-2"><Label htmlFor="new-password">Password</Label><Input id="new-password" required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /><p className="text-xs text-muted-foreground">At least 8 characters.</p></div> : null}{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : null}{busy ? "Please wait…" : mode === "forgot" ? "Send reset link" : mode === "reset" ? "Update password" : "Continue"}</Button></form>}<Button asChild variant="ghost" className="mt-5"><Link to="/"><ArrowLeft className="size-4" />Back to sign in</Link></Button></main>;
}
