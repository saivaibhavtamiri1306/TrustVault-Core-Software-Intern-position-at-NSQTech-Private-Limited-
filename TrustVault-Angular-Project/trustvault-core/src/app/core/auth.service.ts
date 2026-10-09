import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, of, tap } from 'rxjs';
import { TOKEN_KEY } from './api.config';
import { ApiService } from './api.service';
import { AppUser, LoginRequest, Session } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  readonly user = signal<AppUser | null>(null);
  readonly isAdmin = computed(() => this.user()?.role === 'Admin');

  /** Session returned by the password step; only activated once 2FA succeeds. */
  private pending: Session | null = null;

  login(req: LoginRequest) {
    return this.api.login(req).pipe(tap(s => this.pending = s));
  }

  /** Second factor: on success the pending session becomes the active one. */
  verifyMfa(otp: string) {
    return this.api.verifyMfa(otp).pipe(tap(() => {
      if (this.pending) { this.start(this.pending); this.pending = null; }
    }));
  }

  /** Called once the 2FA + biometric scan finish. */
  start(session: Session): void {
    sessionStorage.setItem(TOKEN_KEY, session.token);
    this.user.set(session.user);
  }

  /** APP_INITIALIZER: restores the session on a page refresh before the first route renders. */
  restore() {
    if (!sessionStorage.getItem(TOKEN_KEY)) return of(null);
    return this.api.me().pipe(
      tap((u: AppUser) => this.user.set(u)),
      catchError(() => { this.logout(); return of(null); }));
  }

  logout(): void {
    this.pending = null;
    sessionStorage.removeItem(TOKEN_KEY);
    Object.keys(localStorage).filter(k => k.startsWith('tv_cache:')).forEach(k => localStorage.removeItem(k)); // never keep another user's cached data
    this.user.set(null);
  }
}
