import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast { id: number; text: string; kind: 'ok' | 'err' | 'info' | 'warn'; }

/** Global notifications: any service or component calls show(); <app-toast-host> renders them. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  private sub$ = new Subject<Toast>();
  readonly toasts$ = this.sub$.asObservable();
  show(text: string, kind: Toast['kind'] = 'info'): void { this.sub$.next({ id: ++this.seq, text, kind }); }
}
