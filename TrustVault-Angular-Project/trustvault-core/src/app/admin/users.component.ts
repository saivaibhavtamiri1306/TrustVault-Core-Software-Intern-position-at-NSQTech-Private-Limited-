import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { ToastService } from '../core/toast.service';
import { catchError, of, switchMap, tap } from 'rxjs';
import { AppUser, NewUser, UserRole } from '../core/models';
import { TranslatePipe } from '../shared/translate.pipe';

@Component({
  selector: 'tv-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  template: `
<div class="mx-auto max-w-6xl p-4 lg:p-8 route-in">
  <div class="flex items-start justify-between gap-4 mb-8">
    <div>
      <h2 class="mb-1 text-3xl font-bold">{{ 'User' | translate }} <span class="font-light text-[#22d3ee]">{{ 'Management' | translate }}</span></h2>
      <p class="font-mono text-sm text-slate-400">{{ 'Administrative control over DB entities.' | translate }} <span *ngIf="loading" class="ml-2 animate-pulse text-[#22d3ee]">{{ 'Syncing with API...' | translate }}</span></p>
    </div>
    <button class="btn-cyber shrink-0 w-auto" [disabled]="submitting" (click)="toggleReg()">{{ '+ Register Operator' | translate }}</button>
  </div>

  <form *ngIf="showReg" [formGroup]="form" (ngSubmit)="submit()" class="glass-panel animate-fade-in-up mb-6 grid gap-4 p-6 md:grid-cols-4">
    <div>
      <label class="mb-2 block font-mono text-xs uppercase tracking-widest text-slate-400">{{ 'Operator ID' | translate }}</label>
      <div class="relative">
        <input class="input-cyber pr-10" formControlName="userId" [placeholder]="'e.g. meera' | translate" autocomplete="off">
        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
          <span *ngIf="checkingId" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#22d3ee] border-t-transparent"></span>
          <span *ngIf="idAvailable" class="text-emerald-400">✔</span>
        </span>
      </div>
      <p class="mt-1 font-mono text-xs" [ngClass]="idAvailable ? 'text-emerald-400' : form.get('userId')?.invalid && form.get('userId')?.touched ? 'text-amber-300' : 'text-slate-400'">
        {{ (checkingId ? 'Checking...' : idAvailable ? 'Available' : form.get('userId')?.invalid && form.get('userId')?.touched ? '3-20 letters, numbers or _' : '') | translate }}
      </p>
    </div>

    <div>
      <label class="mb-2 block font-mono text-xs uppercase tracking-widest text-slate-400">{{ 'Full name' | translate }}</label>
      <input class="input-cyber" formControlName="name" placeholder="Meera Iyer">
    </div>

    <div>
      <label class="mb-2 block font-mono text-xs uppercase tracking-widest text-slate-400">{{ 'Role' | translate }}</label>
      <select class="input-cyber appearance-none bg-[#0a0f1e]" formControlName="role">
        <option value="General User">{{ 'General User' | translate }}</option>
        <option value="Admin">{{ 'Admin' | translate }}</option>
      </select>
    </div>

    <div>
      <label class="mb-2 block font-mono text-xs uppercase tracking-widest text-slate-400">{{ 'Access level' | translate }}</label>
      <select class="input-cyber appearance-none bg-[#0a0f1e]" formControlName="accessLevel">
        <option value="Alpha (Public)">{{ 'Alpha (Public)' | translate }}</option>
        <option value="Beta (Internal)">{{ 'Beta (Internal)' | translate }}</option>
        <option value="Omega (Full)">{{ 'Omega (Full)' | translate }}</option>
      </select>
    </div>

    <div class="flex items-center justify-between md:col-span-4 mt-2">
      <p class="font-mono text-xs text-slate-500">{{ 'The new operator signs in with the User ID as the key (demo).' | translate }}</p>
      <button type="submit" class="btn-cyber w-auto" [disabled]="form.invalid || !idAvailable || form.disabled">
        {{ (form.disabled ? 'Creating...' : 'Create operator') | translate }}
      </button>
    </div>
  </form>

  <div class="glass-panel overflow-x-auto animate-fade-in-up">
    <table class="w-full text-left font-mono text-sm">
      <thead class="border-b border-[#22d3ee]/30 bg-white/5 text-xs uppercase text-[#67e8f9]">
        <tr>
          <th class="p-5">{{ 'User ID' | translate }}</th>
          <th class="p-5">{{ 'Name' | translate }}</th>
          <th class="p-5">{{ 'Role' | translate }}</th>
          <th class="p-5">{{ 'Status' | translate }}</th>
          <th class="p-5 text-right">{{ 'DB Actions' | translate }}</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-white/5 text-slate-300">
        <tr *ngFor="let u of users" class="transition hover:bg-[#22d3ee]/5">
          <td class="p-5 text-slate-400">{{ u.id }}</td>
          <td class="p-5 font-sans font-medium text-white">{{ u.name }}</td>
          <td class="p-5 text-[#22d3ee]">{{ u.role | translate }}</td>
          <td class="p-5">
            <span class="rounded border px-2 py-1 text-[10px] uppercase" [ngClass]="u.status === 'Active' ? 'border-emerald-500/50 text-emerald-400' : 'border-[#ff003c]/50 text-[#ff003c]'">
              {{ u.status | translate }}
            </span>
          </td>
          <td class="p-5 text-right">
            <button (click)="toggleStatus(u)" [disabled]="loading || u.id === 'admin'" class="rounded border border-white/20 px-3 py-1 text-xs transition hover:border-[#22d3ee] hover:text-[#22d3ee] disabled:opacity-30 disabled:hover:border-white/20 disabled:hover:text-white">
              {{ (u.status === 'Active' ? 'Suspend Access' : 'Restore Access') | translate }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
  `
})
export class UsersComponent implements OnInit {
  private readonly api = inject(ApiService); 
  private readonly fb = inject(FormBuilder); 
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  users: AppUser[] = [];
  loading = true;
  submitting = false;
  showReg = false;
  checkingId = false;
  idAvailable = false;

  form = this.fb.group({
    userId: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]{3,20}$/)]],
    name: ['', [Validators.required, Validators.minLength(2)]],
    role: this.fb.nonNullable.control<UserRole>('General User', Validators.required),
    accessLevel: ['Beta (Internal)', Validators.required]
  });

  ngOnInit(): void {
    this.fetchUsers();
    
    // Auto-check ID availability when typing
    const control = this.form.controls.userId;
    control.valueChanges.pipe(
      tap(id => {
        this.idAvailable = false;
        this.checkingId = !!id && control.valid;
      }),
      switchMap(id => !id || control.invalid ? of(null) : this.api.checkId(id).pipe(
        catchError(() => {
          this.toast.show('Could not check operator ID. Please retry.', 'err');
          return of(null);
        })
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => {
      this.idAvailable = result !== null && !result.exists;
      this.checkingId = false;
    });
  }

  fetchUsers(): void {
    this.loading = true;
    this.api.get<AppUser[]>('/users').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: () => {
        this.toast.show('Failed to fetch users', 'err');
        this.loading = false;
      }
    });
  }

  toggleReg(): void {
    if (this.submitting) return;
    this.showReg = !this.showReg;
    this.form.reset({ role: 'General User', accessLevel: 'Beta (Internal)' });
    this.idAvailable = false;
    this.checkingId = false;
  }

  submit(): void {
    if (this.form.invalid || !this.idAvailable || this.checkingId || this.submitting) return;
    const values = this.form.getRawValue();
    const request: NewUser = {
      userId: values.userId!, name: values.name!, role: values.role, accessLevel: values.accessLevel!
    };
    this.submitting = true;
    this.form.disable();
    this.api.post<AppUser>('/users', request).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (newUser) => {
        this.users = [...this.users, newUser];
        this.toast.show(`Operator ${newUser.id} created`, 'ok');
        this.submitting = false;
        this.form.enable();
        this.toggleReg();
      },
      error: (e) => {
        this.toast.show(e?.error?.message ?? 'Failed to create operator', 'err');
        this.submitting = false;
        this.form.enable();
      }
    });
  }

  toggleStatus(user: AppUser): void {
    if (this.loading || user.id === 'admin') return;
    this.loading = true;
    this.api.put<AppUser[]>(`/users/${encodeURIComponent(user.id)}/status`, {}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: users => {
        this.users = users;
        this.loading = false;
        this.toast.show('Operator status updated', 'ok');
      },
      error: () => {
        this.toast.show('Failed to update status', 'err');
        this.loading = false;
      }
    });
  }
}
