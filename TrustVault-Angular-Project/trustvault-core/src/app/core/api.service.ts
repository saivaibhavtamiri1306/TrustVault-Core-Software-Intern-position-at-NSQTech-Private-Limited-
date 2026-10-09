import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api.config';
import { AppUser, Candidate, LoginRequest, Session } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = API_URL;

  login(request: LoginRequest): Observable<Session> {
    return this.post<Session>('/auth/login', request);
  }

  verifyMfa(otp: string): Observable<{ ok: boolean }> {
    return this.post<{ ok: boolean }>('/auth/mfa', { otp });
  }

  me(): Observable<AppUser> {
    return this.get<AppUser>('/users/me');
  }

  candidates(): Observable<Candidate[]> {
    return this.get<Candidate[]>('/candidates');
  }

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

  setStage(id: string, stage: number): Observable<any> {
    return this.put(`/candidates/${id}/stage`, { stage });
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.base}${path}`);
  }
}
