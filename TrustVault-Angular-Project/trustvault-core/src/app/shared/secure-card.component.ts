import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TiltDirective } from './tilt.directive';

/** Master card. The parent decides what goes in each slot:
 *  <app-secure-card><div card-header>…</div><div card-body>…</div><div card-footer>…</div></app-secure-card> */
@Component({
  selector: 'app-secure-card',
  standalone: true,
  imports: [TiltDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
  <div class="glass-panel" [appTilt]="tilt() ? 3 : 0">
    <div class="border-b border-brand-400/20 px-5 py-4 empty:hidden"><ng-content select="[card-header]"></ng-content></div>
    <div class="p-5"><ng-content select="[card-body]"></ng-content></div>
    <div class="border-t border-white/10 px-5 py-3 empty:hidden"><ng-content select="[card-footer]"></ng-content></div>
  </div>`,
})
export class SecureCardComponent { tilt = input(true); }
