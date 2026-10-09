import { Injectable, signal } from '@angular/core';

/** `outage` = the (mock) server is switched off. `offlineMode` = we are showing cached data. */
@Injectable({ providedIn: 'root' })
export class NetworkStatusService {
  readonly outage = signal(false);
  readonly offlineMode = signal(false);
  toggleOutage(): void { this.outage.update(v => !v); }
}
