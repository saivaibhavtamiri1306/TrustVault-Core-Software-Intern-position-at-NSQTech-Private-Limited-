import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { SceneStateService } from './core/scene-state.service';
import { QuantumCoreComponent } from './scene/quantum-core.component';
import { ToastHostComponent } from './shared/toast-host.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, QuantumCoreComponent, ToastHostComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="min-h-screen text-slate-200 overflow-hidden relative">
    <div class="noise-overlay"></div>
    <app-quantum-core [currentPath]="path()" [isScanning]="isScanning()" />
    <router-outlet />
    <app-toast-host />
  </div>`,
})
export class AppComponent {
  readonly isScanning = inject(SceneStateService).isScanning;
  /** Current route as a signal, so the 3D scene glides to a new position on every navigation. */
  readonly path = toSignal(
    inject(Router).events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects.split('?')[0].replace(/^\//, '') || 'login')),
    { initialValue: 'login' });
}
