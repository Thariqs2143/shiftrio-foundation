import { useSyncExternalStore } from "react";
import type {
  AttendanceRecord,
  Database,
  Incharge,
  Machine,
  Notification,
  Operator,
  Organization,
  Shift,
  ShiftAssignment,
  Site,
  Worker,
} from "./models";
import { createSeedDatabase, DB_VERSION } from "./seed";

/**
 * Mock persistence layer. Everything lives in localStorage behind these
 * services so a real backend can replace the bodies of these functions later.
 */

const DB_KEY = "shiftrio.db.v1";

const serverSnapshot: Database = createSeedDatabase();

let cache: Database | null = null;
const listeners = new Set<() => void>();

function isBrowser() {
  return typeof window !== "undefined";
}

function read(): Database {
  if (!isBrowser()) return serverSnapshot;
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Database;
      if (parsed && parsed.version === DB_VERSION) {
        cache = parsed;
        return cache;
      }
    }
  } catch {
    /* corrupt storage — fall through to a fresh seed */
  }
  cache = createSeedDatabase();
  persist(cache);
  return cache;
}

function persist(db: Database) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    /* storage full or unavailable — keep in-memory state */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

export function mutate(updater: (db: Database) => Database | void) {
  const current = read();
  const draft: Database = JSON.parse(JSON.stringify(current));
  const next = updater(draft) ?? draft;
  cache = next;
  persist(next);
  emit();
  return next;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDb(): Database {
  return useSyncExternalStore(subscribe, read, () => serverSnapshot);
}

export function getDb() {
  return read();
}

export function resetDemoData() {
  cache = createSeedDatabase();
  persist(cache);
  emit();
}

export function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}

/* ---------------------------------------------------------------- services */

type Coll = "workers" | "sites" | "machines" | "operators" | "incharges" | "assignments";

function upsert<T extends { id: string }>(coll: Coll, item: T) {
  mutate((db) => {
    const list = db[coll] as unknown as T[];
    const idx = list.findIndex((x) => x.id === item.id);
    if (idx >= 0) list[idx] = item;
    else list.unshift(item);
  });
}

function remove(coll: Coll, itemId: string) {
  mutate((db) => {
    const list = db[coll] as unknown as { id: string }[];
    const idx = list.findIndex((x) => x.id === itemId);
    if (idx >= 0) list.splice(idx, 1);
  });
}

export const workerService = {
  save: (w: Worker) => upsert("workers", w),
  remove: (wid: string) => remove("workers", wid),
};

export const siteService = {
  save: (s: Site) => upsert("sites", s),
  remove: (sid: string) => remove("sites", sid),
};

export const machineService = {
  save: (m: Machine) => upsert("machines", m),
  remove: (mid: string) => remove("machines", mid),
};

export const operatorService = {
  save: (o: Operator) => upsert("operators", o),
  remove: (oid: string) => remove("operators", oid),
};

export const inchargeService = {
  save: (i: Incharge) => upsert("incharges", i),
  remove: (iid: string) => remove("incharges", iid),
};

export const assignmentService = {
  save: (a: ShiftAssignment) => upsert("assignments", a),
  remove: (aid: string) => remove("assignments", aid),
  setStatus: (aid: string, status: ShiftAssignment["status"]) =>
    mutate((db) => {
      const a = db.assignments.find((x) => x.id === aid);
      if (a) a.status = status;
    }),
};

export const organizationService = {
  save: (org: Organization) =>
    mutate((db) => {
      db.organization = org;
    }),
};

export const notificationService = {
  markRead: (nid: string, read = true) =>
    mutate((db) => {
      const n = db.notifications.find((x) => x.id === nid);
      if (n) n.read = read;
    }),
  markAllRead: (audience: "admin" | "staff") =>
    mutate((db) => {
      db.notifications.forEach((n) => {
        if (n.audience === audience || n.audience === "all") n.read = true;
      });
    }),
  removeOne: (nid: string) =>
    mutate((db) => {
      const idx = db.notifications.findIndex((x) => x.id === nid);
      if (idx >= 0) db.notifications.splice(idx, 1);
    }),
  push: (n: Omit<Notification, "id" | "createdAt" | "read">) =>
    mutate((db) => {
      db.notifications.unshift({
        ...n,
        id: id("n"),
        createdAt: new Date().toISOString(),
        read: false,
      });
    }),
};

export const shiftService = {
  start: (shift: Omit<Shift, "id" | "status" | "endedAt">) => {
    const created: Shift = { ...shift, id: id("sh"), status: "active", endedAt: null };
    mutate((db) => {
      db.shifts.unshift(created);
      const machine = db.machines.find((m) => m.id === created.machineId);
      if (machine) machine.status = "in_use";
      db.notifications.unshift({
        id: id("n"),
        title: "Shift started",
        body: `${db.workers.find((w) => w.id === created.workerId)?.name ?? "Worker"} started a ${
          created.shiftType
        } shift at ${db.sites.find((s) => s.id === created.siteId)?.name ?? "site"}.`,
        kind: "shift",
        createdAt: new Date().toISOString(),
        read: false,
        audience: "admin",
      });
    });
    return created;
  },
  end: (shiftId: string, payload: { breakMinutes: number; notes: string }) => {
    let ended: Shift | undefined;
    mutate((db) => {
      const s = db.shifts.find((x) => x.id === shiftId);
      if (!s) return;
      s.endedAt = new Date().toISOString();
      s.status = "completed";
      s.breakMinutes = payload.breakMinutes;
      if (payload.notes) s.notes = payload.notes;
      ended = s;
      const machine = db.machines.find((m) => m.id === s.machineId);
      if (machine) machine.status = "available";
      const hours = shiftHours(s);
      db.attendance.unshift({
        id: id("at"),
        workerId: s.workerId,
        siteId: s.siteId,
        date: s.startedAt.slice(0, 10),
        checkIn: formatTime(s.startedAt),
        checkOut: formatTime(s.endedAt),
        totalHours: hours,
        overtimeHours: Math.max(0, +(hours - db.organization.overtimeAfterHours).toFixed(2)),
        status: "present",
        shiftType: s.shiftType,
      });
    });
    return ended;
  },
  cancel: (shiftId: string) =>
    mutate((db) => {
      const s = db.shifts.find((x) => x.id === shiftId);
      if (s) s.status = "cancelled";
    }),
  update: (shiftId: string, patch: Partial<Shift>) =>
    mutate((db) => {
      const idx = db.shifts.findIndex((x) => x.id === shiftId);
      if (idx >= 0) db.shifts[idx] = { ...db.shifts[idx], ...patch };
    }),
};

/* --------------------------------------------------------------- selectors */

export function activeShiftFor(db: Database, workerId: string) {
  return db.shifts.find((s) => s.workerId === workerId && s.status === "active");
}

export function shiftsFor(db: Database, workerId: string) {
  return db.shifts
    .filter((s) => s.workerId === workerId)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export function shiftHours(shift: Shift, now = Date.now()) {
  const end = shift.endedAt ? new Date(shift.endedAt).getTime() : now;
  const ms = end - new Date(shift.startedAt).getTime();
  return Math.max(0, +(ms / 3600000 - shift.breakMinutes / 60).toFixed(2));
}

/** Combines logged shifts with manually recorded attendance rows. */
export function attendanceRows(db: Database): AttendanceRecord[] {
  const fromShifts = db.shifts
    .filter((s) => s.status !== "cancelled")
    .map<AttendanceRecord>((s) => {
      const hours = shiftHours(s);
      return {
        id: `sh-${s.id}`,
        workerId: s.workerId,
        siteId: s.siteId,
        date: s.startedAt.slice(0, 10),
        checkIn: formatTime(s.startedAt),
        checkOut: s.endedAt ? formatTime(s.endedAt) : null,
        totalHours: s.endedAt ? hours : 0,
        overtimeHours: s.endedAt
          ? Math.max(0, +(hours - db.organization.overtimeAfterHours).toFixed(2))
          : 0,
        status: s.endedAt ? "present" : "in_progress",
        shiftType: s.shiftType,
      };
    });
  const manual = db.attendance.filter((a) => !a.id.startsWith("sh-"));
  const merged = [...fromShifts, ...manual];
  const seen = new Set<string>();
  return merged
    .filter((row) => {
      const key = `${row.workerId}-${row.date}-${row.checkIn ?? "none"}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function unreadCount(db: Database, audience: "admin" | "staff") {
  return db.notifications.filter(
    (n) => !n.read && (n.audience === audience || n.audience === "all"),
  ).length;
}

export function byId<T extends { id: string }>(list: T[], itemId?: string | null) {
  if (!itemId) return undefined;
  return list.find((x) => x.id === itemId);
}

/* ------------------------------------------------------------- formatting  */

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(value: string) {
  const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateShort(value: string) {
  const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function todayKey(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

export function downloadCsv(fileName: string, rows: (string | number | null)[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell === null || cell === undefined ? "" : String(cell);
          return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
        })
        .join(","),
    )
    .join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
