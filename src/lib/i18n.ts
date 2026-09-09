/**
 * Minimal string catalogue so Tamil can be added later without touching screens.
 * Every user-facing Staff string should come from here.
 */
import { useSyncExternalStore } from "react";

export type Lang = "en" | "ta";

export const en = {
  appName: "Shiftrio",
  signIn: "Sign in",
  signOut: "Sign out",
  phone: "Phone number",
  workerId: "Worker ID",
  pin: "PIN",
  continue: "Continue",
  back: "Back",
  next: "Next",
  cancel: "Cancel",
  confirm: "Confirm",
  home: "Home",
  history: "History",
  attendance: "Attendance",
  profile: "Profile",
  startShift: "Start shift",
  continueShift: "Continue active shift",
  endShift: "End shift",
  activeShift: "Active shift",
  shiftTimer: "Shift timer",
  site: "Site",
  machine: "Machine",
  operator: "Operator",
  incharge: "Incharge",
  shiftType: "Shift type",
  day: "Day",
  night: "Night",
  gps: "Location check",
  photos: "Photos",
  review: "Review",
  notes: "Notes",
  search: "Search",
  none: "None",
  present: "Present",
  absent: "Absent",
  late: "Late",
  partial: "Partial",
  language: "Language",
  english: "English",
  tamil: "Tamil",
} as const;

export type StringKey = keyof typeof en;

/** Tamil translations land here; missing keys fall back to English. */
const ta: Partial<Record<StringKey, string>> = {
  home: "முகப்பு",
  history: "வரலாறு",
  attendance: "வருகை",
  profile: "சுயவிவரம்",
  startShift: "பணி தொடங்கு",
  endShift: "பணி முடி",
  signOut: "வெளியேறு",
};

const catalogues: Record<Lang, Partial<Record<StringKey, string>>> = { en, ta };

export function translate(key: StringKey, lang: Lang = "en") {
  return catalogues[lang]?.[key] ?? en[key];
}

/* ------------------------------------------------------- language preference */

const LANG_KEY = "shiftrio.lang";
const listeners = new Set<() => void>();
let cached: Lang | null = null;

function read(): Lang {
  if (typeof window === "undefined") return "en";
  if (cached) return cached;
  const raw = window.localStorage.getItem(LANG_KEY);
  cached = raw === "ta" ? "ta" : "en";
  return cached;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function setLang(lang: Lang) {
  cached = lang;
  if (typeof window !== "undefined") window.localStorage.setItem(LANG_KEY, lang);
  listeners.forEach((l) => l());
}

export function useLang() {
  const lang = useSyncExternalStore(subscribe, read, () => "en" as Lang);
  return {
    lang,
    setLang,
    t: (key: StringKey) => translate(key, lang),
  };
}
