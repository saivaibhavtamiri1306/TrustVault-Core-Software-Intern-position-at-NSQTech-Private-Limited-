import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
import { Session } from '../core/models';

@Component({
  selector: 'tv-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
<div class="relative z-10 grid min-h-screen lg:grid-cols-2 bg-[#02040a]">
  <section class="pointer-events-none z-10 hidden flex-col justify-center p-16 lg:flex">
    <div class="animate-fade-in-up" style="animation-delay:.1s">
      <div class="mb-6 flex items-center gap-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-lg border border-[#22d3ee] bg-[#02040a] shadow-[0_0_15px_rgba(34,211,238,0.5)]">
          <svg class="h-6 w-6 text-[#22d3ee]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        </div>
        <span class="text-2xl font-bold uppercase tracking-widest text-white">TrustVault <span class="text-[#22d3ee]">Core</span></span>
      </div>
      <h1 class="mb-6 text-6xl font-bold leading-tight text-white">Unbreachable <br/> <span class="bg-gradient-to-r from-[#00f0ff] to-[#06b6d4] bg-clip-text text-transparent">Quantum Security.</span></h1>
      <p class="max-w-md border-l-2 border-[#22d3ee]/50 pl-4 text-lg font-light leading-relaxed text-slate-400">Military-grade encryption. Immutable audit ledgers. Real-time threat neutralization.</p>
    </div>
  </section>

  <section class="relative z-10 flex items-center justify-center p-6 lg:p-12">
    <div class="animate-fade-in-up w-full max-w-md" style="animation-delay:.2s">
      <ng-container *ngIf="step === 1">
        <div class="mb-4 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-xs font-mono">
          <p class="mb-2 font-bold uppercase tracking-widest text-amber-300">⚠ DEMO ENVIRONMENT</p>
          <p class="mb-3 leading-relaxed text-slate-300">This is a demonstration website. All data is simulated. Sign in with the sample accounts below.</p>
          <div class="grid grid-cols-2 gap-2">
            <button type="button" (click)="fill('admin')" class="rounded-lg border border-white/10 bg-black/30 p-2 text-left transition hover:border-amber-300/60">
              <span class="block font-bold text-[#67e8f9]">Admin</span>
              <span class="text-slate-400">ID: admin<br/>Key: admin</span>
            </button>
            <button type="button" (click)="fill('priya')" class="rounded-lg border border-white/10 bg-black/30 p-2 text-left transition hover:border-amber-300/60">
              <span class="block font-bold text-[#67e8f9]">General User</span>
              <span class="text-slate-400">ID: priya<br/>Key: priya</span>
            </button>
          </div>
          <p class="mt-2 text-slate-400">2FA code (demo): <b class="tracking-widest text-white">123456</b></p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="glass-panel p-8 rounded-xl border border-[#22d3ee]/30 bg-black/40 backdrop-blur-md">
          <div class="mb-8 flex items-start justify-between">
            <div>
              <h2 class="mb-1 text-3xl font-bold text-white">Auth_Protocol</h2>
              <p class="font-mono text-xs text-[#22d3ee]">VER 4.9.2 // REQUIRE CREDENTIALS</p>
            </div>
            <div class="h-3 w-3 animate-pulse rounded-full bg-[#22d3ee] shadow-[0_0_10px_#06b6d4]"></div>
          </div>
          <div class="space-y-5">
            <div>
              <label class="mb-2 block font-mono text-xs uppercase tracking-widest text-slate-400">Operator ID</label>
              <input class="w-full rounded-lg border border-white/10 bg-black/40 p-3 text-white font-mono outline-none focus:border-[#00f0ff] transition" formControlName="userId" placeholder="Enter your operator ID">
            </div>
            <div>
              <label class="mb-2 block font-mono text-xs uppercase tracking-widest text-slate-400">Security Key</label>
              <input class="w-full rounded-lg border border-white/10 bg-black/40 p-3 text-white font-mono outline-none focus:border-[#00f0ff] transition" type="password" formControlName="password" placeholder="Enter your security key">
            </div>
            <div>
              <label class="mb-2 block font-mono text-xs uppercase tracking-widest text-slate-400">Access Role</label>
              <select class="w-full rounded-lg border border-white/10 bg-[#0a0f1e] p-3 text-white font-mono outline-none focus:border-[#00f0ff] transition cursor-pointer" formControlName="role">
                <option value="General User">General User</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>
          <div *ngIf="error" class="mt-4 font-mono text-xs font-bold text-[#ff003c]">{{ error }}</div>
          <button class="mt-8 w-full rounded-lg border border-[#00f0ff]/40 bg-gradient-to-r from-[#06b6d4]/10 to-[#b535f6]/10 p-3 font-mono text-sm font-bold text-[#00f0ff] transition hover:border-[#00f0ff]/60 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] disabled:opacity-50">
            {{ busy ? 'PROCESSING...' : 'INITIALIZE CONNECTION' }}
          </button>
        </form>
      </ng-container>

      <ng-container *ngIf="step === 2">
        <div class="glass-panel p-8 text-center rounded-xl border border-[#22d3ee]/30 bg-black/40 backdrop-blur-md">
          <h2 class="mb-1 text-2xl font-bold text-white">Two-Factor Verification</h2>
          <p class="mb-6 font-mono text-xs text-[#22d3ee]">Enter the 6-digit code to continue.</p>
          <div class="relative mx-auto w-fit">
            <div class="flex gap-2">
              <div *ngFor="let n of [0,1,2,3,4,5]" class="grid h-14 w-11 place-items-center rounded-lg border bg-black/40 font-mono text-2xl text-white transition-all duration-200" [ngClass]="otp[n] ? 'border-[#22d3ee] bg-[#22d3ee]/10' : ''">
                {{ otp[n] || '' }}
              </div>
            </div>
            <input class="absolute inset-0 h-full w-full cursor-text opacity-0" type="text" inputmode="numeric" maxlength="6" [value]="otp" (input)="otpInput($event)" autofocus>
          </div>
          <div class="mx-auto mt-6 h-1.5 w-56 overflow-hidden rounded bg-white/10">
            <div class="h-full rounded transition-all duration-1000 ease-linear" [ngClass]="cooldown < 8 ? 'bg-[#ff003c]' : 'bg-gradient-to-r from-[#22d3ee] to-emerald-400'" [style.width.%]="(cooldown / 30) * 100"></div>
          </div>
          <p class="mt-2 font-mono text-xs text-slate-400">
            <span *ngIf="cooldown > 0">Code expires in <b class="text-white">{{ cooldown }}s</b></span>
            <button *ngIf="cooldown === 0" (click)="resend()" class="font-bold text-[#67e8f9] underline">Resend code</button>
          </p>
          <div *ngIf="error" class="mt-4 font-mono text-xs font-bold text-[#ff003c]">{{ error }}</div>
        </div>
      </ng-container>

      <ng-container *ngIf="step === 3">
        <div class="glass-panel relative overflow-hidden border-[#ff003c] p-8 text-center rounded-xl bg-black/40 backdrop-blur-md">
          <div class="absolute top-0 left-0 w-full h-[5px] bg-gradient-to-b from-transparent via-[#ff003c]/40 to-transparent" style="animation: scanline 2s linear infinite;"></div>
          <h2 class="mb-2 animate-pulse font-mono text-2xl font-bold uppercase tracking-wider text-[#ff003c]">Biometric Scan Active</h2>
          <p class="mb-8 font-mono text-xs text-slate-400">Please look directly into the scanner.</p>
          <div class="relative mx-auto mb-8 flex h-48 w-48 items-center justify-center">
            <div class="absolute inset-0 rounded-full border-4 border-dashed border-[#ff003c] opacity-30" style="animation: spin 8s linear infinite;"></div>
            <div class="absolute inset-2 rounded-full border-2 border-[#22d3ee] opacity-50"></div>
            <div class="h-16 w-16 animate-pulse rounded-full bg-[#ff003c] blur-[10px]"></div>
          </div>
          <div class="h-32 overflow-y-auto flex flex-col-reverse rounded border border-[#22d3ee]/30 bg-black/60 p-4 text-left font-mono text-[10px] leading-relaxed text-[#67e8f9]">
            <div class="animate-pulse">_</div>
            <div *ngFor="let log of logs" class="mb-1">{{ log }}</div>
          </div>
        </div>
      </ng-container>

      <ng-container *ngIf="step === 4">
        <div class="glass-panel border-[#22d3ee] p-10 text-center shadow-[0_0_30px_rgba(34,211,238,0.3)] rounded-xl bg-black/40 backdrop-blur-md">
          <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#06b6d4]/20">
            <svg class="h-10 w-10 text-[#22d3ee]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 class="mb-2 text-3xl font-bold text-white">Access Granted</h2>
          <p class="font-mono text-sm text-[#22d3ee]">Decrypting vault contents...</p>
        </div>
      </ng-container>
    </div>
  </section>
</div>
  `
})
export class LoginComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  step: 1 | 2 | 3 | 4 = 1;
  busy = false;
  error = '';
  otp = '';
  cooldown = 30;
  logs: string[] = [];

  private timer?: any;
  private scanTimers: any[] = [];
  private pendingSession: Session | null = null;

  form = this.fb.nonNullable.group({
    userId: ['', Validators.required],
    password: ['', Validators.required],
    role: ['General User', Validators.required]
  });

  fill(role: 'admin' | 'priya'): void {
    if (role === 'admin') this.form.setValue({ userId: 'admin', password: 'admin', role: 'Admin' });
    else this.form.setValue({ userId: 'priya', password: 'priya', role: 'General User' });
  }

  submit(): void {
    this.error = '';
    if (this.form.invalid) return;
    this.busy = true;

    this.auth.login(this.form.value as any).subscribe({
      next: session => {
        this.pendingSession = session;
        this.step = 2;
        this.busy = false;
        this.startCooldown();
      },
      error: (err: any) => {
        this.busy = false;
        this.error = err?.error?.message || 'Login failed.';
      }
    });
  }

  otpInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6);
    this.otp = value;

    if (value.length !== 6 || this.busy) return;
    if (this.cooldown === 0) {
      this.error = 'Code expired. Please resend.';
      this.otp = '';
      return;
    }

    this.busy = true;
    this.auth.verifyMfa(value).subscribe({
      next: () => this.startScan(),
      error: (err: any) => {
        this.busy = false;
        this.error = err?.error?.message || 'Invalid OTP.';
        this.otp = '';
      }
    });
  }

  resend(): void {
    this.otp = '';
    this.error = '';
    this.startCooldown();
    this.toast.show('Demo code renewed: 123456', 'info');
  }

  private startCooldown(): void {
    clearInterval(this.timer);
    this.cooldown = 30;
    this.timer = setInterval(() => {
      this.cooldown = Math.max(0, this.cooldown - 1);
      if (this.cooldown === 0) clearInterval(this.timer);
    }, 1000);
  }

  private startScan(): void {
    this.busy = false;
    this.step = 3;
    this.logs = [];
    clearInterval(this.timer);

    const sequence = [
      'Verifying credential hash...',
      'Hash match confirmed.',
      'Initializing biometric retinal scanner...',
      'Scanning retina topography...',
      'Analyzing genetic encryption markers...',
      'Cross-referencing quantum ledger...',
      'IDENTITY VERIFIED.',
      'Generating secure session token...',
      'Decrypting primary vault access...'
    ];

    sequence.forEach((msg, i) => {
      this.scanTimers.push(setTimeout(() => {
        const time = new Date().toISOString().split('T')[1].slice(0, -1);
        this.logs.unshift(`[${time}] ${msg}`);
      }, (i + 1) * 400));
    });

    this.scanTimers.push(setTimeout(() => {
      if (!this.pendingSession) return;
      this.auth.start(this.pendingSession);
      this.pendingSession = null;
      this.step = 4;
      this.scanTimers.push(setTimeout(() => this.router.navigateByUrl('/dashboard'), 1500));
    }, sequence.length * 400 + 800));
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
    this.scanTimers.forEach(t => clearTimeout(t));
  }
}
