import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '../core/translate.service';

@Pipe({ name: 'translate', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  private i18n = inject(TranslateService);
  transform(key: string): string { return this.i18n.t(key); }
}
