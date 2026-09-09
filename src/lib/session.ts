import { useSyncExternalStore } from "react";
import type { Role, User, Worker } from "./models";
import { getDb } from "./store";

/**
 * Demo authentication. The signed-in role/user is persisted in localStorage
 * behind these helpers so a real auth provider can replace the bodies later.
 */

const KEY = "shiftrio.session.v1";

export type StoredSession = {
  role: Role;
  userId: string;
  signedInAt: string;
};

const listeners = new Set<() => void>();
let cache: StoredSession | null | undefined;

function isBrowser() {
  return typeof window !== "undefined";
}

function read(): StoredSession | null {
  if (!isBrowser()) return null;
  if (cache !== undefined) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    cache = null;
  }
  return cache;
}

function write(next: StoredSession | null) {
  cache = next;
  if (isBrowser()) {
    if (next) window.localStorage.setItem(KEY, JSON.stringify(next));
    else window.localStorage.removeItem(KEY);
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export const DEMO_PIN = "1234";

function digits(value: string) {
  return value.replace(/\D/g, "");
}

export type SignInResult = { ok: true; role: Role } | { ok: false; error: string };

/** Validates demo credentials against the seeded users/workers. */
export function signInWithCredentials(input: {
  role: Role;
  phone: string;
  workerId?: string;
  pin: string;
}): SignInResult {
  const db = getDb();
  const phone = digits(input.phone);
  if (phone.length < 10) return { ok: false, error: "Enter a valid 10-digit phone number." };
  if (input.pin.length !== 4) return { ok: false, error: "PIN must be 4 digits." };

  const user = db.users.find(
    (u) => u.role === input.role && digits(u.phone).endsWith(phone.slice(-10)),
  );
  if (!user) return { ok: false, error: "No account found for that phone number." };

  if (input.role === "staff") {
    const worker = db.workers.find((w) => w.id === user.workerId);
    const entered = (input.workerId ?? "").trim().toUpperCase();
    if (!entered) return { ok: false, error: "Worker ID is required." };
    if (!worker || worker.employeeCode.toUpperCase() !== entered) {
      return { ok: false, error: "Worker ID does not match this phone number." };
    }
  }

  if (input.pin !== DEMO_PIN) return { ok: false, error: "Incorrect PIN." };

  write({ role: user.role, userId: user.id, signedInAt: new Date().toISOString() });
  return { ok: true, role: user.role };
}

/** Quick demo sign-in used by the "use demo credentials" affordance. */
export function signIn(role: Role) {
  const db = getDb();
  const user = db.users.find((u) => u.role === role);
  if (!user) return;
  write({ role, userId: user.id, signedInAt: new Date().toISOString() });
}

export function signOut() {
  write(null);
}

export function useStoredSession() {
  return useSyncExternalStore(subscribe, read, () => null);
}

export type StaffIdentity = {
  user: User;
  worker: Worker;
};

/** Resolves the signed-in staff user + worker, falling back to the demo staff. */
export function useStaffIdentity(): StaffIdentity | null {
  const stored = useStoredSession();
  const db = getDb();
  const user =
    db.users.find((u) => u.id === stored?.userId && u.role === "staff") ??
    db.users.find((u) => u.role === "staff");
  if (!user) return null;
  const worker = db.workers.find((w) => w.id === user.workerId) ?? db.workers[0];
  if (!worker) return null;
  return { user, worker };
}

/** Legacy shape kept for the Admin shell. */
export type Session = { role: Role; name: string; siteCode: string };

export function useSession(fallback: Role): Session {
  const stored = useStoredSession();
  const db = getDb();
  const role = stored?.role ?? fallback;
  const user =
    db.users.find((u) => u.id === stored?.userId) ?? db.users.find((u) => u.role === role);
  const worker = db.workers.find((w) => w.id === user?.workerId);
  const site = db.sites.find((s) => s.id === worker?.siteId);
  return {
    role,
    name: user?.name ?? "Shiftrio user",
    siteCode: role === "admin" ? "All sites" : (site?.code ?? "Unassigned"),
  };
}
