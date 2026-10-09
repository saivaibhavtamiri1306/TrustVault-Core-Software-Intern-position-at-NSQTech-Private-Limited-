import { AfterViewInit, Component, DestroyRef, ElementRef, QueryList, ViewChildren, inject, OnDestroy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
import { Session, UserRole } from '../core/models';
import { TranslatePipe } from '../shared/translate.pipe';
import { LanguageSwitcherComponent } from '../shared/language-switcher.component';

@Component({
  selector: 'tv-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, LanguageSwitcherComponent],
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
      <h1 class="mb-6 text-6xl font-bold leading-tight text-white">{{ 'Unbreachable' | translate }} <br/> <span class="bg-gradient-to-r from-[#00f0ff] to-[#06b6d4] bg-clip-text text-transparent">{{ 'Quantum Security.' | translate }}</span></h1>
      <p class="max-w-md border-l-2 border-[#22d3ee]/50 pl-4 text-lg font-light leading-relaxed text-slate-400">{{ 'Military-grade encryption. Immutable audit ledgers. Real-time threat neutralization.' | translate }}</p>
    </div>
  </section>

  <section class="relative z-10 flex items-center justify-center p-6 lg:p-12">
    <div class="animate-fade-in-up w-full max-w-md" style="animation-delay:.2s">
      <div class="mb-4 flex justify-end"><app-language-switcher /></div>
      <ng-container *ngIf="step === 1">
        <div class="mb-4 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-xs font-mono">
          <p class="mb-2 font-bold uppercase tracking-widest text-amber-300">{{ 'DEMO ENVIRONMENT' | translate }}</p>
          <p class="mb-3 leading-relaxed text-slate-300">{{ 'This is a demonstration website. All data is simulated. Sign in with the sample accounts below.' | translate }}</p>
          <div class="grid grid-cols-2 gap-2">
            <button type="button" (click)="fill('admin')" class="rounded-lg border border-white/10 bg-black/30 p-2 text-left transition hover:border-amber-300/60">
              <span class="block font-bold text-[#67e8f9]">{{ 'Admin' | translate }}</span>
              <span class="text-slate-400">ID: admin<br/>Key: admin</span>
            </button>
            <button type="button" (click)="fill('priya')" class="rounded-lg border border-white/10 bg-black/30 p-2 text-left transition hover:border-amber-300/60">
              <span class="block font-bold text-[#67e8f9]">{{ 'General User' | translate }}</span>
              <span class="text-slate-400">ID: priya<br/>Key: priya</span>
            </button>
          </div>
          <p class="mt-2 text-slate-400">{{ '2FA code (demo):' | translate }} <b class="tracking-widest text-white">123456</b></p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="glass-panel p-8 rounded-xl border border-[#22d3ee]/30 bg-black/40 backdrop-blur-md">
          <div class="mb-8 flex items-start justify-between">
            <div>
              <h2 class="mb-1 text-3xl font-bold text-white">{{ 'Auth_Protocol' | translate }}</h2>
              <p class="font-mono text-xs text-[#22d3ee]">{{ 'VER 4.9.2 // REQUIRE CREDENTIALS' | translate }}</p>
            </div>
            <div class="h-3 w-3 animate-pulse rounded-full bg-[#22d3ee] shadow-[0_0_10px_#06b6d4]"></div>
          </div>
          <div class="space-y-5">
            <div>
              <label class="mb-2 block font-mono text-xs uppercase tracking-widest text-slate-400">{{ 'Operator ID' | translate }}</label>
              <input class="w-full rounded-lg border border-white/10 bg-black/40 p-3 text-white font-mono outline-none focus:border-[#00f0ff] transition" formControlName="userId" [placeholder]="'Enter your operator ID' | translate">
            </div>
            <div>
              <label class="mb-2 block font-mono text-xs uppercase tracking-widest text-slate-400">{{ 'Security Key' | translate }}</label>
              <input class="w-full rounded-lg border border-white/10 bg-black/40 p-3 text-white font-mono outline-none focus:border-[#00f0ff] transition" type="password" formControlName="password" [placeholder]="'Enter your security key' | translate">
            </div>
            <div>
              <label class="mb-2 block font-mono text-xs uppercase tracking-widest text-slate-400">{{ 'Access Role' | translate }}</label>
              <select class="w-full rounded-lg border border-white/10 bg-[#0a0f1e] p-3 text-white font-mono outline-none focus:border-[#00f0ff] transition cursor-pointer" formControlName="role">
                <option value="General User">{{ 'General User' | translate }}</option>
                <option value="Admin">{{ 'Admin' | translate }}</option>
              </select>
            </div>
          </div>
          <div *ngIf="error" class="mt-4 font-mono text-xs font-bold text-[#ff003c]">{{ error | translate }}</div>
          <button type="submit" [disabled]="busy || form.invalid" class="mt-8 w-full rounded-lg border border-[#00f0ff]/40 bg-gradient-to-r from-[#06b6d4]/10 to-[#b535f6]/10 p-3 font-mono text-sm font-bold text-[#00f0ff] transition hover:border-[#00f0ff]/60 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] disabled:opacity-50">
            {{ (busy ? 'PROCESSING...' : 'INITIALIZE CONNECTION') | translate }}
          </button>
        </form>
      </ng-container>

      <ng-container *ngIf="step === 2">
        <div class="glass-panel rounded-xl border border-[#22d3ee]/30 bg-black/40 p-6 text-center backdrop-blur-md sm:p-8">
          <h2 class="mb-1 text-2xl font-bold text-white">{{ 'MFA.T' | translate }}</h2>
          <p class="mb-5 font-mono text-xs text-[#22d3ee]">{{ 'MFA.SUB' | translate }}</p>
          <div class="mb-6 rounded-lg border border-amber-400/40 bg-amber-400/10 p-4 text-left" role="note">
            <p class="mb-1 text-xs font-bold uppercase tracking-wider text-amber-300">{{ 'Demo verification' | translate }}</p>
            <p class="text-sm leading-relaxed text-slate-300">{{ 'This is a demo. Enter' | translate }} <strong class="font-mono tracking-widest text-white">123456</strong> {{ 'to continue. No SMS is sent.' | translate }}</p>
            <button type="button" [disabled]="busy" (click)="useDemoCode()" class="mt-3 text-xs font-semibold text-amber-200 underline underline-offset-4 disabled:opacity-50">{{ 'Use demo code' | translate }}</button>
          </div>
          <div class="mx-auto flex max-w-xs justify-center gap-2" role="group" [attr.aria-label]="'MFA.T' | translate">
            <input *ngFor="let digitIndex of digitIndexes" #otpDigit
              class="h-12 min-w-0 flex-1 rounded-lg border border-white/20 bg-black/40 text-center font-mono text-2xl text-white caret-[#22d3ee] outline-none transition-colors focus:border-[#22d3ee] focus:ring-2 focus:ring-[#22d3ee]/40 sm:h-14"
              type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1"
              [attr.autocomplete]="digitIndex === 0 ? 'one-time-code' : 'off'"
              [attr.aria-label]="('Code digit' | translate) + ' ' + (digitIndex + 1) + ' / 6'"
              [formControl]="otpControls.at(digitIndex)"
              (input)="otpInput($event, digitIndex)" (keydown)="otpKeydown($event, digitIndex)" (paste)="otpPaste($event, digitIndex)">
          </div>
          <p *ngIf="busy" class="mt-4 text-xs text-[#67e8f9]" role="status">{{ 'Verifying code...' | translate }}</p>
          <div class="mx-auto mt-6 h-1.5 w-56 overflow-hidden rounded bg-white/10">
            <div class="h-full rounded" [ngClass]="cooldown < 8 ? 'bg-[#ff003c]' : 'bg-[#22d3ee]'" [style.width.%]="(cooldown / 30) * 100"></div>
          </div>
          <p class="mt-2 font-mono text-xs text-slate-400">
            <span *ngIf="cooldown > 0">{{ 'MFA.EXP' | translate }} <b class="text-white">{{ cooldown }}s</b></span>
            <button type="button" *ngIf="cooldown === 0" [disabled]="busy" (click)="resend()" class="font-bold text-[#67e8f9] underline">{{ 'MFA.RESEND' | translate }}</button>
          </p>
          <div *ngIf="error" class="mt-4 font-mono text-xs font-bold text-[#ff003c]" role="alert">{{ error | translate }}</div>
        </div>
      </ng-container>

      <ng-container *ngIf="step === 4">
        <div class="glass-panel border-[#22d3ee] p-10 text-center shadow-[0_0_30px_rgba(34,211,238,0.3)] rounded-xl bg-black/40 backdrop-blur-md">
          <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#06b6d4]/20">
            <svg class="h-10 w-10 text-[#22d3ee]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 class="mb-2 text-3xl font-bold text-white">{{ 'Access Granted' | translate }}</h2>
          <p class="font-mono text-sm text-[#22d3ee]">{{ 'Opening your workspace...' | translate }}</p>
        </div>
      </ng-container>
    </div>
  </section>
</div>
  `
})
export class LoginComponent implements AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  @ViewChildren('otpDigit') private digitInputs!: QueryList<ElementRef<HTMLInputElement>>;

  step: 1 | 2 | 4 = 1;
  busy = false;
  error = '';
  readonly digitIndexes = [0, 1, 2, 3, 4, 5];
  readonly otpControls = this.fb.nonNullable.array(this.digitIndexes.map(() => this.fb.nonNullable.control('')));
  get otpDigits(): string[] { return this.otpControls.getRawValue(); }
  cooldown = 30;

  private timer?: ReturnType<typeof setInterval>;
  private focusTimer?: ReturnType<typeof setTimeout>;
  private pendingSession: Session | null = null;

  form = this.fb.nonNullable.group({
    userId: ['', Validators.required],
    password: ['', Validators.required],
    role: this.fb.nonNullable.control<UserRole>('General User', Validators.required)
  });

  fill(role: 'admin' | 'priya'): void {
    if (role === 'admin') this.form.setValue({ userId: 'admin', password: 'admin', role: 'Admin' });
    else this.form.setValue({ userId: 'priya', password: 'priya', role: 'General User' });
  }

  submit(): void {
    this.error = '';
    if (this.form.invalid || this.busy) return;
    this.busy = true;

    this.auth.login(this.form.getRawValue()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

  ngAfterViewInit(): void {
    this.digitInputs.changes.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.digitInputs.length) this.focusFirstDigit();
    });
  }

  otpInput(event: Event, digitIndex: number): void {
    if (this.busy) return;
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '');
    this.error = '';
    if (digits.length > 1) {
      this.enterDigits(digits, digitIndex);
      return;
    }
    this.otpControls.at(digitIndex).setValue(digits, { emitEvent: false });
    if (digits && digitIndex < 5) this.focusDigit(digitIndex + 1);
    this.verifyOtp();
  }

  otpPaste(event: ClipboardEvent, digitIndex: number): void {
    event.preventDefault();
    if (!this.busy) this.enterDigits(event.clipboardData?.getData('text') ?? '', digitIndex);
  }

  otpKeydown(event: KeyboardEvent, digitIndex: number): void {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      this.focusDigit(Math.max(0, Math.min(5, digitIndex + (event.key === 'ArrowLeft' ? -1 : 1))));
    } else if (event.key === 'Backspace' && !this.otpDigits[digitIndex] && digitIndex > 0) {
      event.preventDefault();
      this.otpControls.at(digitIndex - 1).setValue('', { emitEvent: false });
      this.focusDigit(digitIndex - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.verifyOtp();
    } else if (event.key.length === 1 && !/\d/.test(event.key) && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
    }
  }

  useDemoCode(): void {
    if (this.busy) return;
    if (this.cooldown === 0) this.resend();
    this.enterDigits('123456', 0);
  }

  private enterDigits(value: string, digitIndex: number): void {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    const start = digits.length === 6 ? 0 : digitIndex;
    const nextDigits = this.otpDigits;
    digits.slice(0, 6 - start).split('').forEach((digit, offset) => nextDigits[start + offset] = digit);
    this.otpControls.setValue(nextDigits, { emitEvent: false });
    this.error = '';
    this.focusDigit(Math.min(5, start + digits.length));
    this.verifyOtp();
  }

  private focusDigit(digitIndex: number): void {
    const input = this.digitInputs.get(digitIndex)?.nativeElement;
    input?.focus();
    input?.select();
  }

  private focusFirstDigit(): void {
    clearTimeout(this.focusTimer);
    this.focusTimer = setTimeout(() => this.focusDigit(0), 0);
  }

  private verifyOtp(): void {
    const value = this.otpDigits.join('');
    if (value.length !== 6 || this.busy) return;
    if (this.cooldown === 0) {
      this.error = 'Code expired. Please resend.';
      this.resetDigits();
      this.focusFirstDigit();
      return;
    }
    this.busy = true;
    this.otpControls.disable({ emitEvent: false });
    this.auth.verifyMfa(value).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        if (!this.pendingSession) {
          this.busy = false;
          this.otpControls.enable({ emitEvent: false });
          this.step = 1;
          this.error = 'Login failed.';
          return;
        }
        clearInterval(this.timer);
        this.auth.start(this.pendingSession);
        this.pendingSession = null;
        this.step = 4;
        this.busy = false;
        this.router.navigateByUrl('/dashboard');
      },
      error: error => {
        this.busy = false;
        this.otpControls.enable({ emitEvent: false });
        this.error = error?.error?.message || 'Invalid OTP.';
        this.resetDigits();
        this.focusFirstDigit();
      }
    });
  }

  resend(): void {
    if (this.busy) return;
    this.resetDigits();
    this.error = '';
    this.startCooldown();
    this.focusFirstDigit();
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

  private resetDigits(): void {
    this.otpControls.reset(['', '', '', '', '', ''], { emitEvent: false });
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
    clearTimeout(this.focusTimer);
  }
}
