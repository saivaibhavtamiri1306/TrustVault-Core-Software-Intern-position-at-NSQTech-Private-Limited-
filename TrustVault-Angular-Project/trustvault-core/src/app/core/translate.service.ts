import { Injectable, signal } from '@angular/core';
import { DICT, LANGS, Lang } from './i18n';
import { UI_TRANSLATIONS } from './ui-translations';

/** Lightweight runtime translations: switch the language and every `| translate` updates, no reload. */
@Injectable({ providedIn: 'root' })
export class TranslateService {
  readonly langs = LANGS;
  readonly lang = signal<Lang>(this.initialLanguage());

  constructor() { document.documentElement.lang = this.lang(); }

  private initialLanguage(): Lang {
    try {
      const saved = localStorage.getItem('tv_lang');
      return LANGS.find(language => language.code === saved)?.code ?? 'en';
    } catch {
      return 'en';
    }
  }

  use(l: Lang): void {
    if (!LANGS.some(language => language.code === l)) return;
    this.lang.set(l);
    try { localStorage.setItem('tv_lang', l); } catch {}
    document.documentElement.lang = l;
  }
  t(key: string): string {
    const language = this.lang();
    return DICT[language][key] ?? UI_TRANSLATIONS[language][key] ?? DICT.en[key] ?? key;
  }
}
