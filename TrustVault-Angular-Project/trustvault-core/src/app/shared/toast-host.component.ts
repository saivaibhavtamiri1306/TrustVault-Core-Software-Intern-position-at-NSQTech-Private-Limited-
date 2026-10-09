import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Toast, ToastService } from '../core/toast.service';
import { TranslatePipe } from './translate.pipe';

/** Subscribes to ToastService.toasts$ and shows each message for ~3.8 s. */
@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="pointer-events-none fixed bottom-6 left-1/2 z-[80] flex -translate-x-1/2 flex-col items-center gap-2">
    @for (t of items(); track t.id) {
      <div class="glass-panel animate-fade-in-up flex items-center gap-3 px-5 py-3 font-mono text-sm"
           [class]="t.kind === 'err' ? 'border-cyber-danger/60 text-cyber-danger' : t.kind === 'ok' ? 'border-emerald-400/50 text-emerald-300' : t.kind === 'warn' ? 'border-amber-400/50 text-amber-300' : 'border-brand-400/40 text-brand-300'">
        <span>{{ t.kind === 'err' ? '✖' : t.kind === 'ok' ? '✔' : t.kind === 'warn' ? '⚠' : 'ℹ' }}</span>{{ t.text | translate }}
      </div>
    }
  </div>`,
})
export class ToastHostComponent {
  readonly items = signal<Toast[]>([]);
  constructor() {
    inject(ToastService).toasts$.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(t => {
      this.items.update(l => [...l, t]);
      setTimeout(() => this.items.update(l => l.filter(x => x.id !== t.id)), 3800);
    });
  }
}
