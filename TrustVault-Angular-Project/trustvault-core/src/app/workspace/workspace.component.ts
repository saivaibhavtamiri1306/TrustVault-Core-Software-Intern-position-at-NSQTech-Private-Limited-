import { ChangeDetectionStrategy, Component, ComponentRef, ElementRef, HostListener, OnInit, ViewChild, ViewContainerRef, inject, signal } from '@angular/core';
import { HasClearanceDirective } from '../shared/has-clearance.directive';
import { TranslatePipe } from '../shared/translate.pipe';
import { WIDGETS, Widget } from './widgets';

const KEY = 'tv_widgets';

/** Dynamic dashboard: widgets are created from TypeScript at runtime with ViewContainerRef.createComponent(). */
@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [HasClearanceDirective, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
  <div class="mb-4 flex items-center justify-between">
    <h3 class="text-sm font-mono font-bold uppercase tracking-wider text-brand-300">{{ 'DASH.WS' | translate }}</h3>
    <div *hasClearance="'Admin'" class="relative">
      <button class="btn-cyber !px-4 !py-2 !text-xs" (click)="menu.set(!menu())">{{ 'DASH.ADD' | translate }}</button>
      @if (menu()) {
        <div class="glass-panel animate-fade-in-up absolute right-0 z-30 mt-2 w-64 p-2">
          @for (w of defs; track w.id) {
            <button class="w-full rounded-lg px-3 py-2 text-left text-xs font-mono text-slate-300 transition hover:bg-brand-400/10 hover:text-brand-300 disabled:opacity-30"
                    [disabled]="active().includes(w.id)" (click)="add(w.id)">{{ w.label }}</button>
          }
        </div>
      }
    </div>
  </div>
  <div class="grid gap-6 md:grid-cols-2"><ng-container #anchor></ng-container></div>`,
})
export class WorkspaceComponent implements OnInit {
  @ViewChild('anchor', { read: ViewContainerRef, static: true }) anchor!: ViewContainerRef;
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly defs = WIDGETS;
  readonly menu = signal(false);
  readonly active = signal<string[]>([]);
  private refs = new Map<string, ComponentRef<Widget>>();

  ngOnInit(): void {
    let saved: string[] = ['gauge', 'heatmap'];
    try { const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null'); if (Array.isArray(raw)) saved = raw; } catch { /* use defaults */ }
    saved.forEach(id => this.mount(id));
  }

  add(id: string): void { this.mount(id); this.menu.set(false); this.save(); }

  private mount(id: string): void {
    const def = this.defs.find(d => d.id === id);
    if (!def || this.refs.has(id)) return;
    const ref = this.anchor.createComponent<Widget>(def.type);
    ref.instance.removed.subscribe(() => this.remove(id));
    this.refs.set(id, ref);
    this.active.update(a => [...a, id]);
  }

  private remove(id: string): void {
    this.refs.get(id)?.destroy();
    this.refs.delete(id);
    this.active.update(a => a.filter(x => x !== id));
    this.save();
  }

  private save(): void { localStorage.setItem(KEY, JSON.stringify(this.active())); }

  @HostListener('document:click', ['$event'])
  outside(e: MouseEvent): void { if (this.menu() && !this.host.nativeElement.contains(e.target as Node)) this.menu.set(false); }
}
