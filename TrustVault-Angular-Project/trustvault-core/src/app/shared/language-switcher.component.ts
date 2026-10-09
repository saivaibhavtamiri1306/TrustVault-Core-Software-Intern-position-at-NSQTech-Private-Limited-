import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Lang } from '../core/i18n';
import { TranslateService } from '../core/translate.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <select class="cursor-pointer rounded-lg border border-brand-400/20 bg-black/40 px-3 py-1.5 text-xs font-mono text-brand-300 outline-none transition hover:border-brand-400/60"
          [value]="i18n.lang()" (change)="i18n.use($any($event.target).value)" aria-label="Language">
    @for (l of i18n.langs; track l.code) { <option [value]="l.code" class="bg-[#0a0f1e]">{{ l.label }}</option> }
  </select>`,
})
export class LanguageSwitcherComponent { i18n = inject(TranslateService); }
