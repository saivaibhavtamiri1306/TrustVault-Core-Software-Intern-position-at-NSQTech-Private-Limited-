import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, combineLatest, debounceTime, finalize, interval, map, startWith, takeUntil, timer } from 'rxjs';
import { ApiService } from '../core/api.service';
import { CsvService } from '../core/csv.service';
import { Clearance, VaultRecord } from '../core/models';
import { ToastService } from '../core/toast.service';
import { ClearancePipe } from '../shared/clearance.pipe';
import { TranslatePipe } from '../shared/translate.pipe';
import { RecordModalComponent } from './record-modal.component';

@Component({
  selector: 'app-records',
  standalone: true,
  imports: [ReactiveFormsModule, ClearancePipe, TranslatePipe, RecordModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="animate-fade-in-up max-w-6xl mx-auto p-4 lg:p-8">
    <div class="flex justify-between items-end mb-8">
      <div>
        <h2 class="text-3xl font-bold mb-1">{{ 'VAULT.T1' | translate }} <span class="font-light text-brand-400">{{ 'VAULT.T2' | translate }}</span></h2>
        <p class="text-sm font-mono text-slate-400">{{ 'VAULT.SUB' | translate }}</p>
      </div>
      <button (click)="loadRecords()" [disabled]="loading()" class="btn-cyber">
        {{ loading() ? 'Decrypting...' : ('VAULT.FETCH' | translate) }}
      </button>
    </div>

    @if (loading()) {
      <div class="glass-panel p-8 mb-6 border-brand-400/50">
        <div class="flex justify-between font-mono text-sm mb-4 text-brand-300">
          <span>Initiating Quantum Decryption Sequence</span>
          <span>{{ percent() }}%</span>
        </div>
        <div class="w-full h-2 bg-black/60 rounded-full overflow-hidden mb-6 border border-white/10">
          <div class="h-full bg-brand-400 shadow-[0_0_10px_#06b6d4]" [style.width.%]="progress()" style="transition: width 0.1s linear"></div>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono text-slate-500">
          @for (c of cipher(); track $index) {
            <div class="truncate">{{ c }} <span class="animate-pulse text-brand-400"> _</span></div>
          }
        </div>
      </div>
    }

    @if (records().length > 0) {
      <!-- Live filters: three inputs merged with combineLatest, no "Search" button -->
      <form [formGroup]="filterForm" class="glass-panel animate-fade-in-up mb-4 flex flex-wrap items-center gap-3 p-4">
        <input class="input-cyber max-w-xs flex-1" formControlName="search" [placeholder]="'VAULT.SEARCH' | translate" />
        <select class="input-cyber w-auto cursor-pointer appearance-none bg-[#0a0f1e]" formControlName="level">
          <option value="All">{{ 'VAULT.ALL' | translate }} · Clearance</option>
          <option value="Public">Public</option><option value="Internal">Internal</option><option value="Confidential">Confidential</option>
        </select>
        <select class="input-cyber w-auto cursor-pointer appearance-none bg-[#0a0f1e]" formControlName="status">
          <option value="All">{{ 'VAULT.ALL' | translate }} · Status</option>
          <option value="Open">Open</option><option value="Locked">Locked</option>
        </select>
        <span class="ml-auto text-xs font-mono text-slate-500">{{ filtered().length }} / {{ records().length }}</span>
        <button type="button" class="btn-cyber !px-4 !py-2 !text-xs" (click)="exportCsv()" [disabled]="!filtered().length">{{ 'VAULT.EXPORT' | translate }}</button>
      </form>

      <div class="glass-panel overflow-hidden">
        <table class="w-full text-left text-sm font-mono">
          <thead class="bg-white/5 text-brand-300 uppercase text-xs border-b border-brand-400/30">
            <tr>
              <th class="p-5 font-semibold tracking-wider">File ID</th>
              <th class="p-5 font-semibold tracking-wider">Asset Name</th>
              <th class="p-5 font-semibold tracking-wider">Clearance</th>
              <th class="p-5 font-semibold tracking-wider">Size</th>
              <th class="p-5 font-semibold tracking-wider text-right">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-slate-300">
            @for (r of filtered(); track r.id; let i = $index) {
              <tr class="hover:bg-brand-400/5 transition group cursor-pointer animate-fade-in-up" style="opacity:0" [style.animation-delay.ms]="i * 45" (click)="open(r)">
                <td class="p-5 text-slate-500">{{ r.id }}</td>
                <td class="p-5 font-sans font-medium" [class]="r.status === 'Locked' ? 'text-slate-600' : 'text-white group-hover:text-brand-300'">{{ r.title }}</td>
                <td class="p-5"><span class="px-2 py-1 rounded text-[10px] uppercase border" [class]="r.level | clearance">{{ r.level }}</span></td>
                <td class="p-5 text-slate-500">{{ r.size }}</td>
                <td class="p-5 text-right">
                  @if (r.status === 'Decrypted') {
                    <span class="inline-flex items-center gap-2 text-brand-400"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path></svg> OPEN</span>
                  } @else {
                    <span class="inline-flex items-center gap-2 text-cyber-danger"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> LOCKED</span>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="p-10 text-center text-slate-500">No records match your filters.</td></tr>
            }
          </tbody>
        </table>
      </div>
    }

    @if (selected(); as rec) { <app-record-modal [record]="rec" (closed)="selected.set(null)" /> }
  </div>`,
})
export class RecordsComponent {
  private api = inject(ApiService);
  private csv = inject(CsvService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly records = signal<VaultRecord[]>([]);
  readonly progress = signal(0);
  readonly cipher = signal<string[]>([]);
  readonly percent = computed(() => Math.floor(this.progress()));
  readonly selected = signal<VaultRecord | null>(null);

  readonly filterForm = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    level: new FormControl<'All' | Clearance>('All', { nonNullable: true }),
    status: new FormControl<'All' | 'Open' | 'Locked'>('All', { nonNullable: true }),
  });

  /** combineLatest: whenever ANY of the 4 streams emits, the table is re-filtered instantly. */
  readonly filtered = toSignal(
    combineLatest([
      toObservable(this.records),
      this.filterForm.controls.search.valueChanges.pipe(debounceTime(150), startWith('')),
      this.filterForm.controls.level.valueChanges.pipe(startWith('All')),
      this.filterForm.controls.status.valueChanges.pipe(startWith('All')),
    ]).pipe(map(([rows, q, level, status]) => rows.filter(r =>
      (level === 'All' || r.level === level) &&
      (status === 'All' || (status === 'Locked') === (r.status === 'Locked')) &&
      (!q || `${r.id} ${r.title}`.toLowerCase().includes(q.toLowerCase()))))),
    { initialValue: [] as VaultRecord[] });

  private randomCipher(): string[] {
    return Array.from({ length: 8 }, () => Math.random().toString(36).substring(2, 15).toUpperCase());
  }

  loadRecords(): void {
    this.loading.set(true);
    this.records.set([]);
    this.progress.set(0);
    this.cipher.set(this.randomCipher());

    const start = Date.now(), done$ = new Subject<void>();
    interval(50).pipe(takeUntil(done$), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      const p = ((Date.now() - start) / 1500) * 100;
      if (p < 100) { this.progress.set(p); this.cipher.set(this.randomCipher()); }
    });

    // HttpClient call to the (mock) API
    this.api.records().pipe(finalize(() => done$.next()), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        this.progress.set(100);
        timer(400).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => { this.loading.set(false); this.records.set(data); });
      },
      error: () => this.loading.set(false),
    });
  }

  open(r: VaultRecord): void {
    if (r.status === 'Locked') { this.toast.show('ACCESS DENIED: this record needs Admin clearance', 'err'); return; }
    this.selected.set(r);
  }

  exportCsv(): void {
    const rows = this.filtered();
    this.csv.download('trustvault-records.csv', ['File ID', 'Asset Name', 'Clearance', 'Size', 'Status'], rows.map(r => [r.id, r.title, r.level, r.size, r.status]));
    this.api.logEvent('EXPORT_CSV').subscribe({ error: () => undefined });
    this.toast.show(`Exported ${rows.length} rows to CSV`, 'ok');
  }
}
