import { Component, HostListener, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { ToastService } from '../core/toast.service';
import { Subscription, switchMap, timer } from 'rxjs';
import { Candidate, VaultRecord } from '../core/models';
import { CsvService } from '../core/csv.service';
import { ReportService } from '../core/report.service';

@Component({
  selector: 'tv-records',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="mx-auto max-w-6xl p-4 lg:p-8 route-in">
  <div class="mb-8 flex items-end justify-between">
    <div>
      <h2 class="mb-1 text-3xl font-bold">Data <span class="font-light text-[#22d3ee]">Vault</span></h2>
      <p class="font-mono text-sm text-slate-400">Encrypted file storage with role-based masking.</p>
    </div>
    <button class="btn-cyber w-auto" (click)="fetch()" [disabled]="loading">
      {{ loading ? 'Decrypting...' : 'Fetch Records' }}
    </button>
  </div>

  <div *ngIf="loadError && !loading" class="glass-panel mb-6 border-red-500/40 p-4 text-red-300" role="alert">
    {{ loadError }} Use Fetch Records to retry.
  </div>
  <div *ngIf="!loading && !loadError && !records.length" class="glass-panel p-8 text-slate-400">No records are available.</div>

  <div *ngIf="loading" class="glass-panel mb-6 border-[#22d3ee]/50 p-8 animate-fade-in-up">
    <div class="mb-4 flex justify-between font-mono text-sm text-[#67e8f9]">
      <span>Initiating Quantum Decryption Sequence</span>
    </div>
    <div class="mb-6 h-2 w-full overflow-hidden rounded-full border border-white/10 bg-black/60">
      <div class="h-full bg-[#22d3ee] shadow-[0_0_10px_#06b6d4] animate-pulse" style="width: 100%;"></div>
    </div>
    <div class="grid grid-cols-2 gap-4 font-mono text-xs text-slate-500 md:grid-cols-4">
      <div *ngFor="let _ of [1,2,3,4,5,6,7,8]" class="truncate">
        A83F92C... <span class="animate-pulse text-[#22d3ee]">_</span>
      </div>
    </div>
  </div>

  <div *ngIf="!loading && records.length" class="animate-fade-in-up">
    <div class="glass-panel mb-4 flex flex-wrap items-center gap-3 p-4">
      <input class="input-cyber max-w-xs flex-1" [(ngModel)]="search" placeholder="Search assets…">
      
      <select class="input-cyber w-auto cursor-pointer appearance-none bg-[#0a0f1e]" [(ngModel)]="filterLevel">
        <option value="All">All · Clearance</option>
        <option value="Public">Public</option>
        <option value="Internal">Internal</option>
        <option value="Confidential">Confidential</option>
      </select>

      <select class="input-cyber w-auto cursor-pointer appearance-none bg-[#0a0f1e]" [(ngModel)]="filterStatus">
        <option value="All">All · Status</option>
        <option value="Open">Open</option>
        <option value="Locked">Locked</option>
      </select>

      <span class="ml-auto font-mono text-xs text-slate-500">{{ filtered.length }} / {{ records.length }}</span>
      <button class="btn-cyber sm w-auto bg-white/5 border-white/10 text-slate-300" (click)="exportCsv()">Export CSV</button>
    </div>

    <div class="glass-panel overflow-hidden">
      <table class="w-full text-left font-mono text-sm">
        <thead class="border-b border-[#22d3ee]/30 bg-white/5 text-xs uppercase text-[#67e8f9]">
          <tr>
            <th class="p-5 font-semibold tracking-wider">File ID</th>
            <th class="p-5 font-semibold tracking-wider">Asset Name</th>
            <th class="p-5 font-semibold tracking-wider">Clearance</th>
            <th class="p-5 font-semibold tracking-wider">Size</th>
            <th class="p-5 text-right font-semibold tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5 text-slate-300">
          <tr *ngIf="!filtered.length"><td colspan="5" class="p-8 text-center text-slate-400">No records match your search or filters.</td></tr>
          <tr *ngFor="let r of filtered; let i = index" class="group animate-fade-in-up cursor-pointer transition hover:bg-[#22d3ee]/5" [style.animation-delay]="(i * 45) + 'ms'" (click)="open(r)">
            <td class="p-5 text-slate-500">{{ r.id }}</td>
            <td class="p-5 font-sans font-medium" [ngClass]="r.status === 'Locked' ? 'text-slate-600' : 'text-white group-hover:text-[#67e8f9]'">{{ r.title }}</td>
            <td class="p-5">
              <span class="rounded border px-2 py-1 text-[10px] uppercase" [ngClass]="{'border-emerald-500/50 text-emerald-400': r.level === 'Public', 'border-[#22d3ee]/50 text-[#22d3ee]': r.level === 'Internal', 'border-red-500/50 text-red-400': r.level === 'Confidential'}">{{ r.level }}</span>
            </td>
            <td class="p-5 text-slate-500">{{ r.size }}</td>
            <td class="p-5 text-right">
              <span *ngIf="r.status === 'Decrypted'" class="inline-flex items-center gap-2 text-[#22d3ee]"><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>Decrypted</span>
              <span *ngIf="r.status === 'Locked'" class="inline-flex items-center gap-2 text-[#ff003c]"><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>Locked</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- Decryption Modal -->
<div *ngIf="selected" class="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4 backdrop-blur-sm transition-opacity duration-200" style="perspective:1200px" (click)="close()">
  <div class="glass-panel max-h-[90vh] w-full max-w-4xl overflow-y-auto" (click)="$event.stopPropagation()" style="animation: modalIn .5s cubic-bezier(.16,1,.3,1) both;">
    
    <div class="border-b border-[#22d3ee]/20 px-5 py-4 flex items-center justify-between">
      <div>
        <p class="font-mono text-[10px] text-[#22d3ee]">{{ selected.id }} // {{ selected.level | uppercase }}</p>
        <h3 class="text-xl font-bold text-white">{{ selected.title }}</h3>
      </div>
      <button (click)="close()" class="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-slate-400 transition hover:border-[#ff003c]/60 hover:text-[#ff003c]">✕</button>
    </div>

    <div class="p-5 grid gap-6 md:grid-cols-2">
      <div class="relative h-80 overflow-hidden rounded-xl border border-[#22d3ee]/30 bg-black/40">
        <div class="absolute inset-0 space-y-3 p-5 transition-all duration-[2s] ease-out" [ngStyle]="{'filter': decrypted ? 'blur(0px)' : 'blur(12px)'}">
          <div class="h-3 w-1/2 rounded bg-[#22d3ee]/60"></div>
          <div class="h-2 rounded bg-white/15" style="width: 92%"></div>
          <div class="h-2 rounded bg-white/15" style="width: 78%"></div>
          <div class="h-2 rounded bg-white/15" style="width: 85%"></div>
          <div class="h-2 rounded bg-white/15" style="width: 60%"></div>
          <p class="pt-3 font-mono text-[11px] leading-relaxed text-slate-300">{{ selected.title }}. Classification: {{ selected.level }}. Size {{ selected.size }}. Source ID {{ selected.candidateId }}</p>
        </div>
        <div *ngIf="!decrypted" class="absolute inset-x-0 h-0.5 bg-[#ff003c] shadow-[0_0_14px_#ff003c]" style="animation: scanline 2s linear infinite alternate;"></div>
        <div class="absolute bottom-3 left-3 rounded px-2 py-1 font-mono text-[10px]" [ngClass]="decrypted ? 'bg-black/70 text-[#22d3ee]' : 'animate-pulse bg-black/70 text-[#ff003c]'">● {{ decrypted ? 'DECRYPTED' : 'DECRYPTING' }}</div>
      </div>

      <div class="space-y-4" *ngIf="selectedCandidate">
        <div>
          <p class="font-mono text-xs text-slate-500">SUBJECT</p>
          <p class="text-lg font-bold text-white">{{ selectedCandidate.name }}</p>
          <p class="font-mono text-xs text-[#67e8f9]">{{ selectedCandidate.role }}</p>
        </div>
        
        <div class="flex items-start gap-5">
          <div class="relative inline-block" style="width: 110px; height: 110px;">
            <svg viewBox="0 0 100 100" class="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="8"/>
              <circle cx="50" cy="50" r="42" fill="none" [attr.stroke]="selectedCandidate.score >= 85 ? '#34d399' : '#22d3ee'" stroke-width="8" stroke-linecap="round" [attr.stroke-dasharray]="getCircumference()" [attr.stroke-dashoffset]="getDashOffset(selectedCandidate.score)"/>
            </svg>
            <div class="absolute inset-0 grid place-items-center text-center">
              <div>
                <p class="text-2xl font-bold text-white">{{ selectedCandidate.score }}%</p>
                <p class="text-[9px] font-mono uppercase text-slate-400">Integrity</p>
              </div>
            </div>
          </div>

          <div class="flex-1">
            <p class="mb-3 font-mono text-xs text-slate-500">LIVE STATUS · checked every 3s</p>
            <ol>
              <li *ngFor="let stage of stages; let i = index" class="relative flex gap-4" [class.pb-6]="i < 3">
                <span *ngIf="i < 3" class="absolute bottom-0 left-[15px] top-8 w-0.5 bg-white/10">
                  <span class="block w-full bg-[#22d3ee] transition-all duration-500" [style.height]="selectedCandidate.stage > i ? '100%' : '0'"></span>
                </span>
                <span class="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-mono transition-all duration-500" [ngClass]="selectedCandidate.stage >= i ? 'border-[#22d3ee] bg-[#22d3ee]/10 text-[#22d3ee]' : 'border-white/20 text-slate-500'">
                  {{ selectedCandidate.stage > i ? '✓' : i + 1 }}
                </span>
                <div>
                  <p class="text-sm font-mono" [ngClass]="selectedCandidate.stage >= i ? 'text-white' : 'text-slate-500'">{{ stage }}</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
      
      <div *ngIf="candidateError" class="text-sm text-red-300" role="alert">
        {{ candidateError }}
        <button class="btn-cyber mt-4" (click)="open(selected)">Retry details</button>
      </div>
      <div class="space-y-4" *ngIf="!selectedCandidate && !candidateError">
        <div class="h-6 w-1/2 animate-pulse rounded bg-white/10"></div>
        <div class="h-24 animate-pulse rounded bg-white/10"></div>
      </div>
    </div>

    <div class="border-t border-white/10 px-5 py-3 flex items-center justify-between">
      <span class="font-mono text-[10px] text-slate-500">Click outside to close</span>
      <button class="btn-cyber sm w-auto" [disabled]="!selectedCandidate || pdfLoading" (click)="exportPdf()">
        {{ pdfLoading ? 'Building PDF...' : 'Export PDF report' }}
      </button>
    </div>
  </div>
</div>
  `
})
export class RecordsComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService); 
  private readonly toast = inject(ToastService); 
  private readonly csv = inject(CsvService);
  private readonly report = inject(ReportService);
  
  records: VaultRecord[] = [];
  loading = false; 
  loadError = '';
  candidateError = '';
  search = ''; 
  filterLevel = 'All';
  filterStatus = 'All';
  
  selected: VaultRecord | null = null;
  selectedCandidate: Candidate | null = null;
  decrypted = false;
  pdfLoading = false;
  private decryptTimer?: ReturnType<typeof setTimeout>;
  private fetchRequest?: Subscription;
  private recordRequests = new Subscription();

  readonly stages = ['Initiated', 'Queried', 'Verified', 'Cleared'];

  get filtered(): VaultRecord[] {
    const q = this.search.trim().toLowerCase();
    return this.records.filter(r => 
      (this.filterLevel === 'All' || r.level === this.filterLevel) &&
      (this.filterStatus === 'All' || (this.filterStatus === 'Locked') === (r.status === 'Locked')) &&
      (!q || `${r.id} ${r.title}`.toLowerCase().includes(q))
    );
  }

  ngOnInit(): void {
    this.fetch();
  }

  fetch(): void {
    this.fetchRequest?.unsubscribe();
    this.loading = true;
    this.loadError = '';
    this.fetchRequest = this.api.records().subscribe({
      next: d => { this.records = d; this.loading = false; },
      error: error => {
        this.loading = false;
        this.loadError = error?.error?.message ?? 'Could not load records.';
        this.toast.show(this.loadError, 'err');
      }
    });
  }

  open(r: VaultRecord): void {
    if (r.status === 'Locked') {
      this.toast.show('ACCESS DENIED: this record needs Admin clearance', 'err');
      return;
    }
    
    this.close();
    this.selected = r;
    this.decrypted = false;
    
    this.decryptTimer = setTimeout(() => {
      this.decrypted = true;
    }, 2000);

    this.recordRequests.add(this.api.candidate(r.candidateId).subscribe({
      next: c => {
        this.selectedCandidate = c;
        this.recordRequests.add(timer(3000, 3000).pipe(
          switchMap(() => this.api.candidateStatus(r.candidateId))
        ).subscribe({
          next: status => {
            if (this.selectedCandidate && this.selectedCandidate.stage !== status.stage) {
              this.toast.show('Verification update: ' + this.stages[status.stage], 'ok');
            }
            if (this.selectedCandidate) this.selectedCandidate = { ...this.selectedCandidate, ...status };
          },
          error: () => { this.candidateError = 'Live status is unavailable. Retry to reconnect.'; }
        }));
      },
      error: error => { this.candidateError = error?.error?.message ?? 'Could not load candidate details.'; }
    }));
  }

  @HostListener('document:keydown.escape')
  close(): void {
    this.selected = null;
    this.selectedCandidate = null;
    clearTimeout(this.decryptTimer);
    this.recordRequests.unsubscribe();
    this.recordRequests = new Subscription();
    this.candidateError = '';
    this.decrypted = false;
  }

  exportCsv(): void {
    this.csv.download('trustvault-records.csv', ['File ID', 'Asset Name', 'Clearance', 'Size', 'Status'],
      this.filtered.map(record => [record.id, record.title, record.level, record.size, record.status]));
    this.toast.show(`Exported ${this.filtered.length} rows to CSV`, 'ok');
  }

  async exportPdf(): Promise<void> {
    if (!this.selected || !this.selectedCandidate || this.pdfLoading) return;
    this.pdfLoading = true;
    try {
      await this.report.exportCandidate(this.selected, this.selectedCandidate, this.selectedCandidate.stage);
      this.api.logEvent('EXPORT_PDF').subscribe({ error: () => undefined });
      this.toast.show('PDF report downloaded', 'ok');
    } catch {
      this.toast.show('Could not build the PDF', 'err');
    } finally {
      this.pdfLoading = false;
    }
  }

  getCircumference(): number { return 2 * Math.PI * 42; }
  getDashOffset(score: number): number { return this.getCircumference() * (1 - score / 100); }

  ngOnDestroy(): void {
    this.fetchRequest?.unsubscribe();
    this.close();
  }
}
