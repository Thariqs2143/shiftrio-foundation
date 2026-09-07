/**
 * Centralized domain models for Shiftrio.
 * These shapes intentionally mirror the future database schema so the mock
 * services in `store.ts` can be swapped for a real backend later without
 * touching UI components.
 */

export type Role = "admin" | "staff";

export type Organization = {
  id: string;
  name: string;
  legalName: string;
  industry: string;
  timezone: string;
  currency: string;
  standardShiftHours: number;
  overtimeAfterHours: number;
  geofenceRadiusM: number;
  requireCheckInPhoto: boolean;
  requireGpsVerification: boolean;
  autoApproveAttendance: boolean;
  contactEmail: string;
  contactPhone: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  workerId?: string;
  avatarInitials: string;
  language: "en" | "ta";
};

export type WorkerStatus = "active" | "inactive" | "on_leave";

export type Worker = {
  id: string;
  name: string;
  nameTa?: string;
  employeeCode: string;
  designation: string;
  phone: string;
  siteId: string;
  skills: string[];
  status: WorkerStatus;
  joinedAt: string;
  dailyWage: number;
  rating: number;
};

export type Site = {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string;
  inchargeId: string;
  headcountTarget: number;
  status: "active" | "paused" | "closed";
  geofenceRadiusM: number;
  lat: number;
  lng: number;
};

export type Machine = {
  id: string;
  name: string;
  code: string;
  category: string;
  siteId: string;
  status: "available" | "in_use" | "maintenance";
  lastServicedAt: string;
  hoursRun: number;
};

export type Operator = {
  id: string;
  name: string;
  phone: string;
  licenseNo: string;
  certifiedFor: string[];
  siteId: string;
  status: "available" | "assigned" | "off_duty";
};

export type Incharge = {
  id: string;
  name: string;
  phone: string;
  email: string;
  siteId: string;
  shiftPreference: ShiftType | "any";
};

export type ShiftType = "day" | "night";

export type Photo = {
  id: string;
  dataUrl: string | null;
  fileName: string;
  kind: "check_in" | "check_out";
  takenAt: string;
  source: "camera" | "upload";
};

export type LocationVerification = {
  verified: boolean;
  distanceM: number;
  accuracyM: number;
  lat: number;
  lng: number;
  method: "simulated" | "device";
  checkedAt: string;
};

export type ShiftStatus = "active" | "completed" | "cancelled";

export type Shift = {
  id: string;
  workerId: string;
  siteId: string;
  machineId: string | null;
  operatorId: string | null;
  inchargeId: string | null;
  shiftType: ShiftType;
  startedAt: string;
  endedAt: string | null;
  breakMinutes: number;
  status: ShiftStatus;
  checkInPhoto: Photo | null;
  checkOutPhoto: Photo | null;
  checkInLocation: LocationVerification | null;
  notes: string;
};

export type ShiftAssignment = {
  id: string;
  workerId: string;
  siteId: string;
  machineId: string | null;
  inchargeId: string | null;
  date: string; // yyyy-mm-dd
  shiftType: ShiftType;
  startTime: string;
  endTime: string;
  status: "scheduled" | "confirmed" | "cancelled";
  note: string;
};

export type AttendanceStatus = "present" | "late" | "absent" | "in_progress";

export type AttendanceRecord = {
  id: string;
  workerId: string;
  siteId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  totalHours: number;
  overtimeHours: number;
  status: AttendanceStatus;
  shiftType: ShiftType;
};

export type Notification = {
  id: string;
  title: string;
  body: string;
  kind: "shift" | "attendance" | "safety" | "system";
  createdAt: string;
  read: boolean;
  audience: Role | "all";
};

export type Session = {
  role: Role;
  userId: string;
  signedInAt: string;
};

export type Database = {
  version: number;
  organization: Organization;
  users: User[];
  workers: Worker[];
  sites: Site[];
  machines: Machine[];
  operators: Operator[];
  incharges: Incharge[];
  shifts: Shift[];
  assignments: ShiftAssignment[];
  attendance: AttendanceRecord[];
  notifications: Notification[];
};
