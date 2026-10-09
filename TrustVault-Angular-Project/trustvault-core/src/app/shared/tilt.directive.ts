import { Directive, ElementRef, HostListener, inject, input, numberAttribute } from '@angular/core';

/** Adds a soft 3D tilt that follows the mouse. Usage: <div [appTilt]="4"> (0 = off). */
@Directive({
  selector: '[appTilt]',
  standalone: true,
  host: { style: 'transition: transform .25s ease-out; will-change: transform' },
})
export class TiltDirective {
  max = input(5, { alias: 'appTilt', transform: (v: unknown) => numberAttribute(v, 5) });
  private el = inject<ElementRef<HTMLElement>>(ElementRef);

  @HostListener('mousemove', ['$event'])
  move(e: MouseEvent): void {
    const m = this.max();
    if (!m) return;
    const r = this.el.nativeElement.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    this.el.nativeElement.style.transform = `perspective(900px) rotateX(${-y * m}deg) rotateY(${x * m}deg)`;
  }
  @HostListener('mouseleave') reset(): void { this.el.nativeElement.style.transform = ''; }
}
