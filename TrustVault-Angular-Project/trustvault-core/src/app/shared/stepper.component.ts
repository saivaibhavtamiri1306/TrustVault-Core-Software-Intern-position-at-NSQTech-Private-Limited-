import { ChangeDetectionStrategy, Component, effect, input, signal, untracked } from '@angular/core';
import { take, timer } from 'rxjs';
import { STAGES } from '../core/models';

/** Vertical lifecycle timeline. The steps light up one after another, every 550 ms. */
@Component({
  selector: 'app-stepper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
  <ol>
    @for (s of steps; track s; let i = $index; let last = $last) {
      <li class="relative flex gap-4" [class.pb-6]="!last">
        @if (!last) {
          <span class="absolute bottom-0 left-[15px] top-8 w-0.5 bg-white/10">
            <span class="block w-full bg-brand-400 transition-all duration-500" [style.height.%]="active() > i ? 100 : 0"></span>
          </span>
        }
        <span class="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-mono transition-all duration-500"
              [class]="active() >= i ? 'border-brand-400 bg-brand-400/20 text-brand-300 shadow-[0_0_14px_rgba(34,211,238,.5)]' : 'border-white/15 text-slate-500'">
          {{ active() > i ? '✓' : i + 1 }}
        </span>
        <div>
          <p class="text-sm font-mono" [class]="active() >= i ? 'text-white' : 'text-slate-500'">{{ s }}</p>
          <p class="text-[10px] font-mono text-slate-500">{{ sub[i] }}</p>
        </div>
      </li>
    }
  </ol>`,
})
export class StepperComponent {
  stage = input(0);
  readonly steps = STAGES;
  readonly sub = ['Request received', 'EPFO + E-Courts queried', 'Identity matched', 'Report issued'];
  readonly active = signal(-1);

  constructor() {
    effect(onCleanup => {
      const target = this.stage();
      const start = untracked(() => this.active()) + 1;
      const sub = timer(0, 550).pipe(take(Math.max(0, target - start + 1))).subscribe(k => this.active.set(start + k));
      onCleanup(() => sub.unsubscribe());
    });
  }
}
