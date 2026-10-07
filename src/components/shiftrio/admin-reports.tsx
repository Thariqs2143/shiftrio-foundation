import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BarChart3, Download, Timer, Users, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { getAdminAccess } from "@/lib/admin-access";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Shift = Tables<"shifts">;
type Worker = Tables<"workers">;
type Site = Tables<"sites">;
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
const hours = (shift: Shift) => Math.max(0, ((new Date(shift.ended_at ?? new Date()).getTime() - new Date(shift.started_at).getTime()) / 3_600_000) - shift.break_minutes / 60);
const csvValue = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

export function AdminReports() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [startDate, setStartDate] = useState(daysAgo(29));
  const [endDate, setEndDate] = useState(today());
  const [workerFilter, setWorkerFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const access = await getAdminAccess();
        const [shiftResult, workerResult, siteResult] = await Promise.all([
          supabase.from("shifts").select("*").eq("org_id", access.orgId).order("started_at", { ascending: false }).limit(5000),
          supabase.from("workers").select("*").eq("org_id", access.orgId).order("name"),
          supabase.from("sites").select("*").eq("org_id", access.orgId).order("name"),
        ]);
        if (shiftResult.error) throw shiftResult.error;
        if (workerResult.error) throw workerResult.error;
        if (siteResult.error) throw siteResult.error;
        if (alive) { setShifts(shiftResult.data ?? []); setWorkers(workerResult.data ?? []); setSites(siteResult.data ?? []); setProblem(""); }
      } catch (error) {
        if (alive) setProblem(error instanceof Error ? error.message : "Unable to load reports.");
      } finally { if (alive) setLoading(false); }
    }
    void load();
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => shifts.filter((shift) => {
    const shiftDate = shift.started_at.slice(0, 10);
    return shiftDate >= startDate && shiftDate <= endDate && (siteFilter === "all" || shift.site_id === siteFilter) && (workerFilter === "all" || shift.worker_id === workerFilter);
  }), [shifts, startDate, endDate, siteFilter, workerFilter]);
  const workerMap = useMemo(() => new Map(workers.map((worker) => [worker.id, worker])), [workers]);
  const siteMap = useMemo(() => new Map(sites.map((site) => [site.id, site])), [sites]);
  const completed = filtered.filter((shift) => shift.status === "completed");
  const totalHours = filtered.reduce((sum, shift) => sum + hours(shift), 0);
  const bySite = sites.filter((site) => siteFilter === "all" || site.id === siteFilter).map((site) => ({ site, hours: filtered.filter((shift) => shift.site_id === site.id).reduce((sum, shift) => sum + hours(shift), 0) })).sort((a, b) => b.hours - a.hours);
  const maxSiteHours = Math.max(1, ...bySite.map((item) => item.hours));
  const attendanceDays = new Set(filtered.map((shift) => `${shift.worker_id}:${shift.started_at.slice(0, 10)}`)).size;
  const overtimeHours = completed.reduce((sum, shift) => sum + Math.max(0, hours(shift) - 8), 0);

  function download() {
    const rows = [["Date", "Worker", "Worker ID", "Site", "Machine ID", "Shift", "Status", "Started", "Ended", "Break minutes", "Hours", "GPS verified"]];
    for (const shift of filtered) rows.push([shift.started_at.slice(0, 10), workerMap.get(shift.worker_id)?.name ?? "", workerMap.get(shift.worker_id)?.employee_code ?? "", siteMap.get(shift.site_id)?.name ?? "", shift.machine_id ?? "", shift.shift_type, shift.status, shift.started_at, shift.ended_at ?? "", String(shift.break_minutes), hours(shift).toFixed(2), shift.gps_verified === null ? "" : shift.gps_verified ? "Yes" : "No"]);
    const url = URL.createObjectURL(new Blob(["\ufeff", rows.map((row) => row.map(csvValue).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `shiftrio-report-${startDate}-${endDate}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }

  return <div className="mx-auto max-w-6xl space-y-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-eyebrow text-muted-foreground">Organization insights</p><h1 className="mt-1 font-display text-3xl font-bold uppercase">Reports</h1><p className="mt-2 text-sm text-muted-foreground">Shift hours, attendance, and overtime from recorded shifts.</p></div><Button onClick={download} disabled={loading || filtered.length === 0}><Download className="size-4" /> Export CSV</Button></header>
    {problem ? <div role="alert" className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4"><AlertCircle className="size-5 shrink-0 text-destructive" /><div className="min-w-0"><p className="font-semibold">Reports unavailable</p><p className="break-words text-sm text-muted-foreground">{problem}</p></div></div> : null}
    <section aria-label="Report filters" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="space-y-1.5"><label htmlFor="report-start" className="text-xs font-medium text-muted-foreground">From</label><Input id="report-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></div><div className="space-y-1.5"><label htmlFor="report-end" className="text-xs font-medium text-muted-foreground">Through</label><Input id="report-end" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></div><Select value={siteFilter} onValueChange={setSiteFilter}><SelectTrigger aria-label="Filter report by site"><SelectValue placeholder="All sites" /></SelectTrigger><SelectContent><SelectItem value="all">All sites</SelectItem>{sites.map((site) => <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>)}</SelectContent></Select><Select value={workerFilter} onValueChange={setWorkerFilter}><SelectTrigger aria-label="Filter report by worker"><SelectValue placeholder="All workers" /></SelectTrigger><SelectContent><SelectItem value="all">All workers</SelectItem>{workers.map((worker) => <SelectItem key={worker.id} value={worker.id}>{worker.name}</SelectItem>)}</SelectContent></Select></section>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[{ label: "Recorded shifts", value: String(filtered.length), icon: BarChart3 }, { label: "Total hours", value: totalHours.toFixed(1), icon: Timer }, { label: "Worker-days", value: String(attendanceDays), icon: Users }, { label: "Overtime hours", value: overtimeHours.toFixed(1), icon: Wrench }].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-lg border border-border bg-card p-4"><div className="flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground">{label}</p><Icon className="size-4 text-primary" /></div><p className="mt-2 font-display text-2xl font-bold tabular-nums">{loading ? "—" : value}</p></div>)}</div>
    <div className="grid gap-6 lg:grid-cols-2"><section className="space-y-4"><div><h2 className="font-display text-xl font-bold uppercase">Hours by site</h2><p className="text-sm text-muted-foreground">Net hours including completed and active shifts.</p></div>{bySite.length ? <ul className="space-y-4">{bySite.map(({ site, hours: siteHours }) => <li key={site.id}><div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="truncate font-medium">{site.name}</span><span className="shrink-0 tabular-nums text-muted-foreground">{siteHours.toFixed(1)} h</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${Math.max(2, siteHours / maxSiteHours * 100)}%` }} /></div></li>)}</ul> : <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No site records match this range.</p>}</section>
      <section className="space-y-4"><div><h2 className="font-display text-xl font-bold uppercase">Shift mix</h2><p className="text-sm text-muted-foreground">Day vs night · completed shift summary.</p></div>{completed.length ? <div className="grid grid-cols-2 gap-3">{(["day", "night"] as const).map((kind) => { const count = completed.filter((shift) => shift.shift_type === kind).length; const total = completed.filter((shift) => shift.shift_type === kind).reduce((sum, shift) => sum + hours(shift), 0); return <div key={kind} className="rounded-lg border border-border bg-card p-4"><p className="text-sm font-semibold capitalize">{kind} shifts</p><p className="mt-2 font-display text-2xl font-bold tabular-nums">{count}</p><p className="text-xs text-muted-foreground">{total.toFixed(1)} hours</p></div>; })}</div> : <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No completed shifts match this range.</p>}</section></div>
    <section className="space-y-3"><div><h2 className="font-display text-xl font-bold uppercase">Shift records</h2><p className="text-sm text-muted-foreground">{filtered.length} rows · reporting window {startDate} through {endDate}</p></div>{filtered.length ? <div className="overflow-x-auto rounded-lg border border-border"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-muted/50 text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Worker</th><th className="px-4 py-3">Site</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">State</th><th className="px-4 py-3 text-right">Hours</th></tr></thead><tbody className="divide-y divide-border">{filtered.slice(0, 100).map((shift) => <tr key={shift.id}><td className="whitespace-nowrap px-4 py-3">{shift.started_at.slice(0, 10)}</td><td className="px-4 py-3">{workerMap.get(shift.worker_id)?.name ?? "Worker unavailable"}</td><td className="px-4 py-3">{siteMap.get(shift.site_id)?.name ?? "Site unavailable"}</td><td className="px-4 py-3 capitalize">{shift.shift_type}</td><td className="px-4 py-3 capitalize">{shift.status}</td><td className="px-4 py-3 text-right tabular-nums">{hours(shift).toFixed(2)}</td></tr>)}</tbody></table></div> : <div className="rounded-lg border border-dashed border-border p-10 text-center"><p className="font-semibold">No shift records for these filters</p><p className="mt-1 text-sm text-muted-foreground">Try a wider date range or another site.</p></div>}</section>
  </div>;
}