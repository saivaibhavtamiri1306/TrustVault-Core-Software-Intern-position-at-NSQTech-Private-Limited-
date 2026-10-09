import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
import { Candidate } from '../core/models';

@Component({
  selector: 'tv-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="mx-auto max-w-6xl p-4 lg:p-8 route-in">
  <div class="mb-8 flex items-end justify-between">
    <div>
      <h1 class="mb-1 text-4xl font-bold tracking-tight">Command <span class="font-light text-[#22d3ee]">Center</span></h1>
      <p class="font-mono text-sm uppercase tracking-widest text-slate-400">Operator: {{ auth.user()?.name }} // Level: {{ auth.user()?.accessLevel }}</p>
    </div>
    <div class="text-right">
      <div class="mb-1 font-mono text-xs text-[#22d3ee]">SYSTEM INTEGRITY</div>
      <div class="text-2xl font-bold tracking-widest text-white">99.98%</div>
    </div>
  </div>

  <div class="mb-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
    <div class="glass-panel relative flex items-center gap-6 overflow-hidden border-[#22d3ee]/30 p-5 lg:col-span-2">
      <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[#22d3ee] bg-[#164e63]">
        <span class="text-2xl">{{ auth.user()?.name?.charAt(0) }}</span>
      </div>
      <div>
        <h3 class="text-xl font-bold text-white">{{ auth.user()?.name }}</h3>
        <p class="mb-2 font-mono text-sm text-[#67e8f9]">{{ auth.user()?.role }}</p>
        <div class="flex gap-4 font-mono text-xs text-slate-400">
          <span>ID: {{ auth.user()?.id }}</span>
          <span>IP: 192.168.1.104 (SECURE)</span>
        </div>
      </div>
    </div>

    <div class="glass-panel group relative overflow-hidden p-5">
      <div class="absolute right-0 top-0 h-16 w-16 rounded-bl-full bg-[#22d3ee]/10 transition-transform group-hover:scale-150"></div>
      <p class="mb-1 font-mono text-xs text-slate-400">ACCESSIBLE RECORDS</p>
      <p class="mb-2 text-4xl font-bold text-white">{{ auth.user()?.role === 'Admin' ? 12 : 8 }}</p>
      <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-800"><div class="h-full w-3/4 bg-[#22d3ee]"></div></div>
    </div>

    <div class="glass-panel group relative overflow-hidden border-[#ff003c]/30 p-5">
      <div class="absolute right-0 top-0 h-16 w-16 rounded-bl-full bg-[#ff003c]/10 transition-transform group-hover:scale-150"></div>
      <p class="mb-1 font-mono text-xs text-[#ff003c]">THREATS BLOCKED</p>
      <p class="mb-2 text-4xl font-bold text-white">1,042</p>
      <p class="font-mono text-xs text-slate-400">Last 24 hours</p>
    </div>
  </div>

  <div class="mb-4 flex items-center justify-between mt-8">
    <h3 class="font-mono text-sm font-bold uppercase tracking-wider text-[#67e8f9]">Custom Workspace</h3>
    <button class="btn-cyber sm w-auto" (click)="addAll()">+ Add Widget</button>
  </div>

  <div class="grid gap-6 md:grid-cols-2">
    <div *ngIf="widgets.has('gauge')" class="glass-panel p-5 animate-fade-in-up">
      <div class="flex items-center justify-between mb-4 border-b border-[#22d3ee]/20 pb-4">
        <span class="font-mono text-xs font-bold uppercase tracking-wider text-[#67e8f9]">Data Integrity Score</span>
        <button (click)="removeWidget('gauge')" class="text-xs text-slate-500 hover:text-[#ff003c]">✕</button>
      </div>
      <div class="flex items-center gap-6">
        <div class="relative inline-block" style="width: 132px; height: 132px;">
          <svg viewBox="0 0 100 100" class="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="8"/>
            <circle cx="50" cy="50" r="42" fill="none" [attr.stroke]="averageScore >= 85 ? '#34d399' : '#22d3ee'" stroke-width="8" stroke-linecap="round" [attr.stroke-dasharray]="getCircumference()" [attr.stroke-dashoffset]="getDashOffset(averageScore)" style="transition: stroke-dashoffset 1.4s cubic-bezier(.16,1,.3,1); filter: drop-shadow(0 0 5px rgba(34,211,238,.6))"/>
          </svg>
          <div class="absolute inset-0 grid place-items-center text-center">
            <div>
              <p class="text-2xl font-bold text-white">{{ averageScore }}%</p>
              <p class="text-[9px] font-mono uppercase text-slate-400">Average</p>
            </div>
          </div>
        </div>
        <ul class="flex-1 space-y-2 font-mono text-xs text-slate-400">
          <li *ngFor="let c of topCandidates" class="flex justify-between">
            <span>{{ c.name }}</span><span class="text-[#67e8f9]">{{ c.score }}%</span>
          </li>
        </ul>
      </div>
    </div>

    <div *ngIf="widgets.has('heatmap')" class="glass-panel p-5 animate-fade-in-up">
      <div class="flex items-center justify-between mb-4 border-b border-[#22d3ee]/20 pb-4">
        <span class="font-mono text-xs font-bold uppercase tracking-wider text-[#67e8f9]">Anomaly Heatmap · 30 Days</span>
        <button (click)="removeWidget('heatmap')" class="text-xs text-slate-500 hover:text-[#ff003c]">✕</button>
      </div>
      <div class="grid grid-cols-10 gap-1.5">
        <div *ngFor="let i of heatmapCells" class="h-6 rounded-sm transition hover:brightness-150 animate-fade-in-up" [ngClass]="heatClass(i)" [style.animation-delay]="(i * 18) + 'ms'"></div>
      </div>
      <p class="mt-3 text-right text-[10px] font-mono text-slate-500">Less ▫ ▫ ▫ ▫ More</p>
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
  
  candidates: Candidate[] = [];
  loading = true; 
  widgets = new Set(['gauge', 'heatmap', 'graph', 'feed']); 
  readonly stages = ['Initiated', 'Queried', 'Verified', 'Cleared']; 
  readonly heatmapCells = Array.from({ length: 30 }, (_, i) => i);
  
  get averageScore(): number { return this.candidates.length ? Math.round(this.candidates.reduce((s, c) => s + c.score, 0) / this.candidates.length) : 0; }
  get topCandidates(): Candidate[] { return [...this.candidates].sort((a, b) => b.score - a.score).slice(0, 3); }
  
  stageCount(stage: number): number { return this.candidates.filter(c => c.stage === stage).length; }
  bar(stage: number): number { return this.candidates.length ? Math.round(this.stageCount(stage) / this.candidates.length * 100) : 0; }
  
  heatClass(i: number): string { 
    const n = (i * 7 + 13) % 40; 
    return n === 0 ? 'bg-white/5' : n < 6 ? 'bg-[#22d3ee]/20' : n < 14 ? 'bg-[#22d3ee]/40' : n < 24 ? 'bg-[#22d3ee]/70' : 'bg-[#67e8f9] shadow-[0_0_8px_#67e8f9]';
  }

  getCircumference(): number { return 2 * Math.PI * 42; }
  getDashOffset(score: number): number { return this.getCircumference() * (1 - score / 100); }

  ngOnInit(): void {
    this.api.candidates().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: d => { this.candidates = d; this.loading = false; },
      error: () => {
        this.loading = false;
        this.toast.show('Could not load dashboard data. Reopen the Command Center to retry.', 'err');
      }
    });
  }

  removeWidget(id: string): void { this.widgets.delete(id); }
  addWidget(id: string): void { this.widgets.add(id); this.toast.show(`${id.toUpperCase()} widget added`, 'ok'); }
  addAll(): void { ['gauge', 'heatmap', 'graph', 'feed'].forEach(x => this.widgets.add(x)); }
}
