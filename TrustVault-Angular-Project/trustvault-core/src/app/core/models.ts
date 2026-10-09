export type UserRole = 'Admin' | 'General User';
export type Clearance = 'Public' | 'Internal' | 'Confidential';
export type Stage = 0 | 1 | 2 | 3;
export const STAGES = ['Initiated', 'Queried', 'Verified', 'Cleared'] as const;

export interface AppUser { id: string; name: string; role: UserRole; accessLevel: string; email: string; status: 'Active' | 'Suspended'; }
export interface VaultRecord { id: string; title: string; level: Clearance; status: string; size: string; candidateId: string; }
export interface Candidate { id: string; name: string; role: string; aadhaar: string; phone: string; score: number; stage: Stage; canReveal: boolean; }
export interface LoginRequest { userId: string; password: string; role: UserRole; }
export interface Session { token: string; user: AppUser; }
export interface NewUser { userId: string; name: string; role: UserRole; accessLevel: string; }
export interface LogEntry { i: number; time: string; evt: string; user: string; ip: string; hash: string; }
