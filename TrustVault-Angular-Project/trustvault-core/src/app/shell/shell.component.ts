import { Component, DestroyRef, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgClass } from '@angular/common';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { IdleService } from '../core/idle.service';
import { NetworkStatusService } from '../core/network-status.service';
import { LanguageSwitcherComponent } from '../shared/language-switcher.component';
import { routeAnim } from '../shared/animations';
import { TranslatePipe } from '../shared/translate.pipe';

interface NavItem { link: string; icon: string; key: string; }

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [NgClass, RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, LanguageSwitcherComponent],
  animations: [routeAnim],
  template: `
  @if (navigating()) { <div class="fixed inset-x-0 top-0 z-[90] h-0.5 animate-pulse bg-gradient-to-r from-brand-400 via-cyber-purple to-cyber-danger"></div> }

  <div class="relative z-10 flex h-screen overflow-hidden">
    <!-- Futuristic Sidebar -->
    <nav class="glass-panel m-4 mr-0 flex w-[80px] shrink-0 flex-col py-6 transition-all duration-150 lg:hover:w-64 group bg-cyber-bg/80 border-r-brand-400/30">
      <div class="mb-8 flex items-center gap-4 px-5">
        <div class="grid h-10 w-10 shrink-0 place-items-center rounded bg-brand-500/20 border border-brand-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]">
          <svg class="w-6 h-6 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        </div>
        <span class="whitespace-nowrap font-bold text-xl tracking-wider text-white opacity-0 transition lg:group-hover:opacity-100">TRUST<span class="text-brand-400">VAULT</span></span>
      </div>

      <div class="flex-1 space-y-2 px-2">
        @for (n of navItems(); track n.link) {
          <button [routerLink]="n.link" routerLinkActive #rla="routerLinkActive"
            class="w-full flex items-center gap-4 rounded-lg px-3 py-3 transition-all duration-200 hover:translate-x-0.5"
            [ngClass]="rla.isActive ? activeCls : idleCls">
            <svg class="w-6 h-6 shrink-0 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="n.icon"></path></svg>
            <span class="whitespace-nowrap font-mono text-sm opacity-0 transition lg:group-hover:opacity-100">{{ n.key | translate }}</span>
          </button>
        }
      </div>

      <div class="px-4 pb-4">
        <button (click)="logout()" class="w-full flex items-center gap-4 rounded-lg px-3 py-3 text-cyber-danger hover:bg-cyber-danger/10 border border-transparent hover:border-cyber-danger/30 transition">
          <svg class="w-6 h-6 shrink-0 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          <span class="whitespace-nowrap font-mono text-sm opacity-0 transition lg:group-hover:opacity-100">{{ 'NAV.LOGOUT' | translate }}</span>
        </button>
      </div>
    </nav>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col h-full overflow-hidden">
      <header class="m-4 mb-0 flex flex-wrap items-center justify-end gap-2 px-2 py-3 sm:px-6">
        <button (click)="net.toggleOutage()" [attr.title]="'Simulate a server outage to test the offline cache' | translate"
                class="flex items-center gap-2 rounded-full border bg-black/40 px-3 py-2 font-mono text-[10px] tracking-widest backdrop-blur-md transition"
                [ngClass]="net.outage() ? 'border-cyber-danger/60 text-cyber-danger' : 'border-brand-400/20 text-brand-300 hover:border-brand-400/60'">
          <span class="h-2 w-2 rounded-full" [ngClass]="net.outage() ? 'bg-cyber-danger animate-pulse' : 'bg-emerald-400'"></span>{{ (net.outage() ? 'SERVER DOWN' : 'SERVER UP') | translate }}
        </button>
        <app-language-switcher />
        <div class="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-full border border-brand-400/20 backdrop-blur-md">
          <span class="w-2 h-2 rounded-full animate-pulse" [ngClass]="net.offlineMode() ? 'bg-amber-400' : 'bg-brand-400'"></span>
          <span class="text-xs font-mono tracking-widest" [ngClass]="net.offlineMode() ? 'text-amber-300' : 'text-brand-300'">{{ (net.offlineMode() ? 'OFFLINE MODE · CACHED DATA' : 'ENCRYPTED CONNECTION') | translate }}</span>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-20 custom-scrollbar">
        <div [@routeAnim]="animationState()">
          <router-outlet />
        </div>
      </main>
    </div>
  </div>

  @if (idle.warning()) {
    <div class="glass-panel animate-fade-in-up fixed bottom-24 left-1/2 z-[85] -translate-x-1/2 border-amber-400/50 px-6 py-3 font-mono text-sm text-amber-300">
      {{ 'Inactive: locking the session in' | translate }} {{ idle.secondsLeft() }} {{ 'seconds. Move your mouse to stay signed in.' | translate }}
    </div>
  }`,
})
export class ShellComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  readonly idle = inject(IdleService);
  readonly net = inject(NetworkStatusService);

  readonly activeCls = 'bg-brand-400/10 text-brand-300 border border-brand-400/30';
  readonly idleCls = 'text-slate-500 hover:bg-white/5 hover:text-white border border-transparent';

  /** true between the start and the end of a navigation (route resolvers can take a moment) */
  readonly navigating = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationStart || e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError),
      map(e => e instanceof NavigationStart)),
    { initialValue: false });

  readonly animationState = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects.split('?')[0])),
    { initialValue: '' });

  private readonly base: NavItem[] = [
    { link: '/dashboard', key: 'NAV.DASH', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { link: '/records', key: 'NAV.VAULT', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' },
  ];
  private readonly admin: NavItem[] = [
    { link: '/admin/users', key: 'NAV.USERS', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { link: '/admin/pipeline', key: 'NAV.PIPE', icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2' },
    { link: '/admin/audit', key: 'NAV.AUDIT', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  ];
  readonly navItems = computed(() => (this.auth.isAdmin() ? [...this.base, ...this.admin] : this.base));

  constructor() {
    this.idle.start(); // auto-logout after 60s without activity
    inject(DestroyRef).onDestroy(() => this.idle.stop());
  }

  logout(): void { this.auth.logout(); this.router.navigateByUrl('/login'); }
}
