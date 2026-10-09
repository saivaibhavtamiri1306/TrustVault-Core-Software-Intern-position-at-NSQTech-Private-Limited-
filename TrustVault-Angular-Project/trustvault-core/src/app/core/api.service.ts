import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  
  // This tells Angular to route calls to your Netlify Node.js functions
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

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.base}${path}`);
  }
}
