import { useEffect, useState } from "react";
import type { Role } from "./mock-data";

const KEY = "shiftrio.session";

export type Session = {
  role: Role;
  name: string;
  siteCode: string;
};

const defaults: Record<Role, Session> = {
  admin: { role: "admin", name: "Anand Raj", siteCode: "All sites" },
  staff: { role: "staff", name: "Murugan S", siteCode: "KSY-01" },
};

export function signIn(role: Role) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(defaults[role]));
}

export function signOut() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

/** Reads the stored session after hydration to avoid SSR mismatches. */
export function useSession(fallback: Role): Session {
  const [session, setSession] = useState<Session>(defaults[fallback]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setSession({ ...defaults[fallback], ...JSON.parse(raw) });
    } catch {
      /* ignore malformed storage */
    }
  }, [fallback]);

  return session;
}
