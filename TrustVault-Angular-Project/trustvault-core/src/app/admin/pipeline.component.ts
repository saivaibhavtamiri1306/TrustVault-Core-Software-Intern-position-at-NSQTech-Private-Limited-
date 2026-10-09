import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { ApiService } from '../core/api.service';
import { Candidate, STAGES, Stage } from '../core/models';
import { ToastService } from '../core/toast.service';
import { PageHeaderComponent } from '../shared/page-header.component';
import { TranslatePipe } from '../shared/translate.pipe';

/** Kanban board built with the Angular CDK drag-drop module. Data arrives through the route resolver. */
@Component({
  selector: 'app-pipeline',
  standalone: true,
  imports: [DragDropModule, PageHeaderComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="animate-fade-in-up max-w-7xl mx-auto p-4 lg:p-8">
    <app-page-header [title]="'PIPE.T1' | translate" [accent]="'PIPE.T2' | translate">{{ 'PIPE.SUB' | translate }}</app-page-header>

    <div cdkDropListGroup class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      @for (col of board(); track $index; let i = $index) {
        <div class="glass-panel min-h-[22rem] p-4">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-sm font-mono font-bold uppercase tracking-wider" [class]="i === 3 ? 'text-emerald-300' : 'text-brand-300'">{{ stages[i] }}</h3>
            <span class="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-mono text-slate-300">{{ col.length }}</span>
          </div>
          <div cdkDropList [cdkDropListData]="col" (cdkDropListDropped)="drop($event, i)" class="min-h-[16rem] space-y-3">
            @for (c of col; track c.id) {
              <div cdkDrag class="cursor-grab rounded-xl border border-white/10 bg-black/40 p-4 transition hover:border-brand-400/50 active:cursor-grabbing">
                <div class="flex items-center justify-between">
                  <p class="font-bold text-white">{{ c.name }}</p>
                  <span class="text-[10px] font-mono text-slate-500">{{ c.id }}</span>
                </div>
                <p class="mb-3 text-xs font-mono text-brand-300">{{ c.role }}</p>
                <div class="flex items-center gap-2">
                  <div class="h-1.5 flex-1 overflow-hidden rounded bg-white/10"><div class="h-full rounded bg-gradient-to-r from-brand-400 to-emerald-400" [style.width.%]="c.score"></div></div>
                  <span class="text-[10px] font-mono text-slate-400">{{ c.score }}%</span>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  </div>`,
})
export class PipelineComponent {
  /** Filled by the route resolver (withComponentInputBinding maps resolved data to inputs). */
  candidates = input<Candidate[]>([]);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  readonly stages = STAGES;
  readonly board = signal<Candidate[][]>([[], [], [], []]);

  constructor() {
    effect(() => {
      const list = this.candidates();
      untracked(() => this.board.set(STAGES.map((_, i) => list.filter(c => c.stage === i))));
    }, { allowSignalWrites: true });
  }

  drop(e: CdkDragDrop<Candidate[]>, stage: number): void {
    if (e.previousContainer === e.container) {
      moveItemInArray(e.container.data, e.previousIndex, e.currentIndex);
    } else {
      transferArrayItem(e.previousContainer.data, e.container.data, e.previousIndex, e.currentIndex);
      const c = e.container.data[e.currentIndex];
      c.stage = stage as Stage;
      this.api.setStage(c.id, c.stage).subscribe({
        next: () => this.toast.show(`${c.name} moved to ${STAGES[stage]}`, 'ok'),
        error: () => this.toast.show('Could not save the new stage', 'err'),
      });
    }
    this.board.update(b => b.slice()); // the CDK edits the arrays in place, so hand OnPush a new reference
  }
}
