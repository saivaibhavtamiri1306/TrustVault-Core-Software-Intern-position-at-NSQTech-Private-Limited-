import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of, throwError } from 'rxjs';
import { API_URL } from './api.config';
import { CANDIDATES, DEMO_OTP, MOCK_USERS, auditStream, candidateFor, logEvent, recordsFor, saveDb, tickPipeline } from './mock-data';
import { LoginRequest, NewUser, Stage } from './models';
import { NetworkStatusService } from './network-status.service';

/** In-memory "dummy API". Terminal interceptor: it answers /api/* itself. */
export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_URL)) return next(req);
  const net = inject(NetworkStatusService);
  const route = req.url.slice(API_URL.length);

  const ok = <T>(body: T) => of(new HttpResponse<T>({ status: 200, body }));
  const fail = (status: number, message: string) =>
    throwError(() => new HttpErrorResponse({ status, statusText: message, url: req.url, error: { message } }));
  const list = () => Object.values(MOCK_USERS).map(u => ({ ...u }));

  if (net.outage() && req.method === 'GET') return fail(503, 'Service Unavailable');

  // ---- public routes (before the session starts) ----
  if (req.method === 'POST' && route === '/auth/login') {
    const { userId, password, role } = req.body as LoginRequest;
    const user = MOCK_USERS[userId];
    const problem = !user ? `AUTH_FAIL: User ${userId} not found in DB.`
      : password !== userId ? 'AUTH_FAIL: Invalid security key.'                 // dummy pwd check
      : user.role !== role ? `AUTH_FAIL: Access Denied. User is not ${role}.`
      : user.status !== 'Active' ? 'AUTH_FAIL: Account Suspended.' : '';
    if (problem) { logEvent('AUTH_FAIL', userId || 'UNKNOWN'); return fail(401, problem); }
    logEvent('AUTH_SUCCESS', user.id);
    return ok({ token: `mock.${user.id}`, user: { ...user } });
  }
  if (req.method === 'POST' && route === '/auth/mfa') {
    return (req.body as { otp: string }).otp === DEMO_OTP ? ok({ ok: true }) : fail(401, 'AUTH_FAIL: Invalid verification code.');
  }

  // ---- authenticated routes ----
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
  const me = token.startsWith('mock.') ? MOCK_USERS[token.slice(5)] : undefined;
  if (!me) return fail(401, 'Unauthorized');

  if (req.method === 'GET' && route === '/users/me') return ok({ ...me });
  if (req.method === 'GET' && route === '/records') { logEvent('DATA_READ', me.id); return ok(recordsFor(me.role)); }

  if (req.method === 'GET' && route === '/candidates') {
    tickPipeline();
    return ok(CANDIDATES.map(c => candidateFor(c, me.role)));
  }
  const one = route.match(/^\/candidates\/([\w-]+)$/);
  if (req.method === 'GET' && one) {
    const c = CANDIDATES.find(x => x.id === one[1]);
    if (c) logEvent('DOC_OPEN', me.id);
    return c ? ok(candidateFor(c, me.role)) : fail(404, 'Candidate not found');
  }
  const poll = route.match(/^\/candidates\/([\w-]+)\/status$/);
  if (req.method === 'GET' && poll) {
    const c = CANDIDATES.find(x => x.id === poll[1]);
    if (!c) return fail(404, 'Candidate not found');
    c.polls++;
    if (c.stage < 3 && c.polls % 2 === 0) { c.stage = (c.stage + 1) as Stage; saveDb(); } // the "background check" progresses
    return ok({ stage: c.stage, score: c.score });
  }

  if (req.method === 'POST' && route === '/audit/event') { logEvent((req.body as { evt: string }).evt, me.id); return ok({ ok: true }); }

  if (me.role !== 'Admin') return fail(403, 'Admin access required.');

  const move = route.match(/^\/candidates\/([\w-]+)\/stage$/);
  if (req.method === 'PUT' && move) {
    const c = CANDIDATES.find(x => x.id === move[1]);
    if (!c) return fail(404, 'Candidate not found');
    c.stage = (req.body as { stage: Stage }).stage;
    logEvent('STAGE_CHANGE', me.id);
    return ok({ ok: true });
  }
  if (req.method === 'GET' && route === '/users') return ok(list());
  const check = route.match(/^\/users\/check\/([\w-]+)$/);
  if (req.method === 'GET' && check) return ok({ exists: !!MOCK_USERS[check[1].toLowerCase()] });
  if (req.method === 'POST' && route === '/users') {
    const b = req.body as NewUser;
    const id = b.userId.toLowerCase();
    if (MOCK_USERS[id]) return fail(409, 'User ID already exists.');
    MOCK_USERS[id] = { id, name: b.name, role: b.role, accessLevel: b.accessLevel, email: `${id}@trustvault.core`, status: 'Active' };
    logEvent('USER_CREATED', me.id);
    return ok({ ...MOCK_USERS[id] });
  }
  const toggle = route.match(/^\/users\/([^/]+)\/status$/);
  if (req.method === 'PUT' && toggle) {
    const u = MOCK_USERS[toggle[1]];
    if (u) { u.status = u.status === 'Active' ? 'Suspended' : 'Active'; logEvent('USER_TOGGLE', me.id); }
    return ok(list());
  }
  if (req.method === 'GET' && route === '/audit/stream') return ok(auditStream());
  return fail(404, 'Not found');
};
