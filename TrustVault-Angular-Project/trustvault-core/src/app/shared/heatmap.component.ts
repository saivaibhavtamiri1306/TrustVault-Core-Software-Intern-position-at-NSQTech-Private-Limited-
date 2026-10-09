import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** GitHub-style 30-day security-event density grid. */
@Component({
  selector: 'app-heatmap',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
  <div class="grid grid-cols-10 gap-1.5">
    @for (d of days(); track d.i) {
      <div class="h-6 animate-fade-in-up rounded-sm transition hover:brightness-150" style="opacity:0"
           [class]="cls(d.count)" [style.animation-delay.ms]="d.i * 18" [title]="d.label + ': ' + d.count + ' events'"></div>
    }
  </div>
  <div class="mt-3 flex items-center justify-end gap-1.5 text-[10px] font-mono text-slate-500">
    Less @for (c of [0, 3, 10, 20, 30]; track c) { <span class="h-3 w-3 rounded-sm" [class]="cls(c)"></span> } More
  </div>`,
})
export class HeatmapComponent {
  seed = input(7);
  readonly days = computed(() => {
    let s = this.seed() * 9301;
    const rnd = () => { s = (s * 49297 + 233280) % 233280; return s / 233280; };
    const base = Date.UTC(2026, 8, 8);
    return Array.from({ length: 30 }, (_, i) => ({ i, count: Math.floor(rnd() * rnd() * 40), label: new Date(base + i * 86400000).toUTCString().slice(5, 11) }));
  });
  cls(c: number): string {
    return c === 0 ? 'bg-white/5' : c < 6 ? 'bg-brand-400/20' : c < 14 ? 'bg-brand-400/40' : c < 24 ? 'bg-brand-400/70' : 'bg-brand-300 shadow-[0_0_8px_#67e8f9]';
  }
}
