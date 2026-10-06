import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertCircle, ArrowUpRight, Plus, Search, Users, Wrench, MapPin, HardHat, UserRoundCog, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Tables, TablesInsert } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type Entity = "workers" | "sites" | "machines" | "operators" | "incharges";
type Field = { key: string; label: string; type?: "text" | "email" | "tel" | "number" | "textarea" | "select" | "tags"; required?: boolean; options?: readonly { value: string; label: string }[]; min?: number; step?: string };
type RegistryRow = Record<string, unknown> & { id: string; name: string; status?: string; site_id?: string | null };
type FormState = Record<string, string>;

const siteStatuses = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "closed", label: "Closed" },
] as const;
const workerStatuses = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "on_leave", label: "On leave" },
] as const;
const machineStatuses = [
  { value: "available", label: "Available" },
  { value: "in_use", label: "In use" },
  { value: "maintenance", label: "Maintenance" },
] as const;
const operatorStatuses = [
  { value: "available", label: "Available" },
  { value: "assigned", label: "Assigned" },
  { value: "off_duty", label: "Off duty" },
] as const;
const shiftPreferences = [
  { value: "day", label: "Day" },
  { value: "night", label: "Night" },
  { value: "any", label: "Any shift" },
] as const;

const siteField: Field = { key: "site_id", label: "Assigned site", type: "select" };

const definitions: Record<Entity, { title: string; singular: string; subtitle: string; description: string; icon: typeof Users; fields: Field[]; search: string[]; statuses: readonly { value: string; label: string }[] }> = {
  workers: {
    title: "Workers", singular: "worker", subtitle: "Crew directory", description: "Manage workforce records and site assignments.", icon: Users,
    search: ["name", "employee_code", "designation", "phone"], statuses: workerStatuses,
    fields: [
      { key: "name", label: "Full name", required: true }, { key: "name_ta", label: "Tamil name" },
      { key: "employee_code", label: "Worker ID", required: true }, { key: "designation", label: "Trade / designation", required: true },
      { key: "phone", label: "Phone", type: "tel" }, siteField, { key: "skills", label: "Skills (comma separated)", type: "tags" },
      { key: "status", label: "Status", type: "select", required: true, options: workerStatuses },
    ],
  },
  sites: {
    title: "Sites", singular: "site", subtitle: "Locations and access", description: "Maintain operating locations and check-in boundaries.", icon: MapPin,
    search: ["name", "code", "city", "address"], statuses: siteStatuses,
    fields: [
      { key: "name", label: "Site name", required: true }, { key: "code", label: "Site code", required: true },
      { key: "city", label: "City" }, { key: "address", label: "Address", type: "textarea" },
      { key: "headcount_target", label: "Headcount target", type: "number", min: 0 },
      { key: "status", label: "Status", type: "select", required: true, options: siteStatuses },
      { key: "geofence_radius_m", label: "Geofence radius (m)", type: "number", min: 0 },
      { key: "lat", label: "Latitude", type: "number", min: -90, step: "any" }, { key: "lng", label: "Longitude", type: "number", min: -180, step: "any" },
    ],
  },
  machines: {
    title: "Machines", singular: "machine", subtitle: "Equipment register", description: "Track equipment availability and site allocation.", icon: Wrench,
    search: ["name", "code", "category"], statuses: machineStatuses,
    fields: [
      { key: "name", label: "Machine name", required: true }, { key: "code", label: "Asset code", required: true },
      { key: "category", label: "Category", required: true }, siteField,
      { key: "status", label: "Status", type: "select", required: true, options: machineStatuses },
      { key: "hours_run", label: "Run hours", type: "number", min: 0, step: "any" }, { key: "last_serviced_at", label: "Last serviced", type: "text" },
    ],
  },
  operators: {
    title: "Operators", singular: "operator", subtitle: "Certified operators", description: "Manage operator credentials, equipment certifications, and site assignments.", icon: HardHat,
    search: ["name", "phone", "license_no"], statuses: operatorStatuses,
    fields: [
      { key: "name", label: "Full name", required: true }, { key: "phone", label: "Phone", type: "tel" },
      { key: "license_no", label: "License number" }, { key: "certified_for", label: "Certified equipment (comma separated)", type: "tags" },
      siteField, { key: "status", label: "Status", type: "select", required: true, options: operatorStatuses },
    ],
  },
  incharges: {
    title: "In-charges", singular: "in-charge", subtitle: "Site leadership", description: "Maintain supervisors and their site and shift preferences.", icon: UserRoundCog,
    search: ["name", "phone", "email"], statuses: shiftPreferences,
    fields: [
      { key: "name", label: "Full name", required: true }, { key: "phone", label: "Phone", type: "tel" },
      { key: "email", label: "Email", type: "email" }, siteField,
      { key: "shift_preference", label: "Shift preference", type: "select", required: true, options: shiftPreferences },
    ],
  },
};

const relatedScreens: { entity: Entity; title: string; to: "/admin/machines" | "/admin/operators" | "/admin/incharges" }[] = [
  { entity: "machines", title: "Machines", to: "/admin/machines" },
  { entity: "operators", title: "Operators", to: "/admin/operators" },
  { entity: "incharges", title: "In-charges", to: "/admin/incharges" },
];

function rowValue(row: RegistryRow, key: string) {
  const value = row[key];
  if (Array.isArray(value)) return value.map(String).join(", ");
  return value === null || value === undefined ? "" : String(value);
}

function emptyForm(entity: Entity): FormState {
  const values: FormState = {};
  for (const field of definitions[entity].fields) values[field.key] = "";
  if (entity === "workers") values.status = "active";
  if (entity === "sites") { values.status = "active"; values.headcount_target = "20"; values.geofence_radius_m = "150"; }
  if (entity === "machines") { values.status = "available"; values.hours_run = "0"; }
  if (entity === "operators") values.status = "available";
  if (entity === "incharges") values.shift_preference = "any";
  return values;
}

function formFromRow(entity: Entity, row: RegistryRow): FormState {
  return Object.fromEntries(definitions[entity].fields.map((field) => [field.key, rowValue(row, field.key)]));
}

function numeric(value: string, nullable = false) {
  if (!value.trim() && nullable) return null;
  if (!value.trim()) return 0;
  return Number(value);
}

function toPayload(entity: Entity, form: FormState, orgId: string) {
  const siteId = form.site_id || null;
  switch (entity) {
    case "workers":
      return {
        org_id: orgId, name: form.name.trim(), name_ta: form.name_ta.trim() || null,
        employee_code: form.employee_code.trim(), designation: form.designation.trim(), phone: form.phone.trim(),
        site_id: siteId, skills: form.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
        status: form.status as Database["public"]["Enums"]["worker_status"],
      } satisfies TablesInsert<"workers">;
    case "sites":
      return {
        org_id: orgId, name: form.name.trim(), code: form.code.trim().toUpperCase(), city: form.city.trim(), address: form.address.trim(),
        headcount_target: numeric(form.headcount_target), status: form.status as Database["public"]["Enums"]["site_status"],
        geofence_radius_m: numeric(form.geofence_radius_m), lat: numeric(form.lat, true), lng: numeric(form.lng, true),
      } satisfies TablesInsert<"sites">;
    case "machines":
      return {
        org_id: orgId, name: form.name.trim(), code: form.code.trim().toUpperCase(), category: form.category.trim(), site_id: siteId,
        status: form.status as Database["public"]["Enums"]["machine_status"], hours_run: numeric(form.hours_run),
        last_serviced_at: form.last_serviced_at.trim() || null,
      } satisfies TablesInsert<"machines">;
    case "operators":
      return {
        org_id: orgId, name: form.name.trim(), phone: form.phone.trim(), license_no: form.license_no.trim(), site_id: siteId,
        certified_for: form.certified_for.split(",").map((skill) => skill.trim()).filter(Boolean),
        status: form.status as Database["public"]["Enums"]["operator_status"],
      } satisfies TablesInsert<"operators">;
    case "incharges":
      return {
        org_id: orgId, name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(), site_id: siteId,
        shift_preference: form.shift_preference,
      } satisfies TablesInsert<"incharges">;
  }
}

async function getRows(entity: Entity, orgId: string): Promise<RegistryRow[]> {
  switch (entity) {
    case "workers": {
      const { data, error } = await supabase.from("workers").select("*").eq("org_id", orgId).order("name");
      if (error) throw error;
      return (data ?? []) as unknown as RegistryRow[];
    }
    case "sites": {
      const { data, error } = await supabase.from("sites").select("*").eq("org_id", orgId).order("name");
      if (error) throw error;
      return (data ?? []) as unknown as RegistryRow[];
    }
    case "machines": {
      const { data, error } = await supabase.from("machines").select("*").eq("org_id", orgId).order("name");
      if (error) throw error;
      return (data ?? []) as unknown as RegistryRow[];
    }
    case "operators": {
      const { data, error } = await supabase.from("operators").select("*").eq("org_id", orgId).order("name");
      if (error) throw error;
      return (data ?? []) as unknown as RegistryRow[];
    }
    case "incharges": {
      const { data, error } = await supabase.from("incharges").select("*").eq("org_id", orgId).order("name");
      if (error) throw error;
      return (data ?? []) as unknown as RegistryRow[];
    }
  }
}

async function saveRow(entity: Entity, id: string | null, form: FormState, orgId: string) {
  const payload = toPayload(entity, form, orgId);
  async function save<T extends Entity>(target: T) {
    const table = target;
    if (id) {
      const { error } = await supabase.from(table).update(payload as never).eq("id", id).eq("org_id", orgId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from(table).insert(payload as never);
      if (error) throw error;
    }
  }
  await save(entity);
}

async function deleteRow(entity: Entity, id: string, orgId: string) {
  switch (entity) {
    case "workers": return supabase.from("workers").delete().eq("id", id).eq("org_id", orgId);
    case "sites": return supabase.from("sites").delete().eq("id", id).eq("org_id", orgId);
    case "machines": return supabase.from("machines").delete().eq("id", id).eq("org_id", orgId);
    case "operators": return supabase.from("operators").delete().eq("id", id).eq("org_id", orgId);
    case "incharges": return supabase.from("incharges").delete().eq("id", id).eq("org_id", orgId);
  }
}

function statusLabel(value?: string) {
  return value?.replaceAll("_", " ") ?? "Recorded";
}

export function AdminRegistry({ entity }: { entity: Entity }) {
  const config = definitions[entity];
  const Icon = config.icon;
  const [orgId, setOrgId] = useState("");
  const [records, setRecords] = useState<RegistryRow[]>([]);
  const [sites, setSites] = useState<RegistryRow[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [viewRow, setViewRow] = useState<RegistryRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RegistryRow | null>(null);
  const [editing, setEditing] = useState<RegistryRow | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(entity));

  async function loadData(organizationId = orgId) {
    if (!organizationId) return;
    setProblem("");
    const [rowsResult, sitesResult] = await Promise.all([
      getRows(entity, organizationId),
      entity === "sites" ? Promise.resolve([] as RegistryRow[]) : getRows("sites", organizationId),
    ]);
    setRecords(rowsResult);
    setSites(sitesResult);
  }

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      setLoading(true);
      setProblem("");
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!authData.user) throw new Error("Sign in with an administrator account to manage organization records.");
        const { data: membership, error: membershipError } = await supabase
          .from("user_roles").select("org_id, role").eq("user_id", authData.user.id)
          .in("role", ["admin", "manager"]).limit(1).maybeSingle();
        if (membershipError) throw membershipError;
        if (!membership) throw new Error("Your account does not have organization administrator access.");
        if (cancelled) return;
        setOrgId(membership.org_id);
        const [rows, siteRows] = await Promise.all([
          getRows(entity, membership.org_id),
          entity === "sites" ? Promise.resolve([] as RegistryRow[]) : getRows("sites", membership.org_id),
        ]);
        if (!cancelled) { setRecords(rows); setSites(siteRows); }
      } catch (error) {
        if (!cancelled) setProblem(error instanceof Error ? error.message : "Unable to load organization records.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void initialize();
    return () => { cancelled = true; };
  }, [entity]);

  const siteNames = useMemo(() => new Map(sites.map((site) => [site.id, `${site.name}${rowValue(site, "code") ? ` · ${rowValue(site, "code")}` : ""}`])), [sites]);
  const filtered = useMemo(() => records.filter((row) => {
    const matchesQuery = config.search.some((key) => rowValue(row, key).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
    const matchesStatus = statusFilter === "all" || row.status === statusFilter || row.shift_preference === statusFilter;
    const matchesSite = siteFilter === "all" || row.site_id === siteFilter;
    return matchesQuery && matchesStatus && matchesSite;
  }), [config.search, records, query, statusFilter, siteFilter]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm(entity));
    setFormOpen(true);
  }

  function openEdit(row: RegistryRow) {
    setViewRow(null);
    setEditing(row);
    setForm(formFromRow(entity, row));
    setFormOpen(true);
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await saveRow(entity, editing?.id ?? null, form, orgId);
      await loadData();
      setFormOpen(false);
      toast.success(`${config.singular[0]?.toUpperCase()}${config.singular.slice(1)} ${editing ? "updated" : "added"}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Could not save this ${config.singular}.`);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    const { error } = await deleteRow(entity, deleteTarget.id, orgId);
    if (error) toast.error(error.message);
    else {
      toast.success(`${config.singular[0]?.toUpperCase()}${config.singular.slice(1)} removed.`);
      setViewRow(null);
      await loadData();
    }
    setDeleteTarget(null);
    setSaving(false);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-eyebrow text-muted-foreground">Organization · Directory</p>
          <h1 className="mt-1 font-display text-3xl font-bold uppercase leading-none">{config.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{config.description}</p>
        </div>
        <Button onClick={openCreate} className="w-full shrink-0 sm:w-auto"><Plus className="size-4" /> Add {config.singular}</Button>
      </header>

      {entity !== "workers" && entity !== "sites" ? (
        <nav aria-label="Equipment and team records" className="flex gap-1 overflow-x-auto border-b border-border">
          {relatedScreens.map((screen) => (
            <Button key={screen.entity} asChild variant={screen.entity === entity ? "secondary" : "ghost"} size="sm" className="shrink-0 rounded-b-none">
              <Link to={screen.to}>{screen.title}</Link>
            </Button>
          ))}
        </nav>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total {config.title.toLowerCase()}</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums">{loading ? "—" : records.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Showing</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums">{loading ? "—" : filtered.length}</p>
        </div>
        <div className="col-span-2 rounded-lg border border-border bg-card p-4 sm:col-span-1">
          <p className="text-xs text-muted-foreground">Sites in directory</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums">{loading ? "—" : entity === "sites" ? records.length : sites.length}</p>
        </div>
      </div>

      {problem ? (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4" role="alert">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div className="min-w-0"><p className="font-semibold">Records unavailable</p><p className="mt-1 break-words text-sm text-muted-foreground">{problem}</p></div>
        </div>
      ) : null}

      <section className="space-y-4" aria-label={`${config.title} directory`}>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px_180px]">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label={`Search ${config.title.toLowerCase()}`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${config.title.toLowerCase()}…`} className="pl-9" />
          </div>
          {config.statuses.length > 0 ? (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger aria-label="Filter by status"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All statuses</SelectItem>{config.statuses.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
            </Select>
          ) : null}
          {entity !== "sites" ? (
            <Select value={siteFilter} onValueChange={setSiteFilter}>
              <SelectTrigger aria-label="Filter by site"><SelectValue placeholder="All sites" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All sites</SelectItem>{sites.map((site) => <SelectItem key={site.id} value={site.id}>{siteNames.get(site.id) ?? site.name}</SelectItem>)}</SelectContent>
            </Select>
          ) : null}
        </div>

        {loading ? (
          <div className="space-y-2" aria-label={`Loading ${config.title.toLowerCase()}`}>
            {[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-lg border border-border bg-muted/50" />)}
          </div>
        ) : !problem && filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-5 py-12 text-center">
            <Icon className="mx-auto size-8 text-muted-foreground" />
            <h2 className="mt-3 font-display text-xl font-bold uppercase">{records.length ? "No matching records" : `No ${config.title.toLowerCase()} yet`}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{records.length ? "Try another search or filter." : `Add the first ${config.singular} to this organization.`}</p>
            {!records.length ? <Button onClick={openCreate} variant="outline" className="mt-4"><Plus className="size-4" /> Add {config.singular}</Button> : null}
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(100px,0.7fr)_auto] gap-4 px-4 text-xs font-semibold uppercase text-muted-foreground md:grid">
              <span>{config.singular}</span><span>Details</span><span>Status</span><span className="text-right">Actions</span>
            </div>
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {filtered.map((row) => {
                const secondary = entity === "workers" ? `${rowValue(row, "employee_code")} · ${rowValue(row, "designation")}`
                  : entity === "sites" ? `${rowValue(row, "code")} · ${rowValue(row, "city")}`
                  : entity === "machines" ? `${rowValue(row, "code")} · ${rowValue(row, "category")}`
                  : entity === "operators" ? `${rowValue(row, "license_no") || rowValue(row, "phone")}`
                  : `${rowValue(row, "phone")} · ${rowValue(row, "email")}`;
                const status = entity === "incharges" ? rowValue(row, "shift_preference") : row.status;
                return (
                  <li key={row.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(100px,0.7fr)_auto] md:gap-4">
                    <button type="button" onClick={() => setViewRow(row)} className="min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <span className="block truncate text-sm font-semibold">{row.name}</span>
                      <span className="mt-1 block truncate text-xs text-muted-foreground md:hidden">{secondary}</span>
                      {row.site_id ? <span className="mt-1 block truncate text-xs text-muted-foreground">{siteNames.get(row.site_id) ?? "Assigned site"}</span> : null}
                    </button>
                    <span className="hidden min-w-0 truncate text-sm text-muted-foreground md:block">{secondary}</span>
                    <span className="hidden md:block"><Badge variant={status === "active" || status === "available" ? "secondary" : status === "inactive" || status === "closed" ? "destructive" : "outline"} className="capitalize">{statusLabel(status)}</Badge></span>
                    <div className="flex items-center justify-end gap-1">
                      <Badge variant="outline" className="capitalize md:hidden">{statusLabel(status)}</Badge>
                      <Button type="button" variant="ghost" size="icon" aria-label={`View ${row.name}`} onClick={() => setViewRow(row)}><ArrowUpRight className="size-4" /></Button>
                      <Button type="button" variant="ghost" size="icon" aria-label={`Edit ${row.name}`} onClick={() => openEdit(row)}><Pencil className="size-4" /></Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} {config.singular}</DialogTitle><DialogDescription>{editing ? "Changes are saved to your organization." : `Create a ${config.singular} record for your organization.`}</DialogDescription></DialogHeader>
          <form onSubmit={submitForm} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {config.fields.map((field) => (
                <div key={field.key} className={field.type === "textarea" || field.type === "tags" ? "space-y-2 sm:col-span-2" : "space-y-2"}>
                  <Label htmlFor={`field-${field.key}`}>{field.label}{field.required ? " *" : ""}</Label>
                  {field.type === "select" ? (
                    <Select value={form[field.key] || "__none"} onValueChange={(value) => setForm((previous) => ({ ...previous, [field.key]: value === "__none" ? "" : value }))}>
                      <SelectTrigger id={`field-${field.key}`} aria-label={field.label}><SelectValue placeholder={`Select ${field.label.toLowerCase()}`} /></SelectTrigger>
                      <SelectContent>
                        {field.key === "site_id" ? <SelectItem value="__none">No site assigned</SelectItem> : null}
                        {(field.options ?? []).map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                        {field.key === "site_id" ? sites.map((site) => <SelectItem key={site.id} value={site.id}>{siteNames.get(site.id) ?? site.name}</SelectItem>) : null}
                      </SelectContent>
                    </Select>
                  ) : field.type === "textarea" ? (
                    <Textarea id={`field-${field.key}`} required={field.required} value={form[field.key] ?? ""} onChange={(event) => setForm((previous) => ({ ...previous, [field.key]: event.target.value }))} rows={3} />
                  ) : (
                    <Input id={`field-${field.key}`} type={field.type === "tags" ? "text" : field.type ?? "text"} inputMode={field.type === "number" ? "decimal" : undefined} required={field.required} min={field.min} step={field.step} value={form[field.key] ?? ""} onChange={(event) => setForm((previous) => ({ ...previous, [field.key]: event.target.value }))} />
                  )}
                </div>
              ))}
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : `Add ${config.singular}`}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewRow)} onOpenChange={(open) => { if (!open) setViewRow(null); }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          {viewRow ? <>
            <DialogHeader><DialogTitle>{viewRow.name}</DialogTitle><DialogDescription>{config.singular[0]?.toUpperCase()}${config.singular.slice(1)} record · organization data</DialogDescription></DialogHeader>
            <dl className="grid gap-0 divide-y divide-border rounded-lg border border-border px-4">
              {config.fields.map((field) => {
                const value = field.key === "site_id" ? siteNames.get(rowValue(viewRow, field.key)) ?? "Not assigned" : rowValue(viewRow, field.key);
                return <div key={field.key} className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-3 py-3 text-sm"><dt className="text-muted-foreground">{field.label}</dt><dd className="min-w-0 break-words text-right font-medium">{value || "—"}</dd></div>;
              })}
            </dl>
            <DialogFooter className="flex-row justify-between sm:justify-between">
              <Button variant="destructive" onClick={() => setDeleteTarget(viewRow)}><Trash2 className="size-4" /> Remove</Button>
              <Button onClick={() => openEdit(viewRow)}><Pencil className="size-4" /> Edit</Button>
            </DialogFooter>
          </> : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove this {config.singular}?</AlertDialogTitle><AlertDialogDescription>This removes the record from the organization. Records used by shifts may be protected by the system.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel><AlertDialogAction disabled={saving} onClick={(event) => { event.preventDefault(); void confirmDelete(); }}>{saving ? "Removing…" : "Remove"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}