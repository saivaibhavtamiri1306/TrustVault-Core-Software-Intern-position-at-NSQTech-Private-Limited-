import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'tv-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html'
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
      next: () => {
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
    
    // Call the MFA/OTP verification
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
      this.step = 4;
      setTimeout(() => this.router.navigateByUrl('/dashboard'), 1500);
    }, sequence.length * 400 + 800));
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
    this.scanTimers.forEach(t => clearTimeout(t));
  }
}
