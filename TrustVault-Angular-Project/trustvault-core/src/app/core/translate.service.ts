import { Injectable, signal } from '@angular/core';
import { DICT, LANGS, Lang } from './i18n';

/** Lightweight runtime translations: switch the language and every `| translate` updates, no reload. */
@Injectable({ providedIn: 'root' })
export class TranslateService {
  readonly langs = LANGS;
  readonly lang = signal<Lang>((localStorage.getItem('tv_lang') as Lang) || 'en');

  use(l: Lang): void {
    this.lang.set(l);
    localStorage.setItem('tv_lang', l);
    document.documentElement.lang = l;
  }
  t(key: string): string { return DICT[this.lang()][key] ?? DICT.en[key] ?? key; }
}
