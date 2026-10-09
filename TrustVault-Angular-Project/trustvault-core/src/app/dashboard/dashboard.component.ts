import { Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
import { Candidate, Clearance, VaultRecord } from '../core/models';
import { TranslatePipe } from '../shared/translate.pipe';

@Component({
  selector: 'tv-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  template: `
<div class="mx-auto max-w-6xl p-4 lg:p-8 route-in">
  <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 class="mb-1 text-4xl font-bold tracking-tight">{{ 'Command' | translate }} <span class="font-light text-[#22d3ee]">{{ 'Center' | translate }}</span></h1>
      <p class="font-mono text-sm uppercase tracking-widest text-slate-400">{{ 'Operator' | translate }}: {{ auth.user()?.name }} // {{ 'Level' | translate }}: {{ (auth.user()?.accessLevel || '') | translate }}</p>
    </div>
    <div class="text-right">
      <div class="mb-1 font-mono text-xs text-[#22d3ee]">{{ 'SYSTEM INTEGRITY' | translate }}</div>
      <div class="text-2xl font-bold tracking-widest text-white">{{ averageScore }}%</div>
    </div>
  </div>

  <div class="mb-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
    <div class="glass-panel relative flex items-center gap-6 overflow-hidden border-[#22d3ee]/30 p-5 lg:col-span-2">
      <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[#22d3ee] bg-[#164e63]">
        <span class="text-2xl">{{ auth.user()?.name?.charAt(0) }}</span>
      </div>
      <div>
        <h3 class="text-xl font-bold text-white">{{ auth.user()?.name }}</h3>
        <p class="mb-2 font-mono text-sm text-[#67e8f9]">{{ (auth.user()?.role || '') | translate }}</p>
        <div class="flex gap-4 font-mono text-xs text-slate-400">
          <span>ID: {{ auth.user()?.id }}</span>
          <span>IP: 192.168.1.104 (SECURE)</span>
        </div>
      </div>
    </div>

    <div class="glass-panel group relative overflow-hidden p-5">
      <div class="absolute right-0 top-0 h-16 w-16 rounded-bl-full bg-[#22d3ee]/10 transition-transform group-hover:scale-150"></div>
      <p class="mb-1 font-mono text-xs text-slate-400">{{ 'ACCESSIBLE RECORDS' | translate }}</p>
      <p class="mb-2 text-4xl font-bold text-white">{{ accessibleRecords }}</p>
      <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-800"><div class="h-full w-3/4 bg-[#22d3ee]"></div></div>
    </div>

    <div class="glass-panel group relative overflow-hidden border-[#ff003c]/30 p-5">
      <div class="absolute right-0 top-0 h-16 w-16 rounded-bl-full bg-[#ff003c]/10 transition-transform group-hover:scale-150"></div>
      <p class="mb-1 font-mono text-xs text-[#ff003c]">{{ 'THREATS BLOCKED' | translate }}</p>
      <p class="mb-2 text-4xl font-bold text-white">1,042</p>
      <p class="font-mono text-xs text-slate-400">{{ 'Last 24 hours' | translate }}</p>
    </div>
  </div>

  <div class="mb-4 mt-8 flex flex-wrap items-center justify-between gap-3">
    <h3 class="font-mono text-sm font-bold uppercase tracking-wider text-[#67e8f9]">{{ 'Custom Workspace' | translate }}</h3>
    <div class="relative flex w-full max-w-full flex-wrap gap-2 sm:w-auto" (click)="$event.stopPropagation()">
      <button type="button" class="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400 hover:text-white" (click)="restoreDefaults()">{{ 'Restore defaults' | translate }}</button>
      <button type="button" class="btn-cyber sm w-auto" [attr.aria-expanded]="widgetMenu" aria-controls="widget-picker" (click)="widgetMenu = !widgetMenu">{{ '+ Add Widget' | translate }}</button>
      <div *ngIf="widgetMenu" id="widget-picker" class="glass-panel absolute right-0 top-full z-30 mt-2 w-72 max-w-full border-[#22d3ee]/30 p-2" role="region" [attr.aria-label]="'+ Add Widget' | translate">
        <button *ngFor="let option of widgetOptions" type="button" class="flex w-full items-center justify-between gap-3 rounded-lg p-3 text-left text-sm text-slate-200 hover:bg-white/5 disabled:opacity-40" [disabled]="widgets.has(option.id)" (click)="addWidget(option.id)">
          <span>{{ option.label | translate }}</span><span *ngIf="widgets.has(option.id)" class="text-xs">{{ 'Added' | translate }}</span>
        </button>
      </div>
    </div>
  </div>

  <div *ngIf="!widgets.size" class="glass-panel p-8 text-center text-slate-400">{{ 'No widgets selected. Use Add Widget to customize your workspace.' | translate }}</div>

  <div class="grid gap-6 md:grid-cols-2">
    <div *ngIf="widgets.has('gauge')" class="glass-panel p-5 animate-fade-in-up">
      <div class="flex items-center justify-between mb-4 border-b border-[#22d3ee]/20 pb-4">
        <span class="font-mono text-xs font-bold uppercase tracking-wider text-[#67e8f9]">{{ 'Data Integrity Score' | translate }}</span>
        <button (click)="removeWidget('gauge')" class="text-xs text-slate-500 hover:text-[#ff003c]" [attr.aria-label]="('Remove widget' | translate) + ': ' + ('Data Integrity Score' | translate)">✕</button>
      </div>
      <div class="flex flex-wrap items-center gap-6">
        <div class="relative inline-block shrink-0" style="width: 132px; height: 132px;">
          <svg viewBox="0 0 100 100" class="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="8"/>
            <circle cx="50" cy="50" r="42" fill="none" [attr.stroke]="averageScore >= 85 ? '#34d399' : '#22d3ee'" stroke-width="8" stroke-linecap="round" [attr.stroke-dasharray]="getCircumference()" [attr.stroke-dashoffset]="getDashOffset(averageScore)" style="transition: stroke-dashoffset .15s cubic-bezier(.16,1,.3,1); filter: drop-shadow(0 0 5px rgba(34,211,238,.6))"/>
          </svg>
          <div class="absolute inset-0 grid place-items-center text-center">
            <div>
              <p class="text-2xl font-bold text-white">{{ averageScore }}%</p>
              <p class="text-[9px] font-mono uppercase text-slate-400">{{ 'Average' | translate }}</p>
            </div>
          </div>
        </div>
        <ul class="min-w-[8rem] flex-1 space-y-2 font-mono text-xs text-slate-400">
          <li *ngFor="let c of topCandidates" class="flex justify-between gap-2">
            <span>{{ c.name }}</span><span class="shrink-0 text-[#67e8f9]">{{ c.score }}%</span>
          </li>
        </ul>
      </div>
    </div>

    <div *ngIf="widgets.has('heatmap')" class="glass-panel p-5 animate-fade-in-up">
      <div class="flex items-center justify-between mb-4 border-b border-[#22d3ee]/20 pb-4">
        <span class="font-mono text-xs font-bold uppercase tracking-wider text-[#67e8f9]">{{ 'Anomaly Heatmap · 30 Days' | translate }}</span>
        <button (click)="removeWidget('heatmap')" class="text-xs text-slate-500 hover:text-[#ff003c]" [attr.aria-label]="('Remove widget' | translate) + ': ' + ('Anomaly Heatmap · 30 Days' | translate)">✕</button>
      </div>
      <div class="grid grid-cols-10 gap-1.5">
        <div *ngFor="let i of heatmapCells" class="h-6 rounded-sm transition hover:brightness-150 animate-fade-in-up" [ngClass]="heatClass(i)"></div>
      </div>
      <p class="mt-3 text-right text-[10px] font-mono text-slate-500">{{ 'Less' | translate }} ▫ ▫ ▫ ▫ {{ 'More' | translate }}</p>
    </div>

    <div *ngIf="widgets.has('progress')" class="glass-panel p-5">
      <div class="mb-4 flex items-center justify-between border-b border-[#22d3ee]/20 pb-4">
        <h3 class="text-xs font-bold uppercase text-[#67e8f9]">{{ 'Verification Progress' | translate }}</h3>
        <button (click)="removeWidget('progress')" class="text-slate-400" [attr.aria-label]="('Remove widget' | translate) + ': ' + ('Verification Progress' | translate)">✕</button>
      </div>
      <div *ngFor="let stage of stages; let stageIndex = index" class="mb-4">
        <div class="mb-2 flex justify-between text-sm"><span>{{ stage | translate }}</span><span class="font-mono text-[#67e8f9]">{{ stageCount(stageIndex) }}</span></div>
        <div class="h-2 rounded bg-white/5"><div class="h-full rounded bg-[#22d3ee]" [style.width.%]="bar(stageIndex)"></div></div>
      </div>
    </div>

    <div *ngIf="widgets.has('records')" class="glass-panel p-5">
      <div class="mb-4 flex items-center justify-between border-b border-[#22d3ee]/20 pb-4">
        <h3 class="text-xs font-bold uppercase text-[#67e8f9]">{{ 'Vault Overview' | translate }}</h3>
        <button (click)="removeWidget('records')" class="text-slate-400" [attr.aria-label]="('Remove widget' | translate) + ': ' + ('Vault Overview' | translate)">✕</button>
      </div>
      <div *ngFor="let level of clearanceLevels" class="mb-3 flex justify-between text-sm"><span>{{ level | translate }}</span><strong class="font-mono text-[#67e8f9]">{{ recordCount(level) }}</strong></div>
      <p class="mt-4 border-t border-white/10 pt-4 text-sm text-slate-400">{{ 'Locked' | translate }}: {{ records.length - accessibleRecords }}</p>
      <a routerLink="/records" class="mt-4 inline-block text-sm text-[#67e8f9] underline">{{ 'Open Data Vault' | translate }}</a>
    </div>

    <div *ngIf="widgets.has('candidates')" class="glass-panel p-5">
      <div class="mb-4 flex items-center justify-between border-b border-[#22d3ee]/20 pb-4">
        <h3 class="text-xs font-bold uppercase text-[#67e8f9]">{{ 'Candidate Watchlist' | translate }}</h3>
        <button (click)="removeWidget('candidates')" class="text-slate-400" [attr.aria-label]="('Remove widget' | translate) + ': ' + ('Candidate Watchlist' | translate)">✕</button>
      </div>
      <div *ngFor="let candidate of watchlist" class="flex items-center justify-between gap-3 border-b border-white/5 py-3 text-sm">
        <div><p>{{ candidate.name }}</p><p class="mt-1 text-xs text-slate-400">{{ stages[candidate.stage] | translate }}</p></div><strong class="font-mono text-[#67e8f9]">{{ candidate.score }}%</strong>
      </div>
      <p *ngIf="!candidates.length" class="text-sm text-slate-400">{{ (loading ? 'Loading...' : 'No candidates are available.') | translate }}</p>
    </div>

    <div *ngIf="widgets.has('actions')" class="glass-panel p-5">
      <div class="mb-4 flex items-center justify-between border-b border-[#22d3ee]/20 pb-4">
        <h3 class="text-xs font-bold uppercase text-[#67e8f9]">{{ 'Quick Actions' | translate }}</h3>
        <button (click)="removeWidget('actions')" class="text-slate-400" [attr.aria-label]="('Remove widget' | translate) + ': ' + ('Quick Actions' | translate)">✕</button>
      </div>
      <div class="grid gap-3 sm:grid-cols-2">
        <a routerLink="/records" class="rounded-lg border border-white/10 p-3 text-sm text-[#67e8f9] hover:bg-white/5">{{ 'Open Data Vault' | translate }}</a>
        <button (click)="refresh()" [disabled]="loading" class="rounded-lg border border-white/10 p-3 text-left text-sm text-[#67e8f9] disabled:opacity-40">{{ (loading ? 'Loading...' : 'Refresh dashboard') | translate }}</button>
        <a *ngIf="auth.isAdmin()" routerLink="/admin/pipeline" class="rounded-lg border border-white/10 p-3 text-sm text-[#67e8f9] hover:bg-white/5">{{ 'Open Pipeline' | translate }}</a>
        <a *ngIf="auth.isAdmin()" routerLink="/admin/audit" class="rounded-lg border border-white/10 p-3 text-sm text-[#67e8f9] hover:bg-white/5">{{ 'Open Audit Ledger' | translate }}</a>
      </div>
    </div>
  </div>
</div>
  `
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService); 
  readonly auth = inject(AuthService); 
  readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private refreshRequest?: Subscription;
  
  candidates: Candidate[] = [];
  records: VaultRecord[] = [];
  loading = true; 
  widgets = new Set(['gauge', 'heatmap']);
  widgetMenu = false;
  readonly clearanceLevels: Clearance[] = ['Public', 'Internal', 'Confidential'];
  readonly widgetOptions = [
    { id: 'gauge', label: 'Data Integrity Score' },
    { id: 'heatmap', label: 'Anomaly Heatmap · 30 Days' },
    { id: 'progress', label: 'Verification Progress' },
    { id: 'records', label: 'Vault Overview' },
    { id: 'candidates', label: 'Candidate Watchlist' },
    { id: 'actions', label: 'Quick Actions' },
  ];
  readonly stages = ['Initiated', 'Queried', 'Verified', 'Cleared']; 
  readonly heatmapCells = Array.from({ length: 30 }, (_, i) => i);
  
  get averageScore(): number { return this.candidates.length ? Math.round(this.candidates.reduce((s, c) => s + c.score, 0) / this.candidates.length) : 0; }
  get topCandidates(): Candidate[] { return [...this.candidates].sort((a, b) => b.score - a.score).slice(0, 3); }
  get watchlist(): Candidate[] { return [...this.candidates].sort((left, right) => left.score - right.score).slice(0, 5); }
  get accessibleRecords(): number { return this.records.filter(record => record.status !== 'Locked').length; }
  recordCount(level: Clearance): number { return this.records.filter(record => record.level === level).length; }
  
  stageCount(stage: number): number { return this.candidates.filter(c => c.stage === stage).length; }
  bar(stage: number): number { return this.candidates.length ? Math.round(this.stageCount(stage) / this.candidates.length * 100) : 0; }
  
  heatClass(i: number): string { 
    const n = (i * 7 + 13) % 40; 
    return n === 0 ? 'bg-white/5' : n < 6 ? 'bg-[#22d3ee]/20' : n < 14 ? 'bg-[#22d3ee]/40' : n < 24 ? 'bg-[#22d3ee]/70' : 'bg-[#67e8f9] shadow-[0_0_8px_#67e8f9]';
  }

  getCircumference(): number { return 2 * Math.PI * 42; }
  getDashOffset(score: number): number { return this.getCircumference() * (1 - score / 100); }

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.refreshRequest?.unsubscribe();
    this.loading = true;
    this.refreshRequest = forkJoin({ candidates: this.api.candidates(), records: this.api.records() }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => { this.candidates = data.candidates; this.records = data.records; this.loading = false; },
      error: () => {
        this.loading = false;
        this.toast.show('Could not load dashboard data. Reopen the Command Center to retry.', 'err');
      }
    });
  }

  removeWidget(id: string): void { this.widgets.delete(id); }
  addWidget(id: string): void {
    if (this.widgetOptions.some(option => option.id === id)) this.widgets.add(id);
    this.widgetMenu = false;
  }
  restoreDefaults(): void { this.widgets = new Set(['gauge', 'heatmap']); this.widgetMenu = false; }
  @HostListener('document:click') @HostListener('document:keydown.escape')
  closeWidgetMenu(): void { this.widgetMenu = false; }
}
