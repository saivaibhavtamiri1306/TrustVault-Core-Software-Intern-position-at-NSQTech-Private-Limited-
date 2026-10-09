import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Shared heading; the sub-line is projected with <ng-content>. */
@Component({
  selector: 'app-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
  <div class="mb-8">
    <h2 class="text-3xl font-bold mb-1">{{ title() }} <span class="font-light text-brand-400">{{ accent() }}</span></h2>
    <p class="text-sm font-mono text-slate-400"><ng-content /></p>
  </div>`,
})
export class PageHeaderComponent {
  title = input.required<string>();
  accent = input.required<string>();
}
