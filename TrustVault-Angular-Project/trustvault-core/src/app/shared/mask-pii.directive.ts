import { Directive, ElementRef, HostListener, effect, inject, input } from '@angular/core';

/** Keeps the last 4 digits and hides the rest: 4821 7733 9051 -> •••• •••• 9051 */
export function maskValue(v: string): string {
  const digits = [...v].filter(c => /\d/.test(c)).length;
  let seen = 0;
  return [...v].map(c => (/\d/.test(c) ? (++seen > digits - 4 ? c : '•') : c)).join('');
}

/** Press and hold the element (the eye icon) to reveal the real value. Only works when canReveal is true. */
@Directive({ selector: '[appMaskPII]', standalone: true })
export class MaskPiiDirective {
  value = input.required<string>({ alias: 'appMaskPII' });
  canReveal = input(false);
  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private revealed = false;

  constructor() { effect(() => this.paint()); }

  private paint(): void {
    const v = this.value();
    const target = this.el.nativeElement.querySelector<HTMLElement>('[data-pii]') ?? this.el.nativeElement;
    target.textContent = this.revealed && this.canReveal() ? v : maskValue(v);
  }

  @HostListener('mousedown') @HostListener('touchstart')
  down(): void { if (this.canReveal()) { this.revealed = true; this.paint(); } }

  @HostListener('mouseup') @HostListener('mouseleave') @HostListener('touchend')
  up(): void { this.revealed = false; this.paint(); }
}
