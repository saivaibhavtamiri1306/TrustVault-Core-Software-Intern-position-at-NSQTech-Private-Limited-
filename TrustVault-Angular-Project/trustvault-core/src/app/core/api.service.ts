import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppUser, Candidate, LoginRequest, Session } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api'; 

  get<T>(path: string, params?: Record<string, string | number | boolean>): Observable<T> {
    let hp = new HttpParams();
    Object.entries(params ?? {}).forEach(([k, v]) => hp = hp.set(k, String(v)));
    return this.http.get<T>(`${this.base}${path}`, { params: hp });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.base}${path}`, body);
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.base}${path}`, body);
  }

  login(request: LoginRequest): Observable<Session> {
    return this.post<Session>('/auth/login', request);
  }

  me(): Observable<AppUser> {
    return this.get<AppUser>('/users/me');
  }

  candidates(): Observable<Candidate[]> {
    return this.get<Candidate[]>('/candidates');
  }

  candidate(id: string): Observable<Candidate> {
    return this.get<Candidate>(`/candidates/${encodeURIComponent(id)}`);
  }

  candidateStatus(id: string): Observable<Pick<Candidate, 'stage' | 'score'>> {
    return this.get<Pick<Candidate, 'stage' | 'score'>>(`/candidates/${encodeURIComponent(id)}/status`);
  }

  checkId(id: string): Observable<{ exists: boolean }> {
    return this.get<{ exists: boolean }>(`/users/check/${encodeURIComponent(id)}`);
  }

  logEvent(event: string): Observable<{ ok: boolean }> {
    return this.post<{ ok: boolean }>('/audit/event', { evt: event });
  }

  setStage(id: string, stage: number): Observable<any> {
    return this.put(`/candidates/${id}/stage`, { stage });
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.base}${path}`);
  }
}
