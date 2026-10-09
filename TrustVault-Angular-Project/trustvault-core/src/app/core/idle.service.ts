import { Injectable, NgZone, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, filter, fromEvent, map, merge, startWith, switchMap, takeWhile, tap, throttleTime, timer } from 'rxjs';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

/** Logs the user out after 60s without mouse/keyboard/touch activity (with a 10s warning). */
@Injectable({ providedIn: 'root' })
export class IdleService {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private zone = inject(NgZone);
  private sub?: Subscription;
  readonly warning = signal(false);
  readonly secondsLeft = signal(0);

  start(idleMs = 60_000, warnMs = 10_000): void {
    this.stop();
    // listen outside Angular's zone so mouse moves do not trigger change detection
    this.zone.runOutsideAngular(() => {
      this.sub = merge(fromEvent(window, 'mousemove'), fromEvent(window, 'keydown'), fromEvent(window, 'click'), fromEvent(window, 'touchstart')).pipe(
        startWith(null),
        throttleTime(300),
        tap(() => { if (this.warning()) this.zone.run(() => this.warning.set(false)); }),
        switchMap(() => timer(idleMs - warnMs).pipe(                       // every activity restarts the timer
          tap(() => this.zone.run(() => this.warning.set(true))),
          switchMap(() => timer(0, 1000).pipe(
            map(i => warnMs / 1000 - i),
            takeWhile(s => s >= 0),
            tap(s => this.zone.run(() => this.secondsLeft.set(s))),
            filter(s => s === 0))))),
      ).subscribe(() => this.zone.run(() => this.expire()));
    });
  }

  stop(): void { this.sub?.unsubscribe(); this.warning.set(false); }

  private expire(): void {
    this.stop();
    this.auth.logout();
    this.router.navigateByUrl('/login');
    this.toast.show('Session locked after 60 seconds of inactivity', 'warn');
  }
}
