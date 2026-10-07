import { useEffect, useState } from "react";
import { AlertCircle, Building2, Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { getAdminAccess, type AdminAccess } from "@/lib/admin-access";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Organization = Tables<"organizations">;
type Profile = Tables<"profiles">;

export function AdminProfile() {
  const [access, setAccess] = useState<AdminAccess | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const authorized = await getAdminAccess();
        const [organizationResult, profileResult] = await Promise.all([
          supabase.from("organizations").select("*").eq("id", authorized.orgId).maybeSingle(),
          supabase.from("profiles").select("*").eq("id", authorized.userId).maybeSingle(),
        ]);
        if (organizationResult.error) throw organizationResult.error;
        if (profileResult.error) throw profileResult.error;
        if (alive) { setAccess(authorized); setOrganization(organizationResult.data); setProfile(profileResult.data); }
      } catch (error) { if (alive) setProblem(error instanceof Error ? error.message : "Unable to load account settings."); }
      finally { if (alive) setLoading(false); }
    }
    void load();
    return () => { alive = false; };
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!access || !organization || !profile) return;
    setSaving(true);
    try {
      const [organizationResult, profileResult] = await Promise.all([
        access.role === "admin" ? supabase.from("organizations").update({ name: organization.name.trim(), legal_name: organization.legal_name.trim(), industry: organization.industry.trim(), timezone: organization.timezone, contact_email: organization.contact_email.trim(), contact_phone: organization.contact_phone.trim(), standard_shift_hours: Number(organization.standard_shift_hours), overtime_after_hours: Number(organization.overtime_after_hours), geofence_radius_m: Number(organization.geofence_radius_m), require_check_in_photo: organization.require_check_in_photo, require_gps_verification: organization.require_gps_verification, auto_approve_attendance: organization.auto_approve_attendance }).eq("id", access.orgId) : Promise.resolve({ error: null }),
        supabase.from("profiles").update({ full_name: profile.full_name.trim(), phone: profile.phone.trim(), language: profile.language }).eq("id", access.userId),
      ]);
      if (organizationResult.error) throw organizationResult.error;
      if (profileResult.error) throw profileResult.error;
      toast.success("Profile and settings saved.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save settings."); }
    finally { setSaving(false); }
  }

  function editOrg<K extends keyof Organization>(key: K, value: Organization[K]) { setOrganization((previous) => previous ? { ...previous, [key]: value } : previous); }
  function editProfile<K extends keyof Profile>(key: K, value: Profile[K]) { setProfile((previous) => previous ? { ...previous, [key]: value } : previous); }

  if (loading) return <div className="mx-auto max-w-4xl space-y-3" aria-label="Loading profile"><div className="h-12 animate-pulse rounded-lg bg-muted" /><div className="h-72 animate-pulse rounded-lg bg-muted" /></div>;
  if (problem) return <div className="mx-auto max-w-4xl rounded-lg border border-destructive/30 bg-destructive/10 p-5" role="alert"><AlertCircle className="mb-2 size-5 text-destructive" /><h1 className="font-semibold">Account settings unavailable</h1><p className="mt-1 break-words text-sm text-muted-foreground">{problem}</p></div>;
  if (!organization || !profile) return <div className="mx-auto max-w-4xl rounded-lg border border-dashed border-border p-10 text-center"><h1 className="font-display text-xl font-bold uppercase">Profile setup incomplete</h1><p className="mt-2 text-sm text-muted-foreground">Your organization or user profile record is not available yet.</p></div>;

  return <div className="mx-auto max-w-4xl space-y-6">
    <header><p className="text-eyebrow text-muted-foreground">Account</p><h1 className="mt-1 font-display text-3xl font-bold uppercase">Profile & settings</h1><p className="mt-2 text-sm text-muted-foreground">Your identity, organization details, and shift policies.</p></header>
    <form onSubmit={(event) => void save(event)} className="space-y-6">
      <section className="space-y-5 border-b border-border pb-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-lg border border-border bg-muted"><UserRound className="size-5 text-primary" /></span><div><h2 className="font-display text-xl font-bold uppercase">Personal profile</h2><p className="text-sm text-muted-foreground">Role: {access?.role}</p></div></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="profile-name">Full name</Label><Input id="profile-name" required value={profile.full_name} onChange={(event) => editProfile("full_name", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="profile-email">Email</Label><Input id="profile-email" value={profile.email} readOnly aria-readonly="true" /></div><div className="space-y-2"><Label htmlFor="profile-phone">Phone</Label><Input id="profile-phone" type="tel" value={profile.phone} onChange={(event) => editProfile("phone", event.target.value)} /></div><div className="space-y-2"><Label>Language</Label><Select value={profile.language || "en"} onValueChange={(value) => editProfile("language", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="ta">தமிழ் · Tamil</SelectItem></SelectContent></Select></div></div></section>
      <section className="space-y-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-lg border border-border bg-muted"><Building2 className="size-5 text-primary" /></span><div><h2 className="font-display text-xl font-bold uppercase">Organization settings</h2><p className="text-sm text-muted-foreground">Operational defaults used across shifts and attendance.</p></div></div>{access?.role !== "admin" ? <p className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">Organization settings are read-only for manager accounts.</p> : null}<fieldset disabled={access?.role !== "admin"} className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="org-name">Organization name</Label><Input id="org-name" required value={organization.name} onChange={(event) => editOrg("name", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="org-legal">Legal name</Label><Input id="org-legal" value={organization.legal_name} onChange={(event) => editOrg("legal_name", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="org-industry">Industry</Label><Input id="org-industry" value={organization.industry} onChange={(event) => editOrg("industry", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="org-timezone">Timezone</Label><Input id="org-timezone" value={organization.timezone} onChange={(event) => editOrg("timezone", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="org-email">Contact email</Label><Input id="org-email" type="email" value={organization.contact_email} onChange={(event) => editOrg("contact_email", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="org-phone">Contact phone</Label><Input id="org-phone" type="tel" value={organization.contact_phone} onChange={(event) => editOrg("contact_phone", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="org-standard">Standard shift (hours)</Label><Input id="org-standard" type="number" min="1" max="24" step="0.5" value={organization.standard_shift_hours} onChange={(event) => editOrg("standard_shift_hours", Number(event.target.value))} /></div><div className="space-y-2"><Label htmlFor="org-overtime">Overtime after (hours)</Label><Input id="org-overtime" type="number" min="1" max="24" step="0.5" value={organization.overtime_after_hours} onChange={(event) => editOrg("overtime_after_hours", Number(event.target.value))} /></div><div className="space-y-2"><Label htmlFor="org-radius">GPS radius (meters)</Label><Input id="org-radius" type="number" min="0" max="50000" value={organization.geofence_radius_m} onChange={(event) => editOrg("geofence_radius_m", Number(event.target.value))} /></div><div className="space-y-2"><Label htmlFor="org-code">Staff join code</Label><Input id="org-code" value={organization.join_code} readOnly aria-readonly="true" /></div><div className="space-y-3 sm:col-span-2">{([["require_check_in_photo", "Require a check-in photo"], ["require_gps_verification", "Require GPS verification"], ["auto_approve_attendance", "Automatically approve attendance"]] as const).map(([key, label]) => <label key={key} className="flex items-center justify-between gap-4 rounded-md border border-border px-3 py-3 text-sm"><span>{label}</span><input type="checkbox" checked={organization[key]} onChange={(event) => editOrg(key, event.target.checked)} className="size-4 accent-primary" /></label>)}</div></fieldset></section>
      <div className="flex justify-end border-t border-border pt-4"><Button type="submit" disabled={saving}><Save className="size-4" />{saving ? "Saving…" : "Save changes"}</Button></div>
    </form>
  </div>;
}