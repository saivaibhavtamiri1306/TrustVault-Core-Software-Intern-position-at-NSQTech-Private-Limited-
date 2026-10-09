import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AppUser, UserRole } from '../core/models';
import { ToastService } from '../core/toast.service';
import { uniqueIdValidator } from '../core/validators';
import { PageHeaderComponent } from '../shared/page-header.component';
import { TranslatePipe } from '../shared/translate.pipe';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeaderComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="animate-fade-in-up max-w-6xl mx-auto p-4 lg:p-8">
    <div class="flex items-start justify-between gap-4">
      <app-page-header [title]="'USERS.T1' | translate" [accent]="'USERS.T2' | translate">
        Administrative control over DB entities. @if (loading()) { <span class="text-brand-400 animate-pulse ml-2">Syncing with API...</span> }
      </app-page-header>
      <button class="btn-cyber shrink-0" (click)="showForm.set(!showForm())">{{ 'USERS.REG' | translate }}</button>
    </div>

    @if (showForm()) {
      <form [formGroup]="form" (ngSubmit)="register()" class="glass-panel animate-fade-in-up mb-6 grid gap-4 p-6 md:grid-cols-4">
        <div class="md:col-span-1">
          <label class="mb-2 block text-xs font-mono uppercase tracking-widest text-slate-400">Operator ID</label>
          <div class="relative">
            <input class="input-cyber pr-10" formControlName="userId" placeholder="e.g. meera" />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
              @if (f.userId.pending) { <span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand-400 border-t-transparent"></span> }
              @else if (f.userId.valid) { <span class="text-emerald-400">✔</span> }
            </span>
          </div>
          @if (f.userId.touched || f.userId.dirty) {
            @if (f.userId.errors?.['idTaken']) { <p class="mt-1 text-xs font-mono text-cyber-danger">ID already taken</p> }
            @else if (f.userId.errors?.['pattern']) { <p class="mt-1 text-xs font-mono text-amber-300">3-20 letters, numbers or _</p> }
            @else if (f.userId.errors?.['required']) { <p class="mt-1 text-xs font-mono text-amber-300">Required</p> }
          }
        </div>
        <div>
          <label class="mb-2 block text-xs font-mono uppercase tracking-widest text-slate-400">Full name</label>
          <input class="input-cyber" formControlName="name" placeholder="Meera Iyer" />
        </div>
        <div>
          <label class="mb-2 block text-xs font-mono uppercase tracking-widest text-slate-400">Role</label>
          <select class="input-cyber appearance-none bg-[#0a0f1e]" formControlName="role"><option>General User</option><option>Admin</option></select>
        </div>
        <div>
          <label class="mb-2 block text-xs font-mono uppercase tracking-widest text-slate-400">Access level</label>
          <select class="input-cyber appearance-none bg-[#0a0f1e]" formControlName="accessLevel"><option>Alpha (Public)</option><option>Beta (Internal)</option><option>Omega (Full)</option></select>
        </div>
        <div class="flex items-center justify-between md:col-span-4">
          <p class="text-xs font-mono text-slate-500">The new operator signs in with the User ID as the key (demo).</p>
          <button class="btn-cyber" [disabled]="form.invalid || form.pending || saving()">{{ saving() ? 'Creating…' : 'Create operator' }}</button>
        </div>
      </form>
    }

    <div class="glass-panel overflow-hidden">
      <table class="w-full text-left text-sm font-mono">
        <thead class="bg-white/5 text-brand-300 uppercase text-xs border-b border-brand-400/30">
          <tr>
            <th class="p-5">User ID</th><th class="p-5">Name</th><th class="p-5">Role</th><th class="p-5">Status</th><th class="p-5 text-right">DB Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5 text-slate-300">
          @for (u of users(); track u.id) {
            <tr class="hover:bg-brand-400/5 transition">
              <td class="p-5 text-slate-400">{{ u.id }}</td>
              <td class="p-5 font-sans font-medium text-white">{{ u.name }}</td>
              <td class="p-5 text-brand-300">{{ u.role }}</td>
              <td class="p-5">
                <span class="px-2 py-1 rounded text-[10px] uppercase border"
                      [class]="u.status === 'Active' ? 'border-emerald-500/50 text-emerald-400' : 'border-cyber-danger/50 text-cyber-danger'">{{ u.status }}</span>
              </td>
              <td class="p-5 text-right">
                <button (click)="toggle(u.id)" [disabled]="loading() || u.id === 'admin'"
                        class="px-3 py-1 text-xs border border-white/20 hover:border-brand-400 hover:text-brand-400 rounded transition disabled:opacity-30 disabled:hover:border-white/20 disabled:hover:text-white">
                  {{ u.status === 'Active' ? 'Suspend Access' : 'Restore Access' }}
                </button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  </div>`,
})
export class UsersComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private fb = inject(NonNullableFormBuilder);
  private destroyRef = inject(DestroyRef);

  readonly users = signal<AppUser[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly saving = signal(false);

  readonly form = this.fb.group({
    userId: ['', { validators: [Validators.required, Validators.pattern(/^[a-z0-9_]{3,20}$/i)], asyncValidators: [uniqueIdValidator(this.api)] }],
    name: ['', [Validators.required, Validators.minLength(2)]],
    role: ['General User' as UserRole],
    accessLevel: ['Beta (Internal)'],
  });
  get f() { return this.form.controls; }

  constructor() {
    this.api.users().pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe(list => this.users.set(list));
  }

  toggle(id: string): void {
    this.loading.set(true);
    this.api.toggleUser(id).pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe(list => this.users.set(list));
  }

  register(): void {
    if (this.form.invalid || this.form.pending) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.api.createUser(this.form.getRawValue()).pipe(finalize(() => this.saving.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: u => {
        this.users.update(l => [...l, u]);
        this.form.reset({ role: 'General User', accessLevel: 'Beta (Internal)' });
        this.showForm.set(false);
        this.toast.show(`Operator ${u.id} created`, 'ok');
      },
      error: () => this.toast.show('Could not create the operator', 'err'),
    });
  }
}
