import { ChangeDetectionStrategy, Component, Type, computed, inject, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { interval, map, startWith, switchMap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Candidate, STAGES } from '../core/models';
import { GaugeComponent } from '../shared/gauge.component';
import { HasClearanceDirective } from '../shared/has-clearance.directive';
import { HeatmapComponent } from '../shared/heatmap.component';
import { NodeGraphComponent } from '../shared/node-graph.component';
import { SecureCardComponent } from '../shared/secure-card.component';

/** Every dashboard widget can ask to be removed. */
export interface Widget { removed: ReturnType<typeof output<void>>; }

@Component({
  selector: 'app-widget-gauge', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush, host: { class: 'block' },
  imports: [SecureCardComponent, GaugeComponent, HasClearanceDirective],
  template: `
  <app-secure-card>
    <div card-header class="flex items-center justify-between">
      <span class="text-xs font-mono font-bold uppercase tracking-wider text-brand-300">Data Integrity Score</span>
      <button *hasClearance="'Admin'" (click)="removed.emit()" class="text-xs text-slate-500 hover:text-cyber-danger" aria-label="Remove widget">✕</button>
    </div>
    <div card-body class="flex items-center gap-6">
      <app-gauge [score]="avg()" [size]="132" label="Average" />
      <ul class="flex-1 space-y-2 text-xs font-mono text-slate-400">
        @for (c of top(); track c.id) { <li class="flex justify-between"><span>{{ c.name }}</span><span class="text-brand-300">{{ c.score }}%</span></li> }
      </ul>
    </div>
  </app-secure-card>`,
})
export class GaugeWidgetComponent implements Widget {
  removed = output<void>();
  private cands = toSignal(inject(ApiService).candidates(), { initialValue: [] as Candidate[] });
  readonly avg = computed(() => { const c = this.cands(); return c.length ? Math.round(c.reduce((s, x) => s + x.score, 0) / c.length) : 0; });
  readonly top = computed(() => [...this.cands()].sort((a, b) => b.score - a.score).slice(0, 3));
}

@Component({
  selector: 'app-widget-heatmap', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush, host: { class: 'block' },
  imports: [SecureCardComponent, HeatmapComponent, HasClearanceDirective],
  template: `
  <app-secure-card>
    <div card-header class="flex items-center justify-between">
      <span class="text-xs font-mono font-bold uppercase tracking-wider text-brand-300">Anomaly Heatmap · 30 days</span>
      <button *hasClearance="'Admin'" (click)="removed.emit()" class="text-xs text-slate-500 hover:text-cyber-danger" aria-label="Remove widget">✕</button>
    </div>
    <div card-body><app-heatmap [seed]="7" /></div>
  </app-secure-card>`,
})
export class HeatmapWidgetComponent implements Widget { removed = output<void>(); }

@Component({
  selector: 'app-widget-graph', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush, host: { class: 'block md:col-span-2' },
  imports: [SecureCardComponent, NodeGraphComponent, HasClearanceDirective],
  template: `
  <app-secure-card [tilt]="false">
    <div card-header class="flex items-center justify-between">
      <span class="text-xs font-mono font-bold uppercase tracking-wider text-brand-300">Verification Node Graph</span>
      <button *hasClearance="'Admin'" (click)="removed.emit()" class="text-xs text-slate-500 hover:text-cyber-danger" aria-label="Remove widget">✕</button>
    </div>
    <div card-body><app-node-graph /></div>
  </app-secure-card>`,
})
export class GraphWidgetComponent implements Widget { removed = output<void>(); }

@Component({
  selector: 'app-widget-feed', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush, host: { class: 'block' },
  imports: [SecureCardComponent, HasClearanceDirective],
  template: `
  <app-secure-card>
    <div card-header class="flex items-center justify-between">
      <span class="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-brand-300"><span class="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>Live Status Feed · polls every 4s</span>
      <button *hasClearance="'Admin'" (click)="removed.emit()" class="text-xs text-slate-500 hover:text-cyber-danger" aria-label="Remove widget">✕</button>
    </div>
    <div card-body class="space-y-3">
      @for (s of stages(); track s.name) {
        <div>
          <div class="mb-1 flex justify-between text-xs font-mono"><span class="text-slate-300">{{ s.name }}</span><span class="text-brand-300">{{ s.count }}</span></div>
          <div class="h-1.5 overflow-hidden rounded bg-white/5"><div class="h-full rounded bg-gradient-to-r from-brand-400 to-emerald-400 transition-all duration-700" [style.width.%]="s.pct"></div></div>
        </div>
      }
    </div>
  </app-secure-card>`,
})
export class FeedWidgetComponent implements Widget {
  removed = output<void>();
  private api = inject(ApiService);
  /** interval + switchMap = safe polling: a slow reply can never pile up behind a newer one. */
  readonly stages = toSignal(
    interval(4000).pipe(startWith(0), switchMap(() => this.api.candidates()),
      map(list => STAGES.map((name, i) => { const count = list.filter(c => c.stage === i).length; return { name, count, pct: list.length ? (count / list.length) * 100 : 0 }; }))),
    { initialValue: [] });
}

export interface WidgetDef { id: string; label: string; type: Type<Widget>; }
export const WIDGETS: WidgetDef[] = [
  { id: 'gauge', label: 'Data Integrity Gauge', type: GaugeWidgetComponent },
  { id: 'heatmap', label: 'Anomaly Heatmap', type: HeatmapWidgetComponent },
  { id: 'graph', label: 'Verification Node Graph (3D)', type: GraphWidgetComponent },
  { id: 'feed', label: 'Live Status Feed', type: FeedWidgetComponent },
];
