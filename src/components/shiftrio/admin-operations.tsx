import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarDays, Check, Clock3, Download, Eye, Plus, RefreshCw, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { getAdminAccess, type AdminAccess } from "@/lib/admin-access";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Shift = Tables<"shifts">;
type Worker = Tables<"workers">;
type Site = Tables<"sites">;
type Machine = Tables<"machines">;
type Incharge = Tables<"incharges">;
type Assignment = Tables<"shift_assignments">;
type Organization = Tables<"organizations">;
type Tab = "live" | "history" | "attendance" | "assignments";

type Workspace = {
  shifts: Shift[];
  workers: Worker[];
  sites: Site[];
  machines: Machine[];
  incharges: Incharge[];
  assignments: Assignment[];
  organization: Pick<Organization, "timezone" | "standard_shift_hours"> | null;
};

const emptyWorkspace: Workspace = { shifts: [], workers: [], sites: [], machines: [], incharges: [], assignments: [], organization: null };
const dateToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

function dayInZone(iso: string, timezone: string) {
  const values = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(iso)).map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function durationMinutes(shift: Shift, now = Date.now()) {
  const finish = shift.ended_at ? new Date(shift.ended_at).getTime() : now;
  return Math.max(0, Math.floor((finish - new Date(shift.started_at).getTime()) / 60_000) - shift.break_minutes);
}

function durationLabel(minutes: number) {
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
}

function timeLabel(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function exportCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AdminOperations() {
  const [access, setAccess] = useState<AdminAccess | null>(null);
  const [workspace, setWorkspace] = useState<Workspace>(emptyWorkspace);
  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState("");
  const [tab, setTab] = useState<Tab>("live");
  const [selectedDate, setSelectedDate] = useState(dateToday);
  const [siteFilter, setSiteFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [closingId, setClosingId] = useState("");
  const [assignment, setAssignment] = useState({ worker_id: "", site_id: "", machine_id: "", incharge_id: "", date: dateToday(), shift_type: "day" as "day" | "night", start_time: "07:00", end_time: "16:00", note: "" });

  const reload = useCallback(async (orgId: string) => {
    const [shifts, workers, sites, machines, incharges, assignments, organization] = await Promise.all([
      supabase.from("shifts").select("*").eq("org_id", orgId).order("started_at", { ascending: false }).limit(1500),
      supabase.from("workers").select("*").eq("org_id", orgId).order("name"),
      supabase.from("sites").select("*").eq("org_id", orgId).order("name"),
      supabase.from("machines").select("*").eq("org_id", orgId).order("name"),
      supabase.from("incharges").select("*").eq("org_id", orgId).order("name"),
      supabase.from("shift_assignments").select("*").eq("org_id", orgId).order("date", { ascending: false }).limit(800),
      supabase.from("organizations").select("timezone, standard_shift_hours").eq("id", orgId).maybeSingle(),
    ]);
    for (const result of [shifts, workers, sites, machines, incharges, assignments, organization]) if (result.error) throw result.error;
    setWorkspace({ shifts: shifts.data ?? [], workers: workers.data ?? [], sites: sites.data ?? [], machines: machines.data ?? [], incharges: incharges.data ?? [], assignments: assignments.data ?? [], organization: organization.data });
  }, []);

  useEffect(() => {
    let alive = true;
    async function initialize() {
      setLoading(true);
      setProblem("");
      try {
        const authorized = await getAdminAccess();
        if (!alive) return;
        setAccess(authorized);
        await reload(authorized.orgId);
      } catch (error) {
        if (alive) setProblem(error instanceof Error ? error.message : "Unable to load organization operations.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    void initialize();
    return () => { alive = false; };
  }, [reload]);

  const workerMap = useMemo(() => new Map(workspace.workers.map((worker) => [worker.id, worker])), [workspace.workers]);
  const siteMap = useMemo(() => new Map(workspace.sites.map((site) => [site.id, site])), [workspace.sites]);
  const machineMap = useMemo(() => new Map(workspace.machines.map((machine) => [machine.id, machine])), [workspace.machines]);
  const inchargeMap = useMemo(() => new Map(workspace.incharges.map((item) => [item.id, item])), [workspace.incharges]);
  const timezone = workspace.organization?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const todayShifts = useMemo(() => workspace.shifts.filter((shift) => dayInZone(shift.started_at, timezone) === selectedDate && (siteFilter === "all" || shift.site_id === siteFilter)), [workspace.shifts, timezone, selectedDate, siteFilter]);
  const filteredShifts = useMemo(() => {
    const base = tab === "live" ? workspace.shifts.filter((shift) => shift.status === "active") : workspace.shifts.filter((shift) => shift.status !== "active");
    const needle = search.trim().toLocaleLowerCase();
    return base.filter((shift) => (siteFilter === "all" || shift.site_id === siteFilter) && (!needle || `${workerMap.get(shift.worker_id)?.name ?? ""} ${workerMap.get(shift.worker_id)?.employee_code ?? ""} ${siteMap.get(shift.site_id)?.name ?? ""}`.toLocaleLowerCase().includes(needle)));
  }, [workspace.shifts, tab, siteFilter, search, workerMap, siteMap]);
  const attendance = useMemo(() => workspace.workers.filter((worker) => siteFilter === "all" || worker.site_id === siteFilter).map((worker) => {
    const shifts = todayShifts.filter((shift) => shift.worker_id === worker.id).sort((a, b) => a.started_at.localeCompare(b.started_at));
    const shift = shifts[0];
    const assignmentMatch = workspace.assignments.find((item) => item.worker_id === worker.id && item.date === selectedDate);
    let status = "Absent";
    if (shift?.status === "active") status = "In progress";
    else if (shift) {
      const expected = assignmentMatch ? new Date(`${selectedDate}T${assignmentMatch.start_time}`).getTime() : null;
      const late = expected !== null && new Date(shift.started_at).getTime() - expected > 15 * 60_000;
      status = late ? "Late" : durationMinutes(shift) < (workspace.organization?.standard_shift_hours ?? 8) * 60 * 0.6 ? "Partial" : "Present";
    }
    return { worker, shift, status };
  }), [workspace.workers, workspace.assignments, workspace.organization, todayShifts, selectedDate, siteFilter]);
  const dateAssignments = workspace.assignments.filter((item) => item.date === selectedDate && (siteFilter === "all" || item.site_id === siteFilter));

  async function closeShift(shift: Shift) {
    if (!access || !window.confirm(`End ${workerMap.get(shift.worker_id)?.name ?? "this worker"}'s active shift now?`)) return;
    setClosingId(shift.id);
    const endedAt = new Date().toISOString();
    const { data, error } = await supabase.from("shifts").update({ status: "completed", ended_at: endedAt }).eq("id", shift.id).eq("org_id", access.orgId).eq("status", "active").select("id").maybeSingle();
    if (error) toast.error(error.message);
    else if (!data) toast.error("This shift has already changed. Refresh and try again.");
    else { toast.success("Shift closed."); setSelectedShift(null); await reload(access.orgId); }
    setClosingId("");
  }

  async function createAssignment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!access) return;
    setSaving(true);
    const payload: TablesInsert<"shift_assignments"> = { org_id: access.orgId, worker_id: assignment.worker_id, site_id: assignment.site_id, machine_id: assignment.machine_id || null, incharge_id: assignment.incharge_id || null, date: assignment.date, shift_type: assignment.shift_type, start_time: assignment.start_time, end_time: assignment.end_time, note: assignment.note.trim(), status: "scheduled" };
    const { error } = await supabase.from("shift_assignments").insert(payload);
    if (error) toast.error(error.message);
    else { toast.success("Shift assignment created."); setAssignmentOpen(false); setAssignment((previous) => ({ ...previous, worker_id: "", machine_id: "", incharge_id: "", note: "" })); await reload(access.orgId); }
    setSaving(false);
  }

  async function refresh() {
    if (!access) return;
    setLoading(true);
    try { await reload(access.orgId); setProblem(""); }
    catch (error) { setProblem(error instanceof Error ? error.message : "Unable to refresh operations."); }
    finally { setLoading(false); }
  }

  function exportAttendance() {
    const rows = [["Worker", "Worker ID", "Site", "Status", "Check-in", "Check-out", "Hours"]];
    for (const item of attendance) rows.push([item.worker.name, item.worker.employee_code, siteMap.get(item.worker.site_id ?? "")?.name ?? "", item.status, timeLabel(item.shift?.started_at ?? null), timeLabel(item.shift?.ended_at ?? null), item.shift ? (durationMinutes(item.shift) / 60).toFixed(2) : "0"]);
    exportCsv(`attendance-${selectedDate}.csv`, rows);
  }

  const tabItems: { id: Tab; label: string }[] = [{ id: "live", label: "Live shifts" }, { id: "history", label: "Shift history" }, { id: "attendance", label: "Attendance" }, { id: "assignments", label: "Assignments" }];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-eyebrow text-muted-foreground">Site control</p><h1 className="mt-1 font-display text-3xl font-bold uppercase">Operations</h1><p className="mt-2 text-sm text-muted-foreground">Live shifts, attendance, and crew assignments.</p></div>
        <div className="flex gap-2"><Button variant="outline" onClick={() => void refresh()} disabled={loading}><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Refresh</Button><Button onClick={() => { setAssignment({ worker_id: "", site_id: "", machine_id: "", incharge_id: "", date: selectedDate, shift_type: "day", start_time: "07:00", end_time: "16:00", note: "" }); setAssignmentOpen(true); }}><Plus className="size-4" /> Assign shift</Button></div>
      </header>

      {problem ? <div role="alert" className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4"><AlertCircle className="size-5 shrink-0 text-destructive" /><div className="min-w-0"><p className="font-semibold">Operations unavailable</p><p className="mt-1 break-words text-sm text-muted-foreground">{problem}</p><Button variant="outline" size="sm" className="mt-3" onClick={() => void refresh()}>Try again</Button></div></div> : null}

      <nav aria-label="Operations sections" className="flex gap-1 overflow-x-auto border-b border-border">{tabItems.map((item) => <Button key={item.id} variant={tab === item.id ? "secondary" : "ghost"} className="shrink-0 rounded-b-none" onClick={() => setTab(item.id)}>{item.label}</Button>)}</nav>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px_190px]">
        <div className="relative min-w-0"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search operations" placeholder="Search workers or sites" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" /></div>
        <Select value={siteFilter} onValueChange={setSiteFilter}><SelectTrigger aria-label="Filter by site"><SelectValue placeholder="All sites" /></SelectTrigger><SelectContent><SelectItem value="all">All sites</SelectItem>{workspace.sites.map((site) => <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>)}</SelectContent></Select>
        {(tab === "attendance" || tab === "assignments") ? <Input aria-label="Operations date" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /> : <div className="flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm text-muted-foreground"><CalendarDays className="size-4" />{tab === "live" ? "Running now" : "Completed records"}</div>}
      </div>

      {loading ? <div className="space-y-2" aria-label="Loading operations">{[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-lg border border-border bg-muted/50" />)}</div> : tab === "attendance" ? (
        <section className="space-y-3" aria-label="Attendance register">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-xl font-bold uppercase">Daily attendance</h2><p className="text-sm text-muted-foreground">{attendance.filter((item) => item.status !== "Absent").length} of {attendance.length} workers recorded</p></div><Button variant="outline" onClick={exportAttendance}><Download className="size-4" /> Export CSV</Button></div>
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">{attendance.map(({ worker, shift, status }) => <li key={worker.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4 sm:grid-cols-[minmax(0,1.3fr)_minmax(100px,0.8fr)_minmax(140px,1fr)_auto]"><div className="min-w-0"><p className="truncate text-sm font-semibold">{worker.name}</p><p className="truncate text-xs text-muted-foreground">{worker.employee_code} · {siteMap.get(worker.site_id ?? "")?.name ?? "Unassigned"}</p></div><Badge variant={status === "Absent" ? "destructive" : status === "Late" ? "outline" : "secondary"} className="capitalize">{status}</Badge><p className="hidden text-sm text-muted-foreground sm:block">{shift ? `${timeLabel(shift.started_at)} – ${timeLabel(shift.ended_at)}` : "No shift recorded"}</p><span className="text-right text-xs tabular-nums text-muted-foreground">{shift ? durationLabel(durationMinutes(shift)) : "—"}</span></li>)}</ul>
          {attendance.length === 0 ? <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No workers match this site filter.</div> : null}
        </section>
      ) : tab === "assignments" ? (
        <section className="space-y-3" aria-label="Shift assignments"><div className="flex items-center gap-2"><Users className="size-5 text-primary" /><div><h2 className="font-display text-xl font-bold uppercase">Shift roster</h2><p className="text-sm text-muted-foreground">{dateAssignments.length} assignments for {selectedDate}</p></div></div>
          {dateAssignments.length ? <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">{dateAssignments.map((item) => <li key={item.id} className="grid gap-2 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"><div><p className="font-semibold">{workerMap.get(item.worker_id)?.name ?? "Worker record unavailable"}</p><p className="text-xs text-muted-foreground">{siteMap.get(item.site_id)?.name ?? "Site unavailable"} · {item.shift_type} shift</p></div><p className="text-sm text-muted-foreground">{item.start_time}–{item.end_time}{item.machine_id ? ` · ${machineMap.get(item.machine_id)?.name ?? "Machine"}` : ""}</p><Badge variant="outline" className="w-fit capitalize">{item.status}</Badge></li>)}</ul> : <div className="rounded-lg border border-dashed border-border p-10 text-center"><p className="font-semibold">No assignments for this date</p><Button variant="outline" className="mt-3" onClick={() => setAssignmentOpen(true)}><Plus className="size-4" /> Create assignment</Button></div>}
        </section>
      ) : (
        <section className="space-y-3" aria-label={tab === "live" ? "Active shifts" : "Shift history"}><div className="flex items-center justify-between"><div><h2 className="font-display text-xl font-bold uppercase">{tab === "live" ? "Active shifts" : "Shift history"}</h2><p className="text-sm text-muted-foreground">{filteredShifts.length} records</p></div></div>
          {filteredShifts.length ? <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">{filteredShifts.map((shift) => <li key={shift.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(90px,.7fr)_auto]"><div className="min-w-0"><p className="truncate text-sm font-semibold">{workerMap.get(shift.worker_id)?.name ?? "Worker record unavailable"}</p><p className="truncate text-xs text-muted-foreground">{workerMap.get(shift.worker_id)?.employee_code ?? ""} · {siteMap.get(shift.site_id)?.name ?? "Site unavailable"}</p></div><p className="hidden truncate text-sm text-muted-foreground sm:block">{shift.shift_type} shift · {timeLabel(shift.started_at)}{shift.ended_at ? ` – ${timeLabel(shift.ended_at)}` : ""}</p><span className="text-right font-display text-sm font-bold tabular-nums">{durationLabel(durationMinutes(shift))}</span><div className="col-span-2 flex items-center justify-between sm:col-span-1 sm:justify-end"><Badge variant={shift.status === "active" ? "secondary" : shift.status === "cancelled" ? "destructive" : "outline"} className="capitalize">{shift.status}</Badge><Button variant="ghost" size="icon" aria-label={`Inspect shift by ${workerMap.get(shift.worker_id)?.name ?? "worker"}`} onClick={() => setSelectedShift(shift)}><Eye className="size-4" /></Button>{tab === "live" ? <Button size="sm" variant="outline" disabled={closingId === shift.id} onClick={() => void closeShift(shift)}>{closingId === shift.id ? "Ending…" : "End shift"}</Button> : null}</div></li>)}</ul> : <div className="rounded-lg border border-dashed border-border p-10 text-center"><Clock3 className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-semibold">{tab === "live" ? "No active shifts" : "No completed shifts"}</p><p className="mt-1 text-sm text-muted-foreground">{tab === "live" ? "Active staff check-ins will appear here." : "Completed shift records will appear here."}</p></div>}
        </section>
      )}

      <Dialog open={Boolean(selectedShift)} onOpenChange={(open) => { if (!open) setSelectedShift(null); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">{selectedShift ? <><DialogHeader><DialogTitle>Shift details</DialogTitle><DialogDescription>{workerMap.get(selectedShift.worker_id)?.name ?? "Worker"} · {selectedShift.shift_type} shift</DialogDescription></DialogHeader><dl className="divide-y divide-border rounded-lg border border-border px-4">{[["Worker", workerMap.get(selectedShift.worker_id)?.name ?? "—"], ["Site", siteMap.get(selectedShift.site_id)?.name ?? "—"], ["Machine", machineMap.get(selectedShift.machine_id ?? "")?.name ?? "—"], ["In-charge", inchargeMap.get(selectedShift.incharge_id ?? "")?.name ?? "—"], ["Started", new Date(selectedShift.started_at).toLocaleString()], ["Ended", selectedShift.ended_at ? new Date(selectedShift.ended_at).toLocaleString() : "In progress"], ["Duration", durationLabel(durationMinutes(selectedShift))], ["Break", `${selectedShift.break_minutes} min`], ["GPS verification", selectedShift.gps_verified === null ? "Not recorded" : selectedShift.gps_verified ? `Verified${selectedShift.gps_distance_m === null ? "" : ` · ${selectedShift.gps_distance_m} m`}` : "Not verified"], ["Notes", selectedShift.notes || "—"]].map(([label, value]) => <div key={label} className="grid grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] gap-3 py-3 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="break-words text-right font-medium">{value}</dd></div>)}</dl><DialogFooter>{selectedShift.status === "active" ? <Button variant="destructive" onClick={() => void closeShift(selectedShift)} disabled={Boolean(closingId)}><Check className="size-4" /> End shift</Button> : null}</DialogFooter></> : null}</DialogContent></Dialog>

      <Dialog open={assignmentOpen} onOpenChange={setAssignmentOpen}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>Assign a shift</DialogTitle><DialogDescription>Create an organization shift roster entry.</DialogDescription></DialogHeader><form onSubmit={(event) => void createAssignment(event)} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Worker</Label><Select value={assignment.worker_id} onValueChange={(value) => setAssignment((previous) => ({ ...previous, worker_id: value }))}><SelectTrigger><SelectValue placeholder="Choose worker" /></SelectTrigger><SelectContent>{workspace.workers.filter((worker) => worker.status === "active").map((worker) => <SelectItem key={worker.id} value={worker.id}>{worker.name} · {worker.employee_code}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Site</Label><Select value={assignment.site_id} onValueChange={(value) => setAssignment((previous) => ({ ...previous, site_id: value }))}><SelectTrigger><SelectValue placeholder="Choose site" /></SelectTrigger><SelectContent>{workspace.sites.filter((site) => site.status === "active").map((site) => <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Date</Label><Input type="date" required value={assignment.date} onChange={(event) => setAssignment((previous) => ({ ...previous, date: event.target.value }))} /></div><div className="space-y-2"><Label>Shift</Label><Select value={assignment.shift_type} onValueChange={(value: "day" | "night") => setAssignment((previous) => ({ ...previous, shift_type: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="day">Day</SelectItem><SelectItem value="night">Night</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Start time</Label><Input type="time" required value={assignment.start_time} onChange={(event) => setAssignment((previous) => ({ ...previous, start_time: event.target.value }))} /></div><div className="space-y-2"><Label>End time</Label><Input type="time" required value={assignment.end_time} onChange={(event) => setAssignment((previous) => ({ ...previous, end_time: event.target.value }))} /></div><div className="space-y-2"><Label>Machine (optional)</Label><Select value={assignment.machine_id || "none"} onValueChange={(value) => setAssignment((previous) => ({ ...previous, machine_id: value === "none" ? "" : value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No machine</SelectItem>{workspace.machines.filter((machine) => machine.status === "available" || machine.status === "in_use").map((machine) => <SelectItem key={machine.id} value={machine.id}>{machine.name} · {machine.code}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>In-charge (optional)</Label><Select value={assignment.incharge_id || "none"} onValueChange={(value) => setAssignment((previous) => ({ ...previous, incharge_id: value === "none" ? "" : value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Not assigned</SelectItem>{workspace.incharges.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select><span className="sr-only">Select an in-charge</span></div><div className="space-y-2 sm:col-span-2"><Label>Notes (optional)</Label><Textarea rows={2} value={assignment.note} onChange={(event) => setAssignment((previous) => ({ ...previous, note: event.target.value }))} /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setAssignmentOpen(false)}>Cancel</Button><Button type="submit" disabled={saving || !assignment.worker_id || !assignment.site_id}>{saving ? "Saving…" : "Create assignment"}</Button></DialogFooter></form></DialogContent></Dialog>
    </div>
  );
}