import { AppUser, Candidate, LogEntry, Stage, UserRole, VaultRecord } from './models';

export const DEMO_OTP = '123456';

export const MOCK_USERS: Record<string, AppUser> = {
  admin: { id: 'admin', name: 'Alex Admin', role: 'Admin', accessLevel: 'Omega (Full)', email: 'admin@trustvault.core', status: 'Active' },
  priya: { id: 'priya', name: 'Priya Sharma', role: 'General User', accessLevel: 'Beta (Internal)', email: 'priya@trustvault.core', status: 'Active' },
};

const RECORDS: VaultRecord[] = [
  { id: 'REC-77A1', title: 'Public Protocol Guidelines', level: 'Public', status: 'Decrypted', size: '1.2 MB', candidateId: 'C-101' },
  { id: 'REC-77B2', title: 'System Architecture Map', level: 'Internal', status: 'Decrypted', size: '14.5 MB', candidateId: 'C-102' },
  { id: 'REC-77C3', title: 'Employee Network Logs', level: 'Internal', status: 'Decrypted', size: '256 MB', candidateId: 'C-103' },
  { id: 'REC-88D4', title: 'Quantum Encryption Keys [Q3]', level: 'Confidential', status: 'Encrypted', size: '0.5 KB', candidateId: 'C-104' },
  { id: 'REC-88E5', title: 'Zero-Day Vulnerability Report', level: 'Confidential', status: 'Encrypted', size: '4.1 MB', candidateId: 'C-105' },
  { id: 'REC-99F6', title: 'Project "Oversight" Source', level: 'Confidential', status: 'Encrypted', size: '2.4 GB', candidateId: 'C-106' },
];

/** Role-based masking: non-admins see Confidential rows locked. */
export function recordsFor(role: UserRole): VaultRecord[] {
  return RECORDS.map(r => {
    if (role !== 'Admin' && r.level === 'Confidential') return { ...r, title: '█'.repeat(15) + ' [ENCRYPTED]', status: 'Locked', size: '---' };
    if (role === 'Admin') return { ...r, status: 'Decrypted' };
    return { ...r };
  });
}

type CandidateRow = Omit<Candidate, 'canReveal'> & { polls: number };
// All names, numbers and IDs below are fictional demo data.
export const CANDIDATES: CandidateRow[] = [
  { id: 'C-101', name: 'Ananya Rao', role: 'Backend Engineer', aadhaar: '4821 7733 9051', phone: '+91 98765 43210', score: 96, stage: 3, polls: 0 },
  { id: 'C-102', name: 'Rohit Verma', role: 'DevOps Engineer', aadhaar: '3012 5588 1146', phone: '+91 91234 56780', score: 88, stage: 2, polls: 0 },
  { id: 'C-103', name: 'Sneha Kulkarni', role: 'QA Analyst', aadhaar: '7745 2210 6683', phone: '+91 99887 76655', score: 79, stage: 1, polls: 0 },
  { id: 'C-104', name: 'Arjun Mehta', role: 'Security Analyst', aadhaar: '5509 1274 3320', phone: '+91 90000 11122', score: 91, stage: 0, polls: 0 },
  { id: 'C-105', name: 'Divya Nair', role: 'Data Scientist', aadhaar: '2288 9041 7765', phone: '+91 98450 22110', score: 84, stage: 1, polls: 0 },
  { id: 'C-106', name: 'Karthik Reddy', role: 'Frontend Engineer', aadhaar: '6630 4417 8802', phone: '+91 97000 33445', score: 72, stage: 0, polls: 0 },
  { id: 'C-107', name: 'Meera Iyer', role: 'Product Designer', aadhaar: '1194 6650 2237', phone: '+91 96000 77889', score: 93, stage: 2, polls: 0 },
  { id: 'C-108', name: 'Vikram Singh', role: 'Cloud Architect', aadhaar: '8841 3029 5571', phone: '+91 95000 99001', score: 67, stage: 0, polls: 0 },
];

/** Keeps the last 4 digits and masks the rest, e.g. XXXX XXXX 9051. */
const maskDigits = (v: string) => v.replace(/\d(?=(?:\D*\d){4})/g, 'X');

export function candidateFor(c: CandidateRow, role: UserRole): Candidate {
  const admin = role === 'Admin';
  return { id: c.id, name: c.name, role: c.role, score: c.score, stage: c.stage,
    aadhaar: admin ? c.aadhaar : maskDigits(c.aadhaar), phone: admin ? c.phone : maskDigits(c.phone), canReveal: admin };
}

/** Simulates a background worker clearing candidates over time (so polling has something to show). */
let lastTick = Date.now();
export function tickPipeline(): void {
  if (Date.now() - lastTick < 8000) return;
  lastTick = Date.now();
  const next = CANDIDATES.filter(c => c.stage < 3).sort((a, b) => a.stage - b.stage)[0];
  if (next) { next.stage = (next.stage + 1) as Stage; saveDb(); }
}

// ---------------------------------------------------------------------------------------------
// Persistence: the "database" survives page refreshes (browser localStorage).
// Users you create, candidates you drag on the Kanban board and every action you take are kept.
// ---------------------------------------------------------------------------------------------
const DB_KEY = 'tv_db_v1';
interface ActivityRow { evt: string; user: string; ip: string; time: string; }
export const ACTIVITY: ActivityRow[] = [];

export function saveDb(): void {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify({
      users: MOCK_USERS,
      stages: Object.fromEntries(CANDIDATES.map(c => [c.id, c.stage])),
      activity: ACTIVITY.slice(0, 200),
    }));
  } catch { /* storage blocked or full: the demo keeps working in memory */ }
}

function loadDb(): void {
  try {
    const d = JSON.parse(localStorage.getItem(DB_KEY) ?? 'null');
    if (!d) return;
    Object.assign(MOCK_USERS, d.users ?? {});
    for (const c of CANDIDATES) if (d.stages?.[c.id] !== undefined) c.stage = d.stages[c.id];
    ACTIVITY.push(...(d.activity ?? []));
  } catch { /* ignore a corrupted store */ }
}

/** Real audit events (login, record views, exports, stage changes...). Newest first, max 200, persisted. */
export function logEvent(evt: string, user: string): void {
  ACTIVITY.unshift({ evt, user, ip: '192.168.1.104', time: new Date().toISOString().replace('T', ' ').slice(0, 19) });
  if (ACTIVITY.length > 200) ACTIVITY.pop();
  saveDb();
}

/** Wipes everything this demo stored in the browser. */
export function resetDb(): void {
  try {
    ['tv_widgets', 'tv_lang', DB_KEY].forEach(k => localStorage.removeItem(k));
    Object.keys(localStorage).filter(k => k.startsWith('tv_cache:')).forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
  } catch { /* ignore */ }
}

/** Your own recent actions first, followed by 10,000 seeded background events. */
export function auditStream(): LogEntry[] {
  const mine: LogEntry[] = ACTIVITY.map(a => ({ i: 0, time: a.time, evt: a.evt, user: a.user, ip: a.ip, hash: '' }));
  return [...mine, ...generateLogs()].map((e, i) => ({ ...e, i }));
}

/** 10,000 deterministic fake security events (seeded, so every visit looks the same). */
export function generateLogs(n = 10000): LogEntry[] {
  let s = 42;
  const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  const evts = ['AUTH_SUCCESS', 'DATA_READ', 'AUTH_FAIL', 'FIREWALL_BLOCK', 'POLICY_UPDATE', 'KEY_ROTATE', 'EXPORT_PDF', 'SESSION_END'];
  const users = ['admin', 'priya', 'SYSTEM', 'UNKNOWN', 'ananya', 'rohit'];
  const base = Date.UTC(2026, 9, 1);
  return Array.from({ length: n }, (_, i) => ({
    i, time: new Date(base + i * 37000).toISOString().replace('T', ' ').slice(0, 19),
    evt: evts[Math.floor(rnd() * evts.length)], user: users[Math.floor(rnd() * users.length)],
    ip: `${10 + Math.floor(rnd() * 200)}.${Math.floor(rnd() * 255)}.${Math.floor(rnd() * 255)}.${1 + Math.floor(rnd() * 254)}`, hash: '',
  }));
}

loadDb();
