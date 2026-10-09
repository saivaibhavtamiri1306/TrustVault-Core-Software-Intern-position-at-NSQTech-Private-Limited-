import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, of, tap, throwError } from 'rxjs';
import { API_URL } from './api.config';
import { NetworkStatusService } from './network-status.service';
import { ToastService } from './toast.service';

const CACHEABLE = /^\/(records|users|candidates)(\/[\w-]+)?$/;

/** Offline-first: remember every successful GET; if the server later fails, serve the last copy. */
export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  const path = req.url.slice(API_URL.length);
  if (req.method !== 'GET' || !req.url.startsWith(API_URL) || !CACHEABLE.test(path)) return next(req);

  const net = inject(NetworkStatusService), toast = inject(ToastService);
  const key = `tv_cache:${req.headers.get('Authorization') ?? 'anon'}:${req.url}`; // per-user, so no data leaks between accounts

  return next(req).pipe(
    tap(e => {
      if (e instanceof HttpResponse) {
        try { localStorage.setItem(key, JSON.stringify(e.body)); } catch { /* storage full: ignore */ }
        net.offlineMode.set(false);
      }
    }),
    catchError((err: HttpErrorResponse) => {
      const raw = localStorage.getItem(key);
      if (raw && (err.status === 0 || err.status >= 500)) {
        net.offlineMode.set(true);
        toast.show('Offline mode: showing the last cached data', 'warn');
        return of(new HttpResponse({ status: 200, url: req.url, body: JSON.parse(raw) }));
      }
      return throwError(() => err);
    }));
};
