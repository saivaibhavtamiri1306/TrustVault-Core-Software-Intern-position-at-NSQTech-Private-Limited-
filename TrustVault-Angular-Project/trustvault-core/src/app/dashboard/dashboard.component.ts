import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { TrafficChartComponent } from '../shared/traffic-chart.component';
import { TranslatePipe } from '../shared/translate.pipe';
import { WorkspaceComponent } from '../workspace/workspace.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [TrafficChartComponent, TranslatePipe, WorkspaceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  @if (user(); as u) {
  <div class="animate-fade-in-up max-w-6xl mx-auto p-4 lg:p-8">
    <div class="flex justify-between items-end mb-8">
      <div>
        <h1 class="text-4xl font-bold tracking-tight mb-1">{{ 'DASH.T1' | translate }} <span class="font-light text-brand-400">{{ 'DASH.T2' | translate }}</span></h1>
        <p class="text-sm font-mono text-slate-400 uppercase tracking-widest">Operator: {{ u.name }} // Level: {{ u.accessLevel }}</p>
      </div>
      <div class="text-right">
        <div class="text-xs font-mono text-brand-400 mb-1">SYSTEM INTEGRITY</div>
        <div class="text-2xl font-bold text-white tracking-widest">99.98%</div>
      </div>
    </div>

    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <!-- Operator Card -->
      <div class="glass-panel p-5 lg:col-span-2 border-brand-400/30 flex items-center gap-6 relative overflow-hidden">
        <div class="absolute -right-10 -bottom-10 opacity-10">
          <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" stroke-width="1"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div class="w-16 h-16 rounded-full bg-brand-900 border-2 border-brand-400 flex items-center justify-center shrink-0">
          <span class="text-2xl">{{ u.name.charAt(0) }}</span>
        </div>
        <div>
          <h3 class="text-xl font-bold text-white">{{ u.name }}</h3>
          <p class="text-sm text-brand-300 font-mono mb-2">{{ u.role }}</p>
          <div class="flex gap-4 text-xs font-mono text-slate-400">
            <span>ID: {{ u.id }}</span>
            <span>IP: 192.168.1.104 (SECURE)</span>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="glass-panel p-5 relative overflow-hidden group">
        <div class="absolute top-0 right-0 w-16 h-16 bg-brand-400/10 rounded-bl-full group-hover:scale-150 transition-transform"></div>
        <p class="text-xs font-mono text-slate-400 mb-1">ACCESSIBLE RECORDS</p>
        <p class="text-4xl font-bold text-white mb-2">{{ u.role === 'Admin' ? 12 : 8 }}</p>
        <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div class="bg-brand-400 h-full w-3/4"></div>
        </div>
      </div>

      <div class="glass-panel p-5 relative overflow-hidden group border-cyber-danger/30">
        <div class="absolute top-0 right-0 w-16 h-16 bg-cyber-danger/10 rounded-bl-full group-hover:scale-150 transition-transform"></div>
        <p class="text-xs font-mono text-cyber-danger mb-1">THREATS BLOCKED</p>
        <p class="text-4xl font-bold text-white mb-2">1,042</p>
        <p class="text-xs font-mono text-slate-400">Last 24 hours</p>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-3 mb-8">
      <!-- Live Network Traffic Simulation -->
      <div class="glass-panel p-5 lg:col-span-2">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-sm font-mono text-brand-300 font-bold uppercase tracking-wider">Live Network Node Traffic</h3>
          <span class="flex items-center gap-2 text-xs font-mono text-brand-400">
            <span class="w-2 h-2 rounded-full bg-brand-400 animate-pulse"></span> ACTIVE STREAM
          </span>
        </div>
        @defer (on idle) {
          <app-traffic-chart />
        } @placeholder {
          <div class="h-48 border-b border-brand-400/20 pb-2"></div>
        }
      </div>

      <!-- Active Protocols -->
      <div class="glass-panel p-5">
        <h3 class="text-sm font-mono text-brand-300 font-bold uppercase tracking-wider mb-6">Active Protocols</h3>
        <div class="space-y-4">
          @for (p of protocols; track p.name) {
            <div class="flex justify-between items-center border-b border-white/5 pb-2">
              <span class="text-xs font-mono text-slate-300">{{ p.name }}</span>
              <span class="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border border-current" [class]="p.color">{{ p.status }}</span>
            </div>
          }
        </div>
      </div>
    </div>

    <app-workspace />
  </div>
  }`,
})
export class DashboardComponent {
  private auth = inject(AuthService);
  readonly user = computed(() => this.auth.user());
  readonly protocols = [
    { name: 'Quantum Key Distribution', status: 'Active', color: 'text-brand-400' },
    { name: 'Intrusion Detection Sys', status: 'Active', color: 'text-brand-400' },
    { name: 'Neural Behavior Analysis', status: 'Scanning', color: 'text-cyber-purple' },
    { name: 'External Port Lock', status: 'Engaged', color: 'text-cyber-danger' },
  ];
}
