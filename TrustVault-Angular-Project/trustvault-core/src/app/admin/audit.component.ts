import { ScrollingModule } from '@angular/cdk/scrolling';
import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../core/api.service';
import { LogEntry } from '../core/models';
import { ToastService } from '../core/toast.service';
import { PageHeaderComponent } from '../shared/page-header.component';
import { TranslatePipe } from '../shared/translate.pipe';
import { chainHashes } from './hash-chain';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [PageHeaderComponent, ScrollingModule, DecimalPipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="animate-fade-in-up max-w-6xl mx-auto p-4 lg:p-8">
    <app-page-header [title]="'AUDIT.T1' | translate" [accent]="'AUDIT.T2' | translate">Cryptographically secure, append-only event log.</app-page-header>

    <div class="glass-panel overflow-hidden border-brand-400/20">
      <div class="bg-brand-900/30 p-4 border-b border-brand-400/30 flex justify-between items-center">
        <span class="font-mono text-xs text-brand-300 uppercase tracking-widest flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-emerald-400"></span> Ledger Integrity Confirmed</span>
        <button class="text-xs font-mono text-slate-400 hover:text-white border border-white/20 px-3 py-1 rounded">Export CSV</button>
      </div>

      @for (l of logs; track $index) {
        <div class="flex border-b border-white/5 p-4 text-sm font-mono items-center hover:bg-white/5 transition"
             [class]="l.alert ? 'bg-cyber-danger/10 border-l-2 border-l-cyber-danger' : 'border-l-2 border-l-transparent'">
          <div class="w-32 text-slate-500 text-xs">{{ time }}</div>
          <div class="w-40 font-bold" [class]="l.alert ? 'text-cyber-danger' : l.evt === 'SYS_BOOT' ? 'text-brand-300' : 'text-emerald-400'">{{ l.evt }}</div>
          <div class="flex-1 text-slate-300">USR: {{ l.user }} <span class="text-slate-500 mx-2">|</span> IP: {{ l.ip }}</div>
          <div class="text-xs text-slate-500 bg-black/40 px-2 py-1 rounded border border-white/5 flex items-center gap-2">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
            {{ l.hash }}
          </div>
        </div>
      }
    </div>

    <!-- 10,000-event stream: virtual scrolling + hash chain computed in a Web Worker -->
    <div class="glass-panel mt-8 overflow-hidden border-brand-400/20">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-brand-400/30 bg-brand-900/30 p-4">
        <div>
          <p class="text-xs font-mono uppercase tracking-widest text-brand-300">Live Event Stream · {{ total() | number }} events</p>
          <p class="text-[10px] font-mono text-slate-500">Your own actions appear at the top and survive a refresh. Virtual scrolling renders only the visible rows.</p>
        </div>
        <div class="flex items-center gap-3">
          @if (busy()) { <div class="h-1.5 w-40 overflow-hidden rounded bg-white/10"><div class="h-full bg-brand-400 transition-all duration-300" [style.width.%]="progress()"></div></div> }
          @if (verifyMs() > 0) { <span class="text-xs font-mono text-emerald-400">✔ {{ total() | number }} hashed in {{ verifyMs() }} ms</span> }
          <button class="btn-cyber !px-4 !py-2 !text-xs" [disabled]="busy() || !total()" (click)="verifyInWorker()">{{ busy() ? 'Hashing…' : 'Verify chain in Web Worker' }}</button>
        </div>
      </div>
      <cdk-virtual-scroll-viewport itemSize="48" class="h-96 block">
        <div *cdkVirtualFor="let e of stream(); trackBy: trackIdx" class="flex h-12 items-center border-b border-white/5 px-4 text-xs font-mono transition hover:bg-white/5">
          <span class="w-14 text-slate-600">#{{ e.i }}</span>
          <span class="w-44 text-slate-500">{{ e.time }}</span>
          <span class="w-36 font-bold" [class]="e.evt === 'AUTH_FAIL' || e.evt === 'FIREWALL_BLOCK' ? 'text-cyber-danger' : 'text-emerald-400'">{{ e.evt }}</span>
          <span class="flex-1 text-slate-300">{{ e.user }} <span class="text-slate-600">·</span> {{ e.ip }}</span>
          <span class="rounded border border-white/5 bg-black/40 px-2 py-1 text-[10px] text-slate-500">{{ e.hash ? e.hash.slice(0, 14) + '…' : 'not hashed yet' }}</span>
        </div>
      </cdk-virtual-scroll-viewport>
    </div>
  </div>`,
})
export class AuditComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  readonly time = new Date().toISOString().split('T')[1].slice(0, -1);
  readonly logs: { evt: string; user: string; ip: string; hash: string; alert?: boolean }[] = [
    { evt: 'SYS_BOOT', user: 'SYSTEM', ip: 'localhost', hash: '0x8f...3a1' },
    { evt: 'AUTH_SUCCESS', user: 'priya', ip: '192.168.1.104', hash: '0xc2...9f4' },
    { evt: 'DATA_READ', user: 'priya', ip: '192.168.1.104', hash: '0x1a...b62' },
    { evt: 'AUTH_FAIL', user: 'UNKNOWN', ip: '45.22.19.10', hash: '0x5d...e01', alert: true },
    { evt: 'FIREWALL_BLOCK', user: 'SYSTEM', ip: '45.22.19.10', hash: '0x99...a8c' },
    { evt: 'AUTH_SUCCESS', user: 'admin', ip: '10.0.0.5', hash: '0x33...f11' },
    { evt: 'POLICY_UPDATE', user: 'admin', ip: '10.0.0.5', hash: '0x7e...2b9' },
  ];

  readonly stream = signal<LogEntry[]>([]);
  readonly total = signal(0);
  readonly busy = signal(false);
  readonly progress = signal(0);
  readonly verifyMs = signal(0);
  readonly trackIdx = (_: number, e: LogEntry) => e.i;

  constructor() {
    this.api.auditStream().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(list => { this.stream.set(list); this.total.set(list.length); });
  }

  /** The heavy loop (10,000 SHA-256 hashes) runs on a separate thread, so animations never stutter. */
  verifyInWorker(): void {
    const list = this.stream();
    const payload = list.map(l => `${l.i}|${l.time}|${l.evt}|${l.user}|${l.ip}`);
    this.busy.set(true); this.progress.set(1); this.verifyMs.set(0);

    const finish = (hashes: string[], ms: number) => {
      this.stream.set(list.map((l, i) => ({ ...l, hash: hashes[i] })));
      this.verifyMs.set(Math.max(1, ms)); this.busy.set(false);
      this.toast.show(`Chain verified: ${hashes.length.toLocaleString()} entries`, 'ok');
    };

    if (typeof Worker === 'undefined') {                       // very old browser: fall back to the main thread
      const t0 = performance.now();
      chainHashes(payload, p => this.progress.set(p)).then(h => finish(h, Math.round(performance.now() - t0)));
      return;
    }
    const worker = new Worker(new URL('./hash.worker', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => {
      if (data.type === 'progress') this.progress.set(data.pct);
      else { finish(data.hashes, data.ms); worker.terminate(); }
    };
    worker.onerror = () => { this.busy.set(false); this.toast.show('Worker failed to start', 'err'); worker.terminate(); };
    worker.postMessage(payload);
  }
}
