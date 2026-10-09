import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, OnInit, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, switchMap, timer } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Candidate, STAGES, Stage, VaultRecord } from '../core/models';
import { ReportService } from '../core/report.service';
import { ToastService } from '../core/toast.service';
import { panelAnim } from '../shared/animations';
import { GaugeComponent } from '../shared/gauge.component';
import { HasClearanceDirective } from '../shared/has-clearance.directive';
import { MaskPiiDirective } from '../shared/mask-pii.directive';
import { SecureCardComponent } from '../shared/secure-card.component';
import { StepperComponent } from '../shared/stepper.component';

const EYE = 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm10 3a3 3 0 100-6 3 3 0 000 6z';

@Component({
  selector: 'app-record-modal',
  standalone: true,
  imports: [SecureCardComponent, GaugeComponent, StepperComponent, MaskPiiDirective, HasClearanceDirective],
  animations: [panelAnim],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4 backdrop-blur-sm transition-opacity duration-200" [class.opacity-0]="closing()" (click)="close()">
    <div @panel class="max-h-[90vh] w-full max-w-4xl overflow-y-auto" (click)="$event.stopPropagation()">
      <app-secure-card [tilt]="false">
        <div card-header class="flex items-center justify-between">
          <div>
            <p class="text-[10px] font-mono text-brand-400">{{ record().id }} // {{ record().level.toUpperCase() }}</p>
            <h3 class="text-xl font-bold text-white">{{ record().title }}</h3>
          </div>
          <button (click)="close()" class="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-slate-400 transition hover:border-cyber-danger/60 hover:text-cyber-danger" aria-label="Close">✕</button>
        </div>

        <div card-body class="grid gap-6 md:grid-cols-2">
          <!-- Document that "decrypts" in 2 seconds -->
          <div class="relative h-80 overflow-hidden rounded-xl border border-brand-400/30 bg-black/40">
            <div class="absolute inset-0 space-y-3 p-5 transition-[filter] duration-[2000ms] ease-out" [style.filter]="decrypted() ? 'blur(0px)' : 'blur(12px)'">
              <div class="h-3 w-1/2 rounded bg-brand-400/60"></div>
              @for (w of lines; track $index) { <div class="h-2 rounded bg-white/15" [style.width.%]="w"></div> }
              <p class="pt-3 font-mono text-[11px] leading-relaxed text-slate-300">
                {{ record().title }}. Classification: {{ record().level }}. Size {{ record().size }}. Source ID {{ record().candidateId }}. Hash-chained and stored in the audit ledger.
              </p>
            </div>
            @if (!decrypted()) { <div class="absolute inset-x-0 h-0.5 animate-laser bg-cyber-danger shadow-[0_0_14px_#ff003c]"></div> }
            <div class="absolute bottom-3 left-3 rounded bg-black/70 px-2 py-1 font-mono text-[10px]" [class]="decrypted() ? 'text-brand-400' : 'animate-pulse text-cyber-danger'">
              {{ decrypted() ? '● DECRYPTED' : '● DECRYPTING…' }}
            </div>
          </div>

          <!-- Candidate details -->
          @if (candidate(); as c) {
            <div class="space-y-5">
              <div>
                <p class="text-xs font-mono text-slate-500">SUBJECT</p>
                <p class="text-lg font-bold text-white">{{ c.name }}</p>
                <p class="text-xs font-mono text-brand-300">{{ c.role }}</p>
              </div>
              <div class="grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <p class="mb-1 text-slate-500">AADHAAR</p>
                  <span class="inline-flex cursor-pointer select-none items-center gap-2 rounded border border-white/10 bg-black/30 px-2 py-1 text-white" [appMaskPII]="c.aadhaar" [canReveal]="c.canReveal">
                    <svg class="h-4 w-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="eye"></path></svg><span data-pii></span>
                  </span>
                </div>
                <div>
                  <p class="mb-1 text-slate-500">PHONE</p>
                  <span class="inline-flex cursor-pointer select-none items-center gap-2 rounded border border-white/10 bg-black/30 px-2 py-1 text-white" [appMaskPII]="c.phone" [canReveal]="c.canReveal">
                    <svg class="h-4 w-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="eye"></path></svg><span data-pii></span>
                  </span>
                </div>
              </div>
              <p class="text-[10px] font-mono text-slate-500">{{ c.canReveal ? 'Press and hold the eye to reveal.' : 'Admin clearance is required to reveal personal data.' }}</p>
              <div class="flex items-start gap-5">
                <app-gauge [score]="c.score" [size]="110" label="Integrity" />
                <div class="flex-1">
                  <p class="mb-3 text-xs font-mono text-slate-500">LIVE STATUS · checked every 3s</p>
                  <app-stepper [stage]="stage()" />
                </div>
              </div>
            </div>
          } @else {
            <div class="space-y-4"><div class="h-6 w-1/2 animate-pulse rounded bg-white/10"></div><div class="h-24 animate-pulse rounded bg-white/10"></div><div class="h-32 animate-pulse rounded bg-white/10"></div></div>
          }
        </div>

        <div card-footer class="flex items-center justify-between">
          <span class="text-[10px] font-mono text-slate-500">Press ESC to close</span>
          <button *hasClearance="'Admin'" class="btn-cyber !px-4 !py-2 !text-xs" [disabled]="exporting() || !candidate()" (click)="exportPdf()">
            {{ exporting() ? 'Building PDF…' : 'Export PDF report' }}
          </button>
        </div>
      </app-secure-card>
    </div>
  </div>`,
})
export class RecordModalComponent implements OnInit {
  record = input.required<VaultRecord>();
  closed = output<void>();

  private api = inject(ApiService);
  private report = inject(ReportService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  readonly eye = EYE;
  readonly lines = [92, 78, 85, 60, 88, 70, 81];
  readonly candidate = signal<Candidate | null>(null);
  readonly stage = signal<Stage>(0);
  readonly decrypted = signal(false);
  readonly closing = signal(false);
  readonly exporting = signal(false);

  ngOnInit(): void {
    const id = this.record().candidateId;
    this.api.candidate(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(c => { this.candidate.set(c); this.stage.set(c.stage); });
    timer(2000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.decrypted.set(true));
    // Real-time status polling: switchMap drops a slow request if a newer tick arrives
    interval(3000).pipe(switchMap(() => this.api.candidateStatus(id)), takeUntilDestroyed(this.destroyRef)).subscribe(s => {
      if (s.stage !== this.stage()) { this.stage.set(s.stage); this.toast.show(`Verification update: ${STAGES[s.stage]}`, 'ok'); }
    });
  }

  @HostListener('document:keydown.escape') onEsc(): void { this.close(); }

  close(): void {
    if (this.closing()) return;
    this.closing.set(true);
    timer(220).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.closed.emit());
  }

  async exportPdf(): Promise<void> {
    const c = this.candidate();
    if (!c) return;
    this.exporting.set(true);
    try {
      await this.report.exportCandidate(this.record(), c, this.stage());
      this.api.logEvent('EXPORT_PDF').subscribe({ error: () => undefined });
      this.toast.show('PDF report downloaded', 'ok');
    }
    catch { this.toast.show('Could not build the PDF', 'err'); }
    finally { this.exporting.set(false); }
  }
}
