import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api.config';
import { AppUser, Candidate, LogEntry, LoginRequest, NewUser, Session, Stage, VaultRecord } from './models';

/** The only place that talks HTTP. Every method is typed. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  login = (body: LoginRequest) => this.http.post<Session>(`${API_URL}/auth/login`, body);
  verifyOtp = (otp: string) => this.http.post<{ ok: boolean }>(`${API_URL}/auth/mfa`, { otp });
  me = () => this.http.get<AppUser>(`${API_URL}/users/me`);
  records = () => this.http.get<VaultRecord[]>(`${API_URL}/records`);
  candidates = () => this.http.get<Candidate[]>(`${API_URL}/candidates`);
  candidate = (id: string) => this.http.get<Candidate>(`${API_URL}/candidates/${id}`);
  candidateStatus = (id: string) => this.http.get<{ stage: Stage; score: number }>(`${API_URL}/candidates/${id}/status`);
  setStage = (id: string, stage: Stage) => this.http.put<{ ok: boolean }>(`${API_URL}/candidates/${id}/stage`, { stage });
  users = () => this.http.get<AppUser[]>(`${API_URL}/users`);
  checkId = (id: string) => this.http.get<{ exists: boolean }>(`${API_URL}/users/check/${id}`);
  createUser = (body: NewUser) => this.http.post<AppUser>(`${API_URL}/users`, body);
  toggleUser = (id: string) => this.http.put<AppUser[]>(`${API_URL}/users/${id}/status`, {});
  auditStream = () => this.http.get<LogEntry[]>(`${API_URL}/audit/stream`);
  logEvent = (evt: string) => this.http.post<{ ok: boolean }>(`${API_URL}/audit/event`, { evt });
}
