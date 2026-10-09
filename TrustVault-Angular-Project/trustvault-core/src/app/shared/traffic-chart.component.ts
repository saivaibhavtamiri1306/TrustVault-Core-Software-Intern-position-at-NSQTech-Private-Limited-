import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Loaded lazily with @defer from the dashboard. */
@Component({
  selector: 'app-traffic-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
  <div class="h-48 flex items-end justify-between gap-1 border-b border-brand-400/20 pb-2">
    @for (b of bars; track $index) {
      <div class="w-full bg-brand-400/30 rounded-t hover:bg-brand-300 transition-colors"
           [style.height.%]="b.h" [style.animation]="'pulse-fast ' + b.d + 's infinite alternate'"></div>
    }
  </div>`,
})
export class TrafficChartComponent {
  readonly bars = Array.from({ length: 40 }, () => ({ h: 20 + Math.random() * 80, d: 1 + Math.random() }));
}
