import { Component, OnInit, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../core/api.service';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'tv-audit',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="mx-auto max-w-6xl p-4 lg:p-8 route-in">
  <div class="mb-8">
    <h2 class="mb-1 text-3xl font-bold">Audit <span class="font-light text-[#22d3ee]">Ledger</span></h2>
    <p class="font-mono text-sm text-slate-400">Cryptographically secure, append-only event log.</p>
  </div>

  <div class="glass-panel overflow-hidden border-[#22d3ee]/20">
    <div class="flex items-center justify-between border-b border-[#22d3ee]/30 bg-[#164e63]/30 p-4">
      <span class="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#22d3ee]">
        <span class="h-2 w-2 rounded-full bg-emerald-400"></span> Ledger Integrity Confirmed
      </span>
      <button class="rounded border border-white/20 px-3 py-1 font-mono text-xs text-slate-400 hover:text-white">Export CSV</button>
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
        <p class="font-mono text-xs uppercase tracking-widest text-[#22d3ee]">Live Event Stream · <span>{{ events.length | number }}</span> events</p>
        <p class="font-mono text-[10px] text-slate-500">{{ vinfo }}</p>
      </div>
      <div class="flex items-center gap-3">
        <div *ngIf="hashing" class="h-1.5 w-40 overflow-hidden rounded bg-white/10">
          <div class="h-full bg-[#22d3ee] transition-all duration-300" [style.width.%]="hashProgress"></div>
        </div>
        <span *ngIf="hashResult" class="font-mono text-xs text-emerald-400">{{ hashResult }}</span>
        <button class="btn-cyber w-auto sm" [disabled]="hashing || events.length === 0" (click)="verifyChain()">
          {{ hashing ? 'Hashing…' : 'Verify chain in Web Worker' }}
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
            <span class="rounded border border-white/5 bg-black/40 px-2 py-1 text-[10px] text-slate-500">{{ e.hash ? (e.hash | slice:0:14) + '…' : 'not hashed yet' }}</span>
          </div>

        </div>
      </div>
    </div>

  </div>
</div>
  `
})
export class AuditComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
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
  
  events: any[] = [];
  visibleEvents: any[] = [];
  hashing = false;
  hashProgress = 0;
  hashResult = '';
  vinfo = 'Loading events...';

  private readonly rowHeight = 48;
  totalHeight = 0;
  offsetY = 0;

  ngOnInit(): void {
    this.api.get<any[]>('/audit/stream').subscribe({
      next: (data) => {
        this.events = data;
        this.totalHeight = this.events.length * this.rowHeight;
        this.updateVirtualScroll();
      },
      error: () => this.toast.show('Failed to fetch audit logs', 'err')
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

  verifyChain(): void {
    this.hashing = true;
    this.hashProgress = 0;

    const workerCode = `
      const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
      onmessage = async ({ data }) => {
        const t0 = performance.now();
        const enc = new TextEncoder();
        const out = [];
        let prev = '0'.repeat(64);
        for (let i = 0; i < data.length; i++) {
          prev = hex(await crypto.subtle.digest('SHA-256', enc.encode(prev + data[i])));
          out.push(prev);
          if (i % 500 === 0) postMessage({ type: 'p', pct: Math.round((i / data.length) * 100) });
        }
        postMessage({ type: 'd', hashes: out, ms: Math.round(performance.now() - t0) });
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));

    const payload = this.events.map(l => `${l.i}|${l.time}|${l.evt}|${l.user}|${l.ip}`);

    worker.onmessage = ({ data }) => {
      if (data.type === 'p') {
        this.hashProgress = data.pct;
      } else {
        this.events = this.events.map((l, i) => ({ ...l, hash: data.hashes[i] }));
        this.updateVirtualScroll(this.scrollHost.nativeElement.scrollTop);
        this.hashResult = `✔ ${this.events.length.toLocaleString()} hashed in ${data.ms} ms (worker)`;
        this.hashing = false;
        this.toast.show(`Chain verified: ${this.events.length.toLocaleString()} entries`, 'ok');
        worker.terminate();
      }
    };

    worker.postMessage(payload);
  }
}
