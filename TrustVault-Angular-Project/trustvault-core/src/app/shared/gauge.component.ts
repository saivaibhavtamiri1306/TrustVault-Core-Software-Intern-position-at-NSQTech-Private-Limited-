import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';

/** Animated SVG donut: stroke-dashoffset is computed from the score. */
@Component({
  selector: 'app-gauge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block' },
  template: `
  <div class="relative" [style.width.px]="size()" [style.height.px]="size()">
    <svg viewBox="0 0 100 100" class="h-full w-full -rotate-90">
      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="8" />
      <circle cx="50" cy="50" r="42" fill="none" stroke-width="8" stroke-linecap="round"
              [attr.stroke]="color()" [attr.stroke-dasharray]="C" [attr.stroke-dashoffset]="offset()"
              class="transition-[stroke-dashoffset] duration-[1400ms] ease-out" style="filter: drop-shadow(0 0 5px rgba(34,211,238,.6))" />
    </svg>
    <div class="absolute inset-0 grid place-items-center text-center">
      <div><p class="text-2xl font-bold text-white">{{ score() }}%</p><p class="text-[9px] font-mono uppercase text-slate-400">{{ label() }}</p></div>
    </div>
  </div>`,
})
export class GaugeComponent {
  score = input(0);
  size = input(120);
  label = input('Integrity');
  readonly C = 2 * Math.PI * 42;
  private shown = signal(0);
  readonly offset = computed(() => this.C * (1 - this.shown() / 100));
  readonly color = computed(() => (this.shown() >= 85 ? '#34d399' : this.shown() >= 70 ? '#22d3ee' : '#fb923c'));

  constructor() {
    effect(onCleanup => {
      const s = this.score();
      const id = setTimeout(() => this.shown.set(s), 120); // start from 0 so the ring "fills up"
      onCleanup(() => clearTimeout(id));
    });
  }
}
