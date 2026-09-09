import { useSyncExternalStore } from "react";
import type { LocationVerification, Photo, ShiftType } from "./models";

/**
 * Persisted Start Shift wizard draft. Keeping it in localStorage means back
 * navigation and refreshes preserve every selection.
 */

const KEY = "shiftrio.shift-draft.v1";

export const WIZARD_STEPS = [
  "site",
  "machine",
  "operator",
  "incharge",
  "type",
  "gps",
  "photos",
  "review",
] as const;

export type WizardStep = (typeof WIZARD_STEPS)[number];

export type ShiftDraft = {
  step: WizardStep;
  siteId: string | null;
  machineId: string | null;
  operatorId: string | null;
  inchargeId: string | null;
  shiftType: ShiftType | null;
  location: LocationVerification | null;
  photos: Photo[];
  notes: string;
};

export const emptyDraft: ShiftDraft = {
  step: "site",
  siteId: null,
  machineId: null,
  operatorId: null,
  inchargeId: null,
  shiftType: null,
  location: null,
  photos: [],
  notes: "",
};

const listeners = new Set<() => void>();
let cache: ShiftDraft | undefined;

function read(): ShiftDraft {
  if (typeof window === "undefined") return emptyDraft;
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? { ...emptyDraft, ...(JSON.parse(raw) as ShiftDraft) } : emptyDraft;
  } catch {
    cache = emptyDraft;
  }
  return cache;
}

function commit(next: ShiftDraft) {
  cache = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* quota — keep in memory */
    }
  }
  listeners.forEach((l) => l());
}

export function updateDraft(patch: Partial<ShiftDraft>) {
  commit({ ...read(), ...patch });
}

export function clearDraft() {
  commit(emptyDraft);
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useShiftDraft(): ShiftDraft {
  return useSyncExternalStore(subscribe, read, () => emptyDraft);
}

export function stepIndex(step: WizardStep) {
  return WIZARD_STEPS.indexOf(step);
}
