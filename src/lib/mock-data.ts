/**
 * Sample data for the Shiftrio UI foundation.
 * Shapes here intentionally mirror the future database models
 * (workers, sites, shifts, attendance, activity, machines) so screens can be
 * swapped to live data later without changing component props.
 */

export type Role = "admin" | "staff";

export type Site = {
  id: string;
  name: string;
  code: string;
  city: string;
  supervisor: string;
  workersOnSite: number;
  headcountTarget: number;
  status: "active" | "paused" | "closed";
  geofenceRadiusM: number;
};

export type Worker = {
  id: string;
  name: string;
  nameTa: string;
  role: string;
  phone: string;
  siteId: string;
  status: "on_shift" | "off_shift" | "on_break" | "absent";
  skills: string[];
  hoursThisWeek: number;
  rating: number;
};

export type ActiveShift = {
  id: string;
  workerId: string;
  siteId: string;
  startedAt: string;
  machine?: string;
  hasCheckInPhoto: boolean;
  gpsVerified: boolean;
  elapsedMinutes: number;
};

export type AttendanceRow = {
  id: string;
  workerId: string;
  siteId: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  totalHours: number | null;
  overtimeHours: number;
  status: "present" | "late" | "absent" | "in_progress";
};

export type ActivityEvent = {
  id: string;
  kind:
    | "check_in"
    | "check_out"
    | "break_start"
    | "break_end"
    | "photo"
    | "geofence_exit"
    | "machine_assigned";
  workerId: string;
  siteId: string;
  at: string;
  note?: string;
};

export const sites: Site[] = [
  {
    id: "site-1",
    name: "Kovai Steel Yard",
    code: "KSY-01",
    city: "Coimbatore",
    supervisor: "Anand Raj",
    workersOnSite: 18,
    headcountTarget: 22,
    status: "active",
    geofenceRadiusM: 150,
  },
  {
    id: "site-2",
    name: "Marina Tower Block B",
    code: "MTB-04",
    city: "Chennai",
    supervisor: "Fatima Noor",
    workersOnSite: 26,
    headcountTarget: 26,
    status: "active",
    geofenceRadiusM: 120,
  },
  {
    id: "site-3",
    name: "Hosur Precast Plant",
    code: "HPP-02",
    city: "Hosur",
    supervisor: "Vignesh K",
    workersOnSite: 9,
    headcountTarget: 16,
    status: "active",
    geofenceRadiusM: 200,
  },
  {
    id: "site-4",
    name: "Trichy Bypass Roadworks",
    code: "TBR-07",
    city: "Tiruchirappalli",
    supervisor: "Sundar M",
    workersOnSite: 0,
    headcountTarget: 12,
    status: "paused",
    geofenceRadiusM: 300,
  },
];

export const workers: Worker[] = [
  {
    id: "w-1",
    name: "Murugan S",
    nameTa: "முருகன் ச",
    role: "Crane Operator",
    phone: "+91 98400 11223",
    siteId: "site-1",
    status: "on_shift",
    skills: ["Crane", "Rigging"],
    hoursThisWeek: 38.5,
    rating: 4.8,
  },
  {
    id: "w-2",
    name: "Priya Lakshmi",
    nameTa: "பிரியா லக்ஷ்மி",
    role: "Site Safety Officer",
    phone: "+91 90031 55480",
    siteId: "site-2",
    status: "on_shift",
    skills: ["Safety Audit", "First Aid"],
    hoursThisWeek: 41,
    rating: 4.9,
  },
  {
    id: "w-3",
    name: "Karthik R",
    nameTa: "கார்த்திக் ர",
    role: "Welder",
    phone: "+91 99621 78310",
    siteId: "site-1",
    status: "on_break",
    skills: ["MIG", "TIG"],
    hoursThisWeek: 35,
    rating: 4.5,
  },
  {
    id: "w-4",
    name: "Abdul Rahman",
    nameTa: "அப்துல் ரஹ்மான்",
    role: "Excavator Operator",
    phone: "+91 89390 22014",
    siteId: "site-3",
    status: "on_shift",
    skills: ["Excavator", "Loader"],
    hoursThisWeek: 44,
    rating: 4.6,
  },
  {
    id: "w-5",
    name: "Selvi D",
    nameTa: "செல்வி த",
    role: "Bar Bender",
    phone: "+91 94441 90876",
    siteId: "site-2",
    status: "on_shift",
    skills: ["Rebar"],
    hoursThisWeek: 32.5,
    rating: 4.4,
  },
  {
    id: "w-6",
    name: "Ravi Chandran",
    nameTa: "ரவி சந்திரன்",
    role: "Foreman",
    phone: "+91 97890 44512",
    siteId: "site-1",
    status: "off_shift",
    skills: ["Supervision", "Scheduling"],
    hoursThisWeek: 28,
    rating: 4.7,
  },
  {
    id: "w-7",
    name: "Joseph Antony",
    nameTa: "ஜோசப் அந்தோணி",
    role: "Electrician",
    phone: "+91 93450 66127",
    siteId: "site-2",
    status: "absent",
    skills: ["LV Wiring", "Panels"],
    hoursThisWeek: 16,
    rating: 4.1,
  },
  {
    id: "w-8",
    name: "Devi Shankar",
    nameTa: "தேவி சங்கர்",
    role: "Concrete Technician",
    phone: "+91 96770 30945",
    siteId: "site-3",
    status: "on_shift",
    skills: ["Mix Design", "Curing"],
    hoursThisWeek: 37,
    rating: 4.6,
  },
];

export const activeShifts: ActiveShift[] = [
  {
    id: "s-1",
    workerId: "w-1",
    siteId: "site-1",
    startedAt: "06:10",
    machine: "Tower Crane TC-02",
    hasCheckInPhoto: true,
    gpsVerified: true,
    elapsedMinutes: 322,
  },
  {
    id: "s-2",
    workerId: "w-2",
    siteId: "site-2",
    startedAt: "07:02",
    hasCheckInPhoto: true,
    gpsVerified: true,
    elapsedMinutes: 270,
  },
  {
    id: "s-3",
    workerId: "w-4",
    siteId: "site-3",
    startedAt: "06:45",
    machine: "Excavator EX-210",
    hasCheckInPhoto: false,
    gpsVerified: true,
    elapsedMinutes: 287,
  },
  {
    id: "s-4",
    workerId: "w-5",
    siteId: "site-2",
    startedAt: "08:15",
    hasCheckInPhoto: true,
    gpsVerified: false,
    elapsedMinutes: 195,
  },
  {
    id: "s-5",
    workerId: "w-8",
    siteId: "site-3",
    startedAt: "07:30",
    machine: "Batching Plant BP-1",
    hasCheckInPhoto: true,
    gpsVerified: true,
    elapsedMinutes: 240,
  },
];

export const attendance: AttendanceRow[] = [
  {
    id: "a-1",
    workerId: "w-1",
    siteId: "site-1",
    date: "Today",
    checkIn: "06:10",
    checkOut: null,
    totalHours: null,
    overtimeHours: 0,
    status: "in_progress",
  },
  {
    id: "a-2",
    workerId: "w-2",
    siteId: "site-2",
    date: "Today",
    checkIn: "07:02",
    checkOut: null,
    totalHours: null,
    overtimeHours: 0,
    status: "in_progress",
  },
  {
    id: "a-3",
    workerId: "w-3",
    siteId: "site-1",
    date: "Today",
    checkIn: "09:22",
    checkOut: null,
    totalHours: null,
    overtimeHours: 0,
    status: "late",
  },
  {
    id: "a-4",
    workerId: "w-6",
    siteId: "site-1",
    date: "Yesterday",
    checkIn: "06:00",
    checkOut: "16:30",
    totalHours: 10.5,
    overtimeHours: 2.5,
    status: "present",
  },
  {
    id: "a-5",
    workerId: "w-7",
    siteId: "site-2",
    date: "Today",
    checkIn: "—",
    checkOut: null,
    totalHours: 0,
    overtimeHours: 0,
    status: "absent",
  },
  {
    id: "a-6",
    workerId: "w-5",
    siteId: "site-2",
    date: "Yesterday",
    checkIn: "07:45",
    checkOut: "17:00",
    totalHours: 9.25,
    overtimeHours: 1.25,
    status: "present",
  },
];

export const activity: ActivityEvent[] = [
  {
    id: "e-1",
    kind: "geofence_exit",
    workerId: "w-5",
    siteId: "site-2",
    at: "2 min ago",
    note: "Left geofence by 80 m",
  },
  {
    id: "e-2",
    kind: "check_in",
    workerId: "w-8",
    siteId: "site-3",
    at: "14 min ago",
    note: "Photo verified",
  },
  {
    id: "e-3",
    kind: "machine_assigned",
    workerId: "w-4",
    siteId: "site-3",
    at: "28 min ago",
    note: "Excavator EX-210",
  },
  {
    id: "e-4",
    kind: "break_start",
    workerId: "w-3",
    siteId: "site-1",
    at: "41 min ago",
  },
  {
    id: "e-5",
    kind: "photo",
    workerId: "w-2",
    siteId: "site-2",
    at: "1 hr ago",
    note: "Safety walkaround upload",
  },
  {
    id: "e-6",
    kind: "check_out",
    workerId: "w-6",
    siteId: "site-1",
    at: "yesterday 16:30",
    note: "2.5 hrs overtime",
  },
];

export const currentStaff = workers[0];

export const staffShiftPlan = {
  siteId: "site-1",
  scheduledStart: "06:00",
  scheduledEnd: "15:00",
  machine: "Tower Crane TC-02",
  supervisor: "Anand Raj",
  breakMinutes: 45,
  distanceToSiteM: 85,
};

export const staffWeek = [
  { day: "Mon", hours: 8.5 },
  { day: "Tue", hours: 9 },
  { day: "Wed", hours: 8 },
  { day: "Thu", hours: 7.5 },
  { day: "Fri", hours: 5.5 },
  { day: "Sat", hours: 0 },
  { day: "Sun", hours: 0 },
];

export function siteById(id: string) {
  return sites.find((s) => s.id === id);
}

export function workerById(id: string) {
  return workers.find((w) => w.id === id);
}

export function formatElapsed(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}
