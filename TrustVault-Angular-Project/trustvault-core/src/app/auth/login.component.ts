import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, map, take, takeWhile, timer } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { DEMO_OTP, resetDb } from '../core/mock-data';
import { Session, UserRole } from '../core/models';
import { SceneStateService } from '../core/scene-state.service';
import { LanguageSwitcherComponent } from '../shared/language-switcher.component';
import { TranslatePipe } from '../shared/translate.pipe';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, LanguageSwitcherComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="relative z-10 grid min-h-screen lg:grid-cols-2">
    <div class="absolute right-6 top-6 z-20"><app-language-switcher /></div>

    <!-- Left Hero Content -->
    <section class="hidden flex-col justify-center p-16 lg:flex z-10 pointer-events-none">
      <div class="animate-fade-in-up" style="animation-delay: 0.1s">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 rounded-lg bg-cyber-bg border border-brand-400 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.5)]">
            <svg class="w-6 h-6 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <span class="text-2xl font-bold tracking-widest text-white uppercase">TrustVault <span class="text-brand-400">Core</span></span>
        </div>
        <h1 class="text-6xl font-bold leading-tight mb-6">
          Unbreachable <br/> <span class="grad-text-cyan">Quantum Security.</span>
        </h1>
        <p class="text-lg text-slate-400 max-w-md font-light leading-relaxed border-l-2 border-brand-400/50 pl-4">
          Military-grade encryption. Immutable audit ledgers. Real-time threat neutralization.
          <br/><br/>
          <span class="text-brand-300 font-mono text-sm">SYSTEM STATUS: OPTIMAL</span>
        </p>
      </div>
    </section>

    <!-- Right Login Panel -->
    <section class="flex items-center justify-center p-6 lg:p-12 relative z-10">
      <div class="w-full max-w-md animate-fade-in-up" style="animation-delay: 0.2s">

        @switch (step()) {
          @case (0) {
            <!-- Demo disclaimer with sample accounts -->
            <div class="mb-4 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-xs font-mono">
              <p class="mb-2 font-bold uppercase tracking-widest text-amber-300">⚠ {{ 'LOGIN.WARN_T' | translate }}</p>
              <p class="mb-3 leading-relaxed text-slate-300">{{ 'LOGIN.WARN_B' | translate }}</p>
              <div class="grid grid-cols-2 gap-2">
                <button type="button" (click)="fill('admin', 'admin', 'Admin')" class="rounded-lg border border-white/10 bg-black/30 p-2 text-left transition hover:border-amber-300/60">
                  <span class="block font-bold text-brand-300">Admin</span><span class="text-slate-400">ID: admin<br/>Key: admin</span>
                </button>
                <button type="button" (click)="fill('priya', 'priya', 'General User')" class="rounded-lg border border-white/10 bg-black/30 p-2 text-left transition hover:border-amber-300/60">
                  <span class="block font-bold text-brand-300">General User</span><span class="text-slate-400">ID: priya<br/>Key: priya</span>
                </button>
              </div>
              <p class="mt-2 text-slate-400">2FA code (demo): <b class="tracking-widest text-white">123456</b></p>
              <button type="button" (click)="resetDemo()" class="mt-2 text-slate-500 underline transition hover:text-amber-300">↺ Reset demo data</button>
            </div>

            <form [formGroup]="form" ngNativeValidate (ngSubmit)="handleInitiate()" class="glass-panel p-8">
              <div class="flex justify-between items-start mb-8">
                <div>
                  <h2 class="text-3xl font-bold text-white mb-1">Auth_Protocol</h2>
                  <p class="text-xs font-mono text-brand-400">VER 4.9.2 // REQUIRE CREDENTIALS</p>
                </div>
                <div class="w-3 h-3 rounded-full bg-brand-400 animate-pulse-fast shadow-[0_0_10px_#06b6d4]"></div>
              </div>

              <div class="space-y-5">
                <div>
                  <label class="mb-2 block text-xs font-mono uppercase tracking-widest text-slate-400">{{ 'LOGIN.ID' | translate }}</label>
                  <input class="input-cyber" formControlName="userId" placeholder="Enter ID (e.g., admin)" required />
                </div>
                <div>
                  <label class="mb-2 block text-xs font-mono uppercase tracking-widest text-slate-400">{{ 'LOGIN.KEY' | translate }}</label>
                  <input class="input-cyber" type="password" formControlName="password" placeholder="••••••••" required />
                </div>
                <div>
                  <label class="mb-2 block text-xs font-mono uppercase tracking-widest text-slate-400">{{ 'LOGIN.ROLE' | translate }}</label>
                  <select class="input-cyber appearance-none bg-[#0a0f1e] cursor-pointer" formControlName="role">
                    <option value="General User">General User</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              @if (error()) { <p class="mt-4 text-xs font-mono font-bold text-cyber-danger animate-glitch">{{ error() }}</p> }

              <button class="btn-cyber w-full mt-8" type="submit" [disabled]="isAuthenticating()">
                {{ isAuthenticating() ? 'Processing API Request...' : ('LOGIN.BTN' | translate) }}
              </button>

              <div class="mt-8 pt-6 border-t border-white/10 flex flex-col items-center gap-3">
                <span class="text-xs font-mono text-slate-500 uppercase">{{ 'LOGIN.DEMO' | translate }}</span>
                <div class="flex gap-3">
                  <button type="button" (click)="fill('admin', 'admin', 'Admin')" class="px-4 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono transition text-brand-300">ADMIN</button>
                  <button type="button" (click)="fill('priya', 'priya', 'General User')" class="px-4 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono transition text-brand-300">USER</button>
                </div>
              </div>
            </form>
          }

          @case (1) {
            <!-- Two-factor step -->
            <div class="glass-panel p-8 text-center">
              <h2 class="mb-1 text-2xl font-bold text-white">{{ 'MFA.T' | translate }}</h2>
              <p class="mb-6 text-xs font-mono text-brand-400">{{ 'MFA.SUB' | translate }}</p>

              <div class="relative mx-auto w-fit" (click)="otpEl()?.nativeElement?.focus()">
                <div class="flex gap-2">
                  @for (i of digits; track i) {
                    <div class="grid h-14 w-11 place-items-center rounded-lg border bg-black/40 font-mono text-2xl text-white transition-all duration-200"
                         [class]="otp().length === i ? 'border-brand-400 shadow-[0_0_14px_rgba(34,211,238,.5)]' : 'border-white/10'">{{ otp().charAt(i) }}</div>
                  }
                </div>
                <input #otpInput class="absolute inset-0 h-full w-full cursor-text opacity-0" inputmode="numeric" maxlength="6" autocomplete="one-time-code"
                       [value]="otp()" (input)="onOtp($any($event.target).value)" aria-label="Verification code" />
              </div>

              <div class="mx-auto mt-6 h-1.5 w-56 overflow-hidden rounded bg-white/10">
                <div class="h-full rounded transition-all duration-1000 ease-linear"
                     [class]="countdown() < 8 ? 'bg-cyber-danger' : 'bg-gradient-to-r from-brand-400 to-emerald-400'" [style.width.%]="(countdown() / 30) * 100"></div>
              </div>
              <p class="mt-2 font-mono text-xs text-slate-400">
                @if (countdown() > 0) { {{ 'MFA.EXP' | translate }} <b class="text-white">{{ countdown() }}s</b> }
                @else { <button type="button" class="font-bold text-brand-300 underline" (click)="resend()">{{ 'MFA.RESEND' | translate }}</button> }
              </p>

              @if (error()) { <p class="mt-4 text-xs font-mono font-bold text-cyber-danger animate-glitch">{{ error() }}</p> }

              <button type="button" (click)="onOtp(demoOtp)" class="mt-6 rounded border border-white/10 bg-white/5 px-4 py-1.5 font-mono text-xs text-brand-300 transition hover:bg-white/10">
                {{ 'MFA.HINT' | translate }}: {{ demoOtp }}
              </button>
            </div>
          }

          @case (2) {
            <div class="glass-panel p-8 text-center border-cyber-danger relative overflow-hidden">
              <div class="scanline-fx animate-scanline"></div>
              <h2 class="text-2xl font-bold text-cyber-danger mb-2 font-mono uppercase tracking-wider animate-pulse">Biometric Scan Active</h2>
              <p class="text-xs text-slate-400 font-mono mb-8">Please look directly into the scanner.</p>

              <div class="relative w-48 h-48 mx-auto mb-8 flex items-center justify-center">
                <div class="absolute inset-0 border-4 border-cyber-danger rounded-full animate-spin-slow opacity-30 border-dashed"></div>
                <div class="absolute inset-2 border-2 border-brand-400 rounded-full opacity-50"></div>
                <div class="w-16 h-16 bg-cyber-danger rounded-full animate-pulse blur-[10px]"></div>
                <div class="absolute w-full h-1 bg-cyber-danger animate-scanline"></div>
              </div>

              <div class="text-left bg-black/60 p-4 rounded font-mono text-[10px] text-brand-300 h-32 overflow-y-auto leading-relaxed border border-brand-400/30">
                @for (log of terminalLogs(); track $index) { <div class="mb-1">{{ log }}</div> }
                <div class="animate-pulse">_</div>
              </div>
            </div>
          }

          @case (3) {
            <div class="glass-panel p-10 text-center border-brand-400 shadow-[0_0_30px_rgba(34,211,238,0.3)]">
              <div class="w-20 h-20 mx-auto rounded-full bg-brand-500/20 flex items-center justify-center mb-6">
                <svg class="w-10 h-10 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h2 class="text-3xl font-bold text-white mb-2">Access Granted</h2>
              <p class="text-sm font-mono text-brand-400">Decrypting vault contents...</p>
            </div>
          }
        }
      </div>
    </section>
  </div>`,
})
export class LoginComponent {
  private fb = inject(NonNullableFormBuilder);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private scene = inject(SceneStateService);
  private destroyRef = inject(DestroyRef);

  readonly otpEl = viewChild<ElementRef<HTMLInputElement>>('otpInput');
  readonly digits = [0, 1, 2, 3, 4, 5];
  readonly demoOtp = DEMO_OTP;

  readonly step = signal<0 | 1 | 2 | 3>(0); // 0: credentials, 1: 2FA code, 2: biometric scan, 3: access granted
  readonly error = signal('');
  readonly isAuthenticating = signal(false);
  readonly terminalLogs = signal<string[]>([]);
  readonly otp = signal('');
  readonly countdown = signal(30);

  private session?: Session;
  private cd?: Subscription;

  readonly form = this.fb.group({
    userId: ['', Validators.required],
    password: ['', Validators.required],
    role: ['General User' as UserRole],
  });

  constructor() { this.destroyRef.onDestroy(() => this.scene.isScanning.set(false)); }

  fill(userId: string, password: string, role: UserRole): void { this.form.setValue({ userId, password, role }); }

  /** Clears every saved demo user, Kanban move, widget layout and cache from this browser. */
  resetDemo(): void { resetDb(); location.reload(); }

  handleInitiate(): void {
    this.error.set('');
    const credentials = this.form.getRawValue();
    this.setBusy(true);
    // HttpClient -> interceptors -> (mock) API with an async delay
    this.auth.login(credentials).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: session => { this.setBusy(false); this.session = session; this.startMfa(); },
      error: (e: HttpErrorResponse) => { this.setBusy(false); this.error.set(e.error?.message ?? 'AUTH_FAIL: Server unreachable.'); },
    });
  }

  private setBusy(busy: boolean): void {
    this.isAuthenticating.set(busy);
    const { password, role } = this.form.controls;
    if (busy) { password.disable(); role.disable(); } else { password.enable(); role.enable(); }
  }

  // ---------- Two-factor step ----------
  private startMfa(): void {
    this.step.set(1);
    this.otp.set('');
    this.error.set('');
    this.startCountdown();
    setTimeout(() => this.otpEl()?.nativeElement.focus(), 80);
  }

  /** 30 -> 0 once a second; takeWhile stops the stream by itself. */
  private startCountdown(): void {
    this.cd?.unsubscribe();
    this.cd = timer(0, 1000).pipe(map(i => 30 - i), takeWhile(t => t >= 0), takeUntilDestroyed(this.destroyRef)).subscribe(t => this.countdown.set(t));
  }

  resend(): void { this.error.set(''); this.otp.set(''); this.startCountdown(); }

  onOtp(raw: string): void {
    const code = raw.replace(/\D/g, '').slice(0, 6);
    this.otp.set(code);
    if (code.length < 6) return;
    if (this.countdown() === 0) { this.error.set('Code expired. Please resend a new one.'); return; }
    this.api.verifyOtp(code).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.cd?.unsubscribe(); this.startBiometricScan(this.session!); },
      error: (e: HttpErrorResponse) => { this.error.set(e.error?.message ?? 'Verification failed.'); this.otp.set(''); },
    });
  }

  // ---------- Biometric scan ----------
  private addLog(msg: string): void {
    this.terminalLogs.update(l => [...l, `[${new Date().toISOString().split('T')[1].slice(0, -1)}] ${msg}`]);
  }

  private startBiometricScan(session: Session): void {
    this.step.set(2);
    this.scene.isScanning.set(true);
    this.terminalLogs.set([]);
    this.addLog('Initiating secure connection...');
    const logs = [
      'Verifying credential hash...', 'Hash match confirmed.', 'Initializing biometric retinal scanner...',
      'Scanning retina topography...', 'Analyzing genetic encryption markers...', 'Cross-referencing quantum ledger...',
      'IDENTITY VERIFIED.', 'Generating secure session token...', 'Decrypting primary vault access...',
    ];
    timer(400, 400).pipe(take(logs.length), takeUntilDestroyed(this.destroyRef)).subscribe(i => this.addLog(logs[i]));

    timer(logs.length * 400 + 800).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.scene.isScanning.set(false);
      this.step.set(3);
      timer(1500).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.auth.start(session);
        this.router.navigateByUrl('/dashboard');
      });
    });
  }
}
