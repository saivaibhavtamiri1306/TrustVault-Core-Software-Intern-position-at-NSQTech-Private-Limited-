import { Component, DestroyRef, OnInit, OnDestroy, ElementRef, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ApiService } from '../core/api.service';
import { ToastService } from '../core/toast.service';
import { CsvService } from '../core/csv.service';
import { LogEntry } from '../core/models';
import { TranslatePipe } from '../shared/translate.pipe';

@Component({
  selector: 'tv-audit',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
<div class="mx-auto max-w-6xl p-4 lg:p-8 route-in">
  <div class="mb-8">
    <h2 class="mb-1 text-3xl font-bold">{{ 'Audit' | translate }} <span class="font-light text-[#22d3ee]">{{ 'Ledger' | translate }}</span></h2>
    <p class="font-mono text-sm text-slate-400">{{ 'Cryptographically secure, append-only event log.' | translate }}</p>
  </div>

  <div class="glass-panel overflow-hidden border-[#22d3ee]/20">
    <div class="flex items-center justify-between border-b border-[#22d3ee]/30 bg-[#164e63]/30 p-4">
      <span class="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#22d3ee]">
        <span class="h-2 w-2 rounded-full bg-emerald-400"></span> {{ 'Demo audit ledger' | translate }}
      </span>
      <button class="rounded border border-white/20 px-3 py-1 font-mono text-xs text-slate-400 hover:text-white" [disabled]="!events.length" (click)="exportCsv()">{{ 'Export CSV' | translate }}</button>
    </div>
    
    <div *ngFor="let l of staticLogs" class="flex items-center border-b border-white/5 p-4 font-mono text-sm transition hover:bg-white/5" [ngClass]="l[4] ? 'border-l-2 border-l-[#ff003c] bg-[#ff003c]/10' : 'border-l-2 border-l-transparent'">
      <div class="w-32 text-xs text-slate-500">{{ currentTime }}</div>
      <div class="w-40 font-bold" [ngClass]="l[4] ? 'text-[#ff003c]' : l[0] === 'SYS_BOOT' ? 'text-[#22d3ee]' : 'text-emerald-400'">{{ l[0] }}</div>
      <div class="flex-1 text-slate-300">USR: {{ l[1] }} <span class="mx-2 text-slate-500">|</span> IP: {{ l[2] }}</div>
      <div class="flex items-center gap-2 rounded border border-white/5 bg-black/40 px-2 py-1 text-xs text-slate-500">
        <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg> {{ l[3] }}
      </div>
    </div>
  </div>

  <div class="glass-panel mt-8 overflow-hidden border-[#22d3ee]/20">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[#22d3ee]/30 bg-[#164e63]/30 p-4">
      <div>
        <p class="font-mono text-xs uppercase tracking-widest text-[#22d3ee]">{{ 'Live Event Stream' | translate }} · <span>{{ events.length | number }}</span> {{ 'events' | translate }}</p>
        <p class="font-mono text-[10px] text-slate-500">{{ 'Visible events' | translate }}: {{ visibleEvents.length }} / {{ events.length }}</p>
      </div>
      <div class="flex items-center gap-3">
        <div *ngIf="hashing" class="h-1.5 w-40 overflow-hidden rounded bg-white/10">
          <div class="h-full bg-[#22d3ee] transition-all duration-300" [style.width.%]="hashProgress"></div>
        </div>
        <span *ngIf="hashResult" class="font-mono text-xs text-emerald-400">{{ hashComplete ? ('Hashed entries' | translate) + ': ' + events.length + ' · ' + hashTime + ' ms' : ('Could not verify the chain. Please retry.' | translate) }}</span>
        <button class="btn-cyber w-auto sm" [disabled]="hashing || events.length === 0" (click)="verifyChain()">
          {{ (hashing ? 'Hashing…' : 'Verify chain in Web Worker') | translate }}
        </button>
      </div>
    </div>
    
    <!-- Virtual Scroll Implementation -->
    <div #scrollHost class="block h-96 overflow-y-auto" (scroll)="onScroll($event)">
      <div [style.height.px]="totalHeight" class="relative">
        <div class="absolute left-0 right-0 top-0" [style.top.px]="offsetY">
          
          <div *ngFor="let e of visibleEvents" class="flex h-12 items-center border-b border-white/5 px-4 font-mono text-xs transition hover:bg-white/5">
            <span class="w-14 text-slate-600">#{{ e.i }}</span>
            <span class="w-44 text-slate-500">{{ e.time }}</span>
            <span class="w-36 font-bold" [ngClass]="e.evt === 'AUTH_FAIL' || e.evt === 'FIREWALL_BLOCK' ? 'text-[#ff003c]' : 'text-emerald-400'">{{ e.evt }}</span>
            <span class="flex-1 text-slate-300">{{ e.user }} <span class="text-slate-600">·</span> {{ e.ip }}</span>
            <span class="rounded border border-white/5 bg-black/40 px-2 py-1 text-[10px] text-slate-500">{{ e.hash ? (e.hash | slice:0:14) + '…' : ('not hashed yet' | translate) }}</span>
          </div>

        </div>
      </div>
    </div>

  </div>
</div>
  `
})
export class AuditComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly csv = inject(CsvService);
  private readonly destroyRef = inject(DestroyRef);
  private worker?: Worker;
  @ViewChild('scrollHost', { static: true }) scrollHost!: ElementRef<HTMLDivElement>;

  readonly staticLogs = [
    ['SYS_BOOT', 'SYSTEM', 'localhost', '0x8f...3a1'],
    ['AUTH_SUCCESS', 'priya', '192.168.1.104', '0xc2...9f4'],
    ['DATA_READ', 'priya', '192.168.1.104', '0x1a...b62'],
    ['AUTH_FAIL', 'UNKNOWN', '45.22.19.10', '0x5d...e01', true],
    ['FIREWALL_BLOCK', 'SYSTEM', '45.22.19.10', '0x99...a8c'],
    ['AUTH_SUCCESS', 'admin', '10.0.0.5', '0x33...f11'],
    ['POLICY_UPDATE', 'admin', '10.0.0.5', '0x7e...2b9']
  ];
  
  currentTime = new Date().toISOString().split('T')[1].slice(0, -1);
  
  events: LogEntry[] = [];
  visibleEvents: LogEntry[] = [];
  hashing = false;
  hashProgress = 0;
  hashResult = '';
  hashComplete = false;
  hashTime = 0;
  vinfo = 'Loading events...';

  private readonly rowHeight = 48;
  totalHeight = 0;
  offsetY = 0;

  ngOnInit(): void {
    this.api.get<LogEntry[]>('/audit/stream').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.events = data;
        this.totalHeight = this.events.length * this.rowHeight;
        this.updateVirtualScroll();
      },
      error: () => {
        this.vinfo = 'Could not load audit events. Reopen the ledger to retry.';
        this.toast.show('Failed to fetch audit logs', 'err');
      }
    });
  }

  onScroll(event: any): void {
    this.updateVirtualScroll(event.target.scrollTop);
  }

  updateVirtualScroll(scrollTop: number = 0): void {
    const start = Math.max(0, Math.floor(scrollTop / this.rowHeight) - 3);
    const end = Math.min(this.events.length, Math.ceil((scrollTop + 384) / this.rowHeight) + 3); 
    
    this.offsetY = start * this.rowHeight;
    this.visibleEvents = this.events.slice(start, end);
    this.vinfo = `Rendering only ${end - start} of ${this.events.length.toLocaleString()} rows in the DOM`;
  }

  exportCsv(): void {
    this.csv.download('trustvault-audit.csv', ['Index', 'Time', 'Event', 'User', 'IP', 'Hash'],
      this.events.map(event => [event.i, event.time, event.evt, event.user, event.ip, event.hash]));
    this.toast.show(`Exported ${this.events.length} audit events`, 'ok');
  }

  verifyChain(): void {
    if (this.hashing || !this.events.length) return;
    this.hashing = true;
    this.hashProgress = 0;
    this.hashResult = '';
    this.hashComplete = false;
    const fail = () => {
      this.worker?.terminate();
      this.worker = undefined;
      this.hashing = false;
      this.hashResult = 'Could not verify the chain. Please retry.';
      this.toast.show('Audit verification failed', 'err');
    };
    try {
      const worker = new Worker(new URL('./hash.worker', import.meta.url), { type: 'module' });
      this.worker = worker;
      worker.onerror = fail;
      worker.onmessageerror = fail;
      worker.onmessage = ({ data }) => {
        if (data.type === 'progress') {
          this.hashProgress = data.pct;
        } else if (data.type === 'done') {
          this.hashComplete = true;
          this.hashTime = data.ms;
          this.events = this.events.map((event, index) => ({ ...event, hash: data.hashes[index] }));
          this.updateVirtualScroll(this.scrollHost.nativeElement.scrollTop);
          this.hashProgress = 100;
          this.hashResult = `${this.events.length.toLocaleString()} hashed in ${data.ms} ms (worker)`;
          this.hashing = false;
          this.toast.show(`Chain verified: ${this.events.length.toLocaleString()} entries`, 'ok');
          worker.terminate();
          this.worker = undefined;
        }
      };
      worker.postMessage(this.events.map(event => `${event.i}|${event.time}|${event.evt}|${event.user}|${event.ip}`));
    } catch {
      fail();
    }
  }

  ngOnDestroy(): void {
    this.worker?.terminate();
  }
}
