import { animate, query, style, transition, trigger } from '@angular/animations';

/** Page-to-page transition: the new page fades in, rises and un-blurs. */
export const routeAnim = trigger('routeAnim', [
  transition('* <=> *', [
    query(':enter', [style({ opacity: 0, transform: 'translateY(18px) scale(.985)', filter: 'blur(6px)' })], { optional: true }),
    query(':enter', [animate('550ms cubic-bezier(.16,1,.3,1)', style({ opacity: 1, transform: 'none', filter: 'blur(0)' }))], { optional: true }),
  ]),
]);

/** Modal entrance: slides up with a slight 3D tilt. */
export const panelAnim = trigger('panel', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(40px) scale(.92) rotateX(10deg)' }),
    animate('500ms cubic-bezier(.16,1,.3,1)', style({ opacity: 1, transform: 'none' })),
  ]),
]);
